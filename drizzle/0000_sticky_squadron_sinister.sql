CREATE TYPE "public"."semaforo" AS ENUM('Regular', 'Atenção', 'Crítico', 'Aguardando condição-decisão');--> statement-breakpoint
CREATE TYPE "public"."status_atividade" AS ENUM('Não iniciada', 'Em execução', 'Concluída', 'Suspensa');--> statement-breakpoint
CREATE TYPE "public"."status_ciclo" AS ENUM('Aberto', 'Fechado');--> statement-breakpoint
CREATE TYPE "public"."status_condicionante" AS ENUM('Ativa', 'Em atendimento', 'Atendida', 'Encerrada');--> statement-breakpoint
CREATE TYPE "public"."status_pendencia" AS ENUM('Aberta', 'Em tratamento', 'Aguardando DNIT', 'Resolvida', 'Encerrada');--> statement-breakpoint
CREATE TYPE "public"."status_produto" AS ENUM('Não iniciado', 'Em desenvolvimento', 'Concluído');--> statement-breakpoint
CREATE TYPE "public"."status_relatorio" AS ENUM('Planejado', 'Entregue', 'Fechado');--> statement-breakpoint
CREATE TABLE "acoes" (
	"id" text PRIMARY KEY NOT NULL,
	"ted_id" text NOT NULL,
	"titulo" text NOT NULL,
	"origem" text,
	"estado" text
);
--> statement-breakpoint
CREATE TABLE "metas" (
	"id" text PRIMARY KEY NOT NULL,
	"acao_id" text NOT NULL,
	"codigo" text NOT NULL,
	"descricao" text,
	"origem" text
);
--> statement-breakpoint
CREATE TABLE "responsabilidade_acao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acao_id" text NOT NULL,
	"responsavel_id" uuid NOT NULL,
	"papel" text,
	"ativo" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "responsaveis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" text NOT NULL,
	"email" text,
	"papel" text,
	"criado_em" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ted" (
	"id" text PRIMARY KEY NOT NULL,
	"numero" text NOT NULL,
	"objeto" text,
	"data_inicio" date,
	"data_fim" date
);
--> statement-breakpoint
CREATE TABLE "acompanhamentos_atividades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"atividade_id" text NOT NULL,
	"data_registro" timestamp with time zone DEFAULT now(),
	"registrado_por" uuid,
	"percentual_anterior" numeric(5, 2),
	"percentual_atual" numeric(5, 2),
	"status_anterior" "status_atividade",
	"status_atual" "status_atividade",
	"semaforo_anterior" "semaforo",
	"semaforo_atual" "semaforo",
	"justificativa" text,
	"origem" text
);
--> statement-breakpoint
CREATE TABLE "atividades" (
	"id" text PRIMARY KEY NOT NULL,
	"acao_id" text NOT NULL,
	"meta_id" text NOT NULL,
	"descricao" text NOT NULL,
	"inicio_previsto" date,
	"fim_previsto" date,
	"condicional" boolean DEFAULT false,
	"origem" text
);
--> statement-breakpoint
CREATE TABLE "atividades_estado_atual" (
	"atividade_id" text PRIMARY KEY NOT NULL,
	"status_atual" "status_atividade",
	"percentual_atual" numeric(5, 2),
	"semaforo_atual" "semaforo",
	"semaforo_justificativa" text,
	"atualizado_em" timestamp with time zone DEFAULT now(),
	"atualizado_por" uuid
);
--> statement-breakpoint
CREATE TABLE "acompanhamentos_produtos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"produto_id" text NOT NULL,
	"ocorrencia_id" text,
	"data_registro" timestamp with time zone DEFAULT now(),
	"registrado_por" uuid,
	"percentual_anterior" numeric(5, 2),
	"percentual_atual" numeric(5, 2),
	"status_anterior" "status_produto",
	"status_atual" "status_produto",
	"semaforo_anterior" "semaforo",
	"semaforo_atual" "semaforo",
	"justificativa" text,
	"origem" text
);
--> statement-breakpoint
CREATE TABLE "entregas_versoes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"produto_id" text NOT NULL,
	"ocorrencia_id" text NOT NULL,
	"versao_numero" integer NOT NULL,
	"data_entrega" date,
	"resumo" text,
	"registrado_por" uuid,
	"criado_em" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "evidencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entrega_versao_id" uuid,
	"atividade_id" text,
	"pendencia_id" uuid,
	"condicionante_id" uuid,
	"titulo" text NOT NULL,
	"storage_path" text,
	"referencia" text,
	"registrado_por" uuid,
	"criado_em" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ocorrencias_produtos" (
	"id" text PRIMARY KEY NOT NULL,
	"produto_id" text NOT NULL,
	"numero" integer NOT NULL,
	"data_prevista" date,
	"origem" text
);
--> statement-breakpoint
CREATE TABLE "produtos" (
	"id" text PRIMARY KEY NOT NULL,
	"acao_id" text NOT NULL,
	"meta_id" text NOT NULL,
	"codigo" text NOT NULL,
	"descricao" text NOT NULL,
	"ocorrencia_prevista_numero" integer DEFAULT 1,
	"entrega_prevista" date,
	"condicional" boolean DEFAULT false,
	"origem" text
);
--> statement-breakpoint
CREATE TABLE "produtos_estado_atual" (
	"produto_id" text PRIMARY KEY NOT NULL,
	"status_atual" "status_produto",
	"percentual_atual" numeric(5, 2),
	"semaforo_atual" "semaforo",
	"semaforo_justificativa" text,
	"atualizado_em" timestamp with time zone DEFAULT now(),
	"atualizado_por" uuid
);
--> statement-breakpoint
CREATE TABLE "condicionantes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acao_id" text,
	"meta_id" text,
	"atividade_id" text,
	"produto_id" text,
	"ocorrencia_id" text,
	"entrega_versao_id" uuid,
	"titulo" text NOT NULL,
	"descricao" text,
	"status_atual" "status_condicionante" DEFAULT 'Ativa' NOT NULL,
	"responsavel_id" uuid,
	"criado_em" timestamp with time zone DEFAULT now(),
	"criado_por" uuid
);
--> statement-breakpoint
CREATE TABLE "historico_condicionantes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"condicionante_id" uuid NOT NULL,
	"registrado_em" timestamp with time zone DEFAULT now(),
	"registrado_por" uuid,
	"status_anterior" "status_condicionante",
	"status_novo" "status_condicionante",
	"descricao" text,
	"justificativa" text,
	"evidencia_id" uuid
);
--> statement-breakpoint
CREATE TABLE "historico_pendencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pendencia_id" uuid NOT NULL,
	"registrado_em" timestamp with time zone DEFAULT now(),
	"registrado_por" uuid,
	"status_anterior" "status_pendencia",
	"status_novo" "status_pendencia",
	"descricao" text,
	"justificativa" text,
	"prazo" date,
	"evidencia_id" uuid
);
--> statement-breakpoint
CREATE TABLE "pendencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"acao_id" text,
	"meta_id" text,
	"atividade_id" text,
	"produto_id" text,
	"ocorrencia_id" text,
	"entrega_versao_id" uuid,
	"titulo" text NOT NULL,
	"descricao" text,
	"status_atual" "status_pendencia" DEFAULT 'Aberta' NOT NULL,
	"responsavel_acao_id" uuid,
	"responsavel_registro_id" uuid,
	"responsavel_acompanhamento_id" uuid,
	"prazo" date,
	"criado_em" timestamp with time zone DEFAULT now(),
	"criado_por" uuid
);
--> statement-breakpoint
CREATE TABLE "ciclos_governanca" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" text NOT NULL,
	"data_inicio" date,
	"data_fim" date,
	"status" "status_ciclo" DEFAULT 'Aberto' NOT NULL,
	CONSTRAINT "ciclos_governanca_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "comprovacoes_fiscalizacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ciclo_id" uuid,
	"acao_id" text,
	"tipo" text,
	"storage_path" text,
	"referencia" text,
	"registrado_por" uuid,
	"criado_em" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fotografias_ciclo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ciclo_id" uuid NOT NULL,
	"atividade_id" text,
	"produto_id" text,
	"storage_path" text,
	"descricao" text,
	"registrado_por" uuid,
	"criado_em" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "relatorios_gerenciais" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" text NOT NULL,
	"ciclo" text,
	"data_planejada" date,
	"data_efetiva" date,
	"status" "status_relatorio" DEFAULT 'Planejado' NOT NULL,
	"referencia_digital" text,
	"fechado_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now(),
	CONSTRAINT "relatorios_gerenciais_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "relatorios_historico" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relatorio_id" uuid NOT NULL,
	"evento" text NOT NULL,
	"registrado_em" timestamp with time zone DEFAULT now(),
	"registrado_por" uuid,
	"status_anterior" "status_relatorio",
	"status_novo" "status_relatorio",
	"referencia_digital" text
);
--> statement-breakpoint
CREATE TABLE "snapshots_ciclo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ciclo_id" uuid NOT NULL,
	"gerado_em" timestamp with time zone DEFAULT now(),
	"gerado_por" uuid,
	"payload_json" jsonb,
	"hash" text
);
--> statement-breakpoint
CREATE TABLE "orcamento" (
	"id" text PRIMARY KEY NOT NULL,
	"escopo" text NOT NULL,
	"rubrica" text NOT NULL,
	"item" text NOT NULL,
	"referencia" text,
	"quantidade" numeric(12, 2),
	"meses" integer,
	"valor_acao1" numeric(14, 2),
	"valor_acao2" numeric(14, 2),
	"valor_acao3" numeric(14, 2),
	"valor_planejado" numeric(14, 2) NOT NULL,
	"condicional" boolean DEFAULT false,
	"revisao_fonte" boolean DEFAULT false,
	"origem" text
);
--> statement-breakpoint
CREATE TABLE "repasses" (
	"id" text PRIMARY KEY NOT NULL,
	"parcela_numero" integer NOT NULL,
	"marco" text NOT NULL,
	"valor_planejado" numeric(14, 2) NOT NULL,
	"valor_repassado" numeric(14, 2) DEFAULT '0',
	"valor_reprogramado" numeric(14, 2) DEFAULT '0',
	"data_prevista" date,
	"data_realizada" date,
	"status" text
);
--> statement-breakpoint
ALTER TABLE "acoes" ADD CONSTRAINT "acoes_ted_id_ted_id_fk" FOREIGN KEY ("ted_id") REFERENCES "public"."ted"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metas" ADD CONSTRAINT "metas_acao_id_acoes_id_fk" FOREIGN KEY ("acao_id") REFERENCES "public"."acoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responsabilidade_acao" ADD CONSTRAINT "responsabilidade_acao_acao_id_acoes_id_fk" FOREIGN KEY ("acao_id") REFERENCES "public"."acoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responsabilidade_acao" ADD CONSTRAINT "responsabilidade_acao_responsavel_id_responsaveis_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acompanhamentos_atividades" ADD CONSTRAINT "acompanhamentos_atividades_atividade_id_atividades_id_fk" FOREIGN KEY ("atividade_id") REFERENCES "public"."atividades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acompanhamentos_atividades" ADD CONSTRAINT "acompanhamentos_atividades_registrado_por_responsaveis_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atividades" ADD CONSTRAINT "atividades_acao_id_acoes_id_fk" FOREIGN KEY ("acao_id") REFERENCES "public"."acoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atividades" ADD CONSTRAINT "atividades_meta_id_metas_id_fk" FOREIGN KEY ("meta_id") REFERENCES "public"."metas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atividades_estado_atual" ADD CONSTRAINT "atividades_estado_atual_atividade_id_atividades_id_fk" FOREIGN KEY ("atividade_id") REFERENCES "public"."atividades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atividades_estado_atual" ADD CONSTRAINT "atividades_estado_atual_atualizado_por_responsaveis_id_fk" FOREIGN KEY ("atualizado_por") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acompanhamentos_produtos" ADD CONSTRAINT "acompanhamentos_produtos_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acompanhamentos_produtos" ADD CONSTRAINT "acompanhamentos_produtos_ocorrencia_id_ocorrencias_produtos_id_fk" FOREIGN KEY ("ocorrencia_id") REFERENCES "public"."ocorrencias_produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "acompanhamentos_produtos" ADD CONSTRAINT "acompanhamentos_produtos_registrado_por_responsaveis_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entregas_versoes" ADD CONSTRAINT "entregas_versoes_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entregas_versoes" ADD CONSTRAINT "entregas_versoes_ocorrencia_id_ocorrencias_produtos_id_fk" FOREIGN KEY ("ocorrencia_id") REFERENCES "public"."ocorrencias_produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entregas_versoes" ADD CONSTRAINT "entregas_versoes_registrado_por_responsaveis_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_entrega_versao_id_entregas_versoes_id_fk" FOREIGN KEY ("entrega_versao_id") REFERENCES "public"."entregas_versoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidencias" ADD CONSTRAINT "evidencias_registrado_por_responsaveis_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ocorrencias_produtos" ADD CONSTRAINT "ocorrencias_produtos_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_acao_id_acoes_id_fk" FOREIGN KEY ("acao_id") REFERENCES "public"."acoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_meta_id_metas_id_fk" FOREIGN KEY ("meta_id") REFERENCES "public"."metas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos_estado_atual" ADD CONSTRAINT "produtos_estado_atual_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "produtos_estado_atual" ADD CONSTRAINT "produtos_estado_atual_atualizado_por_responsaveis_id_fk" FOREIGN KEY ("atualizado_por") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condicionantes" ADD CONSTRAINT "condicionantes_acao_id_acoes_id_fk" FOREIGN KEY ("acao_id") REFERENCES "public"."acoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condicionantes" ADD CONSTRAINT "condicionantes_meta_id_metas_id_fk" FOREIGN KEY ("meta_id") REFERENCES "public"."metas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condicionantes" ADD CONSTRAINT "condicionantes_responsavel_id_responsaveis_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "condicionantes" ADD CONSTRAINT "condicionantes_criado_por_responsaveis_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_condicionantes" ADD CONSTRAINT "historico_condicionantes_condicionante_id_condicionantes_id_fk" FOREIGN KEY ("condicionante_id") REFERENCES "public"."condicionantes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_condicionantes" ADD CONSTRAINT "historico_condicionantes_registrado_por_responsaveis_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_pendencias" ADD CONSTRAINT "historico_pendencias_pendencia_id_pendencias_id_fk" FOREIGN KEY ("pendencia_id") REFERENCES "public"."pendencias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historico_pendencias" ADD CONSTRAINT "historico_pendencias_registrado_por_responsaveis_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pendencias" ADD CONSTRAINT "pendencias_acao_id_acoes_id_fk" FOREIGN KEY ("acao_id") REFERENCES "public"."acoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pendencias" ADD CONSTRAINT "pendencias_meta_id_metas_id_fk" FOREIGN KEY ("meta_id") REFERENCES "public"."metas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pendencias" ADD CONSTRAINT "pendencias_responsavel_acao_id_responsaveis_id_fk" FOREIGN KEY ("responsavel_acao_id") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pendencias" ADD CONSTRAINT "pendencias_responsavel_registro_id_responsaveis_id_fk" FOREIGN KEY ("responsavel_registro_id") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pendencias" ADD CONSTRAINT "pendencias_responsavel_acompanhamento_id_responsaveis_id_fk" FOREIGN KEY ("responsavel_acompanhamento_id") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pendencias" ADD CONSTRAINT "pendencias_criado_por_responsaveis_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comprovacoes_fiscalizacao" ADD CONSTRAINT "comprovacoes_fiscalizacao_ciclo_id_ciclos_governanca_id_fk" FOREIGN KEY ("ciclo_id") REFERENCES "public"."ciclos_governanca"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comprovacoes_fiscalizacao" ADD CONSTRAINT "comprovacoes_fiscalizacao_acao_id_acoes_id_fk" FOREIGN KEY ("acao_id") REFERENCES "public"."acoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comprovacoes_fiscalizacao" ADD CONSTRAINT "comprovacoes_fiscalizacao_registrado_por_responsaveis_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fotografias_ciclo" ADD CONSTRAINT "fotografias_ciclo_ciclo_id_ciclos_governanca_id_fk" FOREIGN KEY ("ciclo_id") REFERENCES "public"."ciclos_governanca"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fotografias_ciclo" ADD CONSTRAINT "fotografias_ciclo_registrado_por_responsaveis_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relatorios_historico" ADD CONSTRAINT "relatorios_historico_relatorio_id_relatorios_gerenciais_id_fk" FOREIGN KEY ("relatorio_id") REFERENCES "public"."relatorios_gerenciais"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relatorios_historico" ADD CONSTRAINT "relatorios_historico_registrado_por_responsaveis_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots_ciclo" ADD CONSTRAINT "snapshots_ciclo_ciclo_id_ciclos_governanca_id_fk" FOREIGN KEY ("ciclo_id") REFERENCES "public"."ciclos_governanca"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots_ciclo" ADD CONSTRAINT "snapshots_ciclo_gerado_por_responsaveis_id_fk" FOREIGN KEY ("gerado_por") REFERENCES "public"."responsaveis"("id") ON DELETE no action ON UPDATE no action;