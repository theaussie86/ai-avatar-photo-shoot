"use strict";
"use server";

import { createClient } from "@/lib/supabase/server";
import { encrypt } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

export async function updateGeminiApiKey(apiKey: string) {
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
    .update({ gemini_api_key: encryptedKey })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating API key:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}
