-- Ensure uploaded_images bucket exists and is configured correctly
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uploaded_images', 
  'uploaded_images', 
  true, 
  52428800, -- 50MB limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- RLS Policies for uploaded_images

-- Allow authenticated users to upload their own images
-- Path: {user_id}/{session_id}/{filename}
drop policy if exists "Users can upload their own references" on storage.objects;
create policy "Users can upload their own references"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'uploaded_images' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view their own images
drop policy if exists "Users can view their own references" on storage.objects;
create policy "Users can view their own references"
on storage.objects for select
to authenticated
using (
  bucket_id = 'uploaded_images' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own images
drop policy if exists "Users can delete their own references" on storage.objects;
create policy "Users can delete their own references"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'uploaded_images' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own images (if needed)
drop policy if exists "Users can update their own references" on storage.objects;
create policy "Users can update their own references"
on storage.objects for update
to authenticated
using (
  bucket_id = 'uploaded_images' and
  (storage.foldername(name))[1] = auth.uid()::text
);
