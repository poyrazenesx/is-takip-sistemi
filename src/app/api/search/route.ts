import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'notes', 'tasks', 'all'
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Arama terimi en az 2 karakter olmalıdır' },
        { status: 400 }
      );
    }

    const searchTerm = query.trim().toLowerCase();
    console.log('Arama terimi:', searchTerm, 'Tür:', type);

    const results: {
      notes: any[];
      tasks: any[];
      totalCount: number;
    } = {
      notes: [],
      tasks: [],
      totalCount: 0
    };

    // Notlarda arama
    if (type === 'notes' || type === 'all') {
      try {
        // Supabase'den notları al ve filtrele
        const response = await fetch(`${request.nextUrl.origin}/api/notes`);
        if (response.ok) {
          const notesData = await response.json();
          const allNotes = notesData.notes || [];
          
          const filteredNotes = allNotes.filter((note: any) => {
            const titleMatch = note.title.toLowerCase().includes(searchTerm);
            const contentMatch = note.content.toLowerCase().includes(searchTerm);
            const categoryMatch = note.category.toLowerCase().includes(searchTerm);
            
            return titleMatch || contentMatch || categoryMatch;
          }).slice(0, limit);

          results.notes = filteredNotes.map((note: any) => ({
            ...note,
            type: 'note',
            searchRelevance: calculateRelevance(note, searchTerm)
          }));
        }
      } catch (error) {
        console.error('Notlar arama hatası:', error);
      }
    }

    // Görevlerde arama
    if (type === 'tasks' || type === 'all') {
      try {
        // Görevleri al ve filtrele
        const response = await fetch(`${request.nextUrl.origin}/api/tasks`);
        if (response.ok) {
          const tasksData = await response.json();
          const allTasks = Array.isArray(tasksData) ? tasksData : [];
          
          const filteredTasks = allTasks.filter((task: any) => {
            const titleMatch = task.title.toLowerCase().includes(searchTerm);
            const descriptionMatch = task.description.toLowerCase().includes(searchTerm);
            const statusMatch = task.status.toLowerCase().includes(searchTerm);
            const priorityMatch = task.priority.toLowerCase().includes(searchTerm);
            
            return titleMatch || descriptionMatch || statusMatch || priorityMatch;
          }).slice(0, limit);

          results.tasks = filteredTasks.map((task: any) => ({
            ...task,
            type: 'task',
            searchRelevance: calculateRelevance(task, searchTerm)
          }));
        }
      } catch (error) {
        console.error('Görevler arama hatası:', error);
      }
    }

    // Toplam sonuç sayısı
    results.totalCount = results.notes.length + results.tasks.length;

    // Relevansa göre sırala
    if (type === 'all') {
      const allResults = [...results.notes, ...results.tasks]
        .sort((a, b) => b.searchRelevance - a.searchRelevance)
        .slice(0, limit);
      
      results.notes = allResults.filter(item => item.type === 'note');
      results.tasks = allResults.filter(item => item.type === 'task');
    }

    console.log('Arama sonuçları:', {
      notesCount: results.notes.length,
      tasksCount: results.tasks.length,
      totalCount: results.totalCount
    });

    return NextResponse.json({
      success: true,
      results,
      query: searchTerm,
      searchType: type || 'all'
    });

  } catch (error) {
    console.error('💥 Search API hatası:', error);
    return NextResponse.json(
      { error: 'Arama sırasında hata oluştu: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// Arama relevansı hesaplama fonksiyonu
function calculateRelevance(item: any, searchTerm: string): number {
  let score = 0;
  const term = searchTerm.toLowerCase();
  
  // Başlık eşleşmesi (en yüksek puan)
  if (item.title?.toLowerCase().includes(term)) {
    score += 100;
    if (item.title?.toLowerCase().startsWith(term)) {
      score += 50; // Başlangıçta eşleşme bonus
    }
  }
  
  // İçerik/açıklama eşleşmesi
  const content = item.content || item.description || '';
  if (content.toLowerCase().includes(term)) {
    score += 50;
  }
  
  // Kategori/durum eşleşmesi
  if (item.category?.toLowerCase().includes(term) || 
      item.status?.toLowerCase().includes(term) ||
      item.priority?.toLowerCase().includes(term)) {
    score += 25;
  }
  
  // Güncellik bonusu (son 7 gün)
  const updatedAt = new Date(item.updatedAt || item.createdAt);
  const daysSince = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince < 7) {
    score += 10;
  }
  
  return score;
}