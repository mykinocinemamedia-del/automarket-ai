import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const rules = await db.automationRule.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ rules })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, trigger, action, config, active } = body

    if (!name || !trigger || !action) {
      return NextResponse.json({ error: 'name, trigger, action are required' }, { status: 400 })
    }

    const rule = await db.automationRule.create({
      data: {
        name,
        description: description || null,
        trigger,
        action,
        config: config || '{}',
        active: active ?? true,
      },
    })

    return NextResponse.json({ rule })
  } catch (e: any) {
    console.error('rule create error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to create rule' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const rule = await db.automationRule.update({
      where: { id },
      data: {
        ...data,
        description: data.description ?? null,
        config: data.config ?? undefined,
      },
    })

    return NextResponse.json({ rule })
  } catch (e: any) {
    console.error('rule update error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to update rule' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await db.automationRule.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('rule delete error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to delete rule' }, { status: 500 })
  }
}
