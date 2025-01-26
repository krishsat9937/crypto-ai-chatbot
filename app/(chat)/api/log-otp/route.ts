import { NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { otpSessions } from '@/lib/db/schema';

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, chatId, status } = body;

    if (!email || !status) {
      return NextResponse.json({ error: 'Email and status are required.' }, { status: 400 });
    }

    // Save the OTP session to the database
    await db.insert(otpSessions).values({
      email,
      chatId,
      otpStatus: status,
      otpSentAt: new Date(),
    });

    return NextResponse.json({ message: 'Session logged successfully.' });
  } catch (err) {
    console.error('Error logging OTP session:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
