# 📋 SQL Komutları - Hızlı Referans

## 🏥 Hastane Personeli İçin Pratik SQL Sorguları

### 1. GÖREV YÖNETİMİ

#### Tüm Aktif Görevleri Görüntüle
```sql
SELECT 
    t.id as "Görev ID",
    t.title as "Başlık",
    t.status as "Durum",
    t.priority as "Öncelik",
    u.name as "Atanan Kişi",
    t.created_at as "Oluşturulma Tarihi"
FROM public.tasks t
LEFT JOIN public.users u ON t.assigned_to = u.id
WHERE t.status != 'completed'
ORDER BY 
    CASE t.priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
    END,
    t.created_at DESC;
```

#### Bugün Oluşturulan Görevler
```sql
SELECT 
    t.title as "Başlık",
    u1.name as "Atanan",
    u2.name as "Oluşturan",
    t.priority as "Öncelik",
    t.created_at as "Saat"
FROM public.tasks t
LEFT JOIN public.users u1 ON t.assigned_to = u1.id
LEFT JOIN public.users u2 ON t.created_by = u2.id
WHERE DATE(t.created_at) = CURRENT_DATE
ORDER BY t.created_at DESC;
```

#### Kullanıcı Bazında İş Yükü
```sql
SELECT 
    u.name as "Personel",
    COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as "Bekleyen",
    COUNT(CASE WHEN t.status = 'in-progress' THEN 1 END) as "Devam Eden",
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as "Tamamlanan",
    COUNT(t.id) as "Toplam"
FROM public.users u
LEFT JOIN public.tasks t ON u.id = t.assigned_to
GROUP BY u.id, u.name
ORDER BY "Toplam" DESC;
```

### 2. KULLANICI YÖNETİMİ

#### Yeni Personel Ekleme
```sql
-- Örnek: Yeni doktor ekleme
INSERT INTO public.users (username, password, name, role) 
VALUES ('drmehmet', 'doktor123', 'Dr. Mehmet Yılmaz', 'member');
```

#### Personel Bilgilerini Güncelleme
```sql
-- Şifre değiştirme
UPDATE public.users 
SET password = 'yenisifre123' 
WHERE username = 'ismail';

-- İsim güncelleme
UPDATE public.users 
SET name = 'İsmail Arslan - Teknik Uzman' 
WHERE username = 'ismail';
```

#### Tüm Personeli Listele
```sql
SELECT 
    id as "ID",
    username as "Kullanıcı Adı",
    name as "Ad Soyad",
    role as "Rol",
    created_at as "Kayıt Tarihi"
FROM public.users 
ORDER BY created_at ASC;
```

### 3. RAPORLAMA VE İSTATİSTİKLER

#### Haftalık Performans Raporu
```sql
SELECT 
    u.name as "Personel",
    COUNT(CASE WHEN t.status = 'completed' AND t.updated_at >= date_trunc('week', now()) THEN 1 END) as "Bu Hafta Tamamlanan",
    COUNT(CASE WHEN t.created_at >= date_trunc('week', now()) THEN 1 END) as "Bu Hafta Atanan",
    COUNT(CASE WHEN t.status != 'completed' THEN 1 END) as "Bekleyen Görevler"
FROM public.users u
LEFT JOIN public.tasks t ON u.id = t.assigned_to
GROUP BY u.id, u.name
ORDER BY "Bu Hafta Tamamlanan" DESC;
```

#### Öncelik Bazında Durum
```sql
SELECT 
    priority as "Öncelik",
    status as "Durum",
    COUNT(*) as "Adet",
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as "Yüzde"
FROM public.tasks
GROUP BY priority, status
ORDER BY 
    CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
    CASE status WHEN 'todo' THEN 1 WHEN 'in-progress' THEN 2 WHEN 'completed' THEN 3 END;
```

#### Son 7 Günün Aktivitesi
```sql
SELECT 
    DATE(created_at) as "Tarih",
    COUNT(*) as "Oluşturulan Görev",
    COUNT(CASE WHEN priority = 'high' THEN 1 END) as "Yüksek Öncelik",
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as "Tamamlanan"
FROM public.tasks
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY "Tarih" DESC;
```

### 4. ACİL DURUMLAR VE TEMİZLİK

#### Tamamlanmış Eski Görevleri Temizle (30 günden eski)
```sql
-- DİKKAT: Bu sorguyu çalıştırmadan önce backup alın!
DELETE FROM public.tasks 
WHERE status = 'completed' 
AND updated_at < CURRENT_DATE - INTERVAL '30 days';
```

#### Yetim Görevleri Bul (Atanmamış)
```sql
SELECT 
    t.id,
    t.title,
    t.status,
    'ATAMASIZ GÖREV' as uyari
FROM public.tasks t
WHERE t.assigned_to IS NULL OR t.created_by IS NULL;
```

#### Sistem Durumu Kontrolü
```sql
SELECT 
    'Toplam Kullanıcı' as "Metrik",
    COUNT(*) as "Değer"
FROM public.users
UNION ALL
SELECT 
    'Toplam Görev' as "Metrik",
    COUNT(*) as "Değer"
FROM public.tasks
UNION ALL
SELECT 
    'Aktif Görevler' as "Metrik",
    COUNT(*) as "Değer"
FROM public.tasks
WHERE status IN ('todo', 'in-progress')
UNION ALL
SELECT 
    'Bu Hafta Oluşturulan' as "Metrik",
    COUNT(*) as "Değer"
FROM public.tasks
WHERE created_at >= date_trunc('week', now());
```

### 5. HIZLI İŞLEMLER

#### Görev Durumunu Toplu Güncelle
```sql
-- Belirli bir kullanıcının tüm bekleyen görevlerini "devam ediyor" yap
UPDATE public.tasks 
SET status = 'in-progress', updated_at = now()
WHERE assigned_to = 2 AND status = 'todo';
```

#### Bu Ayın En Aktif Kullanıcısı
```sql
SELECT 
    u.name as "En Aktif Personel",
    COUNT(t.id) as "Bu Ay Tamamladığı Görev"
FROM public.users u
JOIN public.tasks t ON u.id = t.assigned_to
WHERE t.status = 'completed' 
AND EXTRACT(MONTH FROM t.updated_at) = EXTRACT(MONTH FROM CURRENT_DATE)
GROUP BY u.id, u.name
ORDER BY COUNT(t.id) DESC
LIMIT 1;
```

---

## ⚠️ ÖNEMLİ HATIRLATMALAR

1. **DELETE** komutları kullanmadan önce mutlaka backup alın
2. **UPDATE** komutlarını test ortamında önce deneyin  
3. Kritik değişiklikler öncesi sistem yöneticisine haber verin
4. Büyük veri silme işlemlerini mesai saatleri dışında yapın

## 🆘 YARDIM

Sorun yaşadığınızda:
1. Supabase Dashboard > Logs bölümünü kontrol edin
2. https://is-takip-sistemi.vercel.app/api/test-db adresini test edin
3. Sistem yöneticisi Enes Poyraz'a ulaşın

**Son güncelleme:** 3 Ekim 2025