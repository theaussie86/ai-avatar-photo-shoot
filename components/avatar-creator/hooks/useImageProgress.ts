"use client";

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { ImageStage, ErrorInfo } from '@/lib/schemas';

interface ImageProgress {
  stage: ImageStage | 'unknown';
  status: string | null;
  error: ErrorInfo | null;
  isPolling: boolean;
}

export function useImageProgress(imageId: string): ImageProgress {
  const supabase = createClient();

  // Query Supabase for image + runId
  const { data: image } = useQuery({
    queryKey: ['image', imageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('images')
        .select('id, status, run_id, url, error_message')
        .eq('id', imageId)
        .single();

      if (error) throw error;
      return data;
    },
    refetchInterval: 3000, // Poll every 3s
  });

  // Fetch run metadata if status is pending and we have a runId
  const { data: runMetadata } = useQuery({
    queryKey: ['run', image?.run_id],
    queryFn: async () => {
      if (!image?.run_id) return null;

      const res = await fetch(`/api/trigger/runs/${image.run_id}`);
      if (!res.ok) return null;

      return res.json() as Promise<{ stage: string; error: ErrorInfo | null }>;
    },
    enabled: image?.status === 'pending' && !!image?.run_id,
    refetchInterval: 3000,
  });

  // Merge state: use run metadata stage if pending, otherwise use DB status
  const stage: ImageStage | 'unknown' =
    image?.status === 'pending' && runMetadata?.stage
      ? (runMetadata.stage as ImageStage)
      : image?.status === 'completed'
        ? 'completed'
        : image?.status === 'failed'
          ? 'failed'
          : 'unknown';

  const error = runMetadata?.error ||
    (image?.status === 'failed' && image.error_message
      ? { code: 'UNKNOWN', message: image.error_message }
      : null);

  return {
    stage,
    status: image?.status || null,
    error,
    isPolling: image?.status === 'pending',
  };
}
