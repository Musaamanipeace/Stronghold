-- ==========================================
-- STRONGHOLD DATABASE SCHEMA (PostgreSQL / Supabase)
-- ==========================================

-- Enable cryptographic extensions for unique identifier generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
-- Tracks all participants in the StrongHold Sacco ecosystem
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'patient', 'donor', 'chama_member', 'admin')),
    wallet_address TEXT UNIQUE, -- Base Layer 1 Bitcoin Address
    lightning_address TEXT,     -- Lightning Network identifier (e.g., user@getalby.com)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ESCROW VAULTS TABLE
-- Coordinates the 2-of-3 programmatic multisig states for rehabilitation
CREATE TABLE vaults (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    donor_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    multisig_address TEXT NOT NULL UNIQUE,
    redeem_script TEXT NOT NULL,
    amount_sats BIGINT NOT NULL CHECK (amount_sats > 0),
    status VARCHAR(50) DEFAULT 'locked' CHECK (status IN ('locked', 'released', 'breached_refunded')),
    milestones_total INT DEFAULT 3,
    milestones_completed INT DEFAULT 0 CHECK (milestones_completed >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SURVEYS TABLE
-- Micro-survey templates for earning Lightning payments
CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    payment_msat BIGINT NOT NULL CHECK (payment_msat > 0),
    estimated_minutes INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SURVEY SUBMISSIONS TRACKING
-- Prevents double-claiming and log payment status
CREATE TABLE survey_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
    lightning_payment_hash TEXT UNIQUE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. VOLUNTEER WORK BOARD TABLE
-- Implements the task board where users earn future-vested Bitcoin
CREATE TABLE volunteer_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Engineering', 'Outreach', 'Academic'
    description TEXT NOT NULL,
    reward_sats BIGINT NOT NULL CHECK (reward_sats > 0),
    lock_period_days INT DEFAULT 14, -- Protocol execution restriction
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'under_review', 'completed')),
    assigned_volunteer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. VOLUNTEER VESTING ESCROWS
-- Tracks locked rewards subject to the 14-day warranty rule
CREATE TABLE volunteer_vesting (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES volunteer_tasks(id) ON DELETE CASCADE,
    volunteer_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    amount_sats BIGINT NOT NULL,
    unlock_timestamp TIMESTAMP WITH TIME ZONE NOT NULL, -- Evaluates CheckLockTimeVerify criteria
    is_withdrawn BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES FOR SCALE & SPEED
CREATE INDEX idx_vaults_patient ON vaults(patient_id);
CREATE INDEX idx_vaults_status ON vaults(status);
CREATE INDEX idx_submissions_student ON survey_submissions(student_id);
CREATE INDEX idx_vesting_unlock ON volunteer_vesting(unlock_timestamp) WHERE is_withdrawn = FALSE;
