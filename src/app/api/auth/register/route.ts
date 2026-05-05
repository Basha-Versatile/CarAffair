import { NextResponse } from 'next/server';

// Public self-registration is disabled. All user creation goes through the
// admin "Users" page, which calls POST /api/users and sends an invite link.
export async function POST() {
  return NextResponse.json(
    { error: 'Self-registration is disabled. Ask an admin to invite you.' },
    { status: 410 }
  );
}
