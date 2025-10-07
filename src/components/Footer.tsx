'use client'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="bg-gradient-to-r from-slate-800 to-slate-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Logo ve Başlık */}
            <div>
              <h3 className="text-xl font-bold mb-4" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
                🏥 Hastane Yönetim Sistemi
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Modern hastane iş takip ve donanım yönetim sistemi. 
                Güvenilir, hızlı ve kullanıcı dostu çözümler.
              </p>
            </div>

            {/* Hızlı Linkler */}
            <div>
              <h4 className="text-lg font-semibold mb-4" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
                Hızlı Erişim
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/" className="text-gray-300 hover:text-white transition-colors">
                    🏠 Ana Sayfa
                  </a>
                </li>
                <li>
                  <a href="/donanim" className="text-gray-300 hover:text-white transition-colors">
                    🖥️ Donanım Yönetimi
                  </a>
                </li>
                <li>
                  <a href="/tasks" className="text-gray-300 hover:text-white transition-colors">
                    📋 İş Takip
                  </a>
                </li>
                <li>
                  <a href="/notes" className="text-gray-300 hover:text-white transition-colors">
                    📝 Notlar
                  </a>
                </li>
              </ul>
            </div>

            {/* İletişim */}
            <div>
              <h4 className="text-lg font-semibold mb-4" style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}>
                Bilgi İşlem Birimi
              </h4>
              <div className="text-sm text-gray-300 space-y-2">
                <p>📞 İç Hat: 1234</p>
                <p>📧 bilgiislem@hastane.gov.tr</p>
                <p>🕒 7/24 Destek</p>
                <p className="text-xs text-gray-400 mt-4">
                  Sistem Versiyon: 2.1.0<br />
                  Son Güncelleme: {new Date().toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
          </div>

          {/* Alt Çizgi ve Copyright */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
              <div className="mb-4 md:mb-0">
                <p>© {currentYear} Hastane Yönetim Sistemi. Tüm hakları saklıdır.</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-500">Development:</span>
                <span 
                  className="text-white font-bold tracking-wider px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-xs"
                  style={{fontFamily: 'Alumni Sans, sans-serif', textTransform: 'uppercase'}}
                >
                  EP
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}