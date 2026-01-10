import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SECRET_KEY; // Using SECRET_KEY as per user feedback
const BUCKET_NAME = 'generated_images';

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SECRET_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function getAllCollectionIds() {
  console.log("📡 Fetching collection IDs from database...");
  const { data, error } = await supabase
    .from('collections')
    .select('id');

  if (error) {
    throw new Error(`Failed to fetch collections: ${error.message}`);
  }

  return new Set(data?.map(c => c.id) || []);
}

async function listAllFilesRecursive(bucket: string, folderPath: string): Promise<string[]> {
  const { data, error } = await supabase.storage.from(bucket).list(folderPath);

  if (error) {
    console.error(`❌ Error listing files in ${folderPath}:`, error.message);
    return [];
  }

  let paths: string[] = [];
  for (const item of data || []) {
    const fullPath = folderPath ? `${folderPath}/${item.name}` : item.name;
    if (item.id === null) {
      // It's a folder (or at least looks like one in the listing)
      const subPaths = await listAllFilesRecursive(bucket, fullPath);
      paths = paths.concat(subPaths);
    } else {
      paths.push(fullPath);
    }
  }
  return paths;
}

async function cleanup() {
  try {
    const validCollectionIds = await getAllCollectionIds();
    console.log(`✅ Found ${validCollectionIds.size} valid collections.`);

    console.log(`📡 Listing top-level folders in bucket '${BUCKET_NAME}'...`);
    const { data: topLevelItems, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list();

    if (listError) {
      throw new Error(`Failed to list bucket: ${listError.message}`);
    }

    if (!topLevelItems || topLevelItems.length === 0) {
      console.log("📭 Bucket is empty.");
      return;
    }

    for (const item of topLevelItems) {
      // Supabase list returns objects. If id is null, it's typically a folder.
      // But we also want to double check if the name is a collection ID regardless.
      
      if (validCollectionIds.has(item.name)) {
        console.log(`--- Keeping valid collection folder: ${item.name}`);
        continue;
      }

      console.log(`--- Processing invalid/old folder: ${item.name}`);
      
      // List all files recursively in this "bad" folder
      const filesToDelete = await listAllFilesRecursive(BUCKET_NAME, item.name);
      
      if (filesToDelete.length > 0) {
        console.log(`🗑️ Deleting ${filesToDelete.length} files from ${item.name}...`);
        
        // Supabase remove takes chunks of paths
        const chunkSize = 100;
        for (let i = 0; i < filesToDelete.length; i += chunkSize) {
          const chunk = filesToDelete.slice(i, i + chunkSize);
          const { error: removeError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove(chunk);

          if (removeError) {
            console.error(`❌ Error deleting chunk:`, removeError.message);
          }
        }
        console.log(`✅ Successfully cleaned up folder: ${item.name}`);
      } else {
        console.log(`ℹ️ Folder ${item.name} is either empty or already handled.`);
        
        // If it's a folder itself, we might still want to "delete" it, 
        // but Supabase storage folders are virtual and vanish when empty.
      }
    }

    console.log("\n✨ Cleanup complete!");
  } catch (error: any) {
    console.error("\n💥 Cleanup failed:", error.message);
    process.exit(1);
  }
}

cleanup();
