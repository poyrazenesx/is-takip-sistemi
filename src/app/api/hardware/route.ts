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
    const requiredFields = ['assignedPerson', 'department', 'service', 'deviceType']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 })
      }
    }

    // Supabase için veri formatını hazırla
    const hardwareData = {
      date: body.date || new Date().toISOString().split('T')[0],
      assigned_person: body.assignedPerson,
      department: body.department,
      service: body.service,
      device_type: body.deviceType,
      tag_number: body.tagNumber || null,
      fault_description: body.faultDescription || null,
      work_done: body.workDone || null,
      spare_part_used: body.sparePartUsed || false,
      spare_part_name: body.sparePartName || null,
      duration: body.duration || 0,
      status: body.status || 'Tamamlandı',
      notes: body.notes || null,
      next_check_date: body.nextCheckDate || null,
      service_return_date: body.serviceReturnDate || null
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