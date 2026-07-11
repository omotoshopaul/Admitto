import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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
