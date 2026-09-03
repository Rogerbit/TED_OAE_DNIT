# Regras de negócio — TED-OAE-DNIT

Fonte: adaptado de `.github/copilot-instructions.md` do protótipo original
(`ted-oae-bi-web`). Estas regras são normativas e não devem ser reinterpretadas
ou "corrigidas" por conveniência de implementação — em caso de dúvida, preserve
a rastreabilidade em vez de automatizar uma decisão.

## Modelo conceitual

```
Ação → Meta → Atividade
Ação → Meta → Produto → Ocorrência prevista → Entrega → Versão
```

Atividade e Produto são sempre entidades distintas — nunca fundidas em uma
entidade genérica, nunca ligadas automaticamente uma à outra.

Entidades próprias adicionais: Pendência, Condicionante, Relatório Gerencial,
Evidência, Comprovação/Fiscalização, Repasse, e os respectivos registros
históricos.

## Percentuais individuais

- Atividade tem percentual individual de **execução** (0–100%).
- Produto tem percentual individual de **desenvolvimento** (0–100%).
- Ausência de informação **não** significa 0% — deve ser representável como
  "Não informado" (NULL), nunca inferido.
- O percentual pode subir ou descer; uma redução exige justificativa.
- O estado atual é sempre derivado do registro histórico válido mais recente
  — nunca editado isoladamente sem gerar um registro de acompanhamento.
- Produto com 100% de desenvolvimento **não** implica automaticamente entrega
  formal, aceite, comprovação pelo fiscal, ou liberação de repasse.

## Proibição de percentuais agregados (decisão definitiva)

**Nunca** criar percentual de avanço/execução/desenvolvimento para Meta, Ação
ou TED — nem por média simples, média ponderada, ponderação 40/60, peso
financeiro, peso temporal, ou qualquer mecanismo equivalente. Meta/Ação/TED
são acompanhados por suas informações estruturais, entregas e pendências, sem
percentual agregado.

## Histórico

Princípio: **histórico de eventos → estado atual derivado → snapshot
imutável no fechamento do Relatório Gerencial.**

Toda alteração relevante deve registrar: quem alterou, quando, o que foi
alterado, valor/situação anterior, valor/situação novo, justificativa e
referência/evidência quando aplicável. Nunca sobrescrever silenciosamente um
registro histórico.

## Relatórios Gerenciais (R1–R15)

Entregas digitais ao fiscal do TED, mostrando o status de Atividades e o
desenvolvimento de Produtos no ciclo correspondente. Cada Relatório Gerencial
é uma fotografia histórica do fechamento — **imutável** uma vez fechado.
Exemplo: se um item estava em 45% no fechamento de R3 e depois passou a 70%,
o snapshot de R3 continua registrando 45%.

Distinguir sempre: acompanhamento corrente ≠ fotografia do Relatório
Gerencial ≠ estado atual.

## Produtos, ocorrências, entregas e versões

`Produto → Ocorrência prevista → Entrega → Versão`. Cada entrega/versão tem
identidade própria. Uma nova versão nunca sobrescreve a anterior, nunca cria
automaticamente um novo Produto, e nunca cria automaticamente uma nova
ocorrência prevista.

## Pendências

Entidade persistente que pode atravessar vários ciclos sem ser duplicada.
Preservar identidade, criação, evolução, situação, providências,
responsáveis, prazos, evidências e encerramento. Estados mínimos: Aberta, Em
tratamento, Aguardando DNIT, Resolvida, Encerrada.

## Condicionantes

Entidade persistente, mesma lógica de continuidade das Pendências. Estados
mínimos: Ativa, Em atendimento, Atendida, Encerrada.

## Responsabilidades

Cada Ação pode ter um responsável (LabTrans) pelo fornecimento/atualização
das informações. Distinguir, quando aplicável: responsável pela Ação,
responsável pelo registro, responsável pela providência.

## Governança e fiscalização

Distinguir sempre: execução/desenvolvimento ≠ entrega ≠ evidência ≠
comprovação da fiscalização. Nunca considerar uma atividade/produto
"comprovado" apenas por ter atingido um certo percentual.

## Semáforo

Representa condição de governança, **não** um percentual médio. Valores:
Regular, Atenção, Crítico, Aguardando condição-decisão. Nunca calcular o
semáforo automaticamente a partir de médias percentuais, prazos vencidos, ou
a partir da simples existência de Pendências/Condicionantes sem regra
específica aprovada — é sempre um campo definível por uma pessoa.

## Orçamento e repasses

Distinguir sempre: Orçamento ≠ Repasses. O acompanhamento financeiro do
painel fica limitado aos repasses globais do DNIT previstos
documentalmente — nunca inferir execução contábil/financeira interna da
UFSC/LabTrans, e nunca distribuir repasses artificialmente entre Atividades
ou Produtos. As parcelas de repasse têm vínculo documental com as entregas
de Relatórios Gerenciais (Parcela 1 → assinatura, Parcela 2 → R1, ...,
Parcela 9 → R8) — não criar parcelas artificiais para relatórios sem parcela
documentalmente vinculada.

## Isolamento do projeto

Nunca importar regras, indicadores ou decisões metodológicas de outros
projetos/TEDs (por exemplo, um projeto sem relação chamado
"TED-DNIT-2026-2031"), mesmo havendo semelhanças superficiais.
