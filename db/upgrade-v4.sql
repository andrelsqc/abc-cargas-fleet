ALTER TABLE drivers ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_expiry DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE drivers ADD CONSTRAINT drivers_user_org_fk FOREIGN KEY (organization_id,user_id) REFERENCES users(organization_id,id) ON DELETE RESTRICT;
CREATE UNIQUE INDEX drivers_user_unique ON drivers(organization_id,user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX drivers_license_unique ON drivers(organization_id,license_number) WHERE license_number IS NOT NULL AND license_number<>'';
