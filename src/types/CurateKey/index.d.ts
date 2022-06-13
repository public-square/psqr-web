/** Curated Key Pair */
interface CurateKey {
    /** Dececentralized ID with Key */
    kid: string,
    /** Private Key */
    private: CryptoKey,
    /** Public Key */
    public: CryptoKey
}

/** Cryptographic Key Object */
interface CryptoKey {
    /** Cryptographic Algorithm */
    algorithm: Algorithm,
    /** Is Extractable? (Only for Public Keys) */
    extractable: boolean,
    /** Public or Private Key */
    type: string,
    /**  */
    usages: Array<string>
}

interface Algorithm {
    /** Name of Algorithm */
    name: string,
    /** Curve of Algorithm */
    namedCurve: string
}

export { CurateKey, CryptoKey, Algorithm }
