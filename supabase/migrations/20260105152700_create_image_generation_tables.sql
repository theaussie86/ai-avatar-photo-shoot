-- Add missing columns to collections
alter table public.collections 
add column if not exists status text not null default 'pending',
add column if not exists prompt text,
add column if not exists quantity integer default 1,
add column if not exists updated_at timestamptz not null default now();

-- Add missing columns to images
alter table public.images
add column if not exists status text not null default 'pending';

-- Ensure storage bucket exists (idempotent)
insert into storage.buckets (id, name, public)
values ('generated_images', 'generated_images', true)
on conflict (id) do nothing;

-- Add storage policies if they don't exist
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can upload their own generated images') then
    create policy "Users can upload their own generated images"
      on storage.objects for insert
      with check (
        bucket_id = 'generated_images' and
        auth.uid() = owner
      );
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can view their own generated images') then
    create policy "Users can view their own generated images"
      on storage.objects for select
      using (
        bucket_id = 'generated_images' and
        auth.uid() = owner
      );
  end if;
  
  if not exists (select 1 from pg_policies where policyname = 'Public access to generated images') then
    create policy "Public access to generated images"
      on storage.objects for select
      using ( bucket_id = 'generated_images' );
  end if;
end $$;
