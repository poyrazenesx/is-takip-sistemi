-- İş Takip Sistemi Database Setup
-- Tavşanlı Doç.Dr.Mustafa KALEMLİ Devlet Hastanesi - BİLGİ İŞLEM BİRİMİ

-- 1. Users tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tasks tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS public.tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'todo',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    assigned_to INTEGER REFERENCES public.users(id),
    created_by INTEGER REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Hastane personeli kullanıcılarını ekle
INSERT INTO public.users (username, password, name, role) VALUES
    ('epoyraz', 'epoyraz43', 'Enes Poyraz', 'admin'),
    ('ismail', '123', 'İsmail Arslan', 'member'),
    ('köroğlu', '123', 'Ali Köroğlu', 'member'),  
    ('serkan', '123', 'Serkan Özil', 'member')
ON CONFLICT (username) DO NOTHING;

-- 4. RLS (Row Level Security) etkinleştir
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 5. Kullanıcılar için RLS politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
CREATE POLICY "Enable read access for all users" ON public.users 
    FOR SELECT USING (true);

-- 6. Tasks için RLS politikaları
DROP POLICY IF EXISTS "Enable read access for all users" ON public.tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.tasks;

CREATE POLICY "Enable read access for all users" ON public.tasks
    FOR SELECT USING (true);
    
CREATE POLICY "Enable insert for authenticated users" ON public.tasks
    FOR INSERT WITH CHECK (true);
    
CREATE POLICY "Enable update for authenticated users" ON public.tasks  
    FOR UPDATE USING (true);
    
CREATE POLICY "Enable delete for authenticated users" ON public.tasks
    FOR DELETE USING (true);

-- 7. Örnek görevler ekle (eğer tablo boşsa)
INSERT INTO public.tasks (title, description, status, priority, assigned_to, created_by) 
SELECT 
    'Sistem Bakımı',
    'Sunucu performans kontrolü ve güvenlik güncellemeleri',
    'todo',
    'high',
    1,
    1
WHERE NOT EXISTS (SELECT 1 FROM public.tasks);

-- Tablo durumlarını kontrol et
SELECT 'Users' as table_name, count(*) as record_count FROM public.users
UNION ALL
SELECT 'Tasks' as table_name, count(*) as record_count FROM public.tasks;