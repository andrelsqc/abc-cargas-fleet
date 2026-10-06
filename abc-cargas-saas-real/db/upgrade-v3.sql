CREATE UNIQUE INDEX IF NOT EXISTS idx_users_org_id ON users(organization_id,id);
CREATE TABLE IF NOT EXISTS fleet_reservations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id),
 vehicle_code TEXT NOT NULL, requester_id UUID NOT NULL, driver_id UUID NOT NULL,
 starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
 vehicle_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
 purpose TEXT NOT NULL, destination TEXT NOT NULL DEFAULT '',
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','active','reviewing','correction','completed','rejected','cancelled')),
 version INTEGER NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(organization_id,id), CHECK(ends_at>starts_at),
 FOREIGN KEY(organization_id,vehicle_code) REFERENCES vehicles(organization_id,code) ON DELETE RESTRICT,
 FOREIGN KEY(organization_id,requester_id) REFERENCES users(organization_id,id),
 FOREIGN KEY(organization_id,driver_id) REFERENCES users(organization_id,id)
);
CREATE INDEX IF NOT EXISTS idx_reservations_vehicle_period ON fleet_reservations(organization_id,vehicle_code,starts_at,ends_at);
CREATE TABLE IF NOT EXISTS fleet_inspections (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL, reservation_id UUID NOT NULL,
 phase TEXT NOT NULL CHECK(phase IN ('checkin','checkout')),
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','submitted','returned','accepted')),
 author_id UUID NOT NULL, km NUMERIC, fuel NUMERIC, notes TEXT NOT NULL DEFAULT '', issue BOOLEAN NOT NULL DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), submitted_at TIMESTAMPTZ,
 UNIQUE(organization_id,id),
 FOREIGN KEY(organization_id,reservation_id) REFERENCES fleet_reservations(organization_id,id) ON DELETE RESTRICT,
 FOREIGN KEY(organization_id,author_id) REFERENCES users(organization_id,id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inspection_one_draft ON fleet_inspections(reservation_id,phase) WHERE status='draft';
CREATE TABLE IF NOT EXISTS fleet_inspection_photos (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL, inspection_id UUID NOT NULL,
 slot TEXT NOT NULL CHECK(slot IN ('front','rear','left','right','panel','detail1','detail2','detail3')),
 mime_type TEXT NOT NULL CHECK(mime_type IN ('image/jpeg','image/png','image/webp')),
 bytes BYTEA NOT NULL, sha256 TEXT NOT NULL, uploaded_by UUID NOT NULL, uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 CHECK(octet_length(bytes)<=700000), UNIQUE(inspection_id,slot),
 FOREIGN KEY(organization_id,inspection_id) REFERENCES fleet_inspections(organization_id,id) ON DELETE RESTRICT,
 FOREIGN KEY(organization_id,uploaded_by) REFERENCES users(organization_id,id)
);
CREATE TABLE IF NOT EXISTS fleet_reservation_events (
 id BIGSERIAL PRIMARY KEY, organization_id UUID NOT NULL, reservation_id UUID NOT NULL,
 action TEXT NOT NULL, actor_id UUID NOT NULL, note TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 FOREIGN KEY(organization_id,reservation_id) REFERENCES fleet_reservations(organization_id,id) ON DELETE RESTRICT,
 FOREIGN KEY(organization_id,actor_id) REFERENCES users(organization_id,id)
);
