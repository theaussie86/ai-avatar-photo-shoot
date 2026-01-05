"use strict";
"use server";

import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

import { ApiKeyConfig, ApiKeySchema } from "@/lib/schemas";

export async function updateGeminiApiKey(data: ApiKeyConfig) {
  const result = ApiKeySchema.safeParse(data);

  if (!result.success) {
      return { success: false, error: "Validation failed" };
  }

  const { apiKey } = result.data;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Encrypt the API key before storing it
  const encryptedKey = encrypt(apiKey);

  const { error } = await supabase
    .from("profiles")
    .upsert({ 
      id: user.id,
      gemini_api_key: encryptedKey,
      full_name: user.user_metadata?.full_name,
      avatar_url: user.user_metadata?.avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating API key:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

export async function deleteGeminiApiKey() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ 
      gemini_api_key: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error deleting API key:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
