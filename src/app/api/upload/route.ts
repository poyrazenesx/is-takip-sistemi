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

    // Dosya boyut kontrolü (10MB limit - Supabase Storage ile)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Dosya boyutu 10MB\'dan büyük olamaz' },
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
      'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Bu dosya tipi desteklenmiyor. Desteklenen: Resim, PDF, Word, Excel, PowerPoint, Text dosyaları.' },
        { status: 400 }
      );
    }

    // Dosya adını güvenli hale getir
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const fileExtension = file.name.split('.').pop() || 'bin';
    const safeFileName = `uploads/${timestamp}_${randomStr}.${fileExtension}`;

    // Resim mi kontrol et
    const isImage = file.type.startsWith('image/');
    
    // Dosyayı buffer'a çevir
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    try {
      // Supabase Storage'a dosya yükle
      console.log('📤 Supabase Storage\'a yükleniyor:', safeFileName);
      
      const { data: uploadData, error: uploadError } = await DatabaseService.uploadFile(
        safeFileName,
        buffer,
        file.type
      );

      if (uploadError) {
        console.error('❌ Storage upload hatası:', uploadError);
        // Fallback: Base64 olarak kaydet
        const base64Data = buffer.toString('base64');
        const dataUrl = `data:${file.type};base64,${base64Data}`;
        
        const savedAttachment = {
          id: timestamp,
          fileName: safeFileName.split('/').pop() || safeFileName,
          originalName: file.name,
          fileType: file.type,
          fileSize: file.size,
          filePath: dataUrl, // Base64 fallback
          uploadedBy: uploadedBy,
          isImage: isImage,
          title: title || file.name,
          description: description,
          uploadedAt: new Date().toISOString()
        };

        console.log('⚠️ Fallback: Base64 kullanıldı');
        return NextResponse.json({
          success: true,
          attachment: savedAttachment,
          message: 'Dosya başarıyla yüklendi (Base64 fallback)'
        });
      }

      // Storage'dan dosya URL'ini al
      const publicUrl = DatabaseService.getPublicUrl(safeFileName);
      
      console.log('✅ Dosya Storage\'a yüklendi:', publicUrl);

      const savedAttachment = {
        id: timestamp,
        fileName: safeFileName.split('/').pop() || safeFileName,
        originalName: file.name,
        fileType: file.type,
        fileSize: file.size,
        filePath: publicUrl, // Storage URL
        uploadedBy: uploadedBy,
        isImage: isImage,
        title: title || file.name,
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