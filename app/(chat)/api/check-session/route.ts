import { NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { otpSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chatId } = body;

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID is required.' }, { status: 400 });
    }

    // Check if a session already exists for the given chatId
    const existingSession = await db
      .select()
      .from(otpSessions)
      .where(eq(otpSessions.chatId, chatId))
      .limit(1);

    if (existingSession.length > 0) {
      return NextResponse.json({ exists: true, session: existingSession[0] });
    }

    return NextResponse.json({ exists: false });
  } catch (err) {
    console.error('Error checking session:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
