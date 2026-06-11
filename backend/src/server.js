// server.js - StrongHold Backend API Server
const express = require('express');
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
            throw new StrongHoldError('ERR_AUTH_MISSING', 'Email and password credentials are required.', 400);
        }

        // Simulating basic credential evaluation paths against your database storage
        const mockUserId = "usr-" + Buffer.from(email).toString('hex').substring(0, 10);
        
        // Generate a mock JWT access token structured for routing authorization
        const mockAccessToken = `sh_token_${Buffer.from(JSON.stringify({ userId: mockUserId, role: requestedRole })).toString('base64')}`;

        return res.status(200).json({
            success: true,
            message: 'Session handshake authenticated successfully.',
            session: {
                userId: mockUserId,
                role: requestedRole,
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

        // Query mock vault store (replace with Supabase in production)
        // In production: await supabase.from('vaults').select('*').or(`donor_id.eq.${userId},patient_id.eq.${userId}`)
        const vaults = mockVaults[userId] || [];

        return res.status(200).json({
            success: true,
            vaults: vaults
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
