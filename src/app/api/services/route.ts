import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ServiceCatalogItem } from '@/models/Service';
import { apiError, requireUser } from '@/lib/auth';
import { listJSON, toJSON } from '@/lib/serialize';

export async function GET() {
  try {
    await requireUser();
    await connectDB();
    const items = await ServiceCatalogItem.find().sort({ name: 1 }).lean();
    return NextResponse.json({ services: listJSON(items as never[]) });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    await connectDB();
    const body = await req.json();
    const created = await ServiceCatalogItem.create(body);
    return NextResponse.json({ service: toJSON(created as never) });
  } catch (err) {
    return apiError(err);
  }
}
