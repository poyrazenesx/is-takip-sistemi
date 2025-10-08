import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const department = searchParams.get('department')
    const status = searchParams.get('status')
    const deviceType = searchParams.get('deviceType')
    const search = searchParams.get('search')

    let query = supabase
      .from('hardware')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Filtreler
    if (department) {
      query = query.eq('department', department)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (deviceType) {
      query = query.eq('device_type', deviceType)
    }
    if (search) {
      query = query.or(`tag_number.ilike.%${search}%,fault_description.ilike.%${search}%,work_done.ilike.%${search}%`)
    }

    // Sayfalama
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Hardware fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Veri doğrulama
    if (!body.device_type) {
      return NextResponse.json({ error: 'Cihaz türü gerekli' }, { status: 400 })
    }
    if (!body.make_model) {
      return NextResponse.json({ error: 'Yapılan işlem gerekli' }, { status: 400 })
    }

    // Supabase için veri formatını hazırla (veritabanı şemasına uygun)
    const hardwareData = {
      date: body.purchase_date || new Date().toISOString().split('T')[0],
      assigned_person: 'Sistem Kullanıcısı', // Varsayılan değer
      department: 'Bilgi İşlem', // Varsayılan değer
      service: 'Donanım İşlemi', // Varsayılan değer
      device_type: body.device_type,
      tag_number: body.ip_address || null, // IP adresini tag olarak kullan
      fault_description: null,
      work_done: body.make_model, // Yapılan işlem
      spare_part_used: false,
      spare_part_name: null,
      duration: 0,
      status: body.status || 'Tamamlandı',
      notes: body.notes || null,
      next_check_date: null,
      service_return_date: null
    }

    const { data, error } = await supabase
      .from('hardware')
      .insert([hardwareData])
      .select()
      .single()

    if (error) {
      console.error('Hardware insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}