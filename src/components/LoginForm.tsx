'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (!success) {
        setError('Geçersiz kullanıcı adı veya şifre');
      }
    } catch (err) {
      setError('Giriş yapılırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <link 
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" 
        rel="stylesheet" 
        integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" 
        crossOrigin="anonymous"
      />
      
      <style jsx>{`
        .login-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 50%, #1a365d 100%);
          position: relative;
          overflow: hidden;
          transition: all 0.5s ease;
        }
        

        
        .login-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><polygon fill="%23ffffff08" points="0,1000 1000,0 1000,1000"/></svg>');
          z-index: 1;
        }
        
        .login-card {
          background: rgba(255, 255, 255, 0.98) !important;
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          position: relative;
          transition: all 0.5s ease;
        }
        

        
        .logo-container {
          background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .form-control {
          border: 2px solid #e9ecef !important;
          border-radius: 15px !important;
          padding: 15px 20px !important;
          font-size: 16px !important;
          background: white !important;
          color: #495057 !important;
          transition: all 0.3s ease !important;
          pointer-events: auto !important;
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          user-select: text !important;
          position: relative !important;
          z-index: 1000 !important;
          cursor: text !important;
          touch-action: manipulation !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          appearance: none !important;
        }
        

        
        .form-control[type="text"], 
        .form-control[type="password"] {
          pointer-events: auto !important;
          cursor: text !important;
          -webkit-user-select: text !important;
          user-select: text !important;
          background-color: white !important;
        }
        

        
        .form-control::placeholder {
          color: #6c757d !important;
          opacity: 0.7;
        }
        

        
        .form-control:focus {
          border-color: #1e3a5f !important;
          box-shadow: 0 0 0 0.25rem rgba(30, 58, 95, 0.25) !important;
          background: white !important;
          color: #495057 !important;
          outline: none !important;
          pointer-events: auto !important;
        }
        

        
        .form-control:hover {
          background: white !important;
          border-color: #667eea !important;
        }
        
        .form-control:active {
          pointer-events: auto !important;
          background: white !important;
        }
        
        .btn-login {
          background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
          border: none;
          padding: 15px 30px;
          font-size: 18px;
          font-weight: 600;
          border-radius: 15px;
          transition: all 0.3s ease;
          position: relative !important;
          overflow: hidden;
          z-index: 1000 !important;
          pointer-events: auto !important;
          cursor: pointer !important;
          color: white !important;
        }
        
        .btn-login::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }
        
        .btn-login:hover::before {
          left: 100%;
        }
        
        .btn-login:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }
        
        .form-label {
          font-weight: 600;
          color: #495057;
          margin-bottom: 10px;
          transition: color 0.3s ease;
        }
        

        
        .alert-custom {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
          color: white;
          border: none;
          border-radius: 15px;
          padding: 15px 20px;
        }
        
        .security-info {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 20px;
          padding: 25px;
          border: 1px solid rgba(102, 126, 234, 0.1);
        }
        
        .spinner-border-sm {
          width: 1.2rem;
          height: 1.2rem;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          color: transparent;
        }
        
        .feature-badge {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
        }
        
        form {
          position: relative;
          z-index: 10;
        }
        
        input, textarea, select {
          pointer-events: auto !important;
          -webkit-user-select: text !important;
          cursor: text !important;
          background: white !important;
          color: #495057 !important;
        }
        

        
        /* Input focus sorunlarını çöz */
        .login-card input:focus,
        .login-card input:active {
          pointer-events: auto !important;
          cursor: text !important;
        }
        

        
        .card-title {
          color: #495057;
          transition: color 0.3s ease;
        }
        

        
        .text-muted {
          color: #6c757d !important;
        }
        

          -moz-user-select: text !important;
          user-select: text !important;
          cursor: text !important;
          outline: none !important;
          touch-action: manipulation !important;
          -webkit-tap-highlight-color: transparent !important;
        }
        
        input:focus, textarea:focus, input:active, textarea:active {
          pointer-events: auto !important;
          cursor: text !important;
          outline: none !important;
        }
        
        .login-card {
          pointer-events: auto !important;
        }
        
        .login-card * {
          pointer-events: auto !important;
        }
      `}</style>

      <div className="login-container d-flex align-items-center justify-content-center">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-6 col-lg-5">
              <div className="login-card rounded-4 p-5">
                
                {/* Logo ve Başlık */}
                <div className="text-center mb-5">
                  <div className="logo-container d-inline-flex align-items-center justify-content-center rounded-4 p-3 mb-4">
                    <LogIn className="text-white" size={32} />
                  </div>
                  <h2 className="gradient-text fw-bold mb-3">İş Takip Sistemi</h2>
                  <h5 className="text-muted mb-2">Hastane Bilgi İşlem Sistemi</h5>
                  <p className="text-muted small">BİLGİ İŞLEM BİRİMİ</p>
                </div>

                {/* Giriş Formu */}
                <form onSubmit={handleSubmit}>
                  
                  {/* Hata Mesajı */}
                  {error && (
                    <div className="alert alert-custom mb-4" role="alert">
                      <div className="d-flex align-items-center">
                        <div className="me-2">⚠️</div>
                        <span>{error}</span>
                      </div>
                    </div>
                  )}

                  {/* Kullanıcı Adı */}
                  <div className="mb-4">
                    <label htmlFor="username" className="form-label">
                      👤 Kullanıcı Adı
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="username"
                      name="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Kullanıcı adınızı girin"
                      required
                      autoComplete="username"
                      autoFocus
                      style={{
                        pointerEvents: 'auto',
                        cursor: 'text',
                        userSelect: 'text',
                        WebkitUserSelect: 'text',
                        MozUserSelect: 'text',
                        touchAction: 'manipulation',
                        zIndex: 1001,
                        position: 'relative'
                      }}
                    />
                  </div>

                  {/* Şifre */}
                  <div className="mb-4">
                    <label htmlFor="password" className="form-label">
                      🔐 Şifre
                    </label>
                    <div className="position-relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control form-control-lg"
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Şifrenizi girin"
                        required
                        autoComplete="current-password"
                        style={{
                          pointerEvents: 'auto',
                          cursor: 'text',
                          userSelect: 'text',
                          WebkitUserSelect: 'text',
                          MozUserSelect: 'text',
                          touchAction: 'manipulation',
                          zIndex: 1001,
                          position: 'relative',
                          paddingRight: '50px'
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y me-3"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ 
                          zIndex: 1002, 
                          border: 'none',
                          background: 'transparent',
                          color: '#6c757d'
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Giriş Butonu */}
                  <div className="d-grid mb-4">
                    <button
                      type="submit"
                      className="btn btn-login text-white position-relative"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Giriş yapılıyor...
                        </>
                      ) : (
                        <>
                          <LogIn className="me-2" size={20} />
                          Sisteme Giriş Yap
                        </>
                      )}
                    </button>
                  </div>

                  {/* Güvenlik Bilgisi */}
                  <div className="security-info text-center">
                    <div className="mb-3">
                      <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 rounded-circle p-2 mb-2">
                        <svg width="20" height="20" fill="currentColor" className="text-success" viewBox="0 0 16 16">
                          <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                        </svg>
                      </div>
                    </div>
                    <h6 className="fw-bold text-dark mb-3">🔒 Güvenli Giriş</h6>
                    <p className="text-muted small mb-3">
                      Ortak Çalışma Alanıdır.
                    </p>
                    
                    {/* Özellik Rozetleri */}
                    <div className="d-flex justify-content-center gap-2">
                      <span className="feature-badge">✅ Güvenli</span>
                      <span className="feature-badge">⚡ Hızlı</span>
                      <span className="feature-badge">🔒 Güvenilir</span>
                    </div>
                  </div>

                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
