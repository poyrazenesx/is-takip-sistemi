# Donanım Yönetim Sistemi - Kurulum Rehberi

Bu dosya donanım yönetim sisteminin kurulumu için adım adım rehber içerir.

## 🚀 Hızlı Kurulum

### 1. Supabase Veritabanı Kurulumu

1. [Supabase](https://supabase.com) hesabınızı oluşturun
2. Yeni bir proje oluşturun
3. SQL Editor'e gidin
4. `database/hardware_table.sql` dosyasındaki SQL komutlarını kopyalayıp çalıştırın

```sql
-- Örnek SQL komutları dosyada mevcut
CREATE TABLE public.hardware (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- ... diğer alanlar
);
```

### 2. Environment Variables Ayarları

1. `.env.example` dosyasını `.env.local` olarak kopyalayın:
```bash
cp .env.example .env.local
```

2. `.env.local` dosyasına Supabase bilgilerinizi ekleyin:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Uygulama Başlatma

```bash
npm run dev
```

## 📊 Sistem Özellikleri

### ✅ Tamamlanan Özellikler

- 🎨 **Modern UI/UX Design**
  - Alumni Sans font entegrasyonu
  - Glassmorphism card tasarımları
  - Responsive layout
  - Gradient buton tasarımları

- 📝 **Donanım Kayıt Sistemi**
  - Kapsamlı 18 alan ile detaylı kayıt
  - Modal tabanlı form sistemi
  - Otomatik form validasyonu
  - Real-time kaydet/iptal işlemleri

- 🗄️ **Veritabanı Entegrasyonu**
  - Supabase PostgreSQL entegrasyonu
  - UUID tabanlı ID sistemi
  - Row Level Security (RLS) politikaları
  - Otomatik timestamp güncellemeleri

- 🔄 **API Sistemi**
  - RESTful API endpoints (`/api/hardware`)
  - CRUD operasyonları (Create, Read, Update, Delete)
  - Sayfalama ve filtreleme desteği
  - Hata yönetimi ve validasyon

### 🚧 Geliştirme Aşamasında

- 🔍 **Gelişmiş Arama ve Filtreleme**
- 📊 **PDF/Excel Rapor Export**
- 🔔 **Servis Hatırlatma Sistemi**
- 📈 **Dashboard İstatistikleri**
- 👥 **Çoklu Kullanıcı Desteği**

## 📋 Donanım Kayıt Alanları

| Alan Adı | Tip | Açıklama |
|----------|-----|----------|
| **date** | DATE | İşlem tarihi |
| **assigned_person** | VARCHAR | Yapan teknisyen |
| **department** | VARCHAR | Bölüm (BİLGİ İŞLEM, HASTA KAYIT, vb.) |
| **service** | VARCHAR | Servis türü (TEKNIK DESTEK, ONARIM, vb.) |
| **device_type** | VARCHAR | Cihaz türü (Masaüstü, Laptop, Yazıcı, vb.) |
| **tag_number** | VARCHAR | Etiket no veya IP adresi |
| **fault_description** | TEXT | Arıza açıklaması |
| **work_done** | TEXT | Yapılan işlemler |
| **spare_part_used** | BOOLEAN | Yedek parça kullanım durumu |
| **spare_part_name** | VARCHAR | Kullanılan parça detayı |
| **duration** | INTEGER | İşlem süresi (dakika) |
| **status** | VARCHAR | Durum (Tamamlandı, Devam Ediyor, Serviste, İptal) |
| **notes** | TEXT | Ek notlar |
| **next_check_date** | DATE | Sonraki kontrol tarihi |
| **service_return_date** | DATE | Servisten dönüş tarihi |

## 🛠️ Teknik Detaylar

### Kullanılan Teknolojiler
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL
- **Database**: Supabase PostgreSQL
- **Icons**: Lucide React
- **Styling**: Custom CSS + Tailwind

### API Endpoints

```bash
GET /api/hardware          # Tüm kayıtları listele
POST /api/hardware         # Yeni kayıt oluştur
GET /api/hardware/[id]     # Belirli kaydı getir
PUT /api/hardware/[id]     # Kayıt güncelle
DELETE /api/hardware/[id]  # Kayıt sil
```

### Dosya Yapısı

```
/src
  /app
    /api/hardware         # API endpoints
    /donanim             # Donanım sayfası
  /components            # Yeniden kullanılabilir bileşenler
  /types                # TypeScript tip tanımları
/database               # SQL schema dosyaları
```

## 🔧 Sorun Giderme

### Yaygın Hatalar

1. **Supabase Connection Error**
   - Environment variables'ları kontrol edin
   - URL ve key'lerin doğru olduğundan emin olun

2. **Database Table Not Found**
   - SQL komutlarını doğru şekilde çalıştırdığınızdan emin olun
   - RLS politikalarının aktif olduğunu kontrol edin

3. **Form Submission Error**
   - Network sekmesinde API isteklerini kontrol edin
   - Browser console'da hata mesajlarını inceleyin

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. Browser console'daki hata mesajlarını kontrol edin
2. Network sekmesinde API isteklerini inceleyin
3. Supabase dashboard'unda log'ları kontrol edin