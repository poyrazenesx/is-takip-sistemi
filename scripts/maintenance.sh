#!/bin/bash

# =======================================================
# İŞ TAKİP SİSTEMİ - SİSTEM BAKIM SCRIPT'İ  
# Tavşanlı Doç.Dr.Mustafa KALEMLİ Devlet Hastanesi
# Bilgi İşlem Birimi - 2025
# =======================================================

set -e

# Konfigürasyon
DB_NAME="your_database_name"
DB_USER="your_username"
DB_HOST="localhost" 
DB_PORT="5432"

APP_DIR="/path/to/your/app"
UPLOADS_DIR="$APP_DIR/public/uploads"
LOG_DIR="/var/log/is-takip-sistemi"

# Log dosyası
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/maintenance_$DATE.log"

# Log fonksiyonu
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Log klasörü oluştur
mkdir -p "$LOG_DIR"

# =======================================================
# 1. VERİTABANI BAKIM İŞLEMLERİ
# =======================================================

database_maintenance() {
    log "=========================================="
    log "VERİTABANI BAKIM İŞLEMLERİ BAŞLATILIYOR"
    log "=========================================="
    
    # Veritabanı bağlantısını test et
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        log "HATA: Veritabanına bağlanılamıyor"
        return 1
    fi
    
    # İstatistikleri güncelle
    log "Veritabanı istatistikleri güncelleniyor..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "ANALYZE;" 2>>"$LOG_FILE"
    
    # Vacuum işlemi
    log "Vacuum işlemi başlatılıyor..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "VACUUM;" 2>>"$LOG_FILE"
    
    # Eski audit kayıtlarını temizle (90 günden eski)
    log "Eski audit kayıtları temizleniyor..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        DELETE FROM audit_logs 
        WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
    " 2>>"$LOG_FILE" || log "UYARI: Audit logs tablosu bulunamadı"
    
    # Veritabanı boyut raporu
    log "Veritabanı boyut raporu:"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10;
    " 2>>"$LOG_FILE" | tee -a "$LOG_FILE"
    
    log "Veritabanı bakımı tamamlandı ✓"
}

# =======================================================
# 2. DOSYA SİSTEMİ BAKIM İŞLEMLERİ
# =======================================================

filesystem_maintenance() {
    log "=========================================="
    log "DOSYA SİSTEMİ BAKIM İŞLEMLERİ BAŞLATILIYOR" 
    log "=========================================="
    
    if [ ! -d "$UPLOADS_DIR" ]; then
        log "UYARI: Uploads klasörü bulunamadı: $UPLOADS_DIR"
        return 0
    fi
    
    # Boş klasörleri temizle
    log "Boş klasörler temizleniyor..."
    find "$UPLOADS_DIR" -type d -empty -delete 2>/dev/null || true
    
    # Yetim dosyaları bul (veritabanında kaydı olmayan)
    log "Yetim dosyalar kontrol ediliyor..."
    if command -v psql >/dev/null 2>&1; then
        # Geçici dosya oluştur
        local temp_file="/tmp/orphaned_files_$DATE.txt"
        
        # Tüm dosyaları listele
        find "$UPLOADS_DIR" -type f -name "*.*" | sed "s|$UPLOADS_DIR/||" > "$temp_file"
        
        # Veritabanından kayıtlı dosyaları al ve karşılaştır
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
            SELECT file_path FROM attachments WHERE file_path IS NOT NULL;
        " 2>/dev/null | sed 's/^[[:space:]]*//' | grep -v "^$" > "${temp_file}.db" || true
        
        # Fark dosyalarını bul
        if [ -f "${temp_file}.db" ]; then
            local orphaned_count=$(comm -23 <(sort "$temp_file") <(sort "${temp_file}.db") | wc -l)
            log "Yetim dosya sayısı: $orphaned_count"
            
            # Yetim dosyaları listele (sadece ilk 10'u)
            if [ "$orphaned_count" -gt 0 ]; then
                log "İlk 10 yetim dosya:"
                comm -23 <(sort "$temp_file") <(sort "${temp_file}.db") | head -10 | while read file; do
                    log "  - $file"
                done
            fi
        fi
        
        # Geçici dosyaları temizle
        rm -f "$temp_file" "${temp_file}.db" 2>/dev/null || true
    fi
    
    # Dosya boyut raporu
    log "Dosya boyut raporu:"
    log "  Toplam boyut: $(du -sh "$UPLOADS_DIR" | cut -f1)"
    log "  Dosya sayısı: $(find "$UPLOADS_DIR" -type f | wc -l)"
    log "  Klasör sayısı: $(find "$UPLOADS_DIR" -type d | wc -l)"
    
    # Büyük dosyaları listele (10MB+)
    log "Büyük dosyalar (10MB+):"
    find "$UPLOADS_DIR" -type f -size +10M -exec ls -lh {} \; 2>/dev/null | head -5 | while read line; do
        log "  $line"
    done
    
    log "Dosya sistemi bakımı tamamlandı ✓"
}

# =======================================================
# 3. LOG DOSYASI BAKIM İŞLEMLERİ
# =======================================================

log_maintenance() {
    log "=========================================="
    log "LOG DOSYASI BAKIM İŞLEMLERİ BAŞLATILIYOR"
    log "=========================================="
    
    # PM2 loglarını temizle
    if command -v pm2 >/dev/null 2>&1; then
        log "PM2 logları temizleniyor..."
        pm2 flush 2>>"$LOG_FILE" || log "UYARI: PM2 log temizleme başarısız"
    fi
    
    # Nginx loglarını sıkıştır (7 günden eski)
    if [ -d "/var/log/nginx" ]; then
        log "Nginx logları sıkıştırılıyor..."
        find /var/log/nginx -name "*.log" -mtime +7 ! -name "*.gz" -exec gzip {} \; 2>/dev/null || true
    fi
    
    # Sistem log dosyalarını kontrol et
    log "Sistem log boyutları:"
    for logfile in /var/log/syslog /var/log/auth.log /var/log/nginx/access.log; do
        if [ -f "$logfile" ]; then
            local size=$(du -sh "$logfile" 2>/dev/null | cut -f1 || echo "0")
            log "  $logfile: $size"
        fi
    done
    
    # Uygulama log dosyalarını temizle (30 günden eski)
    log "Eski uygulama logları temizleniyor..."
    find "$LOG_DIR" -name "*.log" -mtime +30 -delete 2>/dev/null || true
    
    log "Log bakımı tamamlandı ✓"
}

# =======================================================
# 4. SİSTEM PERFORMANS KONTROLÜ
# =======================================================

performance_check() {
    log "=========================================="
    log "SİSTEM PERFORMANS KONTROLÜ BAŞLATILIYOR"
    log "=========================================="
    
    # CPU kullanımı
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    log "CPU kullanımı: %${cpu_usage}"
    
    # RAM kullanımı
    local ram_info=$(free -h | awk 'NR==2{printf "Kullanılan: %s/%s (%.2f%%)", $3,$2,$3*100/$2 }')
    log "RAM kullanımı: $ram_info"
    
    # Disk kullanımı
    log "Disk kullanımı:"
    df -h | grep -E "^/dev" | while read line; do
        log "  $line"
    done
    
    # Network bağlantıları
    local tcp_connections=$(netstat -tn 2>/dev/null | grep :3000 | wc -l || echo "0")
    log "Aktif TCP bağlantıları (port 3000): $tcp_connections"
    
    # Sistem yük ortalaması
    local load_avg=$(uptime | awk -F'load average:' '{print $2}')
    log "Sistem yük ortalaması:$load_avg"
    
    # PM2 process durumu
    if command -v pm2 >/dev/null 2>&1; then
        log "PM2 process durumu:"
        pm2 list --no-color 2>>"$LOG_FILE" | tee -a "$LOG_FILE"
    fi
    
    log "Performans kontrolü tamamlandı ✓"
}

# =======================================================
# 5. GÜVENLİK KONTROLÜ
# =======================================================

security_check() {
    log "=========================================="
    log "GÜVENLİK KONTROLÜ BAŞLATILIYOR"
    log "=========================================="
    
    # Dosya izinlerini kontrol et
    log "Kritik dosya izinleri kontrol ediliyor..."
    
    local files_to_check=(
        "$APP_DIR/.env.local:600"
        "$UPLOADS_DIR:755"
        "$APP_DIR/package.json:644"
    )
    
    for file_perm in "${files_to_check[@]}"; do
        local file=$(echo "$file_perm" | cut -d: -f1)
        local expected_perm=$(echo "$file_perm" | cut -d: -f2)
        
        if [ -e "$file" ]; then
            local current_perm=$(stat -c "%a" "$file" 2>/dev/null || echo "000")
            if [ "$current_perm" != "$expected_perm" ]; then
                log "UYARI: $file izinleri beklenen ($expected_perm) değil (şu an: $current_perm)"
            else
                log "✓ $file izinleri doğru ($current_perm)"
            fi
        else
            log "UYARI: $file bulunamadı"
        fi
    done
    
    # Son başarısız login denemelerini kontrol et
    log "Son başarısız login denemeleri:"
    if [ -f "/var/log/auth.log" ]; then
        grep "Failed password" /var/log/auth.log | tail -5 | while read line; do
            log "  $line"
        done 2>/dev/null || log "  Kayıt bulunamadı"
    fi
    
    # Açık portları kontrol et
    log "Açık portlar:"
    netstat -tlnp 2>/dev/null | grep -E ":(80|443|3000|5432)" | while read line; do
        log "  $line"
    done
    
    log "Güvenlik kontrolü tamamlandı ✓"
}

# =======================================================
# 6. SAĞLIK KONTROL VE RAPOR
# =======================================================

health_check() {
    log "=========================================="
    log "SAĞLIK KONTROLÜ BAŞLATILIYOR"
    log "=========================================="
    
    local errors=0
    local warnings=0
    
    # Veritabanı bağlantısı
    if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        log "❌ Veritabanı bağlantısı başarısız"
        ((errors++))
    else
        log "✅ Veritabanı bağlantısı başarılı"
    fi
    
    # Web aplikasyon durumu
    if command -v curl >/dev/null 2>&1; then
        if curl -f -s "http://localhost:3000" >/dev/null 2>&1; then
            log "✅ Web aplikasyonu çalışıyor"
        else
            log "❌ Web aplikasyonu erişilebilir değil"
            ((errors++))
        fi
    fi
    
    # Disk alanı kontrolü
    local disk_usage=$(df "$APP_DIR" | awk 'NR==2 {print $5}' | tr -d '%')
    if [ "$disk_usage" -gt 90 ]; then
        log "❌ Disk alanı kritik seviyede (%$disk_usage)"
        ((errors++))
    elif [ "$disk_usage" -gt 80 ]; then
        log "⚠️  Disk alanı yüksek (%$disk_usage)"
        ((warnings++))
    else
        log "✅ Disk alanı normal (%$disk_usage)"
    fi
    
    # RAM kullanımı kontrolü
    local ram_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$ram_usage" -gt 90 ]; then
        log "❌ RAM kullanımı kritik seviyede (%$ram_usage)"
        ((errors++))
    elif [ "$ram_usage" -gt 80 ]; then
        log "⚠️  RAM kullanımı yüksek (%$ram_usage)"
        ((warnings++))
    else
        log "✅ RAM kullanımı normal (%$ram_usage)"
    fi
    
    # Sonuç özeti
    log "=========================================="
    log "SAĞLIK KONTROL ÖZETİ"
    log "=========================================="
    log "Hata sayısı: $errors"
    log "Uyarı sayısı: $warnings"
    
    if [ "$errors" -eq 0 ] && [ "$warnings" -eq 0 ]; then
        log "🎉 Sistem tamamen sağlıklı!"
    elif [ "$errors" -eq 0 ]; then
        log "⚠️  Sistem çalışıyor, bazı uyarılar var"
    else
        log "🚨 Sistem kritik hatalar içeriyor!"
    fi
}

# =======================================================
# ANA FONKSİYON
# =======================================================

main() {
    log "=========================================="
    log "İŞ TAKİP SİSTEMİ BAKIM BAŞLADI"
    log "Tarih: $(date '+%d.%m.%Y %H:%M:%S')"
    log "=========================================="
    
    # Bakım işlemlerini çalıştır
    database_maintenance
    filesystem_maintenance  
    log_maintenance
    performance_check
    security_check
    health_check
    
    log "=========================================="
    log "BAKIM İŞLEMLERİ BAŞARIYLA TAMAMLANDI"
    log "Toplam süre: $(( $(date +%s) - $(date -d "1 hour ago" +%s) )) saniye"
    log "=========================================="
    
    # Özet raporu oluştur
    local summary_file="$LOG_DIR/maintenance_summary_$DATE.txt"
    cp "$LOG_FILE" "$summary_file"
    
    log "Detaylı rapor: $summary_file"
}

# Script'i çalıştır
main "$@"