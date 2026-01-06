-- Add prompt column to images table
alter table public.images
add column if not exists prompt text;
