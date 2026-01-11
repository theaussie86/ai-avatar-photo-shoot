
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env.local") });

async function listBuckets() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SECRET_KEY;

  if (!supabaseServiceKey) {
      console.error("Error: SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is required to list buckets.");
      return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase.storage.listBuckets();
  
  if (error) {
      console.error("Error listing buckets:", error);
      return;
  }

  console.log("Buckets found:");
  data.forEach(b => console.log(`- ${b.name} (public: ${b.public})`));
  
  const targetBucket = data.find(b => b.name === 'uploaded_images');
  if (targetBucket) {
      console.log("\nSUCCESS: 'uploaded_images' bucket exists.");
  } else {
      console.log("\nWARNING: 'uploaded_images' bucket DOES NOT exist.");
  }
}

listBuckets();
