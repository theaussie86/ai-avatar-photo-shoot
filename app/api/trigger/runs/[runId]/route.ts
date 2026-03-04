import { runs } from "@trigger.dev/sdk/v3";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export const revalidate = 2; // Cache for 2 seconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  try {
    // 1. Verify auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify user owns the image associated with this runId
    const { data: image, error: imageError } = await supabase
      .from('images')
      .select(`
        id,
        collections!inner(user_id)
      `)
      .eq('run_id', runId)
      .single();

    if (imageError || !image) {
      return Response.json({ error: 'Image not found' }, { status: 404 });
    }

    const collection = image.collections as unknown as { user_id: string };
    if (collection.user_id !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Fetch run from Trigger.dev
    const run = await runs.retrieve(runId);

    return Response.json({
      stage: run.metadata?.stage || 'unknown',
      error: run.metadata?.error || null,
    });

  } catch (error) {
    console.error('Error fetching run metadata:', error);
    return Response.json({
      stage: 'unknown',
      error: null
    }, { status: 200 });
  }
}
