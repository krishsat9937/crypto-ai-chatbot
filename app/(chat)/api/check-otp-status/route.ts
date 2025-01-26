import { NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { otpSessions } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { otp, chatId } = body;

    if (!otp || !chatId) {
      return NextResponse.json({ error: 'OTP and chatId are required.' }, { status: 400 });
    }

    // Check if OTP is already verified for the given chatId
    const session = await db
      .select()
      .from(otpSessions)
      .where(and(eq(otpSessions.chatId, chatId), eq(otpSessions.otp, otp), eq(otpSessions.isVerified, true)))
      .limit(1);

    if (session.length > 0) {
      return NextResponse.json({ verified: true });
    }

    return NextResponse.json({ verified: false });
  } catch (err) {
    console.error('Error checking OTP status:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
