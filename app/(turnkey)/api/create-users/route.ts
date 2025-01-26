import { NextRequest, NextResponse } from "next/server";
import { createTurnkeyUsers } from "@/lib/turnkey";

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();

    // Input validation: Ensure users array exists
    if (!body.users || !Array.isArray(body.users) || body.users.length === 0) {
      return NextResponse.json(
        { error: "Invalid input: 'users' must be a non-empty array" },
        { status: 400 }
      );
    }

    // Call the createTurnkeyUsers method
    const response = await createTurnkeyUsers(body.users);

    // Return successful response
    return NextResponse.json(
      {
        message: "Users created successfully",
        data: response,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in Turnkey Create Users route:", error.message);
    return NextResponse.json(
      {
        error: "Failed to create users",
        details: error.message || "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
