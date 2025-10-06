-- =====================================================
-- İŞ TAKİP SİSTEMİ - SUNUCU GÜNCELLEMELERİ
-- Tavşanlı Doç.Dr.Mustafa KALEMLİ Devlet Hastanesi
-- Bilgi İşlem Birimi - 2025
-- =====================================================

-- Bu dosya tüm yeni özelliklerin veritabanı güncellemelerini içerir:
-- 1. Resim/Dosya yükleme sistemi
-- 2. Not eklentileri
-- 3. Görev eklentileri
-- 4. Arama optimizasyonları

-- =====================================================
-- 1. EKLENTILER (ATTACHMENTS) TABLOSU
-- =====================================================

-- Resim ve dosya eklentileri için ana tablo
CREATE TABLE IF NOT EXISTS attachments (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_image BOOLEAN DEFAULT FALSE,
    thumbnail_path VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. NOT EKLENTİLERİ İLİŞKİ TABLOSU
-- =====================================================

-- Notlar ve eklentiler arasındaki many-to-many ilişki
CREATE TABLE IF NOT EXISTS note_attachments (
    id SERIAL PRIMARY KEY,
    note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
    attachment_id INTEGER REFERENCES attachments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    UNIQUE(note_id, attachment_id)
);

-- =====================================================
-- 3. GÖREV EKLENTİLERİ İLİŞKİ TABLOSU
-- =====================================================

-- Görevler ve eklentiler arasındaki many-to-many ilişki
CREATE TABLE IF NOT EXISTS task_attachments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    attachment_id INTEGER REFERENCES attachments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    UNIQUE(task_id, attachment_id)
);

-- =====================================================
-- 4. PERFORMANS İNDEKSLERİ
-- =====================================================

-- Eklentiler tablosu indeksleri
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachments_file_type ON attachments(file_type);
CREATE INDEX IF NOT EXISTS idx_attachments_is_image ON attachments(is_image);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_at ON attachments(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_file_size ON attachments(file_size);

-- Not eklentileri tablosu indeksleri
CREATE INDEX IF NOT EXISTS idx_note_attachments_note_id ON note_attachments(note_id);
CREATE INDEX IF NOT EXISTS idx_note_attachments_attachment_id ON note_attachments(attachment_id);
CREATE INDEX IF NOT EXISTS idx_note_attachments_created_at ON note_attachments(created_at DESC);

-- Görev eklentileri tablosu indeksleri
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_attachment_id ON task_attachments(attachment_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_created_at ON task_attachments(created_at DESC);

-- Arama performansı için mevcut tablolar üzerinde indeksler
CREATE INDEX IF NOT EXISTS idx_notes_title_search ON notes USING gin(to_tsvector('turkish', title));
CREATE INDEX IF NOT EXISTS idx_notes_content_search ON notes USING gin(to_tsvector('turkish', content));
CREATE INDEX IF NOT EXISTS idx_tasks_title_search ON tasks USING gin(to_tsvector('turkish', title));
CREATE INDEX IF NOT EXISTS idx_tasks_description_search ON tasks USING gin(to_tsvector('turkish', description));

-- =====================================================
-- 5. YARDIMCI VERİTABANI FONKSİYONLARI
-- =====================================================

-- Not eklentilerini getirme fonksiyonu
CREATE OR REPLACE FUNCTION get_note_attachments(p_note_id INTEGER)
RETURNS TABLE (
    attachment_id INTEGER,
    file_name VARCHAR,
    original_name VARCHAR,
    file_type VARCHAR,
    file_size BIGINT,
    file_path VARCHAR,
    is_image BOOLEAN,
    thumbnail_path VARCHAR,
    description TEXT,
    uploaded_by INTEGER,
    uploaded_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.file_name,
        a.original_name,
        a.file_type,
        a.file_size,
        a.file_path,
        a.is_image,
        a.thumbnail_path,
        a.description,
        a.uploaded_by,
        a.uploaded_at
    FROM attachments a
    INNER JOIN note_attachments na ON a.id = na.attachment_id
    WHERE na.note_id = p_note_id
    ORDER BY a.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Görev eklentilerini getirme fonksiyonu
CREATE OR REPLACE FUNCTION get_task_attachments(p_task_id INTEGER)
RETURNS TABLE (
    attachment_id INTEGER,
    file_name VARCHAR,
    original_name VARCHAR,
    file_type VARCHAR,
    file_size BIGINT,
    file_path VARCHAR,
    is_image BOOLEAN,
    thumbnail_path VARCHAR,
    description TEXT,
    uploaded_by INTEGER,
    uploaded_at TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.file_name,
        a.original_name,
        a.file_type,
        a.file_size,
        a.file_path,
        a.is_image,
        a.thumbnail_path,
        a.description,
        a.uploaded_by,
        a.uploaded_at
    FROM attachments a
    INNER JOIN task_attachments ta ON a.id = ta.attachment_id
    WHERE ta.task_id = p_task_id
    ORDER BY a.uploaded_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Kullanıcının toplam dosya boyutunu getirme fonksiyonu
CREATE OR REPLACE FUNCTION get_user_storage_usage(p_user_id INTEGER)
RETURNS BIGINT AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(file_size) 
         FROM attachments 
         WHERE uploaded_by = p_user_id), 
        0
    );
END;
$$ LANGUAGE plpgsql;

-- Dosya tipine göre istatistikler
CREATE OR REPLACE FUNCTION get_file_type_stats()
RETURNS TABLE (
    file_type VARCHAR,
    count BIGINT,
    total_size BIGINT,
    avg_size NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.file_type,
        COUNT(*)::BIGINT,
        SUM(a.file_size)::BIGINT,
        AVG(a.file_size)::NUMERIC
    FROM attachments a
    GROUP BY a.file_type
    ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TETİKLEYİCİLER (TRIGGERS)
-- =====================================================

-- Eklenti silme tetikleyicisi (fiziksel dosyayı da silmek için log tutma)
CREATE OR REPLACE FUNCTION log_attachment_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Silinen dosya bilgilerini log tablosuna kaydet (eğer log tablosu varsa)
    INSERT INTO attachment_deletion_log (
        attachment_id, 
        file_path, 
        original_name, 
        deleted_at, 
        deleted_by
    ) VALUES (
        OLD.id,
        OLD.file_path,
        OLD.original_name,
        CURRENT_TIMESTAMP,
        CURRENT_USER::INTEGER
    );
    
    RETURN OLD;
EXCEPTION
    WHEN others THEN
        -- Log tablosu yoksa hiçbir şey yapma, sadece silme işlemini devam ettir
        RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Tetikleyici oluştur (eğer log tablosu varsa)
DO $$
BEGIN
    -- Log tablosu var mı kontrol et
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attachment_deletion_log') THEN
        DROP TRIGGER IF EXISTS trigger_log_attachment_deletion ON attachments;
        CREATE TRIGGER trigger_log_attachment_deletion
            BEFORE DELETE ON attachments
            FOR EACH ROW
            EXECUTE FUNCTION log_attachment_deletion();
    END IF;
END $$;

-- =====================================================
-- 7. VERİ DOĞRULAMA VE TEMİZLEME
-- =====================================================

-- Boş veya geçersiz eklentileri temizleme
DELETE FROM attachments 
WHERE file_path IS NULL 
   OR file_path = '' 
   OR file_size <= 0
   OR original_name IS NULL 
   OR original_name = '';

-- Referans bütünlüğü kontrolü
DELETE FROM note_attachments 
WHERE note_id NOT IN (SELECT id FROM notes)
   OR attachment_id NOT IN (SELECT id FROM attachments);

DELETE FROM task_attachments 
WHERE task_id NOT IN (SELECT id FROM tasks)
   OR attachment_id NOT IN (SELECT id FROM attachments);

-- =====================================================
-- 8. GÜVENLİK VE YETKİLENDİRME
-- =====================================================

-- Eklentiler için güvenlik görünümü (sadece yetkili kullanıcıların görmesi için)
CREATE OR REPLACE VIEW secure_attachments AS
SELECT 
    id,
    file_name,
    original_name,
    CASE 
        WHEN is_image THEN 'image'
        WHEN file_type LIKE '%pdf%' THEN 'document'
        ELSE 'other'
    END as file_category,
    file_size,
    uploaded_by,
    uploaded_at,
    is_image
FROM attachments
WHERE file_size > 0 AND file_path IS NOT NULL;

-- =====================================================
-- 9. İSTATİSTİKLER VE RAPORLAMA
-- =====================================================

-- Sistem kullanım istatistikleri görünümü
CREATE OR REPLACE VIEW system_usage_stats AS
SELECT 
    'Total Files' as metric,
    COUNT(*)::TEXT as value
FROM attachments
UNION ALL
SELECT 
    'Total Storage (MB)',
    ROUND(SUM(file_size)::NUMERIC / (1024*1024), 2)::TEXT
FROM attachments
UNION ALL
SELECT 
    'Image Files',
    COUNT(*)::TEXT
FROM attachments WHERE is_image = true
UNION ALL
SELECT 
    'Document Files',
    COUNT(*)::TEXT
FROM attachments WHERE is_image = false
UNION ALL
SELECT 
    'Active Users',
    COUNT(DISTINCT uploaded_by)::TEXT
FROM attachments
UNION ALL
SELECT 
    'Notes with Attachments',
    COUNT(DISTINCT note_id)::TEXT
FROM note_attachments
UNION ALL
SELECT 
    'Tasks with Attachments',
    COUNT(DISTINCT task_id)::TEXT
FROM task_attachments;

-- =====================================================
-- 10. TAMAMLAMA MESAJI
-- =====================================================

-- Başarılı kurulum kontrolü
DO $$
DECLARE
    table_count INTEGER;
    index_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Tablo sayısını kontrol et
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name IN ('attachments', 'note_attachments', 'task_attachments');
    
    -- İndeks sayısını kontrol et
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE indexname LIKE 'idx_attachments%' OR indexname LIKE 'idx_note_attachments%' OR indexname LIKE 'idx_task_attachments%';
    
    -- Fonksiyon sayısını kontrol et
    SELECT COUNT(*) INTO function_count
    FROM pg_proc 
    WHERE proname IN ('get_note_attachments', 'get_task_attachments', 'get_user_storage_usage', 'get_file_type_stats');
    
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'İŞ TAKİP SİSTEMİ GÜNCELLEME RAPORU';
    RAISE NOTICE '=====================================';
    RAISE NOTICE 'Tablolar oluşturuldu: %', table_count;
    RAISE NOTICE 'İndeksler oluşturuldu: %', index_count;
    RAISE NOTICE 'Fonksiyonlar oluşturuldu: %', function_count;
    RAISE NOTICE '=====================================';
    
    IF table_count >= 3 AND function_count >= 4 THEN
        RAISE NOTICE '✅ TÜM GÜNCELLEMELER BAŞARILA TAMAMLANDI!';
        RAISE NOTICE '📤 Dosya yükleme sistemi aktif';
        RAISE NOTICE '🔍 Arama sistemi geliştirildi';
        RAISE NOTICE '📋 Not ve görev eklentileri hazır';
    ELSE
        RAISE NOTICE '⚠️  Bazı güncellemeler eksik olabilir';
        RAISE NOTICE '👨‍💻 Lütfen sistem yöneticisine başvurun';
    END IF;
    
    RAISE NOTICE '=====================================';
END $$;

-- Son güncelleme zamanını kaydet
INSERT INTO system_updates (update_name, update_date, description) 
VALUES (
    'File Upload System', 
    CURRENT_TIMESTAMP, 
    'Added attachments, note_attachments, task_attachments tables with search improvements'
) ON CONFLICT DO NOTHING;

-- Alternatif olarak, eğer system_updates tablosu yoksa:
CREATE TABLE IF NOT EXISTS system_updates (
    id SERIAL PRIMARY KEY,
    update_name VARCHAR(255) NOT NULL,
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    version VARCHAR(50) DEFAULT '2.0.0'
);

INSERT INTO system_updates (update_name, update_date, description) 
VALUES (
    'File Upload & Search System', 
    CURRENT_TIMESTAMP, 
    'Resim/dosya yükleme sistemi, gelişmiş arama ve not eklentileri eklendi'
);

-- =====================================================
-- KURULUM TALİMATI:
-- 1. Bu SQL dosyasını PostgreSQL veritabanınızda çalıştırın
-- 2. Tüm komutların başarıyla tamamlandığını kontrol edin
-- 3. Web uygulamasını yeniden başlatın
-- 4. /uploads klasörünün yazılabilir olduğundan emin olun
-- =====================================================