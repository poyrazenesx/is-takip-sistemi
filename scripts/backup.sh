#!/bin/bash

# =======================================================
# İŞ TAKİP SİSTEMİ - YEDEKLİ BACKUP SCRIPT'İ
# Tavşanlı Doç.Dr.Mustafa KALEMLİ Devlet Hastanesi
# Bilgi İşlem Birimi - 2025
# =======================================================

set -e  # Hata durumunda çık

# Konfigürasyon
DB_NAME="your_database_name"
DB_USER="your_username" 
DB_HOST="localhost"
DB_PORT="5432"

APP_DIR="/path/to/your/app"
BACKUP_DIR="/backup/is-takip-sistemi"
UPLOADS_DIR="$APP_DIR/public/uploads"

# Tarih ve zaman
DATE=$(date +%Y%m%d_%H%M%S)
DAY_OF_WEEK=$(date +%u)  # 1=Pazartesi, 7=Pazar

# Log dosyası
LOG_FILE="$BACKUP_DIR/logs/backup_$DATE.log"

# Log fonksiyonu
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Hata durumu fonksiyonu
error_exit() {
    log "HATA: $1"
    exit 1
}

# Backup klasörlerini oluştur
create_backup_dirs() {
    log "Backup klasörleri kontrol ediliyor..."
    
    mkdir -p "$BACKUP_DIR"/{database,files,logs,weekly,monthly}
    
    if [ ! -w "$BACKUP_DIR" ]; then
        error_exit "Backup klasörüne yazma izni yok: $BACKUP_DIR"
    fi
    
    log "Backup klasörleri hazır ✓"
}

# Veritabanı yedeği
backup_database() {
    log "Veritabanı yedeği başlatılıyor..."
    
    local db_backup_file="$BACKUP_DIR/database/db_backup_$DATE.sql"
    
    # Veritabanı bağlantısını test et
    if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        error_exit "Veritabanına bağlanılamıyor"
    fi
    
    # Veritabanı yedeği al
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --clean --if-exists --create \
        > "$db_backup_file" 2>>"$LOG_FILE"; then
        
        # Sıkıştır
        gzip "$db_backup_file"
        log "Veritabanı yedeği tamamlandı: ${db_backup_file}.gz"
        
        # Boyut bilgisi
        local size=$(du -sh "${db_backup_file}.gz" | cut -f1)
        log "Veritabanı yedek boyutu: $size"
    else
        error_exit "Veritabanı yedeği başarısız"
    fi
}

# Dosya yedeği
backup_files() {
    log "Dosya yedeği başlatılıyor..."
    
    if [ ! -d "$UPLOADS_DIR" ]; then
        log "UYARI: Uploads klasörü bulunamadı: $UPLOADS_DIR"
        return 0
    fi
    
    local files_backup_file="$BACKUP_DIR/files/files_backup_$DATE.tar.gz"
    
    # Dosya sayısını kontrol et
    local file_count=$(find "$UPLOADS_DIR" -type f | wc -l)
    log "Yedeklenecek dosya sayısı: $file_count"
    
    if [ "$file_count" -eq 0 ]; then
        log "Yedeklenecek dosya bulunamadı"
        return 0
    fi
    
    # Dosyaları yedekle
    if tar -czf "$files_backup_file" -C "$APP_DIR" "public/uploads" 2>>"$LOG_FILE"; then
        local size=$(du -sh "$files_backup_file" | cut -f1)
        log "Dosya yedeği tamamlandı: $files_backup_file ($size)"
    else
        error_exit "Dosya yedeği başarısız"
    fi
}

# Haftalık ve aylık kopyalar
create_periodic_backups() {
    log "Periyodik yedek kopyaları oluşturuluyor..."
    
    # Haftalık yedek (Pazartesi günleri)
    if [ "$DAY_OF_WEEK" -eq 1 ]; then
        log "Haftalık yedek oluşturuluyor..."
        
        # En son veritabanı yedeğini haftalık klasöre kopyala
        local latest_db=$(ls -t "$BACKUP_DIR"/database/db_backup_*.sql.gz 2>/dev/null | head -n1)
        if [ -f "$latest_db" ]; then
            cp "$latest_db" "$BACKUP_DIR/weekly/weekly_db_$(date +%Y%m%d).sql.gz"
            log "Haftalık veritabanı yedeği oluşturuldu ✓"
        fi
        
        # En son dosya yedeğini haftalık klasöre kopyala  
        local latest_files=$(ls -t "$BACKUP_DIR"/files/files_backup_*.tar.gz 2>/dev/null | head -n1)
        if [ -f "$latest_files" ]; then
            cp "$latest_files" "$BACKUP_DIR/weekly/weekly_files_$(date +%Y%m%d).tar.gz"
            log "Haftalık dosya yedeği oluşturuldu ✓"
        fi
    fi
    
    # Aylık yedek (Ayın 1'i)
    if [ "$(date +%d)" -eq 1 ]; then
        log "Aylık yedek oluşturuluyor..."
        
        # En son veritabanı yedeğini aylık klasöre kopyala
        local latest_db=$(ls -t "$BACKUP_DIR"/database/db_backup_*.sql.gz 2>/dev/null | head -n1)
        if [ -f "$latest_db" ]; then
            cp "$latest_db" "$BACKUP_DIR/monthly/monthly_db_$(date +%Y%m).sql.gz"
            log "Aylık veritabanı yedeği oluşturuldu ✓"
        fi
        
        # En son dosya yedeğini aylık klasöre kopyala
        local latest_files=$(ls -t "$BACKUP_DIR"/files/files_backup_*.tar.gz 2>/dev/null | head -n1)
        if [ -f "$latest_files" ]; then
            cp "$latest_files" "$BACKUP_DIR/monthly/monthly_files_$(date +%Y%m).tar.gz"
            log "Aylık dosya yedeği oluşturuldu ✓"
        fi
    fi
}

# Eski yedekleri temizle
cleanup_old_backups() {
    log "Eski yedekler temizleniyor..."
    
    # 7 günden eski günlük yedekleri sil
    find "$BACKUP_DIR/database" -name "db_backup_*.sql.gz" -mtime +7 -delete 2>/dev/null || true
    find "$BACKUP_DIR/files" -name "files_backup_*.tar.gz" -mtime +7 -delete 2>/dev/null || true
    
    # 4 haftadan eski haftalık yedekleri sil  
    find "$BACKUP_DIR/weekly" -name "weekly_*" -mtime +28 -delete 2>/dev/null || true
    
    # 12 aydan eski aylık yedekleri sil
    find "$BACKUP_DIR/monthly" -name "monthly_*" -mtime +365 -delete 2>/dev/null || true
    
    # 30 günden eski log dosyalarını sil
    find "$BACKUP_DIR/logs" -name "backup_*.log" -mtime +30 -delete 2>/dev/null || true
    
    log "Eski yedekler temizlendi ✓"
}

# Sistem durumunu kontrol et
check_system_status() {
    log "Sistem durumu kontrol ediliyor..."
    
    # Disk alanı kontrolü
    local disk_usage=$(df "$BACKUP_DIR" | awk 'NR==2 {print $5}' | tr -d '%')
    log "Backup disk kullanımı: %$disk_usage"
    
    if [ "$disk_usage" -gt 90 ]; then
        log "UYARI: Disk alanı %90'ın üzerinde!"
    fi
    
    # PM2 durumu
    if command -v pm2 >/dev/null 2>&1; then
        local pm2_status=$(pm2 list | grep -c "online" || echo "0")
        log "PM2 aktif process sayısı: $pm2_status"
    fi
    
    # Veritabanı boyutu
    local db_size=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | xargs || echo "Bilinmiyor")
    log "Veritabanı boyutu: $db_size"
    
    # Upload klasörü boyutu
    if [ -d "$UPLOADS_DIR" ]; then
        local upload_size=$(du -sh "$UPLOADS_DIR" 2>/dev/null | cut -f1 || echo "Bilinmiyor")
        log "Upload klasörü boyutu: $upload_size"
    fi
}

# Backup özeti oluştur
create_backup_summary() {
    log "Backup özeti oluşturuluyor..."
    
    local summary_file="$BACKUP_DIR/backup_summary_$DATE.txt"
    
    cat > "$summary_file" << EOF
========================================
İŞ TAKİP SİSTEMİ BACKUP ÖZETİ
========================================
Tarih: $(date '+%d.%m.%Y %H:%M:%S')
Backup ID: $DATE

Veritabanı Yedeği:
$(ls -lh "$BACKUP_DIR/database/db_backup_${DATE}.sql.gz" 2>/dev/null || echo "Bulunamadı")

Dosya Yedeği:  
$(ls -lh "$BACKUP_DIR/files/files_backup_${DATE}.tar.gz" 2>/dev/null || echo "Bulunamadı")

Sistem Durumu:
- Veritabanı: $(pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1 && echo "Bağlı" || echo "Bağlantı Yok")
- PM2 Durum: $(command -v pm2 >/dev/null 2>&1 && pm2 list --no-color | grep -c "online" || echo "PM2 Yok") aktif process

Backup Klasör Boyutları:
$(du -sh "$BACKUP_DIR"/* 2>/dev/null)

========================================
Backup tamamlandı.
========================================
EOF

    log "Backup özeti oluşturuldu: $summary_file"
}

# Ana fonksiyon
main() {
    log "=========================================="
    log "İŞ TAKİP SİSTEMİ BACKUP BAŞLADI"
    log "=========================================="
    
    create_backup_dirs
    backup_database
    backup_files
    create_periodic_backups
    cleanup_old_backups
    check_system_status
    create_backup_summary
    
    log "=========================================="
    log "BACKUP BAŞARIYLA TAMAMLANDI"
    log "=========================================="
}

# Script'i çalıştır
main "$@"