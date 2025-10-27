-- Add manual adjustments table for stats page corrections
CREATE TABLE IF NOT EXISTS manual_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL, -- Can be positive or negative
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add approval status to buy_ins
ALTER TABLE buy_ins
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_manual_adjustments_user_id ON manual_adjustments(user_id);
CREATE INDEX IF NOT EXISTS idx_buy_ins_approved ON buy_ins(approved);

-- Enable RLS on manual_adjustments
ALTER TABLE manual_adjustments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for manual_adjustments
-- Users can view their own adjustments
CREATE POLICY "Users can view own adjustments"
  ON manual_adjustments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own adjustments
CREATE POLICY "Users can insert own adjustments"
  ON manual_adjustments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own adjustments
CREATE POLICY "Users can delete own adjustments"
  ON manual_adjustments FOR DELETE
  USING (auth.uid() = user_id);

-- Update RLS policy for buy_ins to allow admins to approve
-- First drop existing policies if they exist
DROP POLICY IF EXISTS "Session admins can approve buy-ins" ON buy_ins;

-- Session admins can update buy_ins to approve them
CREATE POLICY "Session admins can approve buy-ins"
  ON buy_ins FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM session_members sm
      WHERE sm.session_id = buy_ins.session_id
        AND sm.user_id = auth.uid()
        AND sm.role = 'admin'
    )
  );

-- Create updated_at trigger for manual_adjustments
CREATE OR REPLACE FUNCTION update_manual_adjustments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS manual_adjustments_updated_at ON manual_adjustments;
CREATE TRIGGER manual_adjustments_updated_at
  BEFORE UPDATE ON manual_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION update_manual_adjustments_updated_at();
