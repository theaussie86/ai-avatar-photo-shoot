import { SupabaseClient } from "@supabase/supabase-js";

export async function uploadGeneratedImage(
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string = 'image/png'
) {
  const { error: uploadError } = await supabase
    .storage
    .from(bucket)
    .upload(path, buffer, {
      contentType: contentType
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: { publicUrl } } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(path);

  return publicUrl;
}

export async function deleteFolder(
  supabase: SupabaseClient,
  bucket: string,
  folderPath: string
) {
  try {
    // List all files in the folder
    const { data: files, error: listError } = await supabase
      .storage
      .from(bucket)
      .list(folderPath);

    if (listError) {
      console.error(`[Delete] Storage list error for ${folderPath}:`, listError);
      return; // Or throw? The original implementation logged and continued.
    }

    if (files && files.length > 0) {
      const pathsToDelete: string[] = [];
      files.forEach(f => {
        // When listing a folder, Supabase returns just the file name. 
        // We need to construct the full path relative to buffer root.
        // It seems files.list returns items with names directly. 
        // If folderPath is "temp/uid/session", and file is "uuid.jpg", 
        // we must remove "temp/uid/session/uuid.jpg".
        
        let filePath = `${folderPath}/${f.name}`;
        
        // Remove double slashes if any (except protocol)
        filePath = filePath.replace(/([^:]\/)\/+/g, "$1");
        
        pathsToDelete.push(filePath);

        // Handle potentially url-encoded names if necessary, matching original logic
        try {
            const decodedName = decodeURIComponent(f.name);
            if (decodedName !== f.name) {
                let decodedPath = `${folderPath}/${decodedName}`;
                decodedPath = decodedPath.replace(/([^:]\/)\/+/g, "$1");
                pathsToDelete.push(decodedPath);
            }
        } catch (e) {}
      });

      console.log(`[Delete] Attempting to remove ${pathsToDelete.length} files from ${bucket}/${folderPath}`);

      const { error: removeError } = await supabase
        .storage
        .from(bucket)
        .remove(pathsToDelete);

      if (removeError) {
        console.error(`[Delete] Storage remove error for ${folderPath}:`, removeError);
      }
    }
  } catch (err) {
    console.error(`[Delete] Unexpected error during folder cleanup for ${folderPath}:`, err);
  }
}
