-- Real enforcement of "Relatório Gerencial imutável uma vez fechado" -- the
-- legacy prototype (fase3c-relatorios-gerenciais.mjs) only relied on
-- data-flow convention (no runtime guard); this trigger rejects any UPDATE
-- on a row that is already Fechado, at the database level.
CREATE OR REPLACE FUNCTION relatorio_gerencial_imutavel() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'Fechado' THEN
    RAISE EXCEPTION 'Relatório Gerencial % já fechado é imutável.', OLD.codigo;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_relatorio_gerencial_imutavel
  BEFORE UPDATE ON relatorios_gerenciais
  FOR EACH ROW EXECUTE FUNCTION relatorio_gerencial_imutavel();
