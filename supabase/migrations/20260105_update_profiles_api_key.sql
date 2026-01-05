-- Remove the character length constraint to accommodate encrypted keys
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS gemini_api_key_length;
