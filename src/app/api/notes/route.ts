import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

// Note kategorileri
const NOTE_CATEGORIES = [
  { id: 'servis', name: 'Servis', icon: '🏥' },
  { id: 'poliklinikler', name: 'Poliklinikler', icon: '👩‍⚕️' },
  { id: 'eczane', name: 'Eczane', icon: '💊' },
  { id: 'genel-hasta-kayit', name: 'Genel Hasta Kayıt', icon: '📋' },
  { id: 'kalite', name: 'Kalite', icon: '⭐' },
  { id: 'dilekceler', name: 'Dilekçeler', icon: '📝' },
  { id: 'idare', name: 'İdare', icon: '🏛️' }
];

// Fallback local notes
let localNotes: any[] = [
  {
    id: 1,
    title: 'Servis Günlük Rapor',
    content: 'Günlük hasta durumu raporları ve vardiya değişim notları buraya yazılacak.',
    category: 'servis',
    created_by: 1,
    updated_by: 1,
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true
  },
  {
    id: 2,
    title: 'Poliklinik Randevu Sistemi',
    content: 'Poliklinik randevu sistemi güncellemeleri ve hasta yönlendirme notları.',
    category: 'poliklinikler',
    created_by: 1,
    updated_by: 1,
    created_at: new Date(),
    updated_at: new Date(),
    is_active: true
  }
];

// GET - Tüm notları getir
export async function GET(request: NextRequest) {
  try {
    console.log('Notes GET API çağrıldı');
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    try {
      const notes = await DatabaseService.getNotes(category);
      console.log('✅ Supabase notes getiriled:', notes?.length || 0);
      return NextResponse.json({
        notes,
        categories: NOTE_CATEGORIES
      });
    } catch (dbError) {
      console.error('Supabase notes hatası, fallback kullanılıyor:', dbError);
      
      // Fallback: Local data
      let filteredNotes = localNotes;
      if (category) {
        filteredNotes = localNotes.filter(note => note.category === category);
      }
      
      return NextResponse.json({
        notes: filteredNotes,
        categories: NOTE_CATEGORIES
      });
    }
  } catch (error) {
    console.error('Notes getirilemedi:', error);
    return NextResponse.json(
      { error: 'Notlar getirilemedi: ' + error },
      { status: 500 }
    );
  }
}

// POST - Yeni not oluştur
export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/notes çağrıldı');
  
  try {
    const noteData = await request.json();
    console.log('📝 Gelen note data:', noteData);
    
    // Gerekli alanları kontrol et
    if (!noteData.title || !noteData.content || !noteData.category) {
      console.error('❌ Eksik alanlar');
      return NextResponse.json(
        { error: 'Başlık, içerik ve kategori gerekli' },
        { status: 400 }
      );
    }

    // Kategori kontrolü
    const validCategory = NOTE_CATEGORIES.find(cat => cat.id === noteData.category);
    if (!validCategory) {
      return NextResponse.json(
        { error: 'Geçersiz kategori' },
        { status: 400 }
      );
    }

    // CreatedBy için varsayılan değer
    if (!noteData.createdBy) {
      noteData.createdBy = 1;
    }

    console.log('💾 Supabase ile not oluşturuluyor...');
    
    try {
      const supabaseNote = await DatabaseService.createNote({
        title: noteData.title,
        content: noteData.content,
        category: noteData.category,
        created_by: noteData.createdBy,
        updated_by: noteData.createdBy,
        is_active: true,
        attachment_url: noteData.attachmentUrl || null,
        attachment_name: noteData.attachmentName || null
      });
      
      console.log('✅ Supabase not oluştu:', supabaseNote);
      return NextResponse.json(supabaseNote, { status: 201 });
    } catch (supabaseError) {
      console.error('❌ Supabase hatası:', supabaseError);
      
      // Fallback olarak local storage kullan
      const newNote = {
        id: Math.max(...localNotes.map(n => n.id), 0) + 1,
        title: noteData.title,
        content: noteData.content,
        category: noteData.category,
        created_by: noteData.createdBy,
        updated_by: noteData.createdBy,
        created_at: new Date(),
        updated_at: new Date(),
        is_active: true,
        attachment_url: noteData.attachmentUrl || null,
        attachment_name: noteData.attachmentName || null
      };
      
      localNotes.push(newNote);
      console.log('🔄 Fallback not oluştu:', newNote);
      return NextResponse.json(newNote, { status: 201 });
    }

  } catch (error) {
    console.error('💥 Genel POST hatası:', error);
    return NextResponse.json(
      { error: 'Not oluşturulamadı: ' + String(error) },
      { status: 500 }
    );
  }
}

// PUT - Not güncelle
export async function PUT(request: NextRequest) {
  console.log('🔄 PUT /api/notes çağrıldı');
  
  try {
    const { id, updatedBy, ...updateData } = await request.json();
    console.log('📝 Güncelleme data:', { id, updateData });
    
    if (!id) {
      return NextResponse.json(
        { error: 'Not ID\'si gerekli' },
        { status: 400 }
      );
    }

    const noteId = typeof id === 'string' ? parseInt(id) : id;
    console.log('🔢 ID dönüşümü:', { original: id, converted: noteId });

    try {
      const supabaseNote = await DatabaseService.updateNote(noteId, {
        ...updateData,
        updated_by: updatedBy || 1
      });
      console.log('✅ Supabase not güncellendi:', supabaseNote);
      return NextResponse.json(supabaseNote);
    } catch (supabaseError) {
      console.error('❌ Supabase güncelleme hatası:', supabaseError);
      
      // Fallback
      const noteIndex = localNotes.findIndex(note => note.id === noteId);
      if (noteIndex === -1) {
        return NextResponse.json(
          { error: 'Not bulunamadı' },
          { status: 404 }
        );
      }
      
      localNotes[noteIndex] = {
        ...localNotes[noteIndex],
        ...updateData,
        updated_by: updatedBy || 1,
        updated_at: new Date()
      };
      
      return NextResponse.json(localNotes[noteIndex]);
    }
  } catch (error) {
    console.error('💥 Genel PUT hatası:', error);
    return NextResponse.json(
      { error: 'Not güncellenemedi: ' + String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Not sil
export async function DELETE(request: NextRequest) {
  console.log('🗑️ DELETE /api/notes çağrıldı');
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Not ID\'si gerekli' },
        { status: 400 }
      );
    }

    const noteId = parseInt(id);
    
    try {
      const deleted = await DatabaseService.deleteNote(noteId);
      console.log('✅ Supabase not silindi:', deleted);
      return NextResponse.json({ success: true, message: 'Not silindi' });
    } catch (supabaseError) {
      console.error('❌ Supabase silme hatası:', supabaseError);
      
      // Fallback
      const noteIndex = localNotes.findIndex(note => note.id === noteId);
      if (noteIndex === -1) {
        return NextResponse.json(
          { error: 'Not bulunamadı' },
          { status: 404 }
        );
      }
      
      localNotes.splice(noteIndex, 1);
      return NextResponse.json({ success: true, message: 'Not silindi' });
    }
  } catch (error) {
    console.error('💥 Genel DELETE hatası:', error);
    return NextResponse.json(
      { error: 'Not silinemedi: ' + String(error) },
      { status: 500 }
    );
  }
}