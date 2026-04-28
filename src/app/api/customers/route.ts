import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Customer } from '@/models/Customer';
import { Vehicle } from '@/models/Vehicle';
import { apiError, requireUser } from '@/lib/auth';
import { listJSON, toJSON } from '@/lib/serialize';

export async function GET() {
  try {
    await requireUser();
    await connectDB();
    const customers = await Customer.find().sort({ createdAt: -1 }).lean();
    const vehicles = await Vehicle.find().lean();
    const list = customers.map((c) => {
      const own = vehicles.filter((v) => String(v.customerId) === String(c._id));
      return { ...toJSON(c as never), vehicles: listJSON(own as never[]) };
    });
    return NextResponse.json({ customers: list });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    await connectDB();
    const body = await req.json();
    const created = await Customer.create({
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
    });
    return NextResponse.json({ customer: { ...toJSON(created as never), vehicles: [] } });
  } catch (err) {
    return apiError(err);
  }
}
