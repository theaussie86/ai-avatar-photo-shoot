import { schemaTask, logger } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { createSupabaseAdmin, verifyCollectionOwnership } from "./utils/supabase-admin";
import { deleteFolder } from "@/lib/storage";

/**
 * Payload schema for delete-collection task.
 */
const DeleteCollectionPayloadSchema = z.object({
  collectionId: z.string().uuid(),
  userId: z.string().uuid(),
});

export type DeleteCollectionPayload = z.infer<typeof DeleteCollectionPayloadSchema>;

/**
 * Background task for deleting a collection and all its images.
 *
 * Flow:
 * 1. Verify collection ownership
 * 2. Delete all files from storage (generated_images/{collectionId}/)
 * 3. Delete all image records from DB
 * 4. Delete collection record from DB
 */
export const deleteCollectionTask = schemaTask({
  id: "delete-collection",
  schema: DeleteCollectionPayloadSchema,
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

    logger.log(`[Task ${taskId}] Starting collection deletion...`);

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

      // 4. Delete image records (cascade should handle this, but be explicit)
      logger.log(`[Task ${taskId}] Deleting image records...`);
      const { error: imagesError } = await supabase
        .from("images")
        .delete()
        .eq("collection_id", collectionId);

      if (imagesError) {
        logger.warn(`[Task ${taskId}] Error deleting images:`, { error: imagesError });
        // Continue anyway - collection delete might cascade
      }

      // 5. Delete collection record
      logger.log(`[Task ${taskId}] Deleting collection record...`);
      const { error: collectionError } = await supabase
        .from("collections")
        .delete()
        .eq("id", collectionId)
        .eq("user_id", userId);

      if (collectionError) {
        throw new Error("Failed to delete collection: " + collectionError.message);
      }

      logger.log(`[Task ${taskId}] Collection deleted successfully.`);

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
