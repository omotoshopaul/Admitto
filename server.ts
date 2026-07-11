import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { ImageAnnotatorClient } from '@google-cloud/vision';
import stringSimilarity from 'string-similarity';

// Initialize Vision Client
let visionClient: ImageAnnotatorClient | null = null;
if (process.env.GOOGLE_VISION_CREDENTIALS) {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_VISION_CREDENTIALS);
    visionClient = new ImageAnnotatorClient({ credentials });
  } catch (e) {
    console.error("Failed to initialize Vision client", e);
  }
}

const FIELD_MAP: Record<string, string[]> = {
  'JAMB': ['firstName', 'lastName'],
  'WAEC/NECO': ['firstName', 'lastName', 'dateOfBirth'],
  'Birth Certificate': ['firstName', 'lastName', 'dateOfBirth'],
  'Testimonial': ['firstName', 'lastName'],
  'Other': ['firstName', 'lastName']
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Firebase Admin SDK (only once)
  if (!getApps().length && process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT) {
    try {
      initializeApp({
        credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT))
      });
    } catch (e) {
      console.error("Failed to initialize Firebase Admin:", e);
    }
  }

  // API Route: run-verification
  app.post("/api/run-verification", async (req, res) => {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ error: 'Missing uid' });
    
    // Non-blocking processing
    res.status(202).json({ message: 'Verification started' });

    // Processing in background
    (async () => {
      try {
        if (!getApps().length) return;
        const db = getFirestore();
        const userDocRef = db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();
        
        if (!userDoc.exists) return;
        const userData = userDoc.data()!;
        
        const verificationType = userData.verificationType;
        
        if (verificationType === 'mismatch') {
          const documents = userData.mismatchDocuments || [];
          const updatedDocuments = [];
          
          for (const docObj of documents) {
            if (!docObj || !docObj.url) {
              updatedDocuments.push(docObj);
              continue;
            }
            
            const { url, type } = docObj;
            let status = 'unverified';
            let matchedValue = '';
            let expectedValue = '';
            let errorType = '';
            
            const docType = type || 'Other';
            const fieldsToCheck = FIELD_MAP[docType] || FIELD_MAP['Other'];
            
            if (visionClient) {
              try {
                const [result] = await visionClient.textDetection(url);
                const text = result.fullTextAnnotation?.text || '';
                const textLower = text.toLowerCase().replace(/\s+/g, ' ');
                
                let allMatched = true;
                const expectedParts = [];
                const matchedParts = [];
                const errors = [];
                
                for (const field of fieldsToCheck) {
                  const expected = userData[field];
                  if (!expected) continue;
                  
                  expectedParts.push(expected);
                  
                  const expectedLower = String(expected).toLowerCase();
                  if (textLower.includes(expectedLower)) {
                    matchedParts.push(expected);
                  } else {
                    // Try string similarity for words in the text
                    const words = textLower.split(' ');
                    const match = stringSimilarity.findBestMatch(expectedLower, words);
                    
                    if (match.bestMatch.rating > 0.8) {
                      matchedParts.push(match.bestMatch.target);
                    } else {
                      allMatched = false;
                      errors.push(`Missing or mismatched ${field}`);
                      matchedParts.push('Not found');
                    }
                  }
                }
                
                if (expectedParts.length > 0) {
                  expectedValue = expectedParts.join(', ');
                  matchedValue = matchedParts.join(', ');
                  
                  if (allMatched) {
                    status = 'verified';
                  } else {
                    status = 'unverified';
                    errorType = errors.join('; ');
                  }
                } else {
                  status = 'unverified';
                  errorType = 'No verifiable fields found in profile';
                }
                
              } catch(e) {
                console.error("Vision API error", e);
                status = 'unverified';
                errorType = 'OCR processing failed';
              }
            } else {
              status = 'unverified';
              errorType = 'OCR service not configured';
            }
            
            updatedDocuments.push({
              ...docObj,
              status,
              matchedValue,
              expectedValue,
              errorType
            });
          }
          
          await userDocRef.update({ 
            mismatchDocuments: updatedDocuments,
            verificationStatus: 'completed'
          });
          
        } else if (verificationType === 'grammar') {
          const documents = userData.testimonialDocuments || [];
          const updatedDocuments = [];
          
          for (const item of documents) {
            // testimonialDocuments might be strings or objects depending on the pipeline stage, let's normalize
            const url = typeof item === 'string' ? item : (item?.url || null);
            
            if (!url) {
              updatedDocuments.push(item);
              continue;
            }
            
            let status = 'unverified';
            let errorType = '';
            
            if (visionClient) {
              try {
                const [result] = await visionClient.textDetection(url);
                const text = result.fullTextAnnotation?.text || '';
                
                // Simple Grammar check via languagetool.org API
                const ltResponse = await fetch('https://api.languagetoolplus.com/v2/check', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: new URLSearchParams({
                    text: text.substring(0, 5000), // LanguageTool limits
                    language: 'en-US'
                  })
                });
                
                if (ltResponse.ok) {
                  const ltData = await ltResponse.json();
                  const matches = ltData.matches || [];
                  
                  if (matches.length > 0) {
                    status = 'unverified';
                    errorType = `${matches.length} grammatical error(s) found`;
                  } else {
                    status = 'verified';
                  }
                } else {
                  status = 'unverified';
                  errorType = 'Grammar check service failed';
                }
              } catch (e) {
                console.error("Vision/Grammar API error", e);
                status = 'unverified';
                errorType = 'Processing failed';
              }
            } else {
              status = 'unverified';
              errorType = 'OCR service not configured';
            }
            
            updatedDocuments.push({
              url,
              type: 'Testimonial',
              status,
              errorType
            });
          }
          
          await userDocRef.update({ 
            testimonialDocuments: updatedDocuments,
            verificationStatus: 'completed'
          });
        }
        
      } catch (error) {
        console.error("Run verification error:", error);
        if (getApps().length) {
          const db = getFirestore();
          await db.collection('users').doc(uid).update({ verificationStatus: 'error' }).catch(() => {});
        }
      }
    })();
  });

  // API Route: list-products
  app.get("/api/list-products", async (req, res) => {
    try {
      const response = await fetch('https://www.naijaresultpins.com/api/v1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.NAIJARESULTPINS_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  // API Route: verify-and-buy-card
  app.post("/api/verify-and-buy-card", async (req, res) => {
    const { paystackReference, cardTypeId, cardName, quantity, uid } = req.body;

    try {
      // Step 1: Verify the Paystack transaction
      const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${paystackReference}`, {
        headers: { 'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
      });
      const verifyData = await verifyResponse.json();

      if (!verifyData.status || verifyData.data.status !== 'success') {
        return res.status(400).json({ error: 'Payment verification failed' });
      }

      // Step 2: Purchase the actual scratch cards from NaijaResultPins
      const purchaseResponse = await fetch('https://www.naijaresultpins.com/api/v1/exam-card/buy', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NAIJARESULTPINS_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ card_type_id: cardTypeId, quantity: String(quantity) })
      });
      const purchaseData = await purchaseResponse.json();

      if (!purchaseData.status) {
        return res.status(400).json({ error: purchaseData.message || 'Purchase failed' });
      }

      // Step 3: Save the purchase to Firestore
      if (getApps().length) {
        const db = getFirestore();
        const purchaseId = purchaseData.reference || `req_${Date.now()}`;
        await db.collection('users').doc(uid).collection('purchases').doc(purchaseId).set({
          cardName,
          quantity: purchaseData.quantity || quantity,
          amount: purchaseData.amount || (verifyData.data.amount / 100),
          cards: purchaseData.cards || [],
          transactionDate: purchaseData.transaction_date || new Date().toISOString(),
          reference: purchaseId
        });
      }

      res.status(200).json({ success: true, purchase: purchaseData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Something went wrong processing your purchase' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
