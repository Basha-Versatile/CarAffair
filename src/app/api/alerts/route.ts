import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Alert } from '@/models/Notification';
import { apiError, requireUser } from '@/lib/auth';
import { listJSON } from '@/lib/serialize';

export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== 'admin' && user.role !== 'staff') {
      return NextResponse.json({ alerts: [] });
    }
    await connectDB();
    const docs = await Alert.find().sort({ createdAt: -1 }).limit(100).lean();
    const alerts = listJSON(docs as never[]).map((a) => ({
      ...a,
      createdAt: (a as Record<string, unknown>).createdAt
        ? new Date(String((a as Record<string, unknown>).createdAt)).toISOString()
        : new Date().toISOString(),
    }));
    return NextResponse.json({ alerts });
  } catch (err) {
    return apiError(err);
  }
}
