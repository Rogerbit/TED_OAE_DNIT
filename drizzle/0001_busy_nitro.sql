CREATE TYPE "public"."relatorio_codigo" AS ENUM('R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9', 'R10', 'R11', 'R12', 'R13', 'R14', 'R15');--> statement-breakpoint
ALTER TABLE "relatorios_gerenciais" ALTER COLUMN "codigo" SET DATA TYPE "public"."relatorio_codigo" USING "codigo"::"public"."relatorio_codigo";--> statement-breakpoint
ALTER TABLE "snapshots_ciclo" ADD COLUMN "relatorio_id" uuid;--> statement-breakpoint
ALTER TABLE "snapshots_ciclo" ADD CONSTRAINT "snapshots_ciclo_relatorio_id_relatorios_gerenciais_id_fk" FOREIGN KEY ("relatorio_id") REFERENCES "public"."relatorios_gerenciais"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entregas_versoes" ADD CONSTRAINT "entregas_versoes_ocorrencia_id_versao_numero_unique" UNIQUE("ocorrencia_id","versao_numero");--> statement-breakpoint
ALTER TABLE "ocorrencias_produtos" ADD CONSTRAINT "ocorrencias_produtos_produto_id_numero_unique" UNIQUE("produto_id","numero");