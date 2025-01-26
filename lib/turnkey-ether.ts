import { ethers, InfuraProvider, BigNumberish, formatEther } from "ethers";
import { TurnkeySigner } from "@turnkey/ethers";
import { TurnkeyClient } from "@turnkey/http";
import { ApiKeyStamper } from "@turnkey/api-key-stamper";


const network = "sepolia";
const provider = new InfuraProvider(network);

const turnkeyClient = new TurnkeyClient(
    {
        baseUrl: "https://api.turnkey.com",
    },

    new ApiKeyStamper({
        apiPublicKey: process.env.TURNKEY_API_PUBLIC_KEY || "",
        apiPrivateKey: process.env.TURNKEY_API_PRIVATE_KEY || "",
    })
);

export const getEtherAccountInfo = async (walletAddress: string) => {
    // Initialize a Turnkey Signer
    const turnkeySigner = new TurnkeySigner({
        client: turnkeyClient,
        organizationId: process.env.TURNKEY_ORGANIZATION_ID || "",
        signWith: walletAddress,
    });

    // Connect it with a Provider (https://docs.ethers.org/v6/api/providers/)
    const connectedSigner = turnkeySigner.connect(provider);


    const chainId = await provider.getNetwork().then(network => network.chainId);
    const address = await connectedSigner.getAddress();
    const balance = await provider.getBalance(address);
    const transactionCount = await provider.getTransactionCount(address);

    return { chainId, address, balance, transactionCount };
};


interface ITransactionRequest {
    to: string;
    value: ethers.BigNumberish;
    type: number;
}

export const makeEtherTransaction = async (walletAddress: string, transactionRequest: ITransactionRequest) => {
    const turnkeySigner = new TurnkeySigner({
        client: turnkeyClient,
        organizationId: process.env.TURNKEY_ORGANIZATION_ID || "",
        signWith: walletAddress,
    });

    const connectedSigner = turnkeySigner.connect(provider);
    const balance = await provider.getBalance(walletAddress)

    const signedTx = await connectedSigner.signTransaction(transactionRequest);

    console.log(`Signed transaction\n\t${signedTx}`);

if (formatEther(balance) === "0.0") {
    let warningMessage =
        "\nWarning: the transaction won't be broadcasted because your account balance is zero.\n";
    warningMessage +=
        "Use https://goerlifaucet.com/ to request funds on Goerli, then run the script again.\n";
    
    console.log(warningMessage);
    return warningMessage;
}

const sentTx = await connectedSigner.sendTransaction(transactionRequest);

console.log(
    `Transaction sent!\n\thttps://${network}.etherscan.io/tx/${sentTx.hash}`
);

return sentTx;
};
