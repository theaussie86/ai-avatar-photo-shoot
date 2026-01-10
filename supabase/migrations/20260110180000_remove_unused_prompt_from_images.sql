-- Remove unused prompt column from images table
alter table public.images
drop column if exists prompt;
