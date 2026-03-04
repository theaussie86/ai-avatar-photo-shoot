import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Creates a Supabase admin client using the service role key.
 * This bypasses RLS, so ownership must be verified explicitly in tasks.
 */
export function createSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SECRET_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SECRET_KEY environment variable");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Verifies that a user owns a collection.
 * Required because we bypass RLS with service role key.
 */
export async function verifyCollectionOwnership(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  collectionId: string,
  userId: string
): Promise<boolean> {
  const { data: collection, error } = await supabase
    .from("collections")
    .select("id")
    .eq("id", collectionId)
    .eq("user_id", userId)
    .single();

  if (error || !collection) {
    return false;
  }

  return true;
}

/**
 * Verifies that a user owns an image (via collection ownership).
 */
export async function verifyImageOwnership(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  imageId: string,
  userId: string
): Promise<boolean> {
  const { data: image, error } = await supabase
    .from("images")
    .select("id, collection_id, collections(user_id)")
    .eq("id", imageId)
    .single();

  if (error || !image) {
    return false;
  }

  const collectionUserId = (image.collections as any)?.user_id;
  return collectionUserId === userId;
}
