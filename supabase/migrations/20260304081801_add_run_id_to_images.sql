-- Add run_id column to images table for Trigger.dev tracking
alter table public.images
add column if not exists run_id text;

-- Create index on run_id for efficient lookups
create index if not exists idx_images_run_id on public.images(run_id);
