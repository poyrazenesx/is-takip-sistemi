#!/bin/bash

# =======================================================
# İŞ TAKİP SİSTEMİ - HIZLI KURULUM SCRIPT'İ
# Tavşanlı Doç.Dr.Mustafa KALEMLİ Devlet Hastanesi
# Bilgi İşlem Birimi - 2025
# =======================================================

set -e

# Renkler
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logo göster
show_logo() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "   İŞ TAKİP SİSTEMİ KURULUM WIZARD'I"
    echo "=========================================="
    echo "Tavşanlı Doç.Dr.Mustafa KALEMLİ"
    echo "Devlet Hastanesi - Bilgi İşlem Birimi"
    echo "2025"
    echo -e "==========================================${NC}"
    echo
}

# Log fonksiyonu
log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[HATA]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[UYARI]${NC} $1"
}

# Kullanıcıdan onay al
confirm() {
    while true; do
        read -p "$1 (e/h): " yn
        case $yn in
            [Ee]* ) return 0;;
            [Hh]* ) return 1;;
            * ) echo "Lütfen 'e' (evet) veya 'h' (hayır) girin.";;
        esac
    done
}

# Sistem gereksinimlerini kontrol et
check_requirements() {
    log "Sistem gereksinimleri kontrol ediliyor..."
    
    # Node.js kontrolü
    if ! command -v node &> /dev/null; then
        error "Node.js bulunamadı. Lütfen Node.js 18+ yükleyin."
    fi
    
    local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 18 ]; then
        error "Node.js versiyonu çok eski. En az 18.x gerekli. Şu an: $(node -v)"
    fi
    log "✓ Node.js $(node -v) - OK"
    
    # PostgreSQL kontrolü
    if ! command -v psql &> /dev/null; then
        error "PostgreSQL bulunamadı. Lütfen PostgreSQL yükleyin."
    fi
    log "✓ PostgreSQL $(psql --version | awk '{print $3}') - OK"
    
    # npm kontrolü
    if ! command -v npm &> /dev/null; then
        error "npm bulunamadı."
    fi
    log "✓ npm $(npm -v) - OK"
    
    # PM2 kontrolü (opsiyonel)
    if command -v pm2 &> /dev/null; then
        log "✓ PM2 $(pm2 -v) - OK"
    else
        warning "PM2 bulunamadı. Production deployment için önerilen."
    fi
    
    # Git kontrolü
    if command -v git &> /dev/null; then
        log "✓ Git $(git --version | awk '{print $3}') - OK"
    else
        warning "Git bulunamadı."
    fi
    
    echo
}

# Kullanıcıdan konfigürasyon bilgilerini al
get_configuration() {
    log "Konfigürasyon bilgileri alınıyor..."
    echo
    
    # Uygulama dizini
    read -p "Uygulama kurulum dizini [/opt/is-takip-sistemi]: " APP_DIR
    APP_DIR=${APP_DIR:-/opt/is-takip-sistemi}
    
    # Veritabanı bilgileri
    echo
    echo "Veritabanı Konfigürasyonu:"
    read -p "Veritabanı sunucusu [localhost]: " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    read -p "Veritabanı portu [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    
    read -p "Veritabanı adı [is_takip]: " DB_NAME
    DB_NAME=${DB_NAME:-is_takip}
    
    read -p "Veritabanı kullanıcısı [postgres]: " DB_USER
    DB_USER=${DB_USER:-postgres}
    
    read -s -p "Veritabanı şifresi: " DB_PASSWORD
    echo
    
    # Supabase konfigürasyonu
    echo
    echo "Supabase Konfigürasyonu:"
    read -p "Supabase URL: " SUPABASE_URL
    read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
    read -p "Supabase Service Role Key: " SUPABASE_SERVICE_KEY
    
    # Domain konfigürasyonu
    echo
    read -p "Domain adı [localhost]: " DOMAIN
    DOMAIN=${DOMAIN:-localhost}
    
    read -p "Port [3000]: " PORT
    PORT=${PORT:-3000}
    
    echo
    log "Konfigürasyon tamamlandı ✓"
    echo
}

# Dizinleri oluştur
create_directories() {
    log "Gerekli dizinler oluşturuluyor..."
    
    # Ana dizin
    sudo mkdir -p "$APP_DIR"
    
    # Alt dizinler
    sudo mkdir -p "$APP_DIR"/{public/uploads,scripts,logs}
    sudo mkdir -p /var/log/is-takip-sistemi
    sudo mkdir -p /backup/is-takip-sistemi/{database,files,logs,weekly,monthly}
    
    # İzinleri ayarla
    sudo chown -R $USER:$USER "$APP_DIR"
    sudo chown -R $USER:$USER /var/log/is-takip-sistemi
    sudo chown -R $USER:$USER /backup/is-takip-sistemi
    
    # Upload klasörü için özel izinler
    chmod 755 "$APP_DIR/public/uploads"
    
    log "✓ Dizinler oluşturuldu"
}

# Proje dosyalarını kopyala
copy_project_files() {
    log "Proje dosyaları kopyalanıyor..."
    
    # Mevcut dizindeki tüm dosyaları kopyala
    cp -r * "$APP_DIR/" 2>/dev/null || true
    
    # Script dosyalarını kopyala ve çalıştırılabilir yap
    if [ -d "scripts" ]; then
        cp scripts/* "$APP_DIR/scripts/"
        chmod +x "$APP_DIR/scripts"/*.sh
    fi
    
    log "✓ Proje dosyaları kopyalandı"
}

# Environment dosyası oluştur
create_env_file() {
    log "Environment dosyası oluşturuluyor..."
    
    cat > "$APP_DIR/.env.local" << EOF
# Database Configuration
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" 
SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_KEY"

# App Configuration
NEXTAUTH_URL="http://$DOMAIN:$PORT"
NEXTAUTH_SECRET="$(openssl rand -hex 32)"
NODE_ENV="production"

# File Upload Configuration
UPLOAD_DIR="$APP_DIR/public/uploads"
MAX_FILE_SIZE="10485760"
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,application/pdf,text/plain"

# Logging
LOG_LEVEL="info"
LOG_DIR="/var/log/is-takip-sistemi"
EOF

    # Güvenlik için sadece owner okuyabilsin
    chmod 600 "$APP_DIR/.env.local"
    
    log "✓ Environment dosyası oluşturuldu"
}

# Bağımlılıkları yükle
install_dependencies() {
    log "Bağımlılıklar yükleniyor..."
    
    cd "$APP_DIR"
    
    # npm paketlerini yükle
    npm install --production=false
    
    # PM2'yi global olarak yükle (yoksa)
    if ! command -v pm2 &> /dev/null; then
        log "PM2 yükleniyor..."
        sudo npm install -g pm2
    fi
    
    log "✓ Bağımlılıklar yüklendi"
}

# Veritabanını kur
setup_database() {
    log "Veritabanı kuruluyor..."
    
    # Veritabanı bağlantısını test et
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        error "Veritabanına bağlanılamıyor. Bilgileri kontrol edin."
    fi
    
    # Ana güncelleme script'ini çalıştır
    if [ -f "$APP_DIR/database_complete_update.sql" ]; then
        log "Veritabanı güncelleme script'i çalıştırılıyor..."
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$APP_DIR/database_complete_update.sql"
    else
        warning "database_complete_update.sql dosyası bulunamadı"
    fi
    
    log "✓ Veritabanı kurulumu tamamlandı"
}

# Uygulamayı build et
build_application() {
    log "Uygulama build ediliyor..."
    
    cd "$APP_DIR"
    
    # Next.js build
    npm run build
    
    log "✓ Build tamamlandı"
}

# PM2 konfigürasyonu
setup_pm2() {
    log "PM2 konfigürasyonu yapılıyor..."
    
    # PM2 ecosystem dosyası oluştur
    cat > "$APP_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: 'is-takip-sistemi',
    script: 'npm',
    args: 'start',
    cwd: '$APP_DIR',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    },
    error_file: '/var/log/is-takip-sistemi/pm2-error.log',
    out_file: '/var/log/is-takip-sistemi/pm2-out.log',
    log_file: '/var/log/is-takip-sistemi/pm2-combined.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    max_memory_restart: '1G'
  }]
};
EOF
    
    cd "$APP_DIR"
    
    # PM2'yi başlat
    pm2 start ecosystem.config.js
    pm2 save
    
    # Sistem başlatımında otomatik başlat
    sudo pm2 startup
    
    log "✓ PM2 konfigürasyonu tamamlandı"
}

# Nginx konfigürasyonu (opsiyonel)
setup_nginx() {
    if command -v nginx &> /dev/null; then
        if confirm "Nginx konfigürasyonu yapılsın mı?"; then
            log "Nginx konfigürasyonu yapılıyor..."
            
            # Site konfigürasyon dosyası oluştur
            sudo tee /etc/nginx/sites-available/is-takip-sistemi > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    client_max_body_size 50M;
    
    location /_next/static {
        alias $APP_DIR/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
    
    location /uploads {
        alias $APP_DIR/public/uploads;
        expires 30d;
        add_header Cache-Control "public";
        add_header X-Content-Type-Options nosniff;
    }
    
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
            
            # Site'ı aktifleştir
            sudo ln -sf /etc/nginx/sites-available/is-takip-sistemi /etc/nginx/sites-enabled/
            
            # Nginx'i test et ve yeniden başlat
            if sudo nginx -t; then
                sudo systemctl reload nginx
                log "✓ Nginx konfigürasyonu tamamlandı"
            else
                warning "Nginx konfigürasyonunda hata var"
            fi
        fi
    else
        warning "Nginx bulunamadı, atlandı"
    fi
}

# Cron işlerini kur
setup_cron() {
    if confirm "Otomatik yedekleme ve bakım işleri kurulsun mu?"; then
        log "Cron işleri kuruluyor..."
        
        # Mevcut crontab'ı yedekle
        crontab -l > /tmp/crontab_backup 2>/dev/null || true
        
        # Yeni cron işlerini ekle
        cat >> /tmp/new_crontab << EOF

# İş Takip Sistemi - Otomatik İşlemler
0 2 * * * $APP_DIR/scripts/backup.sh >> /var/log/is-takip-sistemi/backup_cron.log 2>&1
0 5 * * 0 $APP_DIR/scripts/maintenance.sh >> /var/log/is-takip-sistemi/maintenance_cron.log 2>&1
0 1 * * * find /var/log/is-takip-sistemi -name "*.log" -mtime +30 -delete 2>/dev/null
EOF
        
        # Mevcut crontab ile birleştir
        cat /tmp/crontab_backup /tmp/new_crontab | crontab -
        
        # Geçici dosyaları temizle
        rm -f /tmp/crontab_backup /tmp/new_crontab
        
        log "✓ Cron işleri kuruldu"
    fi
}

# Kurulum sonrası kontroller
post_install_checks() {
    log "Kurulum sonrası kontroller yapılıyor..."
    
    # PM2 durumu
    if pm2 list | grep -q "is-takip-sistemi"; then
        log "✓ PM2 uygulaması çalışıyor"
    else
        error "PM2 uygulaması çalışmıyor"
    fi
    
    # Web uygulaması erişilebilirlik
    sleep 5  # Uygulamanın başlamasını bekle
    if curl -f -s "http://localhost:$PORT" >/dev/null 2>&1; then
        log "✓ Web uygulaması erişilebilir"
    else
        warning "Web uygulamasına erişilemiyor, PM2 loglarını kontrol edin"
    fi
    
    # Veritabanı bağlantısı
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT COUNT(*) FROM users;" >/dev/null 2>&1; then
        log "✓ Veritabanı bağlantısı çalışıyor"
    else
        warning "Veritabanı bağlantısı problemi var"
    fi
    
    # Dosya upload dizini
    if [ -w "$APP_DIR/public/uploads" ]; then
        log "✓ Upload dizini yazılabilir"
    else
        warning "Upload dizinine yazma izni yok"
    fi
    
    log "✓ Kurulum sonrası kontroller tamamlandı"
}

# Kurulum özetini göster
show_summary() {
    echo
    echo -e "${GREEN}=========================================="
    echo "   KURULUM BAŞARIYLA TAMAMLANDI! 🎉"
    echo -e "==========================================${NC}"
    echo
    echo -e "${BLUE}Sistem Bilgileri:${NC}"
    echo "• Uygulama Dizini: $APP_DIR"
    echo "• Veritabanı: $DB_HOST:$DB_PORT/$DB_NAME"
    echo "• Web Adresi: http://$DOMAIN:$PORT"
    echo "• PM2 Uygulama: is-takip-sistemi"
    echo
    echo -e "${BLUE}Test Kullanıcıları:${NC}"
    echo "• Admin: epoyraz / epoyraz43"
    echo "• Kullanıcı: ismail / 123"
    echo "• Kullanıcı: köroğlu / 123"
    echo
    echo -e "${BLUE}Yararlı Komutlar:${NC}"
    echo "• PM2 durumu: pm2 status"
    echo "• PM2 logları: pm2 logs is-takip-sistemi"
    echo "• Yedek alma: $APP_DIR/scripts/backup.sh"
    echo "• Sistem bakımı: $APP_DIR/scripts/maintenance.sh"
    echo
    echo -e "${BLUE}Log Dosyaları:${NC}"
    echo "• Uygulama: /var/log/is-takip-sistemi/"
    echo "• PM2: pm2 logs"
    echo "• Nginx: /var/log/nginx/"
    echo
    echo -e "${YELLOW}Sonraki Adımlar:${NC}"
    echo "1. http://$DOMAIN:$PORT adresinden sisteme giriş yapın"
    echo "2. SSL sertifikası için certbot kurulumunu yapın"
    echo "3. Firewall ayarlarını kontrol edin"
    echo "4. Yedekleme stratejinizi planlayın"
    echo
}

# Ana kurulum fonksiyonu
main() {
    show_logo
    
    # Root kontrolü
    if [ "$EUID" -eq 0 ]; then
        error "Bu script root kullanıcısıyla çalıştırılmamalıdır!"
    fi
    
    log "İş Takip Sistemi kurulum wizard'ına hoş geldiniz!"
    echo
    
    if ! confirm "Kuruluma devam etmek istiyor musunuz?"; then
        log "Kurulum iptal edildi."
        exit 0
    fi
    
    check_requirements
    get_configuration
    
    echo
    log "Kurulum başlatılıyor..."
    echo
    
    create_directories
    copy_project_files  
    create_env_file
    install_dependencies
    setup_database
    build_application
    setup_pm2
    setup_nginx
    setup_cron
    post_install_checks
    
    show_summary
    
    log "Kurulum tamamlandı! Sisteminiz kulıma hazır. 🚀"
}

# Script'i çalıştır
main "$@"