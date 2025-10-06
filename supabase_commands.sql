-- =======================================================
-- SUPABASE SQL EDITOR'DA ÇALIŞTIR - GÜNCELLENMIŞ VERSİYON
-- Bu komutları Supabase Dashboard > SQL Editor'da sırayla çalıştırın
-- =======================================================

-- 0. MEVCUT TABLO YAPILARINI KONTROL ET
-- Önce mevcut tabloların yapısını detaylı kontrol edelim
DO $$ 
DECLARE
    notes_id_type TEXT;
    tasks_id_type TEXT;
    notes_user_col TEXT;
    tasks_user_col TEXT;
BEGIN
    -- Notes tablosu yapısını kontrol et
    SELECT data_type INTO notes_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'notes' AND column_name = 'id';
    
    -- Notes tablosunda kullanıcı sütunu hangi isimde?
    SELECT column_name INTO notes_user_col
    FROM information_schema.columns 
    WHERE table_name = 'notes' 
    AND column_name IN ('user_id', 'created_by', 'author_id', 'owner_id');
    
    -- Tasks tablosu yapısını kontrol et
    SELECT data_type INTO tasks_id_type
    FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'id';
    
    -- Tasks tablosunda kullanıcı sütunu hangi isimde?
    SELECT column_name INTO tasks_user_col
    FROM information_schema.columns 
    WHERE table_name = 'tasks'
    AND column_name IN ('user_id', 'created_by', 'author_id', 'owner_id', 'assigned_to');
    
    RAISE NOTICE '📋 MEVCUT TABLO YAPILARI:';
    RAISE NOTICE '   Notes tablo id tipi: %', COALESCE(notes_id_type, 'TABLO YOK');
    RAISE NOTICE '   Notes kullanıcı sütunu: %', COALESCE(notes_user_col, 'BULUNAMADI');
    RAISE NOTICE '   Tasks tablo id tipi: %', COALESCE(tasks_id_type, 'TABLO YOK');
    RAISE NOTICE '   Tasks kullanıcı sütunu: %', COALESCE(tasks_user_col, 'BULUNAMADI');
    RAISE NOTICE '📋 ========================';
END $$;

-- 0.1. TÜM SÜTUNLARI GÖSTER VE TİPLERİ KONTROL ET
DO $$
DECLARE
    col_record RECORD;
    notes_user_col_type TEXT;
    tasks_user_col_type TEXT;
BEGIN
    RAISE NOTICE '📋 NOTES TABLOSU SÜTUNLARI:';
    FOR col_record IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'notes'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '   - % (%)', col_record.column_name, col_record.data_type;
    END LOOP;
    
    RAISE NOTICE '📋 TASKS TABLOSU SÜTUNLARI:';
    FOR col_record IN 
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'tasks'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '   - % (%)', col_record.column_name, col_record.data_type;
    END LOOP;
    
    -- Kullanıcı sütun tiplerini özel olarak kontrol et
    SELECT data_type INTO notes_user_col_type
    FROM information_schema.columns 
    WHERE table_name = 'notes' 
    AND column_name IN ('user_id', 'created_by', 'author_id', 'owner_id');
    
    SELECT data_type INTO tasks_user_col_type
    FROM information_schema.columns 
    WHERE table_name = 'tasks'
    AND column_name IN ('user_id', 'created_by', 'author_id', 'owner_id', 'assigned_to');
    
    RAISE NOTICE '🔍 KULLANICI SÜTUN TİPLERİ:';
    RAISE NOTICE '   Notes kullanıcı sütunu tipi: %', COALESCE(notes_user_col_type, 'BULUNAMADI');
    RAISE NOTICE '   Tasks kullanıcı sütunu tipi: %', COALESCE(tasks_user_col_type, 'BULUNAMADI');
    RAISE NOTICE '   auth.uid() tipi: UUID';
END $$;

-- 1. ATTACHMENTS TABLOSUNU OLUŞTUR
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Validasyon constraints
    CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 52428800), -- 50MB max
    CONSTRAINT valid_mime_type CHECK (mime_type IN (
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ))
);

-- 2. TABLO TİPLERİNE GÖRE NOTE_ATTACHMENTS OLUŞTUR
DO $$
DECLARE
    notes_id_type TEXT;
BEGIN
    -- Notes tablosu id tipini al
    SELECT data_type INTO notes_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'notes' AND column_name = 'id';
    
    -- Notes tablosu integer id kullanıyorsa
    IF notes_id_type = 'integer' THEN
        CREATE TABLE IF NOT EXISTS note_attachments (
            id SERIAL PRIMARY KEY,
            note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
            attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            -- Her not-attachment çifti benzersiz olmalı
            UNIQUE(note_id, attachment_id)
        );
        RAISE NOTICE '✓ note_attachments tablosu INTEGER id ile oluşturuldu';
        
    -- Notes tablosu UUID kullanıyorsa  
    ELSIF notes_id_type = 'uuid' THEN
        CREATE TABLE IF NOT EXISTS note_attachments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
            attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            -- Her not-attachment çifti benzersiz olmalı
            UNIQUE(note_id, attachment_id)
        );
        RAISE NOTICE '✓ note_attachments tablosu UUID id ile oluşturuldu';
    ELSE
        RAISE EXCEPTION 'Notes tablosu bulunamadı veya desteklenmeyen id tipi: %', notes_id_type;
    END IF;
END $$;

-- 3. TABLO TİPLERİNE GÖRE TASK_ATTACHMENTS OLUŞTUR
DO $$
DECLARE
    tasks_id_type TEXT;
BEGIN
    -- Tasks tablosu id tipini al
    SELECT data_type INTO tasks_id_type
    FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'id';
    
    -- Tasks tablosu integer id kullanıyorsa
    IF tasks_id_type = 'integer' THEN
        CREATE TABLE IF NOT EXISTS task_attachments (
            id SERIAL PRIMARY KEY,
            task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            -- Her task-attachment çifti benzersiz olmalı
            UNIQUE(task_id, attachment_id)
        );
        RAISE NOTICE '✓ task_attachments tablosu INTEGER id ile oluşturuldu';
        
    -- Tasks tablosu UUID kullanıyorsa
    ELSIF tasks_id_type = 'uuid' THEN
        CREATE TABLE IF NOT EXISTS task_attachments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), 
            task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            -- Her task-attachment çifti benzersiz olmalı
            UNIQUE(task_id, attachment_id)
        );
        RAISE NOTICE '✓ task_attachments tablosu UUID id ile oluşturuldu';
    ELSE
        RAISE EXCEPTION 'Tasks tablosu bulunamadı veya desteklenmeyen id tipi: %', tasks_id_type;
    END IF;
END $$;

-- 4. PERFORMANS İNDEKSLERİ OLUŞTUR
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_at ON attachments(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_attachments_mime_type ON attachments(mime_type);
CREATE INDEX IF NOT EXISTS idx_attachments_is_deleted ON attachments(is_deleted);

CREATE INDEX IF NOT EXISTS idx_note_attachments_note_id ON note_attachments(note_id);
CREATE INDEX IF NOT EXISTS idx_note_attachments_attachment_id ON note_attachments(attachment_id);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_attachment_id ON task_attachments(attachment_id);

-- 5. TÜRKÇE ARAMA İÇİN İNDEKSLER (opsiyonel)
CREATE INDEX IF NOT EXISTS idx_notes_title_search ON notes USING gin(to_tsvector('turkish', title));
CREATE INDEX IF NOT EXISTS idx_notes_content_search ON notes USING gin(to_tsvector('turkish', content));
CREATE INDEX IF NOT EXISTS idx_tasks_title_search ON tasks USING gin(to_tsvector('turkish', title));
CREATE INDEX IF NOT EXISTS idx_tasks_description_search ON tasks USING gin(to_tsvector('turkish', description));

-- 6. DOSYA YÖNETİMİ FONKSİYONLARI (TİP UYUMLU)
-- Notes için fonksiyon (integer veya UUID id destekli)
DO $$
DECLARE
    notes_id_type TEXT;
BEGIN
    SELECT data_type INTO notes_id_type 
    FROM information_schema.columns 
    WHERE table_name = 'notes' AND column_name = 'id';
    
    IF notes_id_type = 'integer' THEN
        -- INTEGER id için fonksiyon
        EXECUTE 'CREATE OR REPLACE FUNCTION get_note_attachments(note_int_id INTEGER)
        RETURNS TABLE (
            id UUID,
            filename VARCHAR(255),
            original_filename VARCHAR(255), 
            file_path TEXT,
            file_size BIGINT,
            mime_type VARCHAR(100),
            uploaded_at TIMESTAMP WITH TIME ZONE
        )
        LANGUAGE SQL
        STABLE
        AS $func$
            SELECT 
                a.id,
                a.filename,
                a.original_filename,
                a.file_path,
                a.file_size,
                a.mime_type,
                a.uploaded_at
            FROM attachments a
            INNER JOIN note_attachments na ON a.id = na.attachment_id
            WHERE na.note_id = note_int_id 
              AND a.is_deleted = FALSE
            ORDER BY a.uploaded_at DESC;
        $func$;';
        
    ELSE
        -- UUID id için fonksiyon
        EXECUTE 'CREATE OR REPLACE FUNCTION get_note_attachments(note_uuid UUID)
        RETURNS TABLE (
            id UUID,
            filename VARCHAR(255),
            original_filename VARCHAR(255), 
            file_path TEXT,
            file_size BIGINT,
            mime_type VARCHAR(100),
            uploaded_at TIMESTAMP WITH TIME ZONE
        )
        LANGUAGE SQL
        STABLE
        AS $func$
            SELECT 
                a.id,
                a.filename,
                a.original_filename,
                a.file_path,
                a.file_size,
                a.mime_type,
                a.uploaded_at
            FROM attachments a
            INNER JOIN note_attachments na ON a.id = na.attachment_id
            WHERE na.note_id = note_uuid 
              AND a.is_deleted = FALSE
            ORDER BY a.uploaded_at DESC;
        $func$;';
    END IF;
END $$;

-- Tasks için fonksiyon (integer veya UUID id destekli)  
DO $$
DECLARE
    tasks_id_type TEXT;
BEGIN
    SELECT data_type INTO tasks_id_type
    FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'id';
    
    IF tasks_id_type = 'integer' THEN
        -- INTEGER id için fonksiyon
        EXECUTE 'CREATE OR REPLACE FUNCTION get_task_attachments(task_int_id INTEGER)
        RETURNS TABLE (
            id UUID,
            filename VARCHAR(255),
            original_filename VARCHAR(255),
            file_path TEXT, 
            file_size BIGINT,
            mime_type VARCHAR(100),
            uploaded_at TIMESTAMP WITH TIME ZONE
        )
        LANGUAGE SQL
        STABLE  
        AS $func$
            SELECT 
                a.id,
                a.filename,
                a.original_filename,
                a.file_path,
                a.file_size,
                a.mime_type,
                a.uploaded_at
            FROM attachments a
            INNER JOIN task_attachments ta ON a.id = ta.attachment_id
            WHERE ta.task_id = task_int_id
              AND a.is_deleted = FALSE
            ORDER BY a.uploaded_at DESC;
        $func$;';
        
    ELSE
        -- UUID id için fonksiyon
        EXECUTE 'CREATE OR REPLACE FUNCTION get_task_attachments(task_uuid UUID)
        RETURNS TABLE (
            id UUID,
            filename VARCHAR(255),
            original_filename VARCHAR(255),
            file_path TEXT, 
            file_size BIGINT,
            mime_type VARCHAR(100),
            uploaded_at TIMESTAMP WITH TIME ZONE
        )
        LANGUAGE SQL
        STABLE  
        AS $func$
            SELECT 
                a.id,
                a.filename,
                a.original_filename,
                a.file_path,
                a.file_size,
                a.mime_type,
                a.uploaded_at
            FROM attachments a
            INNER JOIN task_attachments ta ON a.id = ta.attachment_id
            WHERE ta.task_id = task_uuid
              AND a.is_deleted = FALSE
            ORDER BY a.uploaded_at DESC;
        $func$;';
    END IF;
END $$;

-- 7. KULLANICI DEPOLAMA KULLANIMI FONKSİYONU
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_uuid UUID)
RETURNS BIGINT
LANGUAGE SQL
STABLE
AS $$
    SELECT COALESCE(SUM(file_size), 0)
    FROM attachments 
    WHERE uploaded_by = user_uuid 
      AND is_deleted = FALSE;
$$;

-- 8. ROW LEVEL SECURITY (RLS) KURALLARI
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Attachments için RLS politikaları
CREATE POLICY "Users can view attachments they uploaded" ON attachments
    FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "Users can insert their own attachments" ON attachments
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own attachments" ON attachments
    FOR UPDATE USING (uploaded_by = auth.uid());

-- Note attachments için RLS politikaları (TİP UYUMLU)
DO $$
DECLARE 
    notes_user_col TEXT;
    notes_user_col_type TEXT;
BEGIN
    -- Notes tablosundaki kullanıcı sütun adını ve tipini bul
    SELECT column_name, data_type INTO notes_user_col, notes_user_col_type
    FROM information_schema.columns 
    WHERE table_name = 'notes' 
    AND column_name IN ('user_id', 'created_by', 'author_id', 'owner_id');
    
    -- Eğer kullanıcı sütunu bulunursa RLS politikası oluştur
    IF notes_user_col IS NOT NULL THEN
        -- Sütun tipi UUID ise direkt karşılaştır
        IF notes_user_col_type = 'uuid' THEN
            EXECUTE format('
                CREATE POLICY "Users can view note attachments for their notes" ON note_attachments
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM notes n 
                        WHERE n.id = note_attachments.note_id 
                        AND n.%I = auth.uid()
                    )
                );', notes_user_col);
                
            EXECUTE format('
                CREATE POLICY "Users can insert attachments to their notes" ON note_attachments
                FOR INSERT WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM notes n 
                        WHERE n.id = note_attachments.note_id 
                        AND n.%I = auth.uid()
                    )
                );', notes_user_col);
                
        -- Sütun tipi integer ise auth.uid()''ı string''e çevir sonra integer''a
        ELSIF notes_user_col_type = 'integer' THEN
            EXECUTE format('
                CREATE POLICY "Users can view note attachments for their notes" ON note_attachments
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM notes n 
                        WHERE n.id = note_attachments.note_id 
                        AND n.%I = (auth.uid()::text)::integer
                    )
                );', notes_user_col);
                
            EXECUTE format('
                CREATE POLICY "Users can insert attachments to their notes" ON note_attachments
                FOR INSERT WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM notes n 
                        WHERE n.id = note_attachments.note_id 
                        AND n.%I = (auth.uid()::text)::integer
                    )
                );', notes_user_col);
                
        -- Sütun tipi text/varchar ise auth.uid()''ı text''e çevir
        ELSE
            EXECUTE format('
                CREATE POLICY "Users can view note attachments for their notes" ON note_attachments
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM notes n 
                        WHERE n.id = note_attachments.note_id 
                        AND n.%I = auth.uid()::text
                    )
                );', notes_user_col);
                
            EXECUTE format('
                CREATE POLICY "Users can insert attachments to their notes" ON note_attachments
                FOR INSERT WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM notes n 
                        WHERE n.id = note_attachments.note_id 
                        AND n.%I = auth.uid()::text
                    )
                );', notes_user_col);
        END IF;
            
        RAISE NOTICE '✓ Notes RLS politikaları oluşturuldu (sütun: %, tip: %)', notes_user_col, notes_user_col_type;
    ELSE
        -- Basit politika: Herkes kendi yüklediği dosyalara erişebilir
        CREATE POLICY "Users can view note attachments" ON note_attachments
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM attachments a
                    WHERE a.id = note_attachments.attachment_id 
                    AND a.uploaded_by = auth.uid()
                )
            );
            
        CREATE POLICY "Users can insert note attachments" ON note_attachments
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM attachments a
                    WHERE a.id = note_attachments.attachment_id 
                    AND a.uploaded_by = auth.uid()
                )
            );
            
        RAISE NOTICE '⚠️  Notes kullanıcı sütunu bulunamadı, basit RLS kullanılıyor';
    END IF;
END $$;

-- Task attachments için RLS politikaları (TİP UYUMLU)  
DO $$
DECLARE 
    tasks_user_col TEXT;
    tasks_user_col_type TEXT;
BEGIN
    -- Tasks tablosundaki kullanıcı sütun adını ve tipini bul
    SELECT column_name, data_type INTO tasks_user_col, tasks_user_col_type
    FROM information_schema.columns 
    WHERE table_name = 'tasks'
    AND column_name IN ('user_id', 'created_by', 'author_id', 'owner_id', 'assigned_to');
    
    -- Eğer kullanıcı sütunu bulunursa RLS politikası oluştur
    IF tasks_user_col IS NOT NULL THEN
        -- Sütun tipi UUID ise direkt karşılaştır
        IF tasks_user_col_type = 'uuid' THEN
            EXECUTE format('
                CREATE POLICY "Users can view task attachments for their tasks" ON task_attachments
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM tasks t 
                        WHERE t.id = task_attachments.task_id 
                        AND t.%I = auth.uid()
                    )
                );', tasks_user_col);
                
            EXECUTE format('
                CREATE POLICY "Users can insert attachments to their tasks" ON task_attachments  
                FOR INSERT WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM tasks t 
                        WHERE t.id = task_attachments.task_id 
                        AND t.%I = auth.uid()
                    )
                );', tasks_user_col);
                
        -- Sütun tipi integer ise auth.uid()''ı string''e çevir sonra integer''a
        ELSIF tasks_user_col_type = 'integer' THEN
            EXECUTE format('
                CREATE POLICY "Users can view task attachments for their tasks" ON task_attachments
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM tasks t 
                        WHERE t.id = task_attachments.task_id 
                        AND t.%I = (auth.uid()::text)::integer
                    )
                );', tasks_user_col);
                
            EXECUTE format('
                CREATE POLICY "Users can insert attachments to their tasks" ON task_attachments  
                FOR INSERT WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM tasks t 
                        WHERE t.id = task_attachments.task_id 
                        AND t.%I = (auth.uid()::text)::integer
                    )
                );', tasks_user_col);
                
        -- Sütun tipi text/varchar ise auth.uid()''ı text''e çevir
        ELSE
            EXECUTE format('
                CREATE POLICY "Users can view task attachments for their tasks" ON task_attachments
                FOR SELECT USING (
                    EXISTS (
                        SELECT 1 FROM tasks t 
                        WHERE t.id = task_attachments.task_id 
                        AND t.%I = auth.uid()::text
                    )
                );', tasks_user_col);
                
            EXECUTE format('
                CREATE POLICY "Users can insert attachments to their tasks" ON task_attachments  
                FOR INSERT WITH CHECK (
                    EXISTS (
                        SELECT 1 FROM tasks t 
                        WHERE t.id = task_attachments.task_id 
                        AND t.%I = auth.uid()::text
                    )
                );', tasks_user_col);
        END IF;
            
        RAISE NOTICE '✓ Tasks RLS politikaları oluşturuldu (sütun: %, tip: %)', tasks_user_col, tasks_user_col_type;
    ELSE
        -- Basit politika: Herkes kendi yüklediği dosyalara erişebilir
        CREATE POLICY "Users can view task attachments" ON task_attachments
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM attachments a
                    WHERE a.id = task_attachments.attachment_id 
                    AND a.uploaded_by = auth.uid()
                )
            );
            
        CREATE POLICY "Users can insert task attachments" ON task_attachments
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM attachments a
                    WHERE a.id = task_attachments.attachment_id 
                    AND a.uploaded_by = auth.uid()
                )
            );
            
        RAISE NOTICE '⚠️  Tasks kullanıcı sütunu bulunamadı, basit RLS kullanılıyor';
    END IF;
END $$;

-- 9. BAŞARILI KURULUM KONTROLÜ
DO $$ 
BEGIN
    -- Tabloların varlığını kontrol et
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attachments') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'note_attachments') AND  
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_attachments') THEN
        
        RAISE NOTICE '✅ İŞ TAKİP SİSTEMİ VERİTABANI GÜNCELLEMESİ BAŞARIYLA TAMAMLANDI!';
        RAISE NOTICE '📊 Oluşturulan tablolar:';
        RAISE NOTICE '   - attachments (dosya bilgileri)';
        RAISE NOTICE '   - note_attachments (not-dosya ilişkileri)';  
        RAISE NOTICE '   - task_attachments (görev-dosya ilişkileri)';
        RAISE NOTICE '🔍 Oluşturulan fonksiyonlar:';
        RAISE NOTICE '   - get_note_attachments()';
        RAISE NOTICE '   - get_task_attachments()';
        RAISE NOTICE '   - get_user_storage_usage()';
        RAISE NOTICE '🔒 RLS güvenlik kuralları aktif';
        RAISE NOTICE '🚀 Sistem kullanıma hazır!';
    ELSE
        RAISE EXCEPTION '❌ Tablolar oluşturulamadı!';
    END IF;
END $$;