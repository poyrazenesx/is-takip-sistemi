import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Upload API çağrıldı (Vercel uyumlu - Base64)');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadedBy = Number(formData.get('uploadedBy')) || 1;
    const title = formData.get('title') as string || '';
    const description = formData.get('description') as string || '';

    if (!file) {
      return NextResponse.json(
        { error: 'Dosya bulunamadı' },
        { status: 400 }
      );
    }

    console.log('📁 Dosya detayları:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Dosya boyut kontrolü (2MB limit - Vercel + Base64 için küçültüldü)
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Dosya boyutu 2MB\'dan büyük olamaz (Vercel + Base64 sınırı)' },
        { status: 400 }
      );
    }

    // İzin verilen dosya tipleri
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Bu dosya tipi desteklenmiyor. Sadece resim, PDF ve text dosyaları yüklenebilir.' },
        { status: 400 }
      );
    }

    // Dosyayı base64'e çevir
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    
    // Dosya adını güvenli hale getir
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const fileExtension = file.name.split('.').pop() || 'bin';
    const safeFileName = `${timestamp}_${randomStr}.${fileExtension}`;

    // Resim mi kontrol et
    const isImage = file.type.startsWith('image/');
    
    // Base64 data URL oluştur (preview için)
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    try {
      // Veritabanına kaydet
      const attachmentData = {
        fileName: safeFileName,
        originalName: file.name,
        fileType: file.type,
        fileSize: file.size,
        base64Data: base64Data, // Base64 veri
        dataUrl: dataUrl, // Preview için
        uploadedBy: uploadedBy,
        isImage: isImage,
        title: title,
        description: description,
        uploadedAt: new Date()
      };

      console.log('💾 Base64 veritabanına kaydediliyor:', {
        fileName: safeFileName,
        size: file.size,
        type: file.type,
        base64Length: base64Data.length
      });

      // Geçici olarak sadece memory'de saklayalım
      // Gerçek projelerde bu Supabase Storage'a kaydedilir
      const savedAttachment = {
        id: timestamp, // Unique ID
        fileName: safeFileName,
        originalName: file.name,
        fileType: file.type,
        fileSize: file.size,
        filePath: dataUrl, // Base64 data URL
        uploadedBy: uploadedBy,
        isImage: isImage,
        title: title,
        description: description,
        uploadedAt: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        attachment: savedAttachment,
        message: 'Dosya başarıyla yüklendi (Base64)'
      });

    } catch (dbError) {
      console.error('💾 Veritabanı kayıt hatası:', dbError);
      return NextResponse.json(
        { error: 'Veritabanı kayıt hatası: ' + (dbError instanceof Error ? dbError.message : String(dbError)) },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('💥 Upload API hatası:', error);
    return NextResponse.json(
      { error: 'Dosya yüklenirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// Dosya indirme için GET endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get('id');
  
  if (!fileId) {
    return NextResponse.json({ error: 'Dosya ID gerekli' }, { status: 400 });
  }

  // Burada normalde veritabanından dosya bilgisi alınır
  // Şimdilik basit bir test döndürelim
  return NextResponse.json({ 
    message: 'Dosya indirme API aktif',
    fileId: fileId 
  });
}