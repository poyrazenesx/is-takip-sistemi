import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

// Fallback local users
const localUsers = [
  { id: 1, name: 'Enes Poyraz', role: 'Admin' },
  { id: 2, name: 'İsmail Arslan', role: 'Member' },
  { id: 3, name: 'Ali Köroğlu', role: 'Member' },
  { id: 4, name: 'Serkan Özil', role: 'Member' }
];

// Fallback local tasks
let tasks: any[] = [
  {
    id: 1,
    title: 'Örnek Görev 1',
    description: 'Bu bir örnek görevdir',
    status: 'todo',
    assignedTo: 1,
    createdBy: 1,
    priority: 'medium',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Yardımcı fonksiyonlar
async function getUserById(id: number) {
  console.log('🔍 getUserById çağrıldı:', id, typeof id);
  
  try {
    const user = await DatabaseService.getUserById(id);
    console.log('✅ Supabase kullanıcı bulundu:', user);
    return user;
  } catch (dbError) {
    console.error('❌ Supabase kullanıcı hatası:', dbError);
    const localUser = localUsers.find(user => user.id === id);
    console.log('🔄 Local fallback kullanıcı:', localUser);
    return localUser;
  }
}

function createTask(taskData: any) {
  console.log('createTask çağrıldı:', taskData);
  const newId = Math.max(...tasks.map(t => t.id), 0) + 1;
  const newTask = {
    id: newId,
    ...taskData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  tasks.push(newTask);
  return newTask;
}

function updateTask(id: number, updateData: any) {
  console.log('updateTask çağrıldı:', id, updateData);
  const taskIndex = tasks.findIndex(task => task.id === id);
  if (taskIndex === -1) return null;
  
  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...updateData,
    updatedAt: new Date()
  };
  return tasks[taskIndex];
}

function deleteTask(id: number) {
  console.log('deleteTask çağrıldı:', id);
  const taskIndex = tasks.findIndex(task => task.id === id);
  if (taskIndex === -1) return false;
  
  tasks.splice(taskIndex, 1);
  return true;
}

// Fallback tasks array üstte tanımlı

// GET - Tüm görevleri getir
export async function GET() {
  try {
    console.log('Tasks GET API çağrıldı');
    
    try {
      const tasks = await DatabaseService.getTasks();
      return NextResponse.json(tasks);
    } catch (dbError) {
      console.error('Veritabanı hatası, fallback kullanılıyor:', dbError);
      
      // Fallback: Local data
      return NextResponse.json(tasks);
    }
  } catch (error) {
    console.error('Görevler getirilemedi:', error);
    return NextResponse.json(
      { error: 'Görevler getirilemedi: ' + error },
      { status: 500 }
    );
  }
}

// POST - Yeni görev oluştur
export async function POST(request: NextRequest) {
  console.log('🚀 POST /api/tasks çağrıldı');
  
  try {
    const taskData = await request.json();
    console.log('📝 Gelen task data:', taskData);
    
    // Gerekli alanları kontrol et
    if (!taskData.title) {
      console.error('❌ Başlık eksik');
      return NextResponse.json(
        { error: 'Başlık gerekli' },
        { status: 400 }
      );
    }

    // AssignedTo ve createdBy için varsayılan değerler
    if (!taskData.assignedTo) {
      taskData.assignedTo = 1; // Varsayılan kullanıcı
      console.log('⚠️  AssignedTo eksik, varsayılan kullanıcı (1) atandı');
    }

    if (!taskData.createdBy) {
      taskData.createdBy = 1; // Varsayılan kullanıcı
      console.log('⚠️  CreatedBy eksik, varsayılan kullanıcı (1) atandı');
    }

    // Kullanıcı ID'lerini number'a çevir
    const assignedToId = typeof taskData.assignedTo === 'string' ? parseInt(taskData.assignedTo) : taskData.assignedTo;
    const createdById = typeof taskData.createdBy === 'string' ? parseInt(taskData.createdBy) : taskData.createdBy;
    
    console.log('🔢 ID dönüşümleri:', { 
      original: { assignedTo: taskData.assignedTo, createdBy: taskData.createdBy },
      converted: { assignedToId, createdById }
    });
    
    // Atanan kullanıcının var olduğunu kontrol et
    const assignedUser = await getUserById(assignedToId);
    const creatorUser = await getUserById(createdById);
    console.log('👥 Kullanıcı kontrolleri:', { assignedUser, creatorUser });
    
    if (!assignedUser || !creatorUser) {
      console.error('❌ Geçersiz kullanıcı ID\'si');
      return NextResponse.json(
        { error: 'Geçersiz kullanıcı ID\'si' },
        { status: 400 }
      );
    }

    console.log('💾 Supabase ile görev oluşturuluyor...');
    
    // Önce Supabase ile deneme yapalım
    try {
      const supabaseTask = await DatabaseService.createTask({
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status || 'todo',
        assigned_to: assignedToId,
        created_by: createdById,
        priority: taskData.priority || 'medium'
      });
      
      console.log('✅ Supabase görev oluştu:', supabaseTask);
      return NextResponse.json(supabaseTask, { status: 201 });
    } catch (supabaseError) {
      console.error('❌ Supabase hatası:', supabaseError);
      
      // Fallback olarak local storage kullan
      const newTask = createTask({
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status || 'todo',
        assignedTo: assignedToId,
        createdBy: createdById,
        priority: taskData.priority || 'medium'
      });
      
      console.log('🔄 Fallback görev oluştu:', newTask);
      return NextResponse.json(newTask, { status: 201 });
    }

  } catch (error) {
    console.error('💥 Genel POST hatası:', error);
    return NextResponse.json(
      { error: 'Görev oluşturulamadı: ' + String(error) },
      { status: 500 }
    );
  }
}

// PUT - Görev güncelle
export async function PUT(request: NextRequest) {
  console.log('🔄 PUT /api/tasks çağrıldı');
  
  try {
    const { id, ...updateData } = await request.json();
    console.log('📝 Güncelleme data:', { id, updateData });
    
    if (!id) {
      console.error('❌ Görev ID eksik');
      return NextResponse.json(
        { error: 'Görev ID\'si gerekli' },
        { status: 400 }
      );
    }

    console.log('💾 Supabase ile görev güncelleniyor...');
    
    // Önce Supabase ile deneme yapalım
    try {
      const supabaseTask = await DatabaseService.updateTask(id, updateData);
      console.log('✅ Supabase görev güncellendi:', supabaseTask);
      return NextResponse.json(supabaseTask);
    } catch (supabaseError) {
      console.error('❌ Supabase güncelleme hatası:', supabaseError);
      
      // Fallback olarak local storage kullan
      const updatedTask = updateTask(id, updateData);
      
      if (!updatedTask) {
        console.error('❌ Local fallback da başarısız');
        return NextResponse.json(
          { error: 'Görev bulunamadı' },
          { status: 404 }
        );
      }

      console.log('🔄 Fallback görev güncellendi:', updatedTask);
      return NextResponse.json(updatedTask);
    }
  } catch (error) {
    console.error('💥 Genel PUT hatası:', error);
    return NextResponse.json(
      { error: 'Görev güncellenemedi: ' + String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Görev sil
export async function DELETE(request: NextRequest) {
  console.log('🗑️ DELETE /api/tasks çağrıldı');
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    console.log('📝 Silinecek görev ID:', id);
    
    if (!id) {
      console.error('❌ Görev ID eksik');
      return NextResponse.json(
        { error: 'Görev ID\'si gerekli' },
        { status: 400 }
      );
    }

    const taskId = parseInt(id);
    console.log('💾 Supabase ile görev siliniyor...');
    
    // Önce Supabase ile deneme yapalım
    try {
      const deleted = await DatabaseService.deleteTask(taskId);
      console.log('✅ Supabase görev silindi:', deleted);
      return NextResponse.json({ success: true, message: 'Görev silindi' });
    } catch (supabaseError) {
      console.error('❌ Supabase silme hatası:', supabaseError);
      
      // Fallback olarak local storage kullan
      const deleted = deleteTask(taskId);
      
      if (!deleted) {
        console.error('❌ Local fallback da başarısız');
        return NextResponse.json(
          { error: 'Görev bulunamadı' },
          { status: 404 }
        );
      }

      console.log('🔄 Fallback görev silindi');
      return NextResponse.json({ success: true, message: 'Görev silindi' });
    }
  } catch (error) {
    console.error('💥 Genel DELETE hatası:', error);
    return NextResponse.json(
      { error: 'Görev silinemedi: ' + String(error) },
      { status: 500 }
    );
  }
}
