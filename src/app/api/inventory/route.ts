import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { InventoryItem } from '@/models/Inventory';
import { apiError, requireUser } from '@/lib/auth';
import { listJSON, toJSON } from '@/lib/serialize';

export async function GET() {
  try {
    await requireUser();
    await connectDB();
    const items = await InventoryItem.find().sort({ name: 1 }).lean();
    return NextResponse.json({ items: listJSON(items as never[]) });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    await connectDB();
    const body = await req.json();
    const created = await InventoryItem.create(body);
    return NextResponse.json({ item: toJSON(created as never) });
  } catch (err) {
    return apiError(err);
  }
}
