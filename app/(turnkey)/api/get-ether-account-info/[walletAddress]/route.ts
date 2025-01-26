// app/(turnkey)/api/get-wallets/[walletid]/route.ts

import { getEtherAccountInfo } from "@/lib/turnkey-ether";
import { NextRequest, NextResponse } from "next/server";

function serializeBigInt(obj) {
  return JSON.parse(JSON.stringify(obj, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value
  ));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ walletAddress: string }> }
) {
  const { walletAddress } = await params;

  try {
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet ID is required" },
        { status: 400 }
      );
    }

    // Fetch the wallet data using your utility function
    const etherAccount = await getEtherAccountInfo(walletAddress);
    const serializedEtherAccount = serializeBigInt(etherAccount);


    if (!etherAccount) {
      return NextResponse.json(
        { error: "Wallet not found" },
        { status: 404 }
      );
    }

    console.log("etherAccount", serializedEtherAccount);

    // Return the wallet data as JSON
    return NextResponse.json(serializedEtherAccount, { status: 200 });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
