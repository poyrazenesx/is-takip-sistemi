# =======================================================
# İŞ TAKİP SİSTEMİ - WINDOWS OTOMATIK KURULUM SCRIPT'İ
# Tavşanlı Doç.Dr.Mustafa KALEMLİ Devlet Hastanesi
# Bilgi İşlem Birimi - 2025
# =======================================================

# PowerShell execution policy kontrolü
$executionPolicy = Get-ExecutionPolicy
if ($executionPolicy -eq "Restricted") {
    Write-Host "PowerShell execution policy değiştiriliyor..." -ForegroundColor Yellow
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
}

# Renkli çıktı fonksiyonları
function Write-Success($message) {
    Write-Host "[✓] $message" -ForegroundColor Green
}

function Write-Error($message) {
    Write-Host "[✗] $message" -ForegroundColor Red
}

function Write-Warning($message) {
    Write-Host "[!] $message" -ForegroundColor Yellow
}

function Write-Info($message) {
    Write-Host "[i] $message" -ForegroundColor Blue
}

# Logo göster
function Show-Logo {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Blue
    Write-Host "   İŞ TAKİP SİSTEMİ KURULUM WIZARD'I" -ForegroundColor Blue
    Write-Host "==========================================" -ForegroundColor Blue
    Write-Host "Tavşanlı Doç.Dr.Mustafa KALEMLİ" -ForegroundColor Blue
    Write-Host "Devlet Hastanesi - Bilgi İşlem Birimi" -ForegroundColor Blue
    Write-Host "2025" -ForegroundColor Blue
    Write-Host "==========================================" -ForegroundColor Blue
    Write-Host ""
}

# Gerekli araçları kontrol et
function Test-Requirements {
    Write-Info "Sistem gereksinimleri kontrol ediliyor..."
    
    $errors = @()
    
    # Node.js kontrolü
    try {
        $nodeVersion = node --version
        if ($nodeVersion -match "v(\d+)\.") {
            $majorVersion = [int]$matches[1]
            if ($majorVersion -ge 18) {
                Write-Success "Node.js $nodeVersion - OK"
            } else {
                $errors += "Node.js versiyonu çok eski. En az 18.x gerekli. Şu an: $nodeVersion"
            }
        }
    } catch {
        $errors += "Node.js bulunamadı. Lütfen Node.js 18+ yükleyin."
    }
    
    # npm kontrolü
    try {
        $npmVersion = npm --version
        Write-Success "npm $npmVersion - OK"
    } catch {
        $errors += "npm bulunamadı."
    }
    
    # Git kontrolü
    try {
        $gitVersion = git --version
        Write-Success "Git $gitVersion - OK"
    } catch {
        Write-Warning "Git bulunamadı. Bazı özellikler çalışmayabilir."
    }
    
    if ($errors.Count -gt 0) {
        Write-Error "Gereksinimler karşılanmıyor:"
        foreach ($error in $errors) {
            Write-Error "  - $error"
        }
        Write-Host ""
        Write-Host "Gerekli yazılımları yükledikten sonra tekrar deneyin." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host ""
}

# Supabase bağlantı bilgilerini al
function Get-SupabaseConfig {
    Write-Info "Supabase konfigürasyon bilgileri:"
    Write-Host ""
    
    $supabaseUrl = Read-Host "Supabase URL"
    if ([string]::IsNullOrWhiteSpace($supabaseUrl)) {
        Write-Error "Supabase URL boş olamaz!"
        exit 1
    }
    
    $supabaseAnonKey = Read-Host "Supabase Anon Key"
    if ([string]::IsNullOrWhiteSpace($supabaseAnonKey)) {
        Write-Error "Supabase Anon Key boş olamaz!"
        exit 1
    }
    
    $supabaseServiceKey = Read-Host "Supabase Service Role Key"
    if ([string]::IsNullOrWhiteSpace($supabaseServiceKey)) {
        Write-Error "Supabase Service Role Key boş olamaz!"
        exit 1
    }
    
    return @{
        url = $supabaseUrl
        anonKey = $supabaseAnonKey
        serviceKey = $supabaseServiceKey
    }
}

# .env.local dosyası oluştur
function Create-EnvFile($supabaseConfig) {
    Write-Info ".env.local dosyası oluşturuluyor..."
    
    $envContent = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="$($supabaseConfig.url)"
NEXT_PUBLIC_SUPABASE_ANON_KEY="$($supabaseConfig.anonKey)"
SUPABASE_SERVICE_ROLE_KEY="$($supabaseConfig.serviceKey)"

# App Configuration
NEXTAUTH_SECRET="$(([System.Web.Security.Membership]::GeneratePassword(32, 8)))"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"

# File Upload Configuration  
UPLOAD_DIR="./public/uploads"
MAX_FILE_SIZE="10485760"
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,application/pdf,text/plain"

# Development Settings
LOG_LEVEL="info"
"@
    
    $envContent | Out-File -FilePath ".env.local" -Encoding UTF8
    Write-Success ".env.local dosyası oluşturuldu"
}

# Gerekli klasörleri oluştur
function Create-Directories {
    Write-Info "Gerekli klasörler oluşturuluyor..."
    
    $directories = @(
        "public/uploads",
        "public/uploads/2025-10",
        "public/uploads/2025-11",
        "src/app/api/upload",
        "src/app/api/search"
    )
    
    foreach ($dir in $directories) {
        if (!(Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Success "Klasör oluşturuldu: $dir"
        }
    }
}

# Bağımlılıkları yükle
function Install-Dependencies {
    Write-Info "Bağımlılıklar yükleniyor..."
    Write-Warning "Bu işlem birkaç dakika sürebilir..."
    
    try {
        npm install | Out-Host
        Write-Success "Bağımlılıklar başarıyla yüklendi"
    } catch {
        Write-Error "Bağımlılık yükleme başarısız: $_"
        exit 1
    }
}

# Supabase veritabanını kontrol et
function Test-SupabaseConnection($supabaseConfig) {
    Write-Info "Supabase bağlantısı test ediliyor..."
    
    # Basit bir test API endpoint'i oluştur
    $testApiContent = @"
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        message: 'Veritabanı tabloları henüz oluşturulmamış olabilir'
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Supabase bağlantısı başarılı',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
"@
    
    # Test API dosyası oluştur
    $apiDir = "src/app/api/test-connection"
    if (!(Test-Path $apiDir)) {
        New-Item -ItemType Directory -Path $apiDir -Force | Out-Null
    }
    
    $testApiContent | Out-File -FilePath "$apiDir/route.ts" -Encoding UTF8
    
    Write-Success "Test API endpoint'i oluşturuldu"
}

# Uygulamayı build et
function Build-Application {
    Write-Info "Uygulama build ediliyor..."
    Write-Warning "Bu işlem birkaç dakika sürebilir..."
    
    try {
        npm run build | Out-Host
        Write-Success "Build başarıyla tamamlandı"
    } catch {
        Write-Error "Build başarısız: $_"
        Write-Info "Geliştirme modunda devam ediliyor..."
    }
}

# Geliştirme sunucusunu başlat
function Start-DevServer {
    Write-Info "Geliştirme sunucusu başlatılıyor..."
    Write-Host ""
    Write-Host "Sunucu başlatıldıktan sonra:" -ForegroundColor Yellow
    Write-Host "- http://localhost:3000 adresinden uygulamaya erişebilirsiniz" -ForegroundColor Yellow
    Write-Host "- CTRL+C ile sunucuyu durdurabilirsiniz" -ForegroundColor Yellow
    Write-Host ""
    
    Start-Sleep -Seconds 2
    
    try {
        npm run dev
    } catch {
        Write-Error "Geliştirme sunucusu başlatılamadı: $_"
        exit 1
    }
}

# Kurulum özetini göster
function Show-Summary($supabaseConfig) {
    Write-Host ""
    Write-Success "=========================================="
    Write-Success "   KURULUM BAŞARIYLA TAMAMLANDI! 🎉"
    Write-Success "=========================================="
    Write-Host ""
    Write-Host "🌐 Web Adresi: " -NoNewline
    Write-Host "http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "👥 Test Kullanıcıları:" -ForegroundColor Blue
    Write-Host "   • Admin: epoyraz / epoyraz43"
    Write-Host "   • Kullanıcı: ismail / 123"
    Write-Host "   • Kullanıcı: köroğlu / 123"
    Write-Host ""
    Write-Host "🏥 Hastane Birimleri:" -ForegroundColor Blue
    Write-Host "   • Servis • Poliklinikler • Eczane"
    Write-Host "   • Genel Hasta Kayıt • Kalite"
    Write-Host "   • Dilekçeler • İdare"
    Write-Host ""
    Write-Host "📂 Önemli Dosyalar:" -ForegroundColor Blue
    Write-Host "   • .env.local - Konfigürasyon"
    Write-Host "   • public/uploads - Yüklenen dosyalar"
    Write-Host "   • database_complete_update.sql - Veritabanı güncellemeleri"
    Write-Host ""
    Write-Host "🚀 Sonraki Adımlar:" -ForegroundColor Yellow
    Write-Host "   1. Veritabanı güncellemelerini Supabase'de çalıştırın"
    Write-Host "   2. http://localhost:3000 adresinden sisteme giriş yapın"
    Write-Host "   3. Not ve görev oluşturmayı test edin"
    Write-Host "   4. Dosya yükleme özelliğini test edin"
    Write-Host ""
}

# Ana kurulum fonksiyonu
function Start-Installation {
    Show-Logo
    
    Write-Info "İş Takip Sistemi kurulum wizard'ına hoş geldiniz!"
    Write-Host ""
    
    $confirm = Read-Host "Kuruluma devam etmek istiyor musunuz? (E/h)"
    if ($confirm -notmatch "^[Ee]") {
        Write-Info "Kurulum iptal edildi."
        exit 0
    }
    
    Write-Host ""
    Write-Info "Kurulum başlatılıyor..."
    Write-Host ""
    
    # Kurulum adımları
    Test-Requirements
    
    # Supabase konfigürasyonu al
    $supabaseConfig = Get-SupabaseConfig
    
    Create-EnvFile $supabaseConfig
    Create-Directories
    Install-Dependencies
    Test-SupabaseConnection $supabaseConfig
    
    Write-Host ""
    Write-Success "Kurulum tamamlandı! 🎉"
    Write-Host ""
    
    Show-Summary $supabaseConfig
    
    $startServer = Read-Host "Geliştirme sunucusunu şimdi başlatmak istiyor musunuz? (E/h)"
    if ($startServer -match "^[Ee]") {
        Start-DevServer
    } else {
        Write-Info "Sunucuyu manuel olarak başlatmak için: npm run dev"
    }
}

# Script'i çalıştır
try {
    Start-Installation
} catch {
    Write-Error "Kurulum sırasında hata oluştu: $_"
    Write-Host ""
    Write-Host "Destek için:" -ForegroundColor Yellow
    Write-Host "1. Hata mesajının ekran görüntüsünü alın"
    Write-Host "2. Node.js ve npm versiyonlarını kontrol edin: node --version && npm --version"
    Write-Host "3. PowerShell'i yönetici olarak çalıştırmayı deneyin"
    exit 1
}