-- ============================================================
-- SEED: Services v2 - New Portfolio
-- ============================================================

-- Clean up existing generic services if they are from the default setup
-- (Optional: decide if you want to keep them or start fresh)
-- DELETE FROM services; 

-- Insert specific services requested
INSERT INTO services (title, description, icon)
SELECT 'Plano de Saúde', 'Consultoria em planos de saúde empresariais e familiares, focada em otimização de custos e ampla rede credenciada.', 'HeartPulse'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE title = 'Plano de Saúde');

INSERT INTO services (title, description, icon)
SELECT 'Plano Odontológico', 'Soluções completas para saúde bucal com as melhores operadoras do mercado.', 'Stethoscope'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE title = 'Plano Odontológico');

INSERT INTO services (title, description, icon)
SELECT 'Seguro de Vida', 'Proteção financeira personalizada para garantir a tranquilidade de quem você ama.', 'Shield'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE title = 'Seguro de Vida');

INSERT INTO services (title, description, icon)
SELECT 'Previdência Privada', 'Planejamento estratégico para aposentadoria e sucessão patrimonial.', 'TrendingUp'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE title = 'Previdência Privada');

INSERT INTO services (title, description, icon)
SELECT 'Seguro Viagem', 'Cobertura internacional e nacional para viagens de lazer ou negócios.', 'Plane'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE title = 'Seguro Viagem');

INSERT INTO services (title, description, icon)
SELECT 'Seguro Auto', 'Proteção veicular completa com assistência 24h e coberturas exclusivas.', 'Car'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE title = 'Seguro Auto');

INSERT INTO services (title, description, icon)
SELECT 'Seguro Pet', 'Cuidado e proteção para a saúde do seu melhor amigo.', 'Heart'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE title = 'Seguro Pet');

INSERT INTO services (title, description, icon)
SELECT 'Assistência Funeral', 'Suporte completo e humanizado em momentos difíceis.', 'Activity'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE title = 'Assistência Funeral');

INSERT INTO services (title, description, icon)
SELECT 'Acidentes Pessoais', 'Cobertura para morte acidental, invalidez e despesas médico-hospitalares.', 'AlertTriangle'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE title = 'Acidentes Pessoais');

INSERT INTO services (title, description, icon)
SELECT 'Renda por Incapacidade (DIT/RIT)', 'Garantia de renda para profissionais liberais e autônomos em caso de afastamento.', 'Briefcase'
WHERE NOT EXISTS (SELECT 1 FROM services WHERE title = 'Renda por Incapacidade (DIT/RIT)');

-- Done
SELECT 'Services seed completed' AS status;
