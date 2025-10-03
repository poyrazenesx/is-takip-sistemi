import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('Login API çağrıldı');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { username, password } = body;

    if (!username || !password) {
      console.log('Kullanıcı adı veya şifre eksik');
      return NextResponse.json(
        { error: 'Kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      );
    }

    try {
      // Veritabanından kullanıcıyı bul
      const user = await DatabaseService.getUserByUsername(username);

      if (user && user.password === password) {
        console.log('Giriş başarılı:', user.name);
        return NextResponse.json({ 
          success: true, 
          user: { ...user, password: '' },
          message: 'Giriş başarılı' 
        });
      } else {
        console.log('Giriş başarısız');
        return NextResponse.json(
          { error: 'Geçersiz kullanıcı adı veya şifre' },
          { status: 401 }
        );
      }
    } catch (dbError) {
      console.error('Veritabanı bağlantı hatası:', dbError);
      
      // Fallback: Local users (geliştirme için)
      const localUsers = [
        { id: 1, username: 'epoyraz', password: 'epoyraz43', name: 'Enes Poyraz', role: 'admin' },
        { id: 2, username: 'ismail', password: '123', name: 'İsmail Arslan', role: 'member' },
        { id: 3, username: 'köroğlu', password: '123', name: 'Ali Köroğlu', role: 'member' },
        { id: 4, username: 'serkan', password: '123', name: 'Serkan Özil', role: 'member' }
      ];

      const localUser = localUsers.find(u => u.username === username && u.password === password);

      if (localUser) {
        console.log('Local giriş başarılı:', localUser.name);
        return NextResponse.json({ 
          success: true, 
          user: { ...localUser, password: '' },
          message: 'Giriş başarılı (Local)' 
        });
      } else {
        return NextResponse.json(
          { error: 'Geçersiz kullanıcı adı veya şifre' },
          { status: 401 }
        );
      }
    }
  } catch (error) {
    console.error('Login API hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası: ' + error },
      { status: 500 }
    );
  }
}
