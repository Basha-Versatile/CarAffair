import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Notification, Alert } from '@/models/Notification';
import { apiError, requireUser } from '@/lib/auth';
import { listJSON, toJSON } from '@/lib/serialize';

export async function GET() {
  try {
    await requireUser();
    await connectDB();
    const [notifications, alerts] = await Promise.all([
      Notification.find().sort({ createdAt: -1 }).lean(),
      Alert.find().sort({ createdAt: -1 }).lean(),
    ]);
    return NextResponse.json({
      notifications: listJSON(notifications as never[]),
      alerts: listJSON(alerts as never[]),
    });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    if (body.kind === 'alert') {
      const created = await Alert.create(body.payload);
      return NextResponse.json({ alert: toJSON(created as never) });
    }
    const created = await Notification.create(body.payload ?? body);
    return NextResponse.json({ notification: toJSON(created as never) });
  } catch (err) {
    return apiError(err);
  }
}
