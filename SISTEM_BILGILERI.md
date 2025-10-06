# 🏥 İş Takip Sistemi - Backup ve Bilgilendirme Dosyası
**Tavşanlı Doç.Dr.Mustafa KALEMLİ Devlet Hastanesi - BİLGİ İŞLEM BİRİMİ**

## 🌐 Canlı Linkler
- **Ana Site:** https://is-takip-sistemi.vercel.app
- **GitHub Repository:** https://github.com/poyrazenesx/is-takip-sistemi
- **Vercel Dashboard:** https://vercel.com/poyrazenesx/is-takip-sistemi
- **Supabase Dashboard:** https://supabase.com/dashboard/project/deyylwvaulpggmjjhuzj

## 🔐 Giriş Bilgileri
### Admin Kullanıcı:
- **Kullanıcı Adı:** `epoyraz`
- **Şifre:** `epoyraz43`
- **İsim:** Enes Poyraz
- **Rol:** Admin

### Diğer Kullanıcılar:
- **İsmail Arslan:** `ismail` / `123`
- **Ali Köroğlu:** `köroğlu` / `123`  
- **Serkan Özil:** `serkan` / `123`

## 🔧 Teknik Bilgiler

### Supabase Database
- **URL:** `https://deyylwvaulpggmjjhuzj.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXlsd3ZhdWxwZ2dtampodXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjQ0NTcsImV4cCI6MjA3NTAwMDQ1N30.rYPC2Y6-ZVVmmIpMygGHtr2XHlRKhyWSF7wmZh36fsY`
- **Service Role Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXlsd3ZhdWxwZ2dtampodXpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQyNDQ1NywiZXhwIjoyMDc1MDAwNDU3fQ.T_H08H2-116o6qw_OpZE8Konm1iwmNPmUyl43B9lhW4`

### Vercel Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://deyylwvaulpggmjjhuzj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXlsd3ZhdWxwZ2dtampodXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjQ0NTcsImV4cCI6MjA3NTAwMDQ1N30.rYPC2Y6-ZVVmmIpMygGHtr2XHlRKhyWSF7wmZh36fsY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRleXlsd3ZhdWxwZ2dtampodXpqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTQyNDQ1NywiZXhwIjoyMDc1MDAwNDU3fQ.T_H08H2-116o6qw_OpZE8Konm1iwmNPmUyl43B9lhW4
```

## 🗄️ Veritabanı Yapısı

### Users Tablosu
```sql
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tasks Tablosu
```sql
CREATE TABLE public.tasks (
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
```

## 📊 Yararlı SQL Sorguları

### 1. Tüm Kullanıcıları Listele
```sql
SELECT id, username, name, role, created_at 
FROM public.users 
ORDER BY created_at DESC;
```

### 2. Tüm Görevleri Detaylarıyla Listele
```sql
SELECT 
    t.id,
    t.title,
    t.description,
    t.status,
    t.priority,
    u1.name as assigned_to_name,
    u2.name as created_by_name,
    t.created_at,
    t.updated_at
FROM public.tasks t
LEFT JOIN public.users u1 ON t.assigned_to = u1.id
LEFT JOIN public.users u2 ON t.created_by = u2.id
ORDER BY t.created_at DESC;
```

### 3. Kullanıcı Bazında Görev Sayısı
```sql
SELECT 
    u.name,
    u.role,
    COUNT(t.id) as total_tasks,
    COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN t.status = 'in-progress' THEN 1 END) as in_progress_tasks,
    COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as todo_tasks
FROM public.users u
LEFT JOIN public.tasks t ON u.id = t.assigned_to
GROUP BY u.id, u.name, u.role
ORDER BY total_tasks DESC;
```

### 4. Bu Hafta Oluşturulan Görevler
```sql
SELECT 
    t.title,
    t.status,
    u1.name as assigned_to,
    u2.name as created_by,
    t.created_at
FROM public.tasks t
LEFT JOIN public.users u1 ON t.assigned_to = u1.id
LEFT JOIN public.users u2 ON t.created_by = u2.id
WHERE t.created_at >= date_trunc('week', now())
ORDER BY t.created_at DESC;
```

### 5. Öncelik Bazında Görev Dağılımı
```sql
SELECT 
    priority,
    COUNT(*) as task_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress,
    COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo
FROM public.tasks
GROUP BY priority
ORDER BY 
    CASE priority 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
    END;
```

### 6. Yeni Kullanıcı Ekleme
```sql
INSERT INTO public.users (username, password, name, role) 
VALUES ('yenikullanici', 'sifre123', 'Yeni Kullanıcı Adı', 'member');
```

### 7. Kullanıcı Şifre Güncelleme
```sql
UPDATE public.users 
SET password = 'yenisifre123' 
WHERE username = 'kullaniciadi';
```

### 8. Görev Durumu Güncelleme
```sql
UPDATE public.tasks 
SET status = 'completed', updated_at = now() 
WHERE id = 1;
```

## 🛠️ Sistem Yönetimi

### Test Endpoint'leri
- **Database Test:** https://is-takip-sistemi.vercel.app/api/test-db
- **Tasks API:** https://is-takip-sistemi.vercel.app/api/tasks
- **Auth API:** https://is-takip-sistemi.vercel.app/api/auth/login

### Geliştirme Komutları
```bash
# Proje klonlama
git clone https://github.com/poyrazenesx/is-takip-sistemi.git

# Bağımlılıklar
npm install

# Geliştirme server'ı başlatma
npm run dev

# Production build
npm run build
```

## 🚀 Sistem Özellikleri

### Mevcut Özellikler
✅ Kullanıcı girişi ve çıkışı
✅ Görev oluşturma, düzenleme, silme
✅ Görev durumu güncelleme (Todo, In Progress, Completed)
✅ Öncelik seviyeleri (Low, Medium, High)
✅ Kullanıcıya görev atama
✅ Responsive tasarım (mobil uyumlu)
✅ Real-time görev takibi
✅ Modern Bootstrap arayüzü
✅ Supabase PostgreSQL veritabanı
✅ Vercel cloud deployment

### Gelecek Geliştirmeler (Pazartesi için fikirler)
🔮 E-posta bildirimleri
🔮 Görev yorumlama sistemi
🔮 Dosya eklentileri
🔮 Görev tamamlanma süreleri
🔮 Raporlama ve istatistikler
🔮 Takvim entegrasyonu

## 📞 İletişim ve Destek
- **GitHub:** poyrazenesx/is-takip-sistemi
- **Sistem Admin:** Enes Poyraz (epoyraz)
- **Son Güncelleme:** 3 Ekim 2025

---
**🎯 Sistem tamamen çalışır durumda ve üretim ortamında kullanıma hazır!**