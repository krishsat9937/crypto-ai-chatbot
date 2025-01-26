import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq } from 'drizzle-orm';
import postgres from "postgres";
import { subOrg, turnkeyUser, walletTable, walletAddress, turnkeyApikeys } from "../schema";
import { encrypt } from "@/lib/crypto-generate";


interface IApiKey {
    apiKeyName: string;
    publicKey: string;
    curveType: string;
}

// Interface for the provided JSON structure
interface SubOrganizationData {
    subOrganizationName: string;
    rootQuorumThreshold: number;
    rootUsers: [{
        userName: string;
        userEmail: string;
        apiKeys: IApiKey[];
    }];
    wallet: {
        walletName: string;
        accounts: any;
    }
}

// Main response interface
export interface CreateSubOrganizationResponse {
    subOrganizationId: string;
    wallet: Wallet;
    rootUserIds: string[];
    activity: Activity;
}

// Wallet interface
interface Wallet {
    walletId: string;
    addresses: string[];
}

// Activity interface
interface Activity {
    id: string;
    organizationId: string;
    status: string;
    type: string;
    intent: Intent;
    result: Result;
    votes: Vote[];
    fingerprint: string;
    canApprove: boolean;
    canReject: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    failure: Failure | null;
}

// Intent interface
interface Intent {
    createSubOrganizationIntentV7: CreateSubOrganizationIntentV7;
}

// CreateSubOrganizationIntentV7 interface
interface CreateSubOrganizationIntentV7 {
    subOrganizationName: string;
    rootUsers: RootUser[];
    rootQuorumThreshold: number;
    wallet: WalletDetails;
}

// RootUser interface
interface RootUser {
    userName: string;
    userEmail: string;
    apiKeys: ApiKey[];
    authenticators: Authenticator[]; // Assuming it can have multiple authenticators
    oauthProviders: OAuthProvider[]; // Assuming it can have multiple OAuth providers
}

// ApiKey interface
interface ApiKey {
    apiKeyName: string;
    publicKey: string;
    curveType: string;
}

// WalletDetails interface
interface WalletDetails {
    walletName: string;
    accounts: Account[];
}

// Account interface
interface Account {
    curve: string;
    pathFormat: string;
    path: string;
    addressFormat: string;
}

// Result interface
interface Result {
    createSubOrganizationResultV7: CreateSubOrganizationResultV7;
}

// CreateSubOrganizationResultV7 interface
interface CreateSubOrganizationResultV7 {
    subOrganizationId: string;
    wallet: Wallet;
    rootUserIds: string[];
}

// Vote interface
interface Vote {
    id: string;
    userId: string;
    user: User;
    activityId: string;
    selection: string;
    message: string;
    publicKey: string;
    signature: string;
    scheme: string;
    createdAt: Timestamp | null;
}

// User interface
interface User {
    userId: string;
    userName: string;
    userEmail: string;
    authenticators: Authenticator[];
    apiKeys: UserApiKey[];
    userTags: string[]; // Assuming userTags are strings
    oauthProviders: OAuthProvider[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Authenticator interface
interface Authenticator {
    transports: string[];
    attestationType: string;
    aaguid: string;
    credentialId: string;
    model: string;
    credential: Credential;
    authenticatorId: string;
    authenticatorName: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Credential interface
interface Credential {
    publicKey: string;
    type: string;
}

// UserApiKey interface
interface UserApiKey {
    credential: UserApiKeyCredential;
    apiKeyId: string;
    apiKeyName: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// UserApiKeyCredential interface
interface UserApiKeyCredential {
    publicKey: string;
    type: string;
}

// OAuthProvider interface
interface OAuthProvider {
    // Define properties based on actual OAuth provider structure
    // Since the array is empty in the provided JSON, details are assumed
    providerName?: string;
    clientId?: string;
    scopes?: string[];
}

// Failure interface
interface Failure {
    // Define properties based on actual failure structure
    // Since it's null in the provided JSON, details are assumed
    code?: string;
    message?: string;
}

// Timestamp interface
interface Timestamp {
    seconds: string;
    nanos: string;
}



const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export const findTurnkeyUserByEmailAddress = async (email: string): Promise<any> => {
    try {
        return await db.select({
            id: turnkeyUser.id,
            userName: turnkeyUser.userName,
            userEmail: turnkeyUser.userEmail,
            // Add other fields you need to select
        }).from(turnkeyUser).where(eq(turnkeyUser.userEmail, email)).execute();
    } catch (error) {
        console.error('Failed to find Turnkey user by email address');
        throw error;
    }
}

// Function to create sub-organization

export const saveSubOrganization = async (subOrgDetails: SubOrganizationData, data: CreateSubOrganizationResponse, userPrivateKey: string, userPublicKey: string, userId: string): Promise<any> => {
    try {
        const {
            subOrganizationId: turnkeySubOrganizationId,
            rootUserIds: turnkeyRootUserIds,
            wallet: { walletId: turnkeyWalletId, addresses: turnkeyWalletAddresses },
        } = data;

        const newWalletAddress = turnkeyWalletAddresses[0]; // Assuming there is only one address
        const { subOrganizationName, rootUsers, wallet: { walletName } } = subOrgDetails;

        // Save the sub-organization details to the database
        return await db.transaction(async (tx) => {

            // Insert into `walletTable`
            const createdWallet = await tx
                .insert(walletTable)
                .values({
                    turnkeyWalletId: turnkeyWalletId,
                    walletName: walletName,
                })
                .returning({
                    id: walletTable.id,
                });//return wallet id

            const createdWalletAddress = await tx.insert(walletAddress).values({
                walletId: createdWallet[0].id,
                address: newWalletAddress,
            }).returning({
                id: walletAddress.id,
            });

            // Insert into `subOrg`
            const subOrganization = await tx
                .insert(subOrg)
                .values({
                    turnkeySubOrganizationId: turnkeySubOrganizationId,
                    name: subOrganizationName,
                    description: "Created via Frost Chatbot API", // Modify as needed
                    walletId: createdWallet[0].id, // Foreign key to `walletTable`
                })
                .returning(
                    {
                        id: subOrg.id,
                    }
                );    

            // Insert into `user`
            const newTurnkeyUser = await tx
                .insert(turnkeyUser)
                .values({
                    userId: userId,
                    turnkeyRootUserId: turnkeyRootUserIds[0],
                    userName: rootUsers[0].userName,
                    userEmail: rootUsers[0].userEmail,
                    subOrgId: subOrganization[0].id, // Foreign key to `subOrg`                    
                })
                .returning({
                    id: turnkeyUser.id,
                });
            
            const apiKeyName = rootUsers[0].apiKeys[0].apiKeyName;    

            const apiKey = await tx
                .insert(turnkeyApikeys)
                .values({
                    turnkeyUserId: newTurnkeyUser[0].id,                    
                    publicKey: userPublicKey,
                    privateKey: encrypt(userPublicKey), // Encrypt before storing
                    apiKeyName: apiKeyName,
                })
                .returning({
                    id: turnkeyApikeys.id,
                });

            // Return the saved sub-organization data
            return {
                subOrganization,
                wallet: createdWallet,
                walletAddress: createdWalletAddress,
                newTurnkeyUser,
                apiKey,
            };
        });


    } catch (error) {
        console.error('Failed to save sub-organization in database' + error);
        throw error;
    }

}
