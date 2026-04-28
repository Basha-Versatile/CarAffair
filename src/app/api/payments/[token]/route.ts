import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Bill } from '@/models/Bill';
import { ApiError, apiError } from '@/lib/auth';
import { toJSON } from '@/lib/serialize';
import { generateReviewToken } from '@/utils/format';

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await params;
    const bill = await Bill.findOne({ paymentToken: token });
    if (!bill) throw new ApiError('Payment link not found', 404);
    return NextResponse.json({ bill: toJSON(bill as never) });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await params;
    const { paymentMethod } = (await req.json()) ?? {};
    if (!['cash', 'card', 'qr'].includes(paymentMethod)) throw new ApiError('Invalid payment method');
    const existing = await Bill.findOne({ paymentToken: token });
    if (!existing) throw new ApiError('Payment link not found', 404);
    const existingDoc = existing as unknown as { reviewToken?: string; reviewStatus?: string };
    const update: Record<string, unknown> = {
      status: 'paid',
      paymentMethod,
      paidAt: new Date().toISOString(),
      paymentLinkStatus: 'paid',
    };
    if (!existingDoc.reviewToken) {
      update.reviewToken = generateReviewToken();
      update.reviewStatus = 'pending';
      update.reviewSentAt = new Date().toISOString();
    }
    const updated = await Bill.findOneAndUpdate(
      { paymentToken: token },
      update,
      { new: true }
    );
    if (!updated) throw new ApiError('Payment link not found', 404);
    return NextResponse.json({ bill: toJSON(updated as never) });
  } catch (err) {
    return apiError(err);
  }
}
