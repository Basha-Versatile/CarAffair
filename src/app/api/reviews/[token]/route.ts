import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Bill } from '@/models/Bill';
import { ApiError, apiError } from '@/lib/auth';
import { toJSON } from '@/lib/serialize';

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await params;
    const bill = await Bill.findOne({ reviewToken: token });
    if (!bill) throw new ApiError('Review link not found', 404);
    return NextResponse.json({ bill: toJSON(bill as never) });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectDB();
    const { token } = await params;
    const { rating, comment } = (await req.json()) ?? {};
    if (typeof rating !== 'number' || rating < 1 || rating > 5) throw new ApiError('Invalid rating');
    const updated = await Bill.findOneAndUpdate(
      { reviewToken: token },
      {
        reviewStatus: 'submitted',
        reviewRating: rating,
        reviewComment: comment ?? '',
        reviewSubmittedAt: new Date().toISOString(),
      },
      { new: true }
    );
    if (!updated) throw new ApiError('Review link not found', 404);
    return NextResponse.json({ bill: toJSON(updated as never) });
  } catch (err) {
    return apiError(err);
  }
}
