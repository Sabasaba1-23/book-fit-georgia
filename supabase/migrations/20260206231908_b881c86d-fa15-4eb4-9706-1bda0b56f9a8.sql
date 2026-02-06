
-- Fix overly permissive INSERT policies for conversation tables
DROP POLICY "Authenticated users can create threads" ON public.conversation_threads;
DROP POLICY "Authenticated users can add participants" ON public.conversation_participants;

-- Only allow creating threads if you'll be a participant (handled by app logic, restrict to authenticated)
CREATE POLICY "Authenticated users can create threads" ON public.conversation_threads FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp WHERE cp.thread_id = id AND cp.user_id = auth.uid()
    )
    OR NOT EXISTS (SELECT 1 FROM public.conversation_participants cp WHERE cp.thread_id = id)
  );

-- Only allow adding yourself or if you're already a participant
CREATE POLICY "Users can add themselves to threads" ON public.conversation_participants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
