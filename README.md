# İş Takip Sistemi

Modern ve kullanıcı dostu bir ekip iş takip uygulaması. Tavşanlı Doç.Dr.Mustafa KALEMLİ Devlet Hastanesi - BİLGİ İŞLEM BİRİMİ için geliştirilmiş olan bu uygulama, 3 kişilik ekipler için kullanıcı girişi, görev yönetimi ve işbirliği özellikleri sunar.

🌐 **Live Demo:** https://is-takip-sistemi.vercel.app

## Özellikler

- 🔐 **Güvenli Giriş Sistemi** - Kullanıcı adı ve şifre ile giriş
- 📋 **Görev Yönetimi** - Görev ekleme, düzenleme, silme ve durum takibi
- 👥 **Ekip İşbirliği** - Görevleri ekip üyelerine atama
- 📊 **Dashboard** - Proje durumu ve istatistikleri
- 🎨 **Modern Arayüz** - Responsive ve kullanıcı dostu tasarım
- ⚡ **Gerçek Zamanlı** - Anlık güncellemeler

## Test Kullanıcıları

Uygulamayı test etmek için aşağıdaki kullanıcıları kullanabilirsiniz:

- **ahmet** / 123456 (Admin)
- **fatma** / 123456 (Üye)  
- **mehmet** / 123456 (Üye)

## Kurulum

1. Gereksinimler:
   - Node.js 18+ 
   - npm veya yarn

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

4. Tarayıcınızda açın: [http://localhost:3000](http://localhost:3000)

## Kullanım

1. **Giriş Yapın**: Test kullanıcılarından birini kullanarak giriş yapın
2. **Dashboard**: Görev istatistiklerini ve genel durumu görün
3. **Görev Ekleme**: "Yeni Görev" butonuna tıklayarak görev ekleyin
4. **Görev Yönetimi**: Görevleri düzenleyin, durumunu değiştirin veya silin
5. **Ekip İşbirliği**: Görevleri farklı ekip üyelerine atayın

## Teknolojiler

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **bcryptjs** - Password hashing
- **js-cookie** - Cookie management

## Proje Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   └── tasks/         # Task management endpoints
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard
│   └── LoginForm.tsx      # Login form
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication context
├── lib/                   # Utility libraries
│   └── data.ts           # Data management
└── types/                # TypeScript types
    └── index.ts          # Type definitions
```

## Güvenlik

- Şifreler bcrypt ile hash'lenir
- Oturum bilgileri çerezlerde saklanır
- API endpoint'leri doğrulama yapar

## Geliştirme

Bu proje modern web geliştirme standartlarını takip eder:

- TypeScript ile tip güvenliği
- ESLint ile kod kalitesi
- Responsive tasarım
- Component-based architecture
- RESTful API design

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
