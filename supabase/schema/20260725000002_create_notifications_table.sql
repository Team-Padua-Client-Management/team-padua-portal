-- Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'info',
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications or global ones"
    ON public.notifications
    FOR SELECT
    USING (
      user_id IS NULL OR user_id = auth.uid()
    );

CREATE POLICY "Users can insert notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
    ON public.notifications
    FOR DELETE
    USING (user_id = auth.uid());

-- Add to realtime publication
alter publication supabase_realtime add table public.notifications;
