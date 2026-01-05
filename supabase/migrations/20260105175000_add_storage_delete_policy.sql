-- Allow authenticated users to delete objects from the 'generated_images' bucket
-- ONLY if the folder name corresponds to a collection they own.
-- This assumes the folder structure is 'generated_images/{collectionId}/{filename}'

create policy "Allow users to delete their own collection images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'generated_images'
  and (storage.foldername(name))[1] in (
    select id::text 
    from collections 
    where user_id = auth.uid()
  )
);
