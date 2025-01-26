import { NextRequest, NextResponse } from "next/server";
import { getTurnkeyWallets } from "@/lib/turnkey";

export async function GET(req: NextRequest) {
  try {
    
    // Call the getWallets method
    const response = await getTurnkeyWallets();

    // Return successful response
    return NextResponse.json(
      {
        message: "Wallets retrieved successfully",
        data: response,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in Turnkey Get Wallets route:", error.message);
    return NextResponse.json(
      {
        error: "Failed to create users",
        details: error.message || "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
