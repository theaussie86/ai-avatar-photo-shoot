-- Normalize user ownership: derive ownership through collection chain
-- images → collections.user_id
-- video_prompts → images → collections.user_id

-- Step 1: Handle any orphan images (no collection)
-- Delete images without collection_id (shouldn't exist in normal operation)
delete from public.images where collection_id is null;

-- Step 2: Make collection_id NOT NULL
alter table public.images
  alter column collection_id set not null;

-- Step 3: Drop existing RLS policies on images
drop policy if exists "Users can view their own images" on public.images;
drop policy if exists "Users can insert their own images" on public.images;
drop policy if exists "Users can update their own images" on public.images;
drop policy if exists "Users can delete their own images" on public.images;

-- Step 4: Drop existing RLS policies on video_prompts
drop policy if exists "Users can view own video prompts" on public.video_prompts;
drop policy if exists "Users can insert own video prompts" on public.video_prompts;
drop policy if exists "Users can update own video prompts" on public.video_prompts;
drop policy if exists "Users can delete own video prompts" on public.video_prompts;

-- Step 5: Remove user_id from images
alter table public.images
  drop constraint if exists images_user_id_fkey;
alter table public.images
  drop column user_id;

-- Step 6: Remove user_id from video_prompts
drop index if exists idx_video_prompts_user_id;
alter table public.video_prompts
  drop constraint if exists video_prompts_user_id_fkey;
alter table public.video_prompts
  drop column user_id;

-- Step 7: Create new RLS policies for images (ownership via collection)
create policy "Users can view own images"
  on public.images for select
  using (
    exists (
      select 1 from public.collections
      where collections.id = images.collection_id
      and collections.user_id = auth.uid()
    )
  );

create policy "Users can insert own images"
  on public.images for insert
  with check (
    exists (
      select 1 from public.collections
      where collections.id = images.collection_id
      and collections.user_id = auth.uid()
    )
  );

create policy "Users can update own images"
  on public.images for update
  using (
    exists (
      select 1 from public.collections
      where collections.id = images.collection_id
      and collections.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.collections
      where collections.id = images.collection_id
      and collections.user_id = auth.uid()
    )
  );

create policy "Users can delete own images"
  on public.images for delete
  using (
    exists (
      select 1 from public.collections
      where collections.id = images.collection_id
      and collections.user_id = auth.uid()
    )
  );

-- Step 8: Create new RLS policies for video_prompts (ownership via image → collection)
create policy "Users can view own video prompts"
  on public.video_prompts for select
  using (
    exists (
      select 1 from public.images
      join public.collections on collections.id = images.collection_id
      where images.id = video_prompts.image_id
      and collections.user_id = auth.uid()
    )
  );

create policy "Users can insert own video prompts"
  on public.video_prompts for insert
  with check (
    exists (
      select 1 from public.images
      join public.collections on collections.id = images.collection_id
      where images.id = video_prompts.image_id
      and collections.user_id = auth.uid()
    )
  );

create policy "Users can update own video prompts"
  on public.video_prompts for update
  using (
    exists (
      select 1 from public.images
      join public.collections on collections.id = images.collection_id
      where images.id = video_prompts.image_id
      and collections.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.images
      join public.collections on collections.id = images.collection_id
      where images.id = video_prompts.image_id
      and collections.user_id = auth.uid()
    )
  );

create policy "Users can delete own video prompts"
  on public.video_prompts for delete
  using (
    exists (
      select 1 from public.images
      join public.collections on collections.id = images.collection_id
      where images.id = video_prompts.image_id
      and collections.user_id = auth.uid()
    )
  );
