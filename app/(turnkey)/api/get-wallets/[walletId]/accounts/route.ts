// app/(turnkey)/api/get-wallets/[walletid]/route.ts

import { getTurnkeyWalletAccounts } from "@/lib/turnkey";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletId: string }> }
) {
  const { walletId } = await params;

  console.log("walletId", walletId);

  try {
    if (!walletId) {
      return NextResponse.json(
        { error: "Wallet ID is required" },
        { status: 400 }
      );
    }

    // Fetch the wallet data using your utility function
    const wallet = await getTurnkeyWalletAccounts(walletId);

    if (!wallet) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 }
      );
    }

    // Return the wallet data as JSON
    return NextResponse.json(wallet, { status: 200 });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
