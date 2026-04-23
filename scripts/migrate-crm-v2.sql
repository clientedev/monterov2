-- ============================================================
-- MIGRATION: CRM v2 - Safe for Railway PostgreSQL
-- Run ONCE. All statements use IF NOT EXISTS / IF EXISTS guards.
-- ============================================================

-- 1. Add new fields to contacts table (safe - won't error if already exist)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS responsible_name TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS anniversary_date TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS marital_status TEXT;

-- 2. Add product field to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS product TEXT;

-- 3. Create products table (for the CRM dropdown)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Seed some default insurance products
INSERT INTO products (name, description, is_active)
SELECT 'Plano de Saúde', 'Planos de saúde individuais, familiares e empresariais', TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Plano de Saúde');

INSERT INTO products (name, description, is_active)
SELECT 'Plano Odontológico', 'Planos odontológicos individuais, familiares e corporativos', TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Plano Odontológico');

INSERT INTO products (name, description, is_active)
SELECT 'Seguro de Vida', 'Seguro de vida individual, empresarial e para estagiários', TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Seguro de Vida');

INSERT INTO products (name, description, is_active)
SELECT 'Previdência Privada', 'Planejamento financeiro e aposentadoria complementar', TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Previdência Privada');

INSERT INTO products (name, description, is_active)
SELECT 'Seguro Viagem', 'Cobertura para viagens nacionais e internacionais', TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Seguro Viagem');

INSERT INTO products (name, description, is_active)
SELECT 'Seguro Auto', 'Proteção veicular completa com cobertura personalizada', TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Seguro Auto');

INSERT INTO products (name, description, is_active)
SELECT 'Seguro Pet', 'Saúde e proteção para animais de estimação', TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Seguro Pet');

INSERT INTO products (name, description, is_active)
SELECT 'Assistência Funeral', 'Cobertura funeral individual e familiar', TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Assistência Funeral');

INSERT INTO products (name, description, is_active)
SELECT 'Acidentes Pessoais', 'Proteção financeira em acidentes com invalidez ou morte', TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Acidentes Pessoais');

INSERT INTO products (name, description, is_active)
SELECT 'Renda por Incapacidade (DIT/RIT)', 'Proteção de renda durante afastamento temporário', TRUE
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Renda por Incapacidade (DIT/RIT)');

-- Done
SELECT 'Migration completed successfully' AS status;
