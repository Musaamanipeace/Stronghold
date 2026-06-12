// server.js - StrongHold Backend API Server
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { errorHandlerMiddleware, StrongHoldError, DatabaseError } = require('./errors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock vault data store (replace with Supabase in production)
const mockVaults = {
    'usr-patient1': [
        {
            id: 'vault-001',
            donor_id: 'usr-sponsor1',
            patient_id: 'usr-patient1',
            multisig_address: '2N3SGD7kZfNzPMqkqNyNJQE4Ew2y6Q5h7Ux',
            redeem_script: '5221026e...',
            amount_sats: 500000,
            status: 'locked',
            milestones_total: 3,
            milestones_completed: 1,
            created_at: new Date('2024-01-15').toISOString()
        }
    ],
    'usr-sponsor1': [
        {
            id: 'vault-001',
            donor_id: 'usr-sponsor1',
            patient_id: 'usr-patient1',
            multisig_address: '2N3SGD7kZfNzPMqkqNyNJQE4Ew2y6Q5h7Ux',
            redeem_script: '5221026e...',
            amount_sats: 500000,
            status: 'locked',
            milestones_total: 3,
            milestones_completed: 1,
            created_at: new Date('2024-01-15').toISOString()
        }
    ]
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'StrongHold API online', timestamp: new Date().toISOString() });
});

/**
 * Endpoint 5: Mock User Authentication & Session Generation
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

        let vaults = mockVaults[userId];
        if (!vaults) {
            // Seed realistic vaults based on dynamic ID checks (e.g. role check matching)
            if (userId.includes('737475')) { // student
                vaults = [
                    {
                        id: 'vault-student-001',
                        donor_id: 'usr-sponsor1',
                        patient_id: userId,
                        multisig_address: '2N2SurveyStakingAddressMock77777777',
                        redeem_script: '52210212...',
                        amount_sats: 450000,
                        status: 'locked',
                        milestones_total: 3,
                        milestones_completed: 1,
                        created_at: new Date().toISOString()
                    }
                ];
            } else if (userId.includes('73706f')) { // sponsor / donor
                vaults = [
                    {
                        id: 'vault-sponsor-rehab-001',
                        donor_id: userId,
                        patient_id: 'usr-patient1',
                        multisig_address: '2N3SponsorRehabAddressMock99999999',
                        redeem_script: '5221026e...',
                        amount_sats: 2500000,
                        status: 'locked',
                        milestones_total: 3,
                        milestones_completed: 1,
                        created_at: new Date().toISOString()
                    }
                ];
            } else if (userId.includes('76656e')) { // vendor
                vaults = [
                    {
                        id: 'vault-vendor-deferred-001',
                        donor_id: 'usr-customer123',
                        patient_id: userId,
                        multisig_address: '2N4VendorDeferredSpendMock55555555',
                        redeem_script: '5221034f...',
                        amount_sats: 8000000,
                        status: 'locked',
                        milestones_total: 1,
                        milestones_completed: 0,
                        created_at: new Date().toISOString()
                    }
                ];
            } else {
                // Default fallback
                vaults = [
                    {
                        id: 'vault-generic-001',
                        donor_id: 'usr-sponsor1',
                        patient_id: userId,
                        multisig_address: '2N5GenericStrongholdAddressMock1111',
                        redeem_script: '5221023a...',
                        amount_sats: 1000000,
                        status: 'locked',
                        milestones_total: 3,
                        milestones_completed: 0,
                        created_at: new Date().toISOString()
                    }
                ];
            }
            mockVaults[userId] = vaults;
        }

        return res.status(200).json({
            success: true,
            vaults: vaults
        });

    } catch (err) {
        next(err);
    }
});

/**
 * Endpoint to add survey earnings to student vault
 * POST /api/vaults/user/:userId/survey
 */
app.post('/api/vaults/user/:userId/survey', async (req, res, next) => {
    try {
        const { userId } = req.params;
        let vaults = mockVaults[userId] || [];
        if (vaults.length > 0) {
            vaults[0].amount_sats += 50000;
        }
        return res.status(200).json({
            success: true,
            vaults: vaults
        });
    } catch (err) {
        next(err);
    }
});

/**
 * Endpoint to add invoice deposits to vendor vault
 * POST /api/vaults/user/:userId/deposit
 */
app.post('/api/vaults/user/:userId/deposit', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { amount } = req.body;
        let vaults = mockVaults[userId] || [];
        if (vaults.length > 0) {
            vaults[0].amount_sats += parseInt(amount, 10) || 0;
        }
        return res.status(200).json({
            success: true,
            vaults: vaults
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
});

module.exports = app;



