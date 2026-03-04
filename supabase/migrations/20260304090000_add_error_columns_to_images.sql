-- Add error tracking columns to images table
alter table public.images
add column if not exists error_code text,
add column if not exists error_message text;

-- Add index for filtering failed images
create index if not exists idx_images_status on public.images(status);
