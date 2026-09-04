"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { repasses } from "@/db/schema";
import type { ActionResult } from "@/lib/actions/atividades";

// Global-only, per governance rule: repasses are never distributed to
// atividades/produtos, so this action only ever touches one `repasses` row.
export async function registrarRecebimentoRepasse(input: {
  repasseId: string;
  valorRepassado: string | number;
  dataRealizada?: string | null;
  status?: string | null;
}): Promise<ActionResult> {
  try {
    const valor = Number(input.valorRepassado);
    if (!Number.isFinite(valor) || valor < 0) {
      throw new Error("Valor repassado inválido.");
    }
    await db
      .update(repasses)
      .set({
        valorRepassado: String(valor),
        dataRealizada: input.dataRealizada || null,
        status: input.status || null,
      })
      .where(eq(repasses.id, input.repasseId));

    revalidatePath("/orcamento");
    revalidatePath("/visao-executiva");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido." };
  }
}
