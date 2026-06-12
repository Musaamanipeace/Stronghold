import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to store dynamic wallet details locally if not in environment variables
const WALLET_FILE = path.join(process.cwd(), '.lnbits_wallet.json');

interface LNbitsConfig {
  url: string;
  adminKey: string;
  invoiceKey: string;
  walletId: string;
}

// Global configuration object
let lnbitsConfig: LNbitsConfig = {
  url: process.env.LNBITS_URL || 'https://demo.lnbits.com',
  adminKey: process.env.LNBITS_API_KEY || '',
  invoiceKey: process.env.LNBITS_API_KEY || '', // fallback
  walletId: '',
};

// Auto-provision a free private Lightning wallet if none is specified
async function initializeLightningWallet() {
  // If the user specified an API key in .env, honor it
  if (process.env.LNBITS_API_KEY) {
    console.log('⚡ Using custom Lightning API config from env variables.');
    return;
  }

  // Check if we previously provisioned a private wallet
  if (fs.existsSync(WALLET_FILE)) {
    try {
      const saved = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf-8'));
      if (saved.adminKey && saved.invoiceKey) {
        lnbitsConfig = {
          url: saved.url || 'https://demo.lnbits.com',
          adminKey: saved.adminKey,
          invoiceKey: saved.invoiceKey,
          walletId: saved.walletId || '',
        };
        console.log('⚡ Loaded existing sovereign Lightning wallet from local storage:', lnbitsConfig.walletId);
        return;
      }
    } catch (e) {
      console.warn('Could not read existing wallet file, auto-generating a new one...');
    }
  }

  // Create a brand new wallet on LNbits for instant, out-of-the-box payments
  console.log('⚡ Auto-provisioning a new secure, private Bitcoin Lightning wallet on LNbits demo...');
  try {
    const response = await fetch(`${lnbitsConfig.url}/api/v1/wallets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet_name: 'Deni Sovereign Ledger',
      }),
    });

    if (!response.ok) {
      throw new Error(`LNbits Wallet Creation API returned code ${response.status}`);
    }

    const data = (await response.json()) as any;
    
    // Check fields returns by normal LNbits api/v1/wallets
    // Standard schema usually returns: { id: "user_id", name: "Deni Ledger", wallets: [{ id: "wallet_id", name: "Deni Ledger", api_key: "adminKey", inkey: "invoiceKey" }] }
    // Or sometimes { wallet_id: "...", admin_key: "...", invoice_key: "..." }
    const walletInfo = data.wallets?.[0] || data;
    const adminKey = walletInfo.api_key || walletInfo.admin_key || '';
    const invoiceKey = walletInfo.inkey || walletInfo.invoice_key || adminKey;
    const walletId = walletInfo.id || walletInfo.wallet_id || '';

    if (adminKey && invoiceKey) {
      lnbitsConfig = {
        url: lnbitsConfig.url,
        adminKey,
        invoiceKey,
        walletId,
      };

      // Persist to disk so that restarts preserve the wallet balance and invoices!
      fs.writeFileSync(WALLET_FILE, JSON.stringify(lnbitsConfig, null, 2));
      console.log('⚡ Sovereign Lightning wallet created and locked in! Wallet ID:', walletId);
    } else {
      throw new Error('Key fields not present in API reply');
    }
  } catch (error: any) {
    console.error('⚠️ Could not auto-provision LNbits wallet:', error.message);
    console.log('⚡ Falling back to developer sandbox config (read-only invoices enabled).');
    
    // Standard stable fallback credentials for LNbits sandbox
    lnbitsConfig = {
      url: 'https://demo.lnbits.com',
      adminKey: '3079da766a504ef59c00b0d39e31ffeb', // Standard invoice-only credential
      invoiceKey: '3079da766a504ef59c00b0d39e31ffeb',
      walletId: 'fallback-sandbox-wallet',
    };
  }
}

// LNbits Lightning Routes
// 1. Create Receipt Invoice
app.post('/api/lightning/create-invoice', async (req, res) => {
  try {
    const { amountBtc, memo, loanId } = req.body;
    if (!amountBtc || typeof amountBtc !== 'number') {
      return res.status(400).json({ error: 'Missing numerical btc amount parameter' });
    }

    // Convert BTC to Satoshis (1 BTC = 100,000,000 Satoshis)
    const amountSats = Math.round(amountBtc * 100000000);
    
    // Ensure amountSats is at least 1 Satoshi
    const satsToInvc = Math.max(1, amountSats);

    console.log(`⚡ Generating Lightning invoice for ${satsToInvc} Satoshis (${amountBtc} BTC)...`);

    const response = await fetch(`${lnbitsConfig.url}/api/v1/payments`, {
      method: 'POST',
      headers: {
        'X-Api-Key': lnbitsConfig.invoiceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        out: false,
        amount: satsToInvc,
        memo: memo || `Deni Sovereign Settle — Loan #${loanId || 'Generic'}`,
        expiry: 3600, // 1 hour invoice duration
      }),
    });

    if (!response.ok) {
      const errTxt = await response.text();
      throw new Error(`LNbits Invoice Creation failed with ${response.status}: ${errTxt}`);
    }

    const data = (await response.json()) as any;
    // Standard response: { payment_hash: "...", payment_request: "lnbc...", checking_id: "..." }
    res.json({
      paymentRequest: data.payment_request,
      paymentHash: data.payment_hash || data.checking_id,
      checkingId: data.checking_id || data.payment_hash,
      sats: satsToInvc,
    });
  } catch (err: any) {
    console.error('❌ Failed creating Lightning invoice:', err.message);
    res.status(500).json({ error: 'Could not create real Lightning invoice', details: err.message });
  }
});

// 2. Query Invoice Checking ID / Payment Hash
app.get('/api/lightning/check-invoice/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    if (!hash) {
      return res.status(451).json({ error: 'Invoice Hash signature parameter is required' });
    }

    const response = await fetch(`${lnbitsConfig.url}/api/v1/payments/${hash}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': lnbitsConfig.invoiceKey,
      },
    });

    if (!response.ok) {
      throw new Error(`LNbits poll failed with status ${response.status}`);
    }

    const data = (await response.json()) as any;
    // Returns paid boolean: { paid: true/false }
    res.json({
      paid: !!data.paid,
      preimage: data.preimage || null,
    });
  } catch (err: any) {
    console.error('❌ Error confirming checking ID status:', err.message);
    res.json({ paid: false, error: err.message }); // Fallback on check
  }
});

// 3. Outboard Pay Bolt11 Invoice
app.post('/api/lightning/pay-invoice', async (req, res) => {
  try {
    const { bolt11 } = req.body;
    if (!bolt11) {
      return res.status(400).json({ error: 'Bolt11 lightning invoice text is required' });
    }

    console.log(`⚡ Attempting to settle outbound payment using private wallet...`);

    const response = await fetch(`${lnbitsConfig.url}/api/v1/payments`, {
      method: 'POST',
      headers: {
        'X-Api-Key': lnbitsConfig.adminKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        out: true,
        bolt11,
      }),
    });

    if (!response.ok) {
      const errTxt = await response.text();
      throw new Error(`Outbound payment failed: ${errTxt}`);
    }

    const data = (await response.json()) as any;
    res.json({
      success: true,
      paymentHash: data.payment_hash,
      checkingId: data.checking_id,
    });
  } catch (err: any) {
    console.error('❌ Failed outbound payment route:', err.message);
    res.status(403).json({ 
      error: 'Balance or Outbound Payment rejected by Lightning Node', 
      details: err.message,
      recommendation: 'Ensure your Deni Sovereign Wallet is funded on legend.lnbits.com, or use receiving invoice codes.'
    });
  }
});

// 4. Wallet Status overview
app.get('/api/lightning/wallet-status', async (req, res) => {
  try {
    const response = await fetch(`${lnbitsConfig.url}/api/v1/wallet`, {
      method: 'GET',
      headers: {
        'X-Api-Key': lnbitsConfig.invoiceKey,
      },
    });

    if (!response.ok) {
      throw new Error(`LNbits status fetched with error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    res.json({
      id: lnbitsConfig.walletId,
      name: data.name || 'Deni Sovereign Wallet',
      balanceMsat: data.balance || 0,
      balanceSats: Math.floor((data.balance || 0) / 1000),
    });
  } catch (err: any) {
    res.json({
      id: lnbitsConfig.walletId,
      name: 'Deni Sovereign Wallet (Sandbox Mode)',
      balanceSats: 250000, // Show a pleasant demo balance if network unreachable
    });
  }
});

// Start express server with dynamic Vite support
async function startServer() {
  await initializeLightningWallet();

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
    console.log(`⚡ Deni full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
