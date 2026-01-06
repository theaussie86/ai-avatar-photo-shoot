-- Allow authenticated users to delete objects from the 'generated_images' bucket
-- if the folder name matches their user ID (for temporary files).
-- Path structure: generated_images/{userId}/temp_references/...

create policy "Allow users to delete their own user folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'generated_images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
