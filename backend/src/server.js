// server.js - StrongHold Backend API Server
require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const path = require('path');
const { errorHandlerMiddleware, StrongHoldError, DatabaseError } = require('./errors');

const app = express();
const PORT = process.env.PORT || 5000;

const lightningConfig = {
    restUrl: (process.env.LND_REST_URL || 'https://127.0.0.1:8080').replace(/\/$/, ''),
    macaroonPath: process.env.LND_MACAROON_PATH,
    tlsRejectUnauthorized: process.env.LND_TLS_REJECT_UNAUTHORIZED !== 'false'
};

const paidDeposits = new Map();
let protocolPoolSats = 0;

// Middleware
app.use(cors());
app.use(express.json());

function getLndHeaders() {
    if (!lightningConfig.macaroonPath) {
        throw new StrongHoldError(
            'ERR_LIGHTNING_CONFIG',
            'LND macaroon path is missing. Set LND_MACAROON_PATH to the Polar node admin.macaroon file.',
            503
        );
    }

    const macaroon = fs.readFileSync(path.resolve(lightningConfig.macaroonPath)).toString('hex');

    return {
        'Grpc-Metadata-macaroon': macaroon,
        'Content-Type': 'application/json'
    };
}

function requestLnd(method, requestPath, body) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${lightningConfig.restUrl}${requestPath}`);
        const payload = body ? JSON.stringify(body) : null;
        const headers = getLndHeaders();
        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: `${url.pathname}${url.search}`,
            method,
            headers,
            rejectUnauthorized: lightningConfig.tlsRejectUnauthorized
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                let parsed = null;
                if (responseData) {
                    try {
                        parsed = JSON.parse(responseData);
                    } catch (error) {
                        reject(new StrongHoldError('ERR_LIGHTNING_RESPONSE', `LND returned non-JSON response: ${responseData}`, res.statusCode >= 400 ? res.statusCode : 502));
                        return;
                    }
                }

                if (res.statusCode >= 400) {
                    const detail = parsed && (parsed.error || parsed.message || JSON.stringify(parsed));
                    reject(new StrongHoldError('ERR_LIGHTNING_REQUEST', `LND request failed with HTTP ${res.statusCode}: ${detail}`, res.statusCode));
                    return;
                }

                resolve(parsed);
            });
        });

        req.on('error', err => {
            reject(new StrongHoldError('ERR_LIGHTNING_UNREACHABLE', `Unable to reach Polar/LND at ${lightningConfig.restUrl}. Start Polar and set LND_REST_URL correctly.`, 503, err.message));
        });

        if (payload) {
            req.write(payload);
        }

        req.end();
    });
}

function normalizeInvoiceResponse(invoice) {
    const rHash = invoice.r_hash || invoice.payment_hash;
    const paymentRequest = invoice.payment_request;

    if (!rHash || !paymentRequest) {
        throw new StrongHoldError('ERR_LIGHTNING_INVOICE', 'LND returned an invoice without r_hash or payment_request.', 502);
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + ((invoice.expiry || 86400) * 1000));

    return {
        rHash,
        paymentRequest,
        amountSats: parseInt(invoice.value || 0, 10),
        memo: invoice.memo || '',
        state: invoice.state || 'OPEN',
        settleIndex: invoice.settle_index || null,
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString()
    };
}

function getVaultForUser(userId) {
    let vaults = mockVaults[userId];
    if (!vaults) {
        if (userId.includes('737475')) {
            vaults = [{
                id: 'vault-student-001',
                donor_id: 'usr-sponsor1',
                patient_id: userId,
                multisig_address: 'regtest-lnd-invoice-pool',
                redeem_script: 'polar-regtest-lightning-invoice-lock',
                amount_sats: 0,
                status: 'locked',
                milestones_total: 3,
                milestones_completed: 0,
                created_at: new Date().toISOString()
            }];
        } else if (userId.includes('73706f')) {
            vaults = [{
                id: 'vault-sponsor-rehab-001',
                donor_id: userId,
                patient_id: 'usr-patient1',
                multisig_address: 'regtest-lnd-invoice-pool',
                redeem_script: 'polar-regtest-lightning-invoice-lock',
                amount_sats: 0,
                status: 'locked',
                milestones_total: 3,
                milestones_completed: 0,
                created_at: new Date().toISOString()
            }];
        } else if (userId.includes('76656e')) {
            vaults = [{
                id: 'vault-vendor-deferred-001',
                donor_id: 'usr-customer123',
                patient_id: userId,
                multisig_address: 'regtest-lnd-invoice-pool',
                redeem_script: 'polar-regtest-lightning-invoice-lock',
                amount_sats: 0,
                status: 'locked',
                milestones_total: 1,
                milestones_completed: 0,
                created_at: new Date().toISOString()
            }];
        } else {
            vaults = [{
                id: 'vault-generic-001',
                donor_id: 'usr-sponsor1',
                patient_id: userId,
                multisig_address: 'regtest-lnd-invoice-pool',
                redeem_script: 'polar-regtest-lightning-invoice-lock',
                amount_sats: 0,
                status: 'locked',
                milestones_total: 3,
                milestones_completed: 0,
                created_at: new Date().toISOString()
            }];
        }
        mockVaults[userId] = vaults;
    }

    return vaults[0];
}

function applyPaidDeposit(userId, amountSats, invoice) {
    const vault = getVaultForUser(userId);
    vault.amount_sats = (parseInt(vault.amount_sats, 10) || 0) + amountSats;
    vault.status = 'locked';
    protocolPoolSats = (protocolPoolSats || 0) + amountSats;

    return {
        vault,
        protocolPoolSats
    };
}

// Local vault data store (replace with Supabase in production)
const mockVaults = {
    'usr-patient1': [
        {
            id: 'vault-001',
            donor_id: 'usr-sponsor1',
            patient_id: 'usr-patient1',
            multisig_address: 'regtest-lnd-invoice-pool',
            redeem_script: 'polar-regtest-lightning-invoice-lock',
            amount_sats: 0,
            status: 'locked',
            milestones_total: 3,
            milestones_completed: 0,
            created_at: new Date().toISOString()
        }
    ],
    'usr-sponsor1': [
        {
            id: 'vault-001',
            donor_id: 'usr-sponsor1',
            patient_id: 'usr-patient1',
            multisig_address: 'regtest-lnd-invoice-pool',
            redeem_script: 'polar-regtest-lightning-invoice-lock',
            amount_sats: 0,
            status: 'locked',
            milestones_total: 3,
            milestones_completed: 0,
            created_at: new Date().toISOString()
        }
    ]
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'StrongHold API online', timestamp: new Date().toISOString(), lightningMode: 'Polar Regtest LND' });
});

app.get('/api/lightning/wallet', async (req, res, next) => {
    try {
        const [info, walletBalance, channelsBalance] = await Promise.all([
            requestLnd('GET', '/v1/info'),
            requestLnd('GET', '/v1/balance/blockchain'),
            requestLnd('GET', '/v1/balance/channels')
        ]);

        const onchainBalance = parseInt(walletBalance.confirmed_balance || walletBalance.total_balance || 0, 10);
        const channelLocalBalance = parseInt(channelsBalance.local_balance?.sat || channelsBalance.balance || 0, 10);
        const poolBalance = protocolPoolSats || onchainBalance + channelLocalBalance;

        return res.status(200).json({
            success: true,
            mode: 'polar-regtest-lnd',
            network: info.chains?.[0]?.network || 'unknown',
            blockHeight: parseInt(info.block_height || 0, 10),
            identityPubkey: info.identity_pubkey,
            onchainBalanceSats: onchainBalance,
            channelLocalBalanceSats: channelLocalBalance,
            protocolPoolSats: poolBalance,
            protocolPoolBtc: (poolBalance / 100000000).toFixed(8)
        });
    } catch (err) {
        next(err);
    }
});

app.post('/api/lightning/invoice', async (req, res, next) => {
    try {
        const { amountSats, memo, purpose, userId } = req.body;
        const normalizedAmount = parseInt(amountSats, 10);

        if (!Number.isInteger(normalizedAmount) || normalizedAmount <= 0) {
            throw new StrongHoldError('ERR_BAD_REQUEST', 'amountSats must be a positive integer.', 400);
        }

        const invoice = await requestLnd('POST', '/v1/invoices', {
            value: normalizedAmount.toString(),
            memo: memo || purpose || 'StrongHold Regtest Lightning Deposit',
            expiry: '86400'
        });

        const normalizedInvoice = normalizeInvoiceResponse(invoice);
        paidDeposits.set(normalizedInvoice.rHash, {
            ...normalizedInvoice,
            userId,
            purpose: purpose || 'deposit',
            appliedToVault: false
        });

        return res.status(200).json({
            success: true,
            invoice: normalizedInvoice,
            statusUrl: `/api/lightning/invoice/${encodeURIComponent(normalizedInvoice.rHash)}`,
            message: 'Real Polar/LND Bolt11 invoice created. Pay it from your User_Wallet node, then poll the status URL.'
        });
    } catch (err) {
        next(err);
    }
});

app.get('/api/lightning/invoice/:rHash', async (req, res, next) => {
    try {
        const { rHash } = req.params;
        if (!rHash) {
            throw new StrongHoldError('ERR_BAD_REQUEST', 'Invoice r_hash is required.', 400);
        }

        const invoice = await requestLnd('GET', `/v1/invoice/${encodeURIComponent(rHash)}`);
        const normalizedInvoice = normalizeInvoiceResponse(invoice);
        const deposit = paidDeposits.get(rHash);
        const settled = normalizedInvoice.state === 'SETTLED';

        if (settled && deposit && !deposit.appliedToVault && deposit.userId) {
            const applied = applyPaidDeposit(deposit.userId, normalizedInvoice.amountSats, normalizedInvoice);
            paidDeposits.set(rHash, {
                ...deposit,
                appliedToVault: true,
                appliedAt: new Date().toISOString(),
                vaultId: applied.vault.id,
                protocolPoolSats: applied.protocolPoolSats
            });
        }

        return res.status(200).json({
            success: true,
            invoice: normalizedInvoice,
            settled,
            appliedToVault: settled && deposit?.appliedToVault,
            vault: settled && deposit?.appliedToVault ? deposit.vaultId : null,
            protocolPoolSats: settled && deposit?.appliedToVault ? deposit.protocolPoolSats : protocolPoolSats
        });
    } catch (err) {
        next(err);
    }
});

/**
 * Endpoint 5: Local User Authentication & Session Generation
 * POST /api/auth/session
 */
app.post('/api/auth/session', async (req, res, next) => {
    try {
        const { email, password, requestedRole } = req.body;

        if (!email || !password) {
            throw new StrongHoldError('ERR_AUTH_MISSING', 'Email and credentials are required.', 400);
        }

        const alias = email.split('@')[0];
        const mockUserId = "usr-" + Buffer.from(email).toString('hex').substring(0, 10);
        
        // Generate a mock JWT access token containing alias and role
        const mockAccessToken = `sh_token_${Buffer.from(JSON.stringify({ userId: mockUserId, role: requestedRole, alias })).toString('base64')}`;

        return res.status(200).json({
            success: true,
            message: 'Session handshake authenticated successfully.',
            session: {
                userId: mockUserId,
                role: requestedRole,
                alias: alias,
                token: mockAccessToken,
                expiresInSeconds: 3600
            }
        });

    } catch (err) {
        next(err);
    }
});

/**
 * Endpoint 6: Retrieve Active Escrows Associated with an Authenticated User
 * GET /api/vaults/user/:userId
 */
app.get('/api/vaults/user/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            throw new StrongHoldError('ERR_BAD_REQUEST', 'User identifier context is required.', 400);
        }

        const vault = getVaultForUser(userId);

        return res.status(200).json({
            success: true,
            vaults: [vault]
        });

    } catch (err) {
        next(err);
    }
});

/**
 * Endpoint to request a survey deposit invoice.
 * POST /api/vaults/user/:userId/survey
 */
app.post('/api/vaults/user/:userId/survey', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const invoice = await requestLnd('POST', '/v1/invoices', {
            value: '50000',
            memo: 'Youth Survey Deposit',
            expiry: '86400'
        });
        const normalizedInvoice = normalizeInvoiceResponse(invoice);
        paidDeposits.set(normalizedInvoice.rHash, {
            ...normalizedInvoice,
            userId,
            purpose: 'survey_deposit',
            appliedToVault: false
        });

        return res.status(200).json({
            success: true,
            invoice: normalizedInvoice,
            statusUrl: `/api/lightning/invoice/${encodeURIComponent(normalizedInvoice.rHash)}`
        });
    } catch (err) {
        next(err);
    }
});

/**
 * Endpoint to request a vendor invoice deposit.
 * POST /api/vaults/user/:userId/deposit
 */
app.post('/api/vaults/user/:userId/deposit', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { amountSats } = req.body;
        const normalizedAmount = parseInt(amountSats, 10);

        if (!Number.isInteger(normalizedAmount) || normalizedAmount <= 0) {
            throw new StrongHoldError('ERR_BAD_REQUEST', 'amountSats must be a positive integer.', 400);
        }

        const invoice = await requestLnd('POST', '/v1/invoices', {
            value: normalizedAmount.toString(),
            memo: 'Vendor Customer Settlement Deposit',
            expiry: '86400'
        });
        const normalizedInvoice = normalizeInvoiceResponse(invoice);
        paidDeposits.set(normalizedInvoice.rHash, {
            ...normalizedInvoice,
            userId,
            purpose: 'vendor_deposit',
            appliedToVault: false
        });

        return res.status(200).json({
            success: true,
            invoice: normalizedInvoice,
            statusUrl: `/api/lightning/invoice/${encodeURIComponent(normalizedInvoice.rHash)}`
        });
    } catch (err) {
        next(err);
    }
});

/**
 * Endpoint to update vault milestones or log breaches
 * POST /api/vaults/:vaultId/event
 */
app.post('/api/vaults/:vaultId/event', async (req, res, next) => {
    try {
        const { vaultId } = req.params;
        const { event } = req.body; // 'milestone' or 'breach'
        
        let foundVault = null;
        for (const userId in mockVaults) {
            const vault = mockVaults[userId].find(v => v.id === vaultId);
            if (vault) {
                foundVault = vault;
                break;
            }
        }

        if (!foundVault) {
            throw new StrongHoldError('ERR_NOT_FOUND', 'Vault not found.', 404);
        }

        if (event === 'milestone') {
            if (foundVault.milestones_completed < foundVault.milestones_total) {
                foundVault.milestones_completed++;
                if (foundVault.milestones_completed >= foundVault.milestones_total) {
                    foundVault.status = 'released';
                }
            }
        } else if (event === 'breach') {
            foundVault.status = 'breached_refunded';
        }

        return res.status(200).json({
            success: true,
            vault: foundVault
        });
    } catch (err) {
        next(err);
    }
});

// Error handling middleware
app.use(errorHandlerMiddleware);

// Server startup
app.listen(PORT, () => {
    console.log(`\x1b[36m[StrongHold Backend]\x1b[0m Server running at http://localhost:${PORT}`);
    console.log(`\x1b[36m[StrongHold Backend]\x1b[0m Health check: GET /api/health`);
    console.log(`\x1b[36m[StrongHold Backend]\x1b[0m Authentication: POST /api/auth/session`);
    console.log(`\x1b[36m[StrongHold Backend]\x1b[0m Vault Tracking: GET /api/vaults/user/:userId`);
    console.log(`\x1b[36m[StrongHold Backend]\x1b[0m Lightning: GET /api/lightning/wallet`);
    console.log(`\x1b[36m[StrongHold Backend]\x1b[0m Lightning: POST /api/lightning/invoice`);
    console.log(`\x1b[36m[StrongHold Backend]\x1b[0m Lightning: GET /api/lightning/invoice/:r_hash`);
});

module.exports = app;



