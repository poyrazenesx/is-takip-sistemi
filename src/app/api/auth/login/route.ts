import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

// Vercel dynamic server için gerekli config
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Login API çağrıldı');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      );
    }

    // Fallback kullanıcılar (Supabase çalışmazsa)
    const fallbackUsers = [
      { id: 1, username: 'admin', password: 'admin123', name: 'System Admin', role: 'admin' },
      { id: 2, username: 'user1', password: 'user123', name: 'User One', role: 'member' },
      { id: 3, username: 'user2', password: 'user123', name: 'User Two', role: 'member' },
      { id: 4, username: 'serkan', password: '123', name: 'Serkan Özil', role: 'member' }
    ];

    try {
      // Önce Supabase'i dene
      const user = await DatabaseService.getUserByUsername(username);
      if (user && user.password === password) {
        console.log('✅ Supabase giriş başarılı:', user.name);
        return NextResponse.json({ 
          success: true, 
          user: { ...user, password: '' },
          message: 'Giriş başarılı' 
        });
      }
    } catch (dbError) {
      console.error('Supabase hatası, fallback kullanılıyor:', dbError);
    }

    // Fallback authentication
    const localUser = fallbackUsers.find(u => u.username === username && u.password === password);
    
    if (localUser) {
      console.log('✅ Fallback giriş başarılı:', localUser.name);
      return NextResponse.json({ 
        success: true, 
        user: { ...localUser, password: '' },
        message: 'Giriş başarılı' 
      });
    }

    console.log('❌ Giriş başarısız');
    return NextResponse.json(
      { error: 'Kullanıcı adı veya şifre yanlış' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Login API hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}