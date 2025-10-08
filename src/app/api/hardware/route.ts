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
    
    // Veri doğrulama (sadece temel alanları kontrol et)
    const requiredFields = ['device_type', 'make_model']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Supabase için veri formatını hazırla
    const hardwareData = {
      device_type: body.device_type,
      make_model: body.make_model, // Yapılan işlem
      serial_number: body.serial_number || '',
      asset_tag: body.asset_tag || '',
      location: body.location || '',
      department: body.department || '',
      assigned_to: body.assigned_to || '',
      status: body.status || 'Tamamlandı',
      purchase_date: body.purchase_date || new Date().toISOString().split('T')[0],
      warranty_expiry: body.warranty_expiry || null,
      processor: body.processor || '',
      memory_gb: body.memory_gb || 0,
      storage_gb: body.storage_gb || 0,
      operating_system: body.operating_system || '',
      ip_address: body.ip_address || '',
      mac_address: body.mac_address || '',
      notes: body.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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