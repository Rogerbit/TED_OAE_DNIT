import "server-only";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "evidencias";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

// Idempotent -- safe to call on every cold start. Creates the private bucket
// used for Evidências/Fotografias uploads if it doesn't exist yet.
export async function ensureBucket() {
  const supabase = getServiceClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === BUCKET)) return;
  const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
  if (error && !error.message.includes("already exists")) throw error;
}

export async function uploadEvidencia(file: File, entregaVersaoId: string): Promise<string> {
  const supabase = getServiceClient();
  await ensureBucket();
  const path = `${entregaVersaoId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw new Error(`Falha ao enviar evidência: ${error.message}`);
  return path;
}
