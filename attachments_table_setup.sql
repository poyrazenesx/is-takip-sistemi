-- ========================================
-- ATTACHMENTS TABLOSU OLUŞTURMA KOMUTLARI
-- ========================================
-- Bu komutları Supabase SQL Editor'da çalıştırın

-- 1. Attachments tablosunu oluştur
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

-- 2. Indexleri ekle
CREATE INDEX IF NOT EXISTS idx_attachments_note_id ON public.attachments(note_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON public.attachments(uploaded_by);

-- 3. RLS (Row Level Security) aktif et
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- 4. Mevcut policy'leri kontrol et ve sil (eğer varsa)
DROP POLICY IF EXISTS "Enable all operations for attachments" ON public.attachments;

-- 5. Tüm işlemler için policy oluştur
CREATE POLICY "Enable all operations for attachments" ON public.attachments
    FOR ALL USING (true);

-- 6. Storage bucket oluştur (eğer yoksa)
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Storage policy'leri kontrol et ve sil (eğer varsa)
DROP POLICY IF EXISTS "Enable all operations for attachment files" ON storage.objects;

-- 8. Storage policy oluştur
CREATE POLICY "Enable all operations for attachment files" ON storage.objects
    FOR ALL USING (bucket_id = 'attachments');