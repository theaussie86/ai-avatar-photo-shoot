import { schemaTask, logger } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { createSupabaseAdmin, verifyCollectionOwnership } from "./utils/supabase-admin";
import { deleteFolder } from "@/lib/storage";

/**
 * Payload schema for delete-collection-images task.
 */
const DeleteCollectionImagesPayloadSchema = z.object({
  collectionId: z.string().uuid(),
  userId: z.string().uuid(),
});

export type DeleteCollectionImagesPayload = z.infer<typeof DeleteCollectionImagesPayloadSchema>;

/**
 * Background task for deleting all images in a collection (but keeping the collection).
 *
 * Flow:
 * 1. Verify collection ownership
 * 2. Delete all files from storage (generated_images/{collectionId}/)
 * 3. Delete all image records from DB
 */
export const deleteCollectionImagesTask = schemaTask({
  id: "delete-collection-images",
  schema: DeleteCollectionImagesPayloadSchema,
  maxDuration: 60, // 1 minute max
  retry: {
    maxAttempts: 2,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload, { ctx }) => {
    const { collectionId, userId } = payload;
    const taskId = collectionId.slice(0, 8);

    logger.log(`[Task ${taskId}] Starting collection images deletion...`);

    // 1. Create Supabase admin client
    const supabase = createSupabaseAdmin();

    // 2. Verify ownership
    const hasAccess = await verifyCollectionOwnership(supabase, collectionId, userId);
    if (!hasAccess) {
      throw new Error("Access denied: User does not own this collection");
    }

    try {
      // 3. Delete storage files
      logger.log(`[Task ${taskId}] Deleting storage folder...`);
      await deleteFolder(supabase, "generated_images", collectionId);

      // 4. Delete image records
      logger.log(`[Task ${taskId}] Deleting image records...`);
      const { error: dbError } = await supabase
        .from("images")
        .delete()
        .eq("collection_id", collectionId);

      if (dbError) {
        throw new Error("Failed to delete images: " + dbError.message);
      }

      logger.log(`[Task ${taskId}] Collection images deleted successfully.`);

      return {
        success: true,
        collectionId,
      };
    } catch (err: any) {
      logger.error(`[Task ${taskId}] FAILED:`, { error: err });
      throw err;
    }
  },
});
