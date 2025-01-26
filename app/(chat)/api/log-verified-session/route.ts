import { NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { otpSessions } from '@/lib/db/schema';

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, chatId, sessionId } = body;


    if (!email || !chatId || !sessionId) {
      return NextResponse.json({ error: 'Email, chatId, and sessionId are required.' }, { status: 400 });
    }

    // Log the verified session
    const res = await db.insert(otpSessions).values({
      email,
      otp,
      chatId,
      otpStatus: 'verified',
      isVerified: true,
      updatedAt: new Date(),
      sessionId,
    }).returning({
      createdId: otpSessions.id,
      chatId: otpSessions.chatId,
      isVerified: otpSessions.isVerified,
      otp: otpSessions.otp,
    });

    return NextResponse.json({
      id: res[0].createdId,
      chatId: res[0].chatId,
      isVerified: res[0].isVerified,
      otp: res[0].otp,
    });
  } catch (err) {
    console.error('Error logging verified session:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
