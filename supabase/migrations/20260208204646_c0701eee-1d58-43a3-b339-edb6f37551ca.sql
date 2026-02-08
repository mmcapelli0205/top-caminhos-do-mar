ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pode_aprovar BOOLEAN DEFAULT FALSE;
UPDATE user_profiles SET pode_aprovar = true WHERE id = '4c7d3dae-e747-4414-a11d-5fd3126404f5';