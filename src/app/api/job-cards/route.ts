import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { JobCard } from '@/models/JobCard';
import { apiError, requireUser } from '@/lib/auth';
import { listJSON, toJSON } from '@/lib/serialize';

export async function GET() {
  try {
    await requireUser();
    await connectDB();
    const jobs = await JobCard.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ jobCards: listJSON(jobs as never[]) });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    await connectDB();
    const body = await req.json();
    const created = await JobCard.create(body);
    return NextResponse.json({ jobCard: toJSON(created as never) });
  } catch (err) {
    return apiError(err);
  }
}
