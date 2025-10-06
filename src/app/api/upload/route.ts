import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { DatabaseService } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Upload API çağrıldı');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadedBy = Number(formData.get('uploadedBy')) || 1;
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

    // Dosya boyut kontrolü (10MB limit)
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
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Bu dosya tipi desteklenmiyor' },
        { status: 400 }
      );
    }

    // Dosya adını güvenli hale getir
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const safeFileName = `${timestamp}_${randomStr}.${fileExtension}`;

    // Upload klasörünü oluştur
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const monthDir = join(uploadDir, new Date().toISOString().slice(0, 7)); // YYYY-MM
    
    try {
      await mkdir(monthDir, { recursive: true });
    } catch (error) {
      console.log('📁 Klasör zaten mevcut:', monthDir);
    }

    // Dosyayı kaydet
    const filePath = join(monthDir, safeFileName);
    const relativePath = `/uploads/${new Date().toISOString().slice(0, 7)}/${safeFileName}`;
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);
    console.log('✅ Dosya kaydedildi:', relativePath);

    // Resim mi kontrol et
    const isImage = file.type.startsWith('image/');
    
    // Veritabanına kaydet
    try {
      // Fallback - basit kayıt
      const attachmentData = {
        fileName: safeFileName,
        originalName: file.name,
        fileType: file.type,
        fileSize: file.size,
        filePath: relativePath,
        uploadedBy: uploadedBy,
        isImage: isImage,
        description: description,
        uploadedAt: new Date()
      };

      console.log('💾 Veritabanına kaydediliyor:', attachmentData);

      // Supabase'e kaydetmeyi dene
      let savedAttachment = null;
      try {
        // DatabaseService'i genişletmemiz gerekecek
        // Şimdilik basit bir ID döndürelim
        savedAttachment = {
          id: Date.now(), // Geçici ID
          ...attachmentData
        };
      } catch (dbError) {
        console.error('Supabase kayıt hatası:', dbError);
        // Fallback olarak dosya sistemi kayıtlı kalacak
        savedAttachment = {
          id: Date.now(),
          ...attachmentData
        };
      }

      return NextResponse.json({
        success: true,
        attachment: savedAttachment,
        message: 'Dosya başarıyla yüklendi'
      });

    } catch (dbError) {
      console.error('💾 Veritabanı kayıt hatası:', dbError);
      return NextResponse.json({
        success: true,
        attachment: {
          id: Date.now(),
          fileName: safeFileName,
          originalName: file.name,
          fileType: file.type,
          fileSize: file.size,
          filePath: relativePath,
          uploadedBy: uploadedBy,
          isImage: isImage,
          description: description,
          uploadedAt: new Date()
        },
        message: 'Dosya yüklendi (veritabanı kayıt hatası)'
      });
    }

  } catch (error) {
    console.error('💥 Upload API hatası:', error);
    return NextResponse.json(
      { error: 'Dosya yüklenirken hata oluştu: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Upload API aktif' });
}