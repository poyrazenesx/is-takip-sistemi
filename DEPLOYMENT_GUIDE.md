# İŞ TAKİP SİSTEMİ - SUNUCU DEPLOYMENT REHBERİ

## 🚀 Sunucuya Yükleme Adımları

### 1. 📋 Ön Gereksinimler
- **PostgreSQL** 14+ veritabanı
- **Node.js** 18+ 
- **PM2** process manager (önerilen)
- **Nginx** web server (önerilen)

### 2. 🗄️ Veritabanı Güncellemeleri
```bash
# PostgreSQL'e bağlanın
psql -U your_username -d your_database_name

# Ana güncelleme dosyasını çalıştırın
\i database_complete_update.sql

# Alternatif olarak:
cat database_complete_update.sql | psql -U your_username -d your_database_name
```

### 3. 📁 Dosya Sistemi Hazırlığı
```bash
# Uploads klasörü oluşturun
mkdir -p public/uploads
chmod 755 public/uploads

# Ay bazında klasörler oluşturun (örnek)
mkdir -p public/uploads/2025-10
mkdir -p public/uploads/2025-11
chmod -R 755 public/uploads
```

### 4. 🔧 Environment Değişkenleri
`.env.local` dosyasını güncelleyin:
```env
# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# File Upload Settings
UPLOAD_DIR=/path/to/your/public/uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,text/plain

# App Settings
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=https://yourdomain.com
```

### 5. 📦 Paket Kurulumu ve Build
```bash
# Bağımlılıkları yükleyin
npm install

# Production build
npm run build

# PM2 ile başlatın
pm2 start npm --name "is-takip-sistemi" -- start
pm2 save
pm2 startup
```

### 6. 🌐 Nginx Konfigürasyonu
`/etc/nginx/sites-available/is-takip-sistemi`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Static files
    location /_next/static {
        alias /path/to/app/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Uploaded files
    location /uploads {
        alias /path/to/app/public/uploads;
        expires 30d;
        add_header Cache-Control "public";
        
        # Security headers for file access
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
        add_header X-XSS-Protection "1; mode=block";
    }

    # Main application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # File upload size limit
        client_max_body_size 50M;
    }
}
```

### 7. 🔒 Güvenlik Ayarları
```bash
# Dosya izinleri
chmod 600 .env.local
chmod -R 755 public/uploads
chown -R www-data:www-data public/uploads

# Firewall kuralları
ufw allow 80
ufw allow 443
ufw enable
```

### 8. 🏥 Hastane Özel Ayarları

#### Test Kullanıcıları:
- **epoyraz** / epoyraz43 (Admin)
- **ismail** / 123 (Üye)  
- **köroğlu** / 123 (Üye)

#### Birim Kategorileri:
- 🏥 Servis
- 👩‍⚕️ Poliklinikler  
- 💊 Eczane
- 📋 Genel Hasta Kayıt
- ⭐ Kalite
- 📝 Dilekçeler
- 🏛️ İdare

### 9. 📊 İzleme ve Bakım
```bash
# PM2 durumu kontrol
pm2 status
pm2 logs is-takip-sistemi

# Disk kullanımı kontrol
du -sh public/uploads/*

# Veritabanı boyutu kontrol
SELECT pg_size_pretty(pg_database_size('your_database_name'));

# Dosya sayıları kontrol
SELECT COUNT(*) FROM attachments;
SELECT COUNT(*) FROM notes;
SELECT COUNT(*) FROM tasks;
```

### 10. 🚨 Yedekleme Stratejisi
```bash
# Veritabanı yedeği
pg_dump -U your_username -d your_database_name > backup_$(date +%Y%m%d).sql

# Dosya yedeği  
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz public/uploads/

# Otomatik yedekleme (crontab)
0 2 * * * /path/to/backup_script.sh
```

### 11. ✅ Deployment Kontrol Listesi

#### Veritabanı:
- [ ] `attachments` tablosu oluşturuldu
- [ ] `note_attachments` tablosu oluşturuldu
- [ ] `task_attachments` tablosu oluşturuldu
- [ ] İndeksler oluşturuldu
- [ ] Fonksiyonlar çalışıyor

#### Dosya Sistemi:
- [ ] `public/uploads` klasörü oluşturuldu
- [ ] Yazma izinleri verildi
- [ ] Nginx uploads location konfigürasyonu

#### Uygulama:
- [ ] Environment değişkenleri set edildi
- [ ] Build başarılı
- [ ] PM2 ile çalışıyor
- [ ] SSL sertifikası aktif

#### Test:
- [ ] Giriş yapılabiliyor
- [ ] Notlar oluşturulabiliyor
- [ ] Görevler oluşturulabiliyor
- [ ] Dosya yükleme çalışıyor
- [ ] Arama fonksiyonu aktif

### 12. 🆘 Sorun Giderme

#### Dosya yükleme çalışmıyor:
```bash
# İzinleri kontrol et
ls -la public/uploads
# Disk alanını kontrol et  
df -h
```

#### Veritabanı bağlantı hatası:
```bash
# Supabase bağlantısını test et
psql -U your_username -d your_database_name -c "SELECT 1;"
```

#### Nginx 413 hatası:
```nginx
# client_max_body_size artır
client_max_body_size 50M;
```

---

## 📞 Destek İletişim
**Tavşanlı Doç.Dr.Mustafa KALEMLİ Devlet Hastanesi**  
**Bilgi İşlem Birimi - 2025**

Bu rehber tüm gerekli adımları içermektedir. Her adımı sırasıyla takip ederek sistemi sunucuya başarıyla yükleyebilirsiniz.