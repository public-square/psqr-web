import axios from "axios";
import { importJWK, compactVerify } from "jose-browser-runtime";

/**
* Extract Ref from Value
*
* @param r reference
* @return any
*/
export function extractRef(r: any): any {
    return JSON.parse(JSON.stringify(r.value));
}

/**
* Construct Bare DID from KID
*
* @param kid KID to parse
* @return DID or false
*/
function parseBareDid(kid: string): string|boolean {
    // strip # and anything after
    try {
        const bdid = kid.match(/[^#]+/g);
        if (bdid == null || bdid[0] == null) {
            return false;
        }

        return bdid[0];
    } catch (e) {
        return false;
    }
}

/**
* Retrieve DID Type from DID
*
* @param did DID to parse
* @return type or false
*/
function parseDidType(did: string): string|boolean  {
    // remove any key names
    const bdid = parseBareDid(did);
    if (bdid === false) return false;

    try {
        const didReg = /did:(\w+)/;
        const result = didReg.exec(bdid as string);

        if (result === null) {
            return false;
        }

        return result[1];
    } catch (error) {
        return false;
    }
}

/**
* Retrieve URL from DID
*
* @param did DID to parse
* @return url string or false
*/
function parseDidUrl(did: string): string|boolean {
    // remove any key names
    const bdid = parseBareDid(did);
    if (bdid === false) {
        return false;
    }

    // determine didType
    const didType = parseDidType(bdid as string);

    try {
        // separate components
        const matches = (bdid as string).split(':');

        // ensure all components are present
        if (matches.length < 3) {
            return false;
        }

        // remove initial part of did and delimit with /
        let path = matches.slice(2).join('/');

        // add to path if necessary
        if (path.includes('/') === false) {
            path += didType === 'psqr' ? '/.well-known/psqr' : '/.well-known';
        }
        if (matches[1] === 'web') {
            // add did.json if web
            path += `/did.json`;
        }

        const url = `https://${path}`;

        return url;
    } catch (error) {
        return false;
    }
}

/**
* Retrieve DID doc from URL
*
* @param did DID to retrieve doc for
* @return Success or Failure Message Object
*/
async function getDid(did: string): Promise<any> {
    const didErr = {
        success: false,
        error: new TypeError(
            "Unable to parse did string. Expected format: did:psqr:{hostname}/{path}#{keyId}"
        ),
    };

    // ensure it is only the did string, no key names
    const bdid = parseBareDid(did);
    if (bdid === false) {
        return didErr;
    }

    const didType = parseDidType(bdid as string);

    try {
        // get url for DID
        const url = parseDidUrl(bdid as string);
        if (url === false) {
            return didErr;
        }

        // retrieve DID based on type
        let didDoc;

        if (didType === 'web') {
            // retrieve and validate DID from url
            const response = await axios.get(url as string);
            didDoc = response.data;
        } else {
            // set required accept headers
            const config = {
                headers: {
                    'accept': 'application/json,application/did+json',
                },
            }

            // retrieve and validate DID from url
            const response = await axios.get(url as string, config);
            didDoc = response.data;
        }

        return {
            success: true,
            didDoc,
        };
    } catch (err) {
        console.log(err.message);
        return {
            success: false,
            error: err,
        };
    }
}

/**
* Validate Article based on if the signatures for the article match the object's information
*
* @param p article
* @return Promise Response for either Void or Boolean
*/
export async function validateArticle(p: any): Promise<void|boolean> {
    // get dids from local storage if available
    let didDocs = [];
    if (localStorage.didDocs) {
        didDocs = JSON.parse(localStorage.didDocs);
    }

    try {
        const sig = p.provenance.signature;
        const bdid = parseBareDid(p.createdBy);
        if (bdid === false) {
            console.log(`Unable to parse provided did: ${p.createdBy}`);
            return;
        }

        let didDoc: any = false;
        for (let i = 0; i < didDocs.length; i++) {
            const d = didDocs[i];

            if (d.id === bdid) {
                didDoc = d;
                break;
            }
        }

        if (didDoc === false) {
            const didResp = await getDid(bdid as string);
            if (didResp.success == false) {
                return false;
            }

            didDoc = didResp.didDoc;
            didDocs.push(didDoc);
            localStorage.didDocs = JSON.stringify(didDocs);
        }

        // verify that didDoc has psqr element
        if (typeof didDoc.psqr === 'undefined') {
            console.log(`Invalid did doc with no psqr property: ${didDoc.id}`)
            return;
        }

        const keys = [];
        for (let j = 0; j < didDoc.psqr.publicKeys.length; j++) {
            const k = didDoc.psqr.publicKeys[j];

            if (k.kid === p.provenance.jwk.kid) {
                keys.push(k);
            }
        }

        if (keys.length !== 1) {
            return;
        }

        const pubKey = await importJWK(keys[0]);

        const decoder = new TextDecoder();

        const { payload } = await compactVerify(sig, pubKey);
        const infoSig = decoder.decode(payload);

        // ensure signature matches info obj
        return (JSON.stringify(p.info) === infoSig);
    } catch (e) {
        console.error(e);
        return false;
    }
}

export async function skipFrame(): Promise<any> {
    return new Promise(resolve => {
        requestAnimationFrame(() =>
            requestAnimationFrame(resolve)
        );
    });
}

export function decodeHtml(html: any): string {
    const txt = document.createElement("textarea");

    txt.innerHTML = html.linkify({
        target: '_blank',
        truncate: 20,
        formatHref: function (href: string, type: string) {
            if (type === 'mention') {
                href = 'https://twitter.com' + href;
            }

            if (type === 'hashtag') {
                href = 'https://twitter.com/hashtag/' + href.substring(1);
            }

            return href;
        },
        format: function (value: string, type: string) {
            if (type === 'url' && /twitter.com\/.+\/status\/.+\/photo\/1/.test(value) === true) {
                value = '';
            }

            if (type === 'url' && value.length > 50) {
                value = value.slice(0, 50) + '…';
            }

            return value;
        }
    });

    const decoded = txt.value.replace(/\n/g, '<br/>');

    return decoded;
}
