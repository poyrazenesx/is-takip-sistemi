-- Hastane Not Sistemi Database Setup
-- Tavşanlı Doç.Dr.Mustafa KALEMLİ Devlet Hastanesi - BİLGİ İŞLEM BİRİMİ

-- 1. Notes kategorileri enum oluştur
DO $$ BEGIN
    CREATE TYPE note_category AS ENUM (
        'servis',
        'poliklinikler', 
        'eczane',
        'genel-hasta-kayit',
        'kalite',
        'dilekceler',
        'idare'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Notes tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.notes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category note_category NOT NULL,
    created_by INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    updated_by INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    attachment_url TEXT,
    attachment_name VARCHAR(255)
);

-- 3. Note güncelleme geçmişi tablosu
CREATE TABLE IF NOT EXISTS public.note_history (
    id SERIAL PRIMARY KEY,
    note_id INTEGER REFERENCES public.notes(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'deleted'
    old_content TEXT,
    new_content TEXT,
    changed_by INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    change_description TEXT
);

-- 4. RLS politikaları
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_history ENABLE ROW LEVEL SECURITY;

-- Notes için politikalar
CREATE POLICY IF NOT EXISTS "Enable all operations for notes" ON public.notes
    FOR ALL USING (true);

-- Note history için politikalar  
CREATE POLICY IF NOT EXISTS "Enable all operations for note history" ON public.note_history
    FOR ALL USING (true);

-- 5. Güncelleme trigger function
CREATE OR REPLACE FUNCTION update_note_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Trigger oluştur
DROP TRIGGER IF EXISTS update_notes_updated_at ON public.notes;
CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION update_note_updated_at();

-- 7. History trigger function
CREATE OR REPLACE FUNCTION log_note_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.note_history (note_id, action, new_content, changed_by, change_description)
        VALUES (NEW.id, 'created', NEW.content, NEW.created_by, 'Not oluşturuldu');
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.note_history (note_id, action, old_content, new_content, changed_by, change_description)
        VALUES (NEW.id, 'updated', OLD.content, NEW.content, NEW.updated_by, 'Not güncellendi');
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.note_history (note_id, action, old_content, changed_by, change_description)
        VALUES (OLD.id, 'deleted', OLD.content, OLD.updated_by, 'Not silindi');
        RETURN OLD;
    END IF;
END;
$$ language 'plpgsql';

-- 8. History trigger oluştur
DROP TRIGGER IF EXISTS log_note_changes_trigger ON public.notes;
CREATE TRIGGER log_note_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION log_note_changes();

-- 9. Örnek notlar ekle (test için)
INSERT INTO public.notes (title, content, category, created_by, updated_by) 
SELECT 
    'Servis Günlük Rapor',
    'Günlük hasta durumu raporları ve vardiya değişim notları buraya yazılacak.',
    'servis',
    1,
    1
WHERE NOT EXISTS (SELECT 1 FROM public.notes WHERE category = 'servis');

INSERT INTO public.notes (title, content, category, created_by, updated_by) 
SELECT 
    'Poliklinik Randevu Sistemi',
    'Poliklinik randevu sistemi güncellemeleri ve hasta yönlendirme notları.',
    'poliklinikler',
    1,
    1
WHERE NOT EXISTS (SELECT 1 FROM public.notes WHERE category = 'poliklinikler');

-- 10. Kontrol sorgusu
SELECT 
    category as "Kategori",
    COUNT(*) as "Not Sayısı"
FROM public.notes 
GROUP BY category
ORDER BY category;