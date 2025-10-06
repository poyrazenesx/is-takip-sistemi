-- ========================================
-- ATTACHMENTS TABLOSU GÜVENLİ KURULUM
-- ========================================
-- Bu komutları Supabase SQL Editor'da TEK TEK çalıştırın

-- 1. ÖNCE TABLOYU OLUŞTURUN
CREATE TABLE IF NOT EXISTS public.attachments (
    id SERIAL PRIMARY KEY,
    note_id INTEGER REFERENCES public.notes(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL,
    is_image BOOLEAN DEFAULT false,
    title VARCHAR(255),
    description TEXT,
    uploaded_by INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. INDEXLERI EKLEYIN
CREATE INDEX IF NOT EXISTS idx_attachments_note_id ON public.attachments(note_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON public.attachments(uploaded_by);

-- 3. RLS AKTİF EDIN
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- 4. MEVCUT POLICY'Yİ SİLİN (HATA VERİRSE NORMAL)
DROP POLICY IF EXISTS "Enable all operations for attachments" ON public.attachments;

-- 5. YENİ POLICY OLUŞTURUN
CREATE POLICY "Enable all operations for attachments" ON public.attachments FOR ALL USING (true);

-- 6. STORAGE BUCKET OLUŞTURUN
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', true) ON CONFLICT (id) DO NOTHING;

-- 7. STORAGE POLICY'Yİ SİLİN (HATA VERİRSE NORMAL)
DROP POLICY IF EXISTS "Enable all operations for attachment files" ON storage.objects;

-- 8. STORAGE POLICY OLUŞTURUN
CREATE POLICY "Enable all operations for attachment files" ON storage.objects FOR ALL USING (bucket_id = 'attachments');

-- ========================================
-- KONTROL KOMUTLARI
-- ========================================
-- Tablonun oluşup oluşmadığını kontrol edin:
SELECT * FROM information_schema.tables WHERE table_name = 'attachments';

-- Policy'lerin oluşup oluşmadığını kontrol edin:
SELECT * FROM pg_policies WHERE tablename = 'attachments';

-- Storage bucket'ın oluşup oluşmadığını kontrol edin:
SELECT * FROM storage.buckets WHERE id = 'attachments';