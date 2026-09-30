ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE maintenance ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE fuel_records ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS revision BIGINT NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS yards (
 organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 code TEXT NOT NULL,
 name TEXT NOT NULL,
 address TEXT NOT NULL DEFAULT '',
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 PRIMARY KEY (organization_id,code)
);
INSERT INTO yards(organization_id,code,name)
 SELECT id,'PATIO-PRINCIPAL','Pátio principal' FROM organizations
 ON CONFLICT(organization_id,code) DO NOTHING;
UPDATE vehicles SET details=jsonb_set(details,'{yardId}','"PATIO-PRINCIPAL"'::jsonb)
 WHERE NOT(details ? 'yardId');
-- Do not rename old internal codes: maintenance/fuel history remains linked.
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_org_plate_unique
 ON vehicles(organization_id,upper(regexp_replace(plate,'[^A-Za-z0-9]','','g')));
