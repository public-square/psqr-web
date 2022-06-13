import { Publisher } from '@/types/Publisher';

/** Article's Provenance */
interface Provenance {
    /** JSON Web Key */
    jwk: Array<string>,
    /** Key Signature */
    signature: string,
    /** JWK Publisher */
    publisher: Publisher
}

export { Provenance }
