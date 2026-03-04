"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ImageStage } from "@/lib/schemas";

export interface CollectionStats {
  total: number;
  completed: number;
  failed: number;
  byStage: {
    queued: number;
    processing: number;
    generating: number;
  };
}

interface RunMetadata {
  status: string;
  metadata?: {
    stage?: ImageStage;
  };
}

async function fetchCollectionProgress(
  collectionId: string
): Promise<CollectionStats | null> {
  const supabase = createClient();

  // Fetch all images for this collection
  const { data: images, error } = await supabase
    .from("images")
    .select("id, status, run_id")
    .eq("collection_id", collectionId);

  if (error || !images) {
    console.error("Failed to fetch collection images:", error);
    return null;
  }

  // For pending images with run_ids, fetch their current stage from Trigger.dev
  const pendingWithRunIds = images.filter(
    (img) => img.status === "pending" && img.run_id
  );

  const runMetadataMap = new Map<string, RunMetadata>();

  if (pendingWithRunIds.length > 0) {
    // Fetch all run metadata in parallel
    await Promise.all(
      pendingWithRunIds.map(async (img) => {
        try {
          const response = await fetch(
            `/api/trigger/runs/${img.run_id}/metadata`
          );
          if (response.ok) {
            const metadata: RunMetadata = await response.json();
            runMetadataMap.set(img.run_id!, metadata);
          }
        } catch (err) {
          console.error(`Failed to fetch metadata for run ${img.run_id}:`, err);
        }
      })
    );
  }

  // Aggregate statistics
  const stats: CollectionStats = {
    total: images.length,
    completed: 0,
    failed: 0,
    byStage: {
      queued: 0,
      processing: 0,
      generating: 0,
    },
  };

  for (const img of images) {
    if (img.status === "completed") {
      stats.completed++;
    } else if (img.status === "failed") {
      stats.failed++;
    } else if (img.status === "pending") {
      // Determine stage from run metadata or default to queued
      let stage: ImageStage = "queued";

      if (img.run_id && runMetadataMap.has(img.run_id)) {
        const metadata = runMetadataMap.get(img.run_id)!;
        stage = metadata.metadata?.stage || "queued";
      }

      // Increment the appropriate stage counter
      if (stage === "queued" || stage === "processing" || stage === "generating") {
        stats.byStage[stage]++;
      } else {
        // Default to queued for unknown stages
        stats.byStage.queued++;
      }
    }
  }

  return stats;
}

export function useCollectionProgress(collectionId: string | undefined) {
  return useQuery<CollectionStats | null>({
    queryKey: ["collection-progress", collectionId],
    queryFn: () =>
      collectionId ? fetchCollectionProgress(collectionId) : Promise.resolve(null),
    enabled: !!collectionId,
    refetchInterval: 3000, // Poll every 3 seconds
    refetchIntervalInBackground: true,
  });
}
