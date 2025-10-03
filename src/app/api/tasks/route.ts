import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

// Fallback local users
const localUsers = [
  { id: 1, name: 'Enes Poyraz', role: 'Admin' },
  { id: 2, name: 'İsmail Arslan', role: 'Member' },
  { id: 3, name: 'Ali Köroğlu', role: 'Member' },
  { id: 4, name: 'Serkan Özil', role: 'Member' }
];

// Yardımcı fonksiyonlar
async function getUserById(id: number) {
  try {
    const user = await DatabaseService.getUserById(id);
    return user;
  } catch {
    return localUsers.find(user => user.id === id);
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

// Basit task listesi
let tasks = [
  {
    id: 1,
    title: 'Proje Planı Hazırla',
    description: 'Yeni proje için detaylı plan hazırlanması',
    status: 'in-progress',
    assignedTo: 1,
    createdBy: 1,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    priority: 'high'
  },
  {
    id: 2,
    title: 'Müşteri Toplantısı',
    description: 'ABC Şirketi ile ürün tanıtım toplantısı',
    status: 'todo',
    assignedTo: 2,
    createdBy: 1,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    priority: 'medium'
  }
];

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
    if (!taskData.title || !taskData.assignedTo || !taskData.createdBy) {
      console.error('❌ Eksik alanlar:', { title: !!taskData.title, assignedTo: !!taskData.assignedTo, createdBy: !!taskData.createdBy });
      return NextResponse.json(
        { error: 'Başlık, atanan kişi ve oluşturan kişi gerekli' },
        { status: 400 }
      );
    }

    // Atanan kullanıcının var olduğunu kontrol et
    const assignedUser = await getUserById(taskData.assignedTo);
    const creatorUser = await getUserById(taskData.createdBy);
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
        assigned_to: taskData.assignedTo,
        created_by: taskData.createdBy,
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
        assignedTo: taskData.assignedTo,
        createdBy: taskData.createdBy,
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
  try {
    const { id, ...updateData } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Görev ID\'si gerekli' },
        { status: 400 }
      );
    }

    const updatedTask = updateTask(id, updateData);
    
    if (!updatedTask) {
      return NextResponse.json(
        { error: 'Görev bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error('Görev güncellenemedi:', error);
    return NextResponse.json(
      { error: 'Görev güncellenemedi' },
      { status: 500 }
    );
  }
}

// DELETE - Görev sil
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Görev ID\'si gerekli' },
        { status: 400 }
      );
    }

    const deleted = deleteTask(parseInt(id));
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Görev bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Görev silindi' });
  } catch (error) {
    console.error('Görev silinemedi:', error);
    return NextResponse.json(
      { error: 'Görev silinemedi' },
      { status: 500 }
    );
  }
}
