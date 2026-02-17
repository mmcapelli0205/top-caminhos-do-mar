
ALTER TABLE servidores ADD COLUMN IF NOT EXISTS profissao TEXT;
ALTER TABLE servidores ADD COLUMN IF NOT EXISTS especialidade_medica TEXT;
ALTER TABLE servidores ADD COLUMN IF NOT EXISTS crm TEXT;

ALTER TABLE hakuna_participante ADD COLUMN IF NOT EXISTS servidor_id UUID REFERENCES servidores(id);
