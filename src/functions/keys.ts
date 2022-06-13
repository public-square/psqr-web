import { CompactSign, compactVerify, importJWK } from "jose-browser-runtime";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export interface PairObject {
    kid: string;
    private: any;
    public: any;
}

export type PairResponse = {
    success: false;
    message: string;
} | {
    success: true;
    message: string;
    pair: PairObject;
}

/**
* Parse a Private and Public Key Pair into a Pair Object
*
* @param keyPair Private and Public Key Pair
* @return Success Message and KeyPair Object, or Error Message Object
*/
async function parseKeyPair(keyPair: any): Promise<PairResponse> {
    // get keyLike object
    try {
        // ensure private isn't extractable but pub is
        const pubJwk = keyPair.public;
        const privJwk = keyPair.private;
        pubJwk.ext = true;
        privJwk.ext = false;

        const privateKey = await importJWK(privJwk);
        const publicKey = await importJWK(pubJwk);

        // assemble the keyPair object
        const pairObject: PairObject = {
            kid: keyPair.kid,
            private: privateKey,
            public: publicKey
        }

        return {
            success: true,
            message: 'Successfully parsed Key Pair',
            pair: pairObject
        }
    } catch (error) {
        const msg = `Error parsing Key Pair ${keyPair.kid}: ${error.message}`;

        return {
            success: false,
            message: msg
        };
    }
}

/**
* Validate a Key Pair Object and a test message with JOSE CompactSign
*
* @param pairObject Key Pair Object
* @return True if valid, False if an error occurred
*/
async function validateKeyPair(pairObject: PairObject): Promise<boolean> {
    const testMsg = "Hello There!";
    try {
        // sign an arbitrary string with the private key
        const JWS = await new CompactSign(
            encoder.encode(testMsg)
        )
            .setProtectedHeader({ alg: 'ES384' })
            .sign(pairObject.private);

        // verify the string with the public key
        const { payload } = await compactVerify(
            JWS,
            pairObject.public
        );
        const valid = decoder.decode(payload) === testMsg;

        return valid;
    } catch (error) {
        const msg = `Error validating keyPair ${pairObject.kid}: ${error.message}`;
        console.log(msg)

        return false;
    }
}

/**
* CompactSign a text string with a KeyPair Object
*
* @param text String to Sign
* @param pairObject Key Pair Object
* @return JWS Token or False
*/
async function signText(text: string, pairObject: PairObject): Promise<string|boolean> {
    try {
        // sign an arbitrary string with the private key
        const JWS = await new CompactSign(
            encoder.encode(text)
        )
            .setProtectedHeader({
                alg: 'ES384',
                kid: pairObject.kid
            })
            .sign(pairObject.private);

        return JWS;
    } catch (error) {
        const msg = `Error signing text ${pairObject.kid}: ${error.message}`;
        console.log(msg)

        return false;
    }
}

export { validateKeyPair, parseKeyPair, signText }
