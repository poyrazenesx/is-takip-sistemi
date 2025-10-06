-- Attachments tablosunu ekle
CREATE TABLE IF NOT EXISTS public.attachments (
    id SERIAL PRIMARY KEY,
    note_id INTEGER REFERENCES public.notes(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL, -- Storage URL veya Base64
    is_image BOOLEAN DEFAULT false,
    title VARCHAR(255),
    description TEXT,
    uploaded_by INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index ekle
CREATE INDEX IF NOT EXISTS idx_attachments_note_id ON public.attachments(note_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON public.attachments(uploaded_by);

-- RLS policy
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Enable all operations for attachments" ON public.attachments
    FOR ALL USING (true);