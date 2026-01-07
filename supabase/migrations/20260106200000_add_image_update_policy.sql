-- Create missing UPDATE policy for images table
CREATE POLICY "Users can update their own images"
  ON public.images FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
