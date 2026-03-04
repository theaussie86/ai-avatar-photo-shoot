# Manual Migration Instructions for run_id Column

## Status: Migration File Created, Awaiting Database Application

The migration file has been successfully created at:
```
supabase/migrations/20260304081801_add_run_id_to_images.sql
```

However, the migration could not be automatically applied due to authentication requirements for the Supabase CLI.

## What's Been Completed

1. ✅ Created migration file with proper naming convention
2. ✅ Added idempotent SQL to add `run_id` column to images table
3. ✅ Added index for efficient run_id lookups
4. ✅ Migration file follows project conventions (IF NOT EXISTS)

## What Needs Manual Completion

### Option 1: Apply Migration via Supabase CLI (Recommended)

If you have access to the Supabase database password:

1. Set the database password environment variable:
   ```bash
   export SUPABASE_DB_PASSWORD='your-database-password'
   ```

2. Run the migration:
   ```bash
   npm run db:push
   ```

3. Update TypeScript types:
   ```bash
   npm run types:update
   ```

4. Verify the `run_id` field appears in `types/database.types.ts`:
   - Look for `run_id: string | null` in the `images` Row type
   - Look for `run_id?: string | null` in Insert and Update types

5. Commit the changes:
   ```bash
   git add supabase/migrations/20260304081801_add_run_id_to_images.sql types/database.types.ts
   git commit -m "feat: add run_id column to images table for Trigger.dev tracking"
   ```

### Option 2: Apply Migration via Supabase Studio

1. Open Supabase Studio for your project:
   - Navigate to: https://supabase.com/dashboard/project/etcoqpyqphrmdhifzcim

2. Go to SQL Editor

3. Run the migration SQL:
   ```sql
   -- Add run_id column to images table for Trigger.dev tracking
   alter table public.images
   add column if not exists run_id text;

   -- Create index on run_id for efficient lookups
   create index if not exists idx_images_run_id on public.images(run_id);
   ```

4. Update TypeScript types:
   ```bash
   npm run types:update
   ```

5. Commit the changes (same as Option 1, step 5)

## Expected Result

After successful migration, the `images` table type definition should include:

```typescript
images: {
  Row: {
    collection_id: string
    created_at: string | null
    id: string
    metadata: Json | null
    status: string
    storage_path: string
    type: string
    url: string
    run_id: string | null  // ← NEW FIELD
  }
  // ... Insert and Update types will also include run_id
}
```

## Next Steps

After completing this migration, proceed with Task 2 of the implementation plan:
- Add ImageStage and ErrorInfo types to `src/lib/schemas.ts`
