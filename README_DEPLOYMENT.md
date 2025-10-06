# 🏥 İŞ TAKİP SİSTEMİ - SERVER DEPLOYMENT
**Tavşanlı Doç.Dr.Mustafa KALEMLİ Devlet Hastanesi - Bilgi İşlem Birimi**

## 🚀 Hızlı Kurulum (Otomatik)

### 1. Tek Komutla Kurulum
```bash
# Kurulum script'ini çalıştırır
chmod +x install.sh
./install.sh
```

Bu script size rehberlik ederek:
- ✅ Sistem gereksinimlerini kontrol eder
- ✅ Konfigürasyon bilgilerini alır
- ✅ Tüm bileşenleri otomatik kurar
- ✅ Veritabanını hazırlar
- ✅ PM2 ile uygulamayı başlatır
- ✅ Nginx konfigürasyonunu yapar
- ✅ Cron işlerini kurar

---

## 🛠️ Manuel Kurulum (Adım Adım)

### 1. 📋 Ön Gereksinimler
```bash
# Node.js 18+ yükleyin
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL yükleyin  
sudo apt-get install postgresql postgresql-contrib

# PM2 yükleyin
sudo npm install -g pm2

# Nginx yükleyin (opsiyonel)
sudo apt-get install nginx
```

### 2. 🗄️ Veritabanı Kurulumu
```bash
# PostgreSQL'e bağlanın
sudo -u postgres psql

# Veritabanı ve kullanıcı oluşturun
CREATE DATABASE is_takip;
CREATE USER is_takip_user WITH ENCRYPTED PASSWORD 'güçlü_şifre';
GRANT ALL PRIVILEGES ON DATABASE is_takip TO is_takip_user;
\q

# Güncelleme script'ini çalıştırın
psql -U is_takip_user -d is_takip -f database_complete_update.sql
```

### 3. 📁 Proje Kurulumu
```bash
# Proje dizinini oluşturun
sudo mkdir -p /opt/is-takip-sistemi
sudo chown $USER:$USER /opt/is-takip-sistemi

# Dosyaları kopyalayın
cp -r * /opt/is-takip-sistemi/
cd /opt/is-takip-sistemi

# Bağımlılıkları yükleyin
npm install

# Environment dosyasını oluşturun
cp .env.example .env.local
# .env.local dosyasını kendi bilgilerinizle düzenleyin
```

### 4. 🔧 Environment Konfigürasyonu
`.env.local` dosyasını düzenleyin:
```env
# Database
DATABASE_URL="postgresql://is_takip_user:güçlü_şifre@localhost:5432/is_takip"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_key"

# App Settings
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="random_secret_key"
NODE_ENV="production"

# File Upload
UPLOAD_DIR="/opt/is-takip-sistemi/public/uploads"
MAX_FILE_SIZE="10485760"
```

### 5. 📦 Build ve Başlatma
```bash
# Uygulamayı build edin
npm run build

# PM2 ile başlatın
pm2 start npm --name "is-takip-sistemi" -- start
pm2 save
pm2 startup
```

### 6. 🌐 Nginx Konfigürasyonu
```bash
# Site konfigürasyonu oluşturun
sudo nano /etc/nginx/sites-available/is-takip-sistemi

# Aşağıdaki konfigürasyonu ekleyin:
server {
    listen 80;
    server_name yourdomain.com;
    
    client_max_body_size 50M;
    
    location /_next/static {
        alias /opt/is-takip-sistemi/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
    
    location /uploads {
        alias /opt/is-takip-sistemi/public/uploads;
        expires 30d;
        add_header Cache-Control "public";
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Site'ı aktifleştirin
sudo ln -s /etc/nginx/sites-available/is-takip-sistemi /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

---

## 📊 Sistem Durumu Kontrolü

### Temel Kontroller
```bash
# PM2 durumu
pm2 status
pm2 logs is-takip-sistemi

# Nginx durumu  
sudo systemctl status nginx

# Veritabanı bağlantısı
psql -U is_takip_user -d is_takip -c "SELECT COUNT(*) FROM users;"

# Disk kullanımı
df -h
du -sh /opt/is-takip-sistemi/public/uploads
```

### Sağlık Kontrolü
```bash
# Web uygulaması erişim testi
curl -I http://localhost:3000

# Veritabanı bağlantı testi  
curl -f http://localhost:3000/api/health

# PM2 process durumu
pm2 monit
```

---

## 🔄 Yedekleme ve Bakım

### Otomatik Yedekleme Kurulumu
```bash
# Script dosyalarına izin verin
chmod +x scripts/*.sh

# Cron işlerini kurun
crontab -e
# Aşağıdaki satırları ekleyin:

# Günlük yedek - Her gece 02:00
0 2 * * * /opt/is-takip-sistemi/scripts/backup.sh

# Haftalık bakım - Her Pazar 05:00
0 5 * * 0 /opt/is-takip-sistemi/scripts/maintenance.sh
```

### Manuel Yedekleme
```bash
# Veritabanı yedeği
./scripts/backup.sh

# Sistem bakımı
./scripts/maintenance.sh

# Manuel veritabanı yedeği
pg_dump -U is_takip_user is_takip > backup_$(date +%Y%m%d).sql
```

---

## 🔒 SSL Sertifikası (HTTPS)

### Certbot ile SSL
```bash
# Certbot yükleyin
sudo apt-get install certbot python3-certbot-nginx

# SSL sertifikası alın
sudo certbot --nginx -d yourdomain.com

# Otomatik yenileme
sudo crontab -e
# Ekleyin: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🚨 Sorun Giderme

### Yaygın Sorunlar ve Çözümleri

#### 1. Uygulama başlamıyor
```bash
# PM2 loglarını kontrol edin
pm2 logs is-takip-sistemi

# Port kullanımını kontrol edin
sudo netstat -tlnp | grep :3000

# Environment dosyasını kontrol edin
cat .env.local
```

#### 2. Veritabanı bağlantı hatası
```bash
# PostgreSQL servisini kontrol edin
sudo systemctl status postgresql

# Bağlantıyı test edin
psql -U is_takip_user -h localhost -d is_takip

# Log dosyalarını kontrol edin
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### 3. Dosya yükleme sorunu
```bash
# Upload dizini izinlerini kontrol edin
ls -la /opt/is-takip-sistemi/public/uploads

# Disk alanını kontrol edin
df -h

# Nginx upload limitini kontrol edin
sudo nginx -T | grep client_max_body_size
```

#### 4. 502 Bad Gateway
```bash
# PM2 uygulamasının çalıştığını kontrol edin
pm2 status

# Nginx konfigürasyonunu test edin
sudo nginx -t

# Proxy ayarlarını kontrol edin
sudo nano /etc/nginx/sites-available/is-takip-sistemi
```

---

## 📈 Performans Optimizasyonu

### PM2 Optimizasyonu
```bash
# PM2 cluster mode (çok çekirdekli sistemler için)
pm2 delete is-takip-sistemi
pm2 start ecosystem.config.js --env production

# Memory limiti ayarlama
pm2 start npm --name "is-takip-sistemi" -- start --max-memory-restart 1G
```

### Nginx Cache
```nginx
# Nginx konfigürasyonuna ekleyin
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Veritabanı Optimizasyonu
```sql
-- İstatistikleri güncelle
ANALYZE;

-- Vacuum işlemi
VACUUM;

-- İndeks kullanımını kontrol et
SELECT * FROM pg_stat_user_indexes;
```

---

## 🏥 Hastane Özel Ayarları

### Test Kullanıcıları
- **epoyraz** / epoyraz43 (Admin)
- **ismail** / 123 (Kullanıcı)
- **köroğlu** / 123 (Kullanıcı)

### Birim Kategorileri
- 🏥 Servis
- 👩‍⚕️ Poliklinikler
- 💊 Eczane
- 📋 Genel Hasta Kayıt
- ⭐ Kalite
- 📝 Dilekçeler
- 🏛️ İdare

---

## 📞 Destek

Herhangi bir sorun yaşarsanız:

1. **Log dosyalarını kontrol edin:**
   - `/var/log/is-takip-sistemi/`
   - `pm2 logs is-takip-sistemi`
   - `/var/log/nginx/error.log`

2. **Sistem durumunu kontrol edin:**
   ```bash
   # Hızlı durum kontrolü
   pm2 status && systemctl status nginx && df -h
   ```

3. **Bakım script'ini çalıştırın:**
   ```bash
   ./scripts/maintenance.sh
   ```

---

## 📄 Dosya Listesi

Deployment için gerekli dosyalar:
- ✅ `database_complete_update.sql` - Veritabanı güncellemeleri
- ✅ `DEPLOYMENT_GUIDE.md` - Detaylı deployment rehberi  
- ✅ `install.sh` - Otomatik kurulum script'i
- ✅ `scripts/backup.sh` - Yedekleme script'i
- ✅ `scripts/maintenance.sh` - Bakım script'i
- ✅ `scripts/crontab_setup.txt` - Cron ayarları
- ✅ `README_DEPLOYMENT.md` - Bu dosya

---

**🎉 Başarılı bir deployment dileriz!**  
*Tavşanlı Doç.Dr.Mustafa KALEMLİ Devlet Hastanesi Bilgi İşlem Birimi - 2025*