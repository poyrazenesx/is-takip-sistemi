-- Donanım Yönetim Sistemi için Veritabanı Tabloları
-- Bu dosyayı Supabase SQL Editor'de çalıştırın

-- 1. Hardware (Donanım) Tablosunu Oluştur
CREATE TABLE IF NOT EXISTS public.hardware (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  assigned_person VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  service VARCHAR(255) NOT NULL,
  device_type VARCHAR(255) NOT NULL,
  tag_number VARCHAR(255),
  fault_description TEXT,
  work_done TEXT,
  spare_part_used BOOLEAN DEFAULT FALSE,
  spare_part_name VARCHAR(255),
  duration INTEGER DEFAULT 0, -- dakika cinsinden
  status VARCHAR(50) DEFAULT 'Tamamlandı' CHECK (status IN ('Tamamlandı', 'Devam Ediyor', 'Serviste', 'İptal')),
  notes TEXT,
  next_check_date DATE,
  service_return_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Row Level Security (RLS) politikalarını etkinleştir
ALTER TABLE public.hardware ENABLE ROW LEVEL SECURITY;

-- 3. Herkesin okuma ve yazma izni (isteğe göre değiştirilebilir)
CREATE POLICY "Enable read access for all users" ON public.hardware
FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.hardware
FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.hardware
FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users" ON public.hardware
FOR DELETE USING (true);

-- 4. updated_at otomatik güncellenmesi için trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hardware_updated_at 
  BEFORE UPDATE ON public.hardware 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Performans için index'ler
CREATE INDEX IF NOT EXISTS idx_hardware_date ON public.hardware (date DESC);
CREATE INDEX IF NOT EXISTS idx_hardware_department ON public.hardware (department);
CREATE INDEX IF NOT EXISTS idx_hardware_device_type ON public.hardware (device_type);
CREATE INDEX IF NOT EXISTS idx_hardware_status ON public.hardware (status);
CREATE INDEX IF NOT EXISTS idx_hardware_next_check ON public.hardware (next_check_date) WHERE next_check_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hardware_service_return ON public.hardware (service_return_date) WHERE service_return_date IS NOT NULL;

-- 6. Örnek veri ekleme (isteğe bağlı - test için)
/*
INSERT INTO public.hardware (
  date, assigned_person, department, service, device_type, tag_number,
  fault_description, work_done, spare_part_used, duration, status, notes
) VALUES 
(
  '2024-01-15',
  'Ahmet Yılmaz',
  'BİLGİ İŞLEM',
  'DONANIM ONARIM',
  'Masaüstü Bilgisayar',
  'PC-001',
  'Bilgisayar açılmıyor, güç led yanmıyor',
  'Güç kaynağı değiştirildi, sistem testleri yapıldı',
  true,
  60,
  'Tamamlandı',
  'Garanti süresi 2 yıl'
);
*/

-- 7. Veritabanı yapısını kontrol etme sorguları
-- SELECT * FROM public.hardware ORDER BY created_at DESC LIMIT 10;
-- SELECT COUNT(*) as toplam_kayit FROM public.hardware;
-- SELECT status, COUNT(*) as adet FROM public.hardware GROUP BY status;