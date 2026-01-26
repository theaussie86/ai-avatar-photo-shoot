-- Create video_prompts table
create table public.video_prompts (
  id uuid primary key default gen_random_uuid(),
  image_id uuid not null references public.images(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt_text text not null check (char_length(prompt_text) <= 2000),
  user_instruction text,
  model_name text not null,
  camera_style text default 'statisch',
  film_effects text[] default '{}'::text[],
  status text not null default 'draft' check (status in ('draft', 'pending', 'completed', 'failed')),
  is_primary boolean default false,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add indexes
create index idx_video_prompts_image_id on public.video_prompts(image_id);
create index idx_video_prompts_user_id on public.video_prompts(user_id);
create index idx_video_prompts_image_id_created_at on public.video_prompts(image_id, created_at);

-- Create or replace updated_at trigger function (idempotent)
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at trigger
create trigger update_video_prompts_updated_at
  before update on public.video_prompts
  for each row execute function update_updated_at_column();

-- Enable RLS
alter table public.video_prompts enable row level security;

-- Users can view their own video prompts
create policy "Users can view own video prompts"
  on public.video_prompts for select
  using (auth.uid() = user_id);

-- Users can insert their own video prompts
create policy "Users can insert own video prompts"
  on public.video_prompts for insert
  with check (auth.uid() = user_id);

-- Users can update their own video prompts
create policy "Users can update own video prompts"
  on public.video_prompts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own video prompts
create policy "Users can delete own video prompts"
  on public.video_prompts for delete
  using (auth.uid() = user_id);
