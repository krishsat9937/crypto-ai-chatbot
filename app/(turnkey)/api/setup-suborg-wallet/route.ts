import { setupTurnKeySubOrgAndWallet } from "@/lib/turnkey";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
    try {
        // Parse the request body
        const body = await req.json();

        // Input validation: Ensure subOrgName, WalletName, and rootUser properties - username, email - exist
        if (!body.subOrgName || !body.walletName || !body.rootUser || !body.rootUser.userName || !body.rootUser.userEmail) {
            return NextResponse.json(
                { error: "Invalid input: 'subOrgName', 'walletName', 'rootUser.userName', and 'rootUser.userEmail' are required" },
                { status: 400 }
            );
        }

        // Call the setupTurnKeySubOrgAndWallet method
        const turnkeyResponse = await setupTurnKeySubOrgAndWallet(body.subOrgName, body.walletName, body.rootUser);
        console.log("Turnkey response:", turnkeyResponse);


        // Return successful response
        return NextResponse.json(
            {
                message: "SubOrg and Wallet created successfully",
                data: turnkeyResponse
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error in Turnkey Create SubOrg and Wallet route:", error.message);
        return NextResponse.json(
            {
                error: "Failed to create SubOrg and Wallet",
                details: error.message || "An unknown error occurred",
            },
            { status: 500 }
        );
    }
}


