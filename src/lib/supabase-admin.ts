import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase côté serveur avec la clé service_role.
 * À n'utiliser QUE dans des server actions / route handlers — jamais exposé au client.
 * (Le fichier n'est importé que par `src/lib/actions/upload.ts`, qui est "use server".)
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export const PRODUCER_MEDIA_BUCKET = "producer-media";
