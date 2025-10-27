-- Add paid status tracking to settlements table

-- Add paid column (default false for existing records)
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT false;

-- Add paid_at timestamp column
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Add paid_by column to track who marked it as paid
ALTER TABLE settlements ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES auth.users(id);

-- Add index for querying unpaid settlements
CREATE INDEX IF NOT EXISTS idx_settlements_paid ON settlements(paid);

-- Add index for filtering by paid_at
CREATE INDEX IF NOT EXISTS idx_settlements_paid_at ON settlements(paid_at);

COMMENT ON COLUMN settlements.paid IS 'Whether the settlement has been paid';
COMMENT ON COLUMN settlements.paid_at IS 'When the settlement was marked as paid';
COMMENT ON COLUMN settlements.paid_by IS 'User who marked the settlement as paid';
