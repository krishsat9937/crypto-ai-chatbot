import * as crypto from 'crypto';
import { ec as EC } from 'elliptic';

/**
 * Interface representing a JSON Web Key (JWK) for EC public keys.
 */
interface JWKPublicKey {
    kty: string; // Key Type, e.g., 'EC'
    crv: string; // Curve name, e.g., 'P-256'
    x: string;   // X coordinate (Base64URL)
    y: string;   // Y coordinate (Base64URL)
    d?: string;  // Private key scalar (Base64URL) - Optional
    // Other fields like 'use', 'key_ops', etc., can be present but are ignored here
}

/**
 * Interface representing the key pair in hexadecimal and PEM formats.
 */
interface KeyPairHex {
    publicKey: string; // Compressed public key in hex
    privateKey: string; // PEM-encoded private key
}


export const encrypt = (text: string): string => {
    const iv = crypto.randomBytes(16); // AES block size is 16 bytes
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted; // Prepend IV to ciphertext
};

export const decrypt = (encryptedText: string): string => {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

/**
 * Converts a Base64URL string to a standard Base64 string.
 * @param base64Url - The Base64URL-encoded string.
 * @returns The standard Base64-encoded string.
 */
function base64UrlToBase64(base64Url: string): string {
    // Replace URL-specific characters
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Pad with '=' to make the length a multiple of 4
    while (base64.length % 4 !== 0) {
        base64 += '=';
    }

    return base64;
}

/**
 * Compresses an EC public key from DER SPKI hexadecimal format to compressed hexadecimal format.
 * @param publicKeyHex - The public key in DER SPKI hexadecimal format.
 * @returns The compressed public key as a 66-character hexadecimal string.
 */
function compressPublicKey(publicKeyHex: string): string {
    try {
        // Step 1: Convert hex string to Buffer
        const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');

        // Step 2: Create a PublicKey object from DER SPKI format
        const publicKeyObject = crypto.createPublicKey({
            key: publicKeyBuffer,
            format: 'der',
            type: 'spki'
        });

        // Step 3: Export the public key in JWK format
        const publicKeyJwk = publicKeyObject.export({ format: 'jwk' }) as JWKPublicKey;

        // Validate the key type and curve
        if (publicKeyJwk.kty !== 'EC') {
            throw new Error(`Unsupported key type: ${publicKeyJwk.kty}. Expected 'EC'.`);
        }

        if (publicKeyJwk.crv !== 'P-256') {
            throw new Error(`Unsupported curve: ${publicKeyJwk.crv}. Expected 'P-256'.`);
        }

        // Step 4: Decode X and Y from Base64URL to Buffers
        const xBuffer = Buffer.from(base64UrlToBase64(publicKeyJwk.x), 'base64');
        const yBuffer = Buffer.from(base64UrlToBase64(publicKeyJwk.y), 'base64');

        // Ensure X and Y are 32 bytes each for P-256
        if (xBuffer.length !== 32 || yBuffer.length !== 32) {
            throw new Error('Invalid X or Y coordinate length. Expected 32 bytes each for P-256.');
        }

        // Step 5: Determine the parity of Y (even or odd)
        const yLastByte = yBuffer[yBuffer.length - 1];
        const isYEven = (yLastByte & 1) === 0;

        // Step 6: Set the prefix based on the parity of Y
        const prefix = isYEven ? '02' : '03';

        // Convert the X coordinate to a hexadecimal string, ensuring it's 64 characters
        const xHex = xBuffer.toString('hex').padStart(64, '0');

        // Concatenate the prefix with the X coordinate to form the compressed public key
        const compressedPublicKeyHex = prefix + xHex;

        // Validate the length of the compressed public key
        if (compressedPublicKeyHex.length !== 66) {
            throw new Error('Compressed public key has an unexpected length.');
        }

        return compressedPublicKeyHex;
    } catch (error) {
        console.error('Error compressing public key:', error);
        throw error; // Re-throw the error for further handling if needed
    }
}


/**
 * Generates a P-256 EC key pair and returns the compressed public key and PEM-encoded private key.
 * @returns An object containing the compressed public key (hex) and private key (PEM).
 */
export function generateP256KeyPairHex(): KeyPairHex {
    try {
        // Generate a P-256 EC key pair
        const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
            namedCurve: 'P-256', // The curve name
            publicKeyEncoding: {
                type: 'spki',
                format: 'der' // Use DER encoding to extract raw key material
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        console.log('Generated Public Key before hexing:', publicKey);

        const pub = crypto.createPublicKey(
            { key: publicKey, format: 'der', type: 'spki' }
        );
        // console.log('Generated Public Key:', pub.export({ type: 'spki', format: 'pem' }));

        // Convert the public key to a hexadecimal encoded string
        const publicKeyHex = pub.export({ type: 'spki', format: 'der' }).toString('hex');

        // Compress the public key to the 66-character hexadecimal format
        const compressedPublicKeyHex = compressPublicKey(publicKeyHex);

        // Create a KeyObject for the private key
        const privateKeyObject = crypto.createPrivateKey({
            key: privateKey,
            format: 'pem',
            type: 'pkcs8'
        });

        // Export the private key in JWK format to extract 'd'
        const privateKeyJwk = privateKeyObject.export({ format: 'jwk' }) as JWKPublicKey;

        if (!privateKeyJwk.d) {
            throw new Error("Private key JWK does not contain 'd' parameter.");
        }

        // Convert 'd' from Base64URL to Base64
        const dBase64 = base64UrlToBase64(privateKeyJwk.d);

        // Convert Base64 to Buffer, then to hex
        const privateKeyHex = Buffer.from(dBase64, 'base64').toString('hex');

        // Validate the length of the private key (P-256 should be 32 bytes => 64 hex characters)
        if (privateKeyHex.length !== 64) {
            throw new Error('Private key has an unexpected length.');
        }

        console.log('Private Key (Hex):', privateKeyHex);

        return { publicKey: compressedPublicKeyHex, privateKey: privateKeyHex };
    } catch (error) {
        console.error('Error generating key pair:', error);
        throw error; // Re-throw the error for further handling if needed
    }
}

/**
 * Function to verify that a private key corresponds to a public key.
 * @param publicKeyHex - The compressed public key in hexadecimal format.
 * @param privateKeyHex - The private key scalar in hexadecimal format.
 * @returns Boolean indicating whether the keys correspond.
 */
export const verifyKeyPair = (publicKeyHex: string, privateKeyHex: string): boolean => {
    const ec = new EC('p256');

    // Reconstruct the key pair from the private key
    const keyPair = ec.keyFromPrivate(privateKeyHex, 'hex');

    // Get the compressed public key from the reconstructed key pair
    const reconstructedPublicKeyHex = keyPair.getPublic(true, 'hex');

    // Compare with the original public key
    return reconstructedPublicKeyHex === publicKeyHex;
};
