import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { JobCard } from '@/models/JobCard';
import { ApiError, apiError } from '@/lib/auth';
import { toJSON } from '@/lib/serialize';

const GST_RATE = 18;

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await params;
    const job = await JobCard.findOne({ quoteToken: token });
    if (!job) throw new ApiError('Quote not found', 404);
    return NextResponse.json({ jobCard: toJSON(job as never) });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await params;
    const body = await req.json();
    const action: 'accepted' | 'rejected' = body.action;
    if (action !== 'accepted' && action !== 'rejected') throw new ApiError('Invalid action');

    const job = (await JobCard.findOne({ quoteToken: token })) as unknown as Record<string, unknown> | null;
    if (!job) throw new ApiError('Quote not found', 404);

    const update: Record<string, unknown> = {
      quoteStatus: action,
      quoteRespondedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (action === 'accepted') {
      update.status = 'approved';
      const services = (job.services as Array<{ id: string; cost: number }>) ?? [];
      const parts = (job.parts as Array<{ id: string; totalCost: number }>) ?? [];
      const approvedServiceIds: string[] = body.approvedServiceIds ?? services.map((s) => s.id);
      const approvedPartIds: string[] = body.approvedPartIds ?? parts.map((p) => p.id);
      update.approvedServiceIds = approvedServiceIds;
      update.approvedPartIds = approvedPartIds;
      const servicesCost = services.filter((s) => approvedServiceIds.includes(s.id)).reduce((s, x) => s + x.cost, 0);
      const partsCost = parts.filter((p) => approvedPartIds.includes(p.id)).reduce((s, x) => s + x.totalCost, 0);
      const subtotal = servicesCost + partsCost;
      update.estimatedCost = subtotal;
      update.quoteSubtotal = subtotal;
      const taxAmount = job.quoteType === 'with_gst' ? Math.round(subtotal * (GST_RATE / 100)) : 0;
      update.quoteTaxAmount = taxAmount;
      update.quoteTotal = subtotal + taxAmount;
    } else {
      update.approvedServiceIds = [];
      update.approvedPartIds = [];
    }

    const updated = await JobCard.findOneAndUpdate({ quoteToken: token }, update, { new: true });
    return NextResponse.json({ jobCard: toJSON(updated as never) });
  } catch (err) {
    return apiError(err);
  }
}
