CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','manager','operator','viewer')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, email)
);

CREATE TABLE IF NOT EXISTS organization_settings (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  plate TEXT NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL,
  km NUMERIC NOT NULL DEFAULT 0,
  driver TEXT NOT NULL DEFAULT '—',
  next_maintenance DATE,
  fuel NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, code)
);

CREATE TABLE IF NOT EXISTS drivers (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  license TEXT NOT NULL,
  status TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, code)
);

CREATE TABLE IF NOT EXISTS maintenance (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  vehicle_code TEXT NOT NULL,
  type TEXT NOT NULL,
  service_date DATE NOT NULL,
  status TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, code),
  FOREIGN KEY (organization_id, vehicle_code) REFERENCES vehicles(organization_id, code) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fuel_records (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  vehicle_code TEXT NOT NULL,
  service_date DATE NOT NULL,
  liters NUMERIC NOT NULL DEFAULT 0,
  km NUMERIC NOT NULL DEFAULT 0,
  driver TEXT NOT NULL DEFAULT '—',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, code),
  FOREIGN KEY (organization_id, vehicle_code) REFERENCES vehicles(organization_id, code) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  vehicle_code TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  level TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  event_date DATE NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (organization_id, code),
  FOREIGN KEY (organization_id, vehicle_code) REFERENCES vehicles(organization_id, code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_org_status ON vehicles(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_org_date ON maintenance(organization_id, service_date);
CREATE INDEX IF NOT EXISTS idx_fuel_org_date ON fuel_records(organization_id, service_date);
CREATE INDEX IF NOT EXISTS idx_notifications_org_read ON notifications(organization_id, read);
