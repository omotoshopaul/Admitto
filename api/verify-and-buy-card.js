import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT))
  });
}
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { paystackReference, cardTypeId, cardName, quantity, uid } = req.body;

  try {
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${paystackReference}`, {
      headers: { 'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    const verifyData = await verifyResponse.json();

    if (!verifyData.status || verifyData.data.status !== 'success') {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

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

    const purchaseId = purchaseData.reference;
    await db.collection('users').doc(uid).collection('purchases').doc(purchaseId).set({
      cardName,
      quantity: purchaseData.quantity,
      amount: purchaseData.amount,
      cards: purchaseData.cards,
      transactionDate: purchaseData.transaction_date,
      reference: purchaseId
    });

    res.status(200).json({ success: true, purchase: purchaseData });
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong processing your purchase' });
  }
}
