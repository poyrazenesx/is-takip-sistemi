import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Supabase bağlantı testi başlıyor...');
    
    // Basit bir test sorgusu
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase bağlantı hatası:', error);
      return NextResponse.json({
        success: false,
        error: 'Veritabanı bağlantı hatası: ' + (error instanceof Error ? error.message : String(error)),
        details: error
      }, { status: 500 });
    }

    console.log('Supabase bağlantı başarılı:', data);
    
    // Kullanıcıları da test et
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, name')
      .limit(5);

    if (usersError) {
      console.error('Kullanıcılar sorgu hatası:', usersError);
      return NextResponse.json({
        success: false,
        error: 'Kullanıcılar sorgulanamadı: ' + (usersError?.message || String(usersError))
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Veritabanı bağlantısı başarılı!',
      users: users,
      userCount: users?.length || 0,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasApiKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    });

  } catch (error) {
    console.error('Test hatası:', error);
    return NextResponse.json({
      success: false,
      error: 'Beklenmeyen hata: ' + error,
      envCheck: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
      }
    }, { status: 500 });
  }
}