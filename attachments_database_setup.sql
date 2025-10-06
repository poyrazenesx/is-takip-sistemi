-- Resim ve dosya eklentileri için tablo
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
  description TEXT
);

-- Notlar ve eklentiler arasındaki ilişki tablosu
CREATE TABLE IF NOT EXISTS note_attachments (
  id SERIAL PRIMARY KEY,
  note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
  attachment_id INTEGER REFERENCES attachments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(note_id, attachment_id)
);

-- Görevler ve eklentiler arasındaki ilişki tablosu  
CREATE TABLE IF NOT EXISTS task_attachments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  attachment_id INTEGER REFERENCES attachments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, attachment_id)
);

-- Eklentiler tablosu için indeksler
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachments_file_type ON attachments(file_type);
CREATE INDEX IF NOT EXISTS idx_attachments_is_image ON attachments(is_image);

-- İlişki tabloları için indeksler
CREATE INDEX IF NOT EXISTS idx_note_attachments_note_id ON note_attachments(note_id);
CREATE INDEX IF NOT EXISTS idx_note_attachments_attachment_id ON note_attachments(attachment_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_attachment_id ON task_attachments(attachment_id);

-- Veritabanı fonksiyonları
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