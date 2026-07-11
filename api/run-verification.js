import stringSimilarity from 'string-similarity';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT)) });
}
const db = getFirestore();

async function runOcr(imageUrl) {
  const params = new URLSearchParams({
    apikey: process.env.OCRSPACE_API_KEY,
    url: imageUrl,
    language: 'eng',
    OCREngine: '2'
  });
  const response = await fetch(`https://api.ocr.space/parse/imageurl?${params.toString()}`, {
    method: 'GET'
  });
  const data = await response.json();
  if (data.OCRExitCode !== 1 || !data.ParsedResults || data.ParsedResults.length === 0) {
    return '';
  }
  return data.ParsedResults[0].ParsedText || '';
}

const FIELD_MAP = {
  'JAMB': ['firstName', 'lastName', 'dateOfBirth'],
  'WAEC/NECO': ['firstName', 'lastName', 'dateOfBirth'],
  'Birth Certificate': ['firstName', 'lastName', 'dateOfBirth', 'gender'],
  'Testimonial': ['firstName', 'lastName'],
  'Other': ['firstName', 'lastName']
};

function fuzzyContains(text, value) {
  if (!value) return { matched: false, confidence: 0 };
  const normalizedText = text.toLowerCase();
  const normalizedValue = String(value).toLowerCase().trim();
  if (normalizedText.includes(normalizedValue)) return { matched: true, confidence: 1 };
  const words = normalizedText.split(/\s+/);
  let bestScore = 0;
  for (let i = 0; i < words.length; i++) {
    const window = words.slice(i, i + normalizedValue.split(' ').length).join(' ');
    const score = stringSimilarity.compareTwoStrings(window, normalizedValue);
    if (score > bestScore) bestScore = score;
  }
  return { matched: bestScore >= 0.75, confidence: bestScore };
}

function fuzzyContainsDate(text, dateString) {
  const [year, month, day] = dateString.split('-');
  const dayNum = String(parseInt(day));
  const monthNames = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const monthName = monthNames[parseInt(month) - 1];
  const lowerText = text.toLowerCase();
  const hasYear = lowerText.includes(year);
  const hasDay = lowerText.includes(day) || lowerText.includes(dayNum);
  const hasMonth = lowerText.includes(month) || lowerText.includes(monthName);
  const matched = hasYear && (hasDay || hasMonth);
  return { matched, confidence: matched ? 0.8 : 0.2 };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { uid } = req.body;

  try {
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) return res.status(404).json({ error: 'User not found' });
    const userData = userSnap.data();

    if (userData.verificationType === 'mismatch') {
      const updatedDocs = [];
      for (const doc of userData.mismatchDocuments || []) {
        const extractedText = await runOcr(doc.url);

        const fieldsToCheck = FIELD_MAP[doc.type] || FIELD_MAP['Other'];
        const fieldResults = [];
        let allMatched = true;

        for (const field of fieldsToCheck) {
          const expectedValue = userData[field];
          const result = field === 'dateOfBirth'
            ? fuzzyContainsDate(extractedText, expectedValue)
            : fuzzyContains(extractedText, expectedValue);
          if (!result.matched) allMatched = false;
          fieldResults.push({ field, expectedValue, matched: result.matched, confidence: result.confidence });
        }

        updatedDocs.push({
          ...doc,
          status: allMatched ? 'verified' : 'unverified',
          matchedValue: fieldResults.filter(f => f.matched).map(f => `${f.field}: ${f.expectedValue}`).join(', ') || 'None',
          expectedValue: fieldResults.map(f => `${f.field}: ${f.expectedValue}`).join(', '),
          errorType: allMatched ? 'None detected' : `Mismatch in: ${fieldResults.filter(f => !f.matched).map(f => f.field).join(', ')}`
        });
      }
      await userRef.set({ mismatchDocuments: updatedDocs, verificationStatus: 'complete' }, { merge: true });

    } else if (userData.verificationType === 'grammar') {
      const updatedDocs = [];
      for (const doc of userData.testimonialDocuments || []) {
        const extractedText = await runOcr(doc.url || doc);

        const grammarResponse = await fetch('https://api.languagetool.org/v2/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `text=${encodeURIComponent(extractedText)}&language=en-US`
        });
        const grammarData = await grammarResponse.json();
        const errorCount = grammarData.matches ? grammarData.matches.length : 0;
        const firstError = errorCount > 0 ? grammarData.matches[0].message : 'None detected';

        updatedDocs.push({
          url: doc.url || doc,
          status: errorCount === 0 ? 'verified' : 'unverified',
          matchedValue: `${errorCount} issue(s) found`,
          expectedValue: 'Correct grammar and spelling',
          errorType: firstError
        });
      }
      await userRef.set({ testimonialDocuments: updatedDocs, verificationStatus: 'complete' }, { merge: true });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    await db.collection('users').doc(uid).set({ verificationStatus: 'error' }, { merge: true });
    res.status(500).json({ error: 'Verification failed' });
  }
}
