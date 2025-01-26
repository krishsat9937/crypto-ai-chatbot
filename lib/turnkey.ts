import { Turnkey } from "@turnkey/sdk-server";
import { generateP256KeyPairHex, verifyKeyPair } from "./crypto-generate";
import { DEFAULT_ETHEREUM_ACCOUNTS } from "@turnkey/sdk-server";
import { saveSubOrganization } from "./db/turnkey_queries/queries";
import { auth } from '@clerk/nextjs/server';
import { findUserIdByClerkId } from "./db/queries";

const turnkey = new Turnkey({
    defaultOrganizationId: process.env.TURNKEY_ORGANIZATION_ID || "",
    apiBaseUrl: "https://api.turnkey.com",
    apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY || "",
    apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY || "",
});

const apiClient = turnkey.apiClient();
// apiClient.getWalletAccounts

export const createTurnkeyUsers = async (users: any[]) => {
    const { publicKey, privateKey } = generateP256KeyPairHex();
    const isValid = verifyKeyPair(publicKey, privateKey);

    if (!isValid) {
        throw new Error('Key verification failed: The private key does not correspond to the public key.');
    }

    console.log('Key verification successful: The private key corresponds to the public key.');

    const payload = {
        type: "ACTIVITY_TYPE_CREATE_USERS_V2",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID || "",
        users: users.map((user) => ({
            userName: user.userName,
            userEmail: user.userEmail || null,
            apiKeys: [
                {
                    apiKeyName: "defaultKey",
                    publicKey: publicKey,
                    curveType: "API_KEY_CURVE_P256" as const,
                }
            ],
            authenticators: [],
            userTags: [],
        })),
    };

    try {
        console.log("Creating Turnkey users:", payload);
        // Call Turnkey API
        const response = await apiClient.createUsers(payload);
        return response;
    } catch (error) {
        const err = error as any;
        console.error("Error creating Turnkey users:", err.response?.data || err.message);
        throw error;
    }
};

export const getTurnkeyWallets = async () => {
    try {
        console.log("Getting Turnkey wallets:");
        // Call Turnkey API
        const response = await apiClient.getWallets();
        return response;
    } catch (error) {
        const err = error as any;
        console.error("Error getting Turnkey wallets:", err.response?.data || err.message);
        throw error;
    }
}

export const getTurnkeyWallet = async (walletId: string) => {
    try {
        console.log("Getting Turnkey wallet:", walletId);
        // Call Turnkey API
        const response = await apiClient.getWallet({
            organizationId: process.env.TURNKEY_ORGANIZATION_ID || "",
            walletId: walletId
        });
        return response;
    } catch (error) {
        const err = error as any;
        console.error("Error getting Turnkey wallet:", err.response?.data || err.message);
        throw error;
    }
}


export const getTurnkeyWalletAccounts = async (walletId: string) => {
    try {
        console.log("Getting Turnkey wallet accounts:", walletId);
        // Call Turnkey API
        const response = await apiClient.getWalletAccounts({
            organizationId: process.env.TURNKEY_ORGANIZATION_ID || "",
            walletId: walletId
        });
        return response;
    } catch (error) {
        const err = error as any;
        console.error("Error getting Turnkey wallet accounts:", err.response?.data || err.message);
        throw error;
    }
}

export const createTurnkeyInvitation = async (users: any[]) => {
    const payload = {
        type: "ACTIVITY_TYPE_CREATE_INVITATIONS",
        timestampMs: Date.now().toString(),
        organizationId: process.env.TURNKEY_ORGANIZATION_ID || "",
        invitations: users.map((user) => ({
            receiverUserName: user.userName as string,
            receiverUserEmail: user.userEmail as string || "",
            receiverUserTags: [],
            accessType: "ACCESS_TYPE_ALL" as "ACCESS_TYPE_ALL",
            senderUserId: "2a5fc1bb-a024-494d-9baa-62e2ff548d08"

        }))
    };

    try {
        console.log("Creating Turnkey users:", payload);
        // Call Turnkey API
        const response = await apiClient.createInvitations(payload);
        return response;
    } catch (error) {
        const err = error as any;
        console.error("Error creating Turnkey users:", err.response?.data || err.message);
        throw error;
    }
}

export const setupTurnKeySubOrgAndWallet = async (subOrgName: string, walletName: string, rootUser: any) => {
    
    const { privateKey, publicKey } = generateP256KeyPairHex();
    const isValid = verifyKeyPair(publicKey, privateKey);

    if (!isValid) {
        throw new Error('Key verification failed: The private key does not correspond to the public key.');
    }

    const createSuborgRequest = {
        subOrganizationName: subOrgName,
        rootQuorumThreshold: 1,
        rootUsers: [
            {
                userName: rootUser.userName as string,
                userEmail: rootUser.userEmail as string || null,
                apiKeys: [
                    {
                        apiKeyName: "defaultKey",
                        publicKey: publicKey,
                        curveType: "API_KEY_CURVE_P256",
                    },
                ],
                authenticators: [],
                oauthProviders: [],
            },
        ],
        wallet: {
            walletName: walletName,
            accounts: DEFAULT_ETHEREUM_ACCOUNTS,
        },
    };

    const createSubOrgResponse = await apiClient.createSubOrganization(createSuborgRequest);
    console.log("Create SubOrg Response:", createSubOrgResponse);
    
    const { userId: clerkId } = await auth();

    if (!clerkId) {
        throw new Error('Clerk ID is null');
    }

    const user = await findUserIdByClerkId(clerkId);

    const dbResponse = await saveSubOrganization(
        createSuborgRequest,
        createSubOrgResponse,
        privateKey,
        publicKey,
        user[0].id
    );

    return dbResponse;

}

