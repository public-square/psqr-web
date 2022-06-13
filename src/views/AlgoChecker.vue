<script setup lang="ts">
    import { ref, onMounted } from "vue";
    import {
        MDBContainer,
        MDBCard,
        MDBBtn,
        MDBTextarea,
        MDBSpinner,
        MDBCardBody,
        MDBCardTitle,
        MDBCardText,
    } from "mdb-vue-ui-kit";
    import { CompactSign, exportJWK, importJWK, compactVerify, generateKeyPair } from "jose-browser-runtime";
    import localForage from "localforage";

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const options = ref(`
    [
        "ES384",
        {
            "extractable": true
        }
    ]
    `);
    const keys = ref("");
    const jws = ref("");
    const time = ref(0);
    const errMsg = ref("");
    const checkRunning = ref(false);
    const keyJson = ref(`
    {
        "alg": "ES384",
        "crv": "P-384",
        "d": "zhd8boQpvdCI0UUCnPqtOKjuxWtF8KMy2720K6ExQQZcnyRbNP5UY7LyI_WSab2L",
        "kty": "EC",
        "x": "VYhbEiKNTIKLfn_pyAj-jQtgKHpOuOTTg5VzPQQWfL3lQgywI7SBXq0UgJcCxtX8",
        "y": "ssSFRxzGGa-fq4MzZXqTTZO7t8wSq6fsALTijXkKeLpbLYScvIAL_Y7aSbpRt122"
    }
    `);
    const keyErrMsg = ref("");
    const keyExport = ref("");
    const importJWS = ref("");
    const keyCheckRunning = ref(false);
    const kid = 'did:psqr:id.ology.com/test#test';
    let db: false | IDBDatabase = false;

    window.localForage = localForage;
    window.exportJWK = exportJWK;

    async function generateKeys() {
        keys.value = "";
        jws.value = "";
        time.value = 0;
        errMsg.value = "";
        checkRunning.value = true;

        const start = Math.floor(Date.now() / 1000);

        try {
            const opt = JSON.parse(options.value);
            console.log(...opt);
            const { publicKey, privateKey } = await generateKeyPair(...opt);
            console.log(publicKey);
            console.log(privateKey);

            const pair = {
                "Public Key": publicKey.extractable ? await exportJWK(publicKey) : 'Not extractable',
                "Private Key": privateKey.extractable ? await exportJWK(privateKey) : 'Not extractable',
            };

            keys.value = JSON.stringify(pair, null, 4);

            const JWS = await new CompactSign(
                encoder.encode("Hello There!")
            )
            .setProtectedHeader({ alg: opt[0] })
            .sign(privateKey);

            jws.value = JWS;

            // eslint-disable-next-line
            const { payload, protectedHeader } = await compactVerify(
                JWS,
                publicKey
            );

            time.value = Math.floor(Date.now() / 1000) - start;
            checkRunning.value = false;
        } catch (error: any) {
            keys.value = "";
            jws.value = "";
            time.value = 0;
            checkRunning.value = false;
            console.error(error);
            errMsg.value = error.message;
        }
    }

    async function setupDB() {
        const req = window.indexedDB.open("check", 1);

        // if initial access, create object store
        req.onupgradeneeded = () => {
            // store db connection
            db = req.result;
            window.db = db;
            console.log('Initial Database connection established');

            // Create an objectStore for this database
            const keyStore = db.createObjectStore("keys", { keyPath: 'kid', autoIncrement: true });
            keyStore.createIndex("kid", "kid", { unique: true });
            keyStore.createIndex("private", "private", { unique: true });
            keyStore.createIndex("public", "public", { unique: true });
            console.log('Created key ObjectStore');
        }

        // make normal connection if subsequent access
        req.onsuccess = () => {
            if (db === false) {
                // store db connection
                db = req.result;
                window.db = db;
                console.log('Database connection established');
            }
        }
    }

    async function importKey() {
        keyExport.value = "";
        importJWS.value = "";
        keyErrMsg.value = "";
        keyCheckRunning.value = true;

        // verify db is setup
        if (db === false) {
            keyCheckRunning.value = false;

            const msg = `Database connection not established yet`;
            console.error(msg);
            keyErrMsg.value = msg;
            return false;
        }

        // get keyLike object
        try {
            const jwk = JSON.parse(keyJson.value);
            jwk.ext = false;

            const privateKey = await importJWK(jwk);
            window.importedKey = privateKey;
            const msg = `Key Object is window.importedKey and stored as ${kid}, use window.exportJWK or Force Export button to attempt extraction.`;
            console.log(msg);
            console.log(privateKey);

            // parse public key from private key json
            let pubJwk = JSON.parse(keyJson.value);
            delete pubJwk.d;
            pubJwk.ext = true;
            const publicKey = await importJWK(pubJwk);
            console.log(publicKey);

            const exportedKey = {
                "Public Key": publicKey.extractable ? await exportJWK(publicKey) : 'Not extractable',
                "Private Key": privateKey.extractable ? await exportJWK(privateKey) : 'Not extractable',
                "Message": msg
            };

            keyExport.value = JSON.stringify(exportedKey, null, 4);

            // Get the key object
            const pairObject = {
                kid: kid,
                private: privateKey,
                public: publicKey
            }

            const keyStore = db.transaction(['keys'], "readwrite").objectStore('keys');
            const req = keyStore.put(pairObject);
            await localForage.setItem(kid, pairObject);

            req.onsuccess = () => {
                console.log("Key Pair stored in DB");
            };
        } catch (error: any) {
            keyErrMsg.value = "";
            keyCheckRunning.value = false;
            console.error(error);
            keyErrMsg.value = error.message;
        }

        keyCheckRunning.value = false;
    }

    async function forceKeyExport() {
        keyExport.value = "";
        keyErrMsg.value = "";
        keyCheckRunning.value = true;

        // verify db is setup
        if (db === false) {
            keyCheckRunning.value = false;

            const msg = `Database connection not established yet`;
            console.error(msg);
            keyErrMsg.value = msg;
            return false;
        }

        const keyStore = db.transaction(['keys'], "readonly").objectStore('keys');
        const req = keyStore.get(kid);

        console.log(req);

        req.onerror = () => {
            keyExport.value = "";
            keyErrMsg.value = "";
            keyCheckRunning.value = false;
            console.error(req.error);
            keyErrMsg.value = req.error.message;
        }

        req.onsuccess = async () => {
            const keyPair = req.result;

            if (typeof keyPair?.private === 'undefined') {
                keyErrMsg.value = 'Run import first to create key object and store it'
                keyCheckRunning.value = false;
                return;
            }

            try {
                const keyExportAttempt = await exportJWK(keyPair.private);

                console.log(`Successfully exported key:`)
                console.log(keyExportAttempt);
                keyExport.value = keyExportAttempt;
            } catch (error: any) {
                keyExport.value = "";
                keyErrMsg.value = "";
                console.error(error);
                keyErrMsg.value = error.message;
            }

            keyCheckRunning.value = false;
        }
    }

    async function retrieveAndSign() {
        importJWS.value = "";
        keyErrMsg.value = "";
        keyCheckRunning.value = true;

        // verify db is setup
        if (db === false) {
            keyCheckRunning.value = false;

            const msg = `Database connection not established yet`;
            console.error(msg);
            keyErrMsg.value = msg;
            return false;
        }

        const keyStore = db.transaction(['keys'], "readonly").objectStore('keys');
        const req = keyStore.get(kid);

        req.onerror = () => {
            keyExport.value = "";
            keyErrMsg.value = "";
            keyCheckRunning.value = false;
            console.error(req.error);
            keyErrMsg.value = req.error.message;
        }

        req.onsuccess = async () => {
            const keyPair = req.result;

            if (typeof keyPair?.private === 'undefined') {
                keyErrMsg.value = 'Run import first to create key object and store it'
                keyCheckRunning.value = false;
                return;
            }

            try {
                const JWS = await new CompactSign(
                    encoder.encode("Hello There!")
                )
                .setProtectedHeader({ alg: 'ES384' })
                .sign(keyPair.private);

                const { payload } = await compactVerify(
                    JWS,
                    keyPair.public
                );

                console.log(`Successfully signed and verified:`)
                console.log('JWS:', JWS);
                console.log('Payload:', decoder.decode(payload));

                importJWS.value = JWS;
            } catch (error: any) {
                importJWS.value = "";
                keyErrMsg.value = "";
                console.error(error);
                keyErrMsg.value = error.message;
            }

            keyCheckRunning.value = false;
        }
    }

    onMounted(async () => {
        await setupDB();
    });
</script>

<template>
    <MDBContainer>
        <MDBCard class="mt-5">
            <MDBCardBody>
                <MDBCardTitle>Algorithm Checker</MDBCardTitle>
                <p v-if="errMsg !== ''" class="note note-danger">{{ errMsg }}</p>
                <MDBCardText>
                    This checks if an algorithm is available and times how long
                    it takes to create a key pair and use it.
                </MDBCardText>
                <MDBTextarea label="Algorithm Options" rows="8" v-model="options" />
                <MDBBtn color="primary" v-on:click="generateKeys" class="m-2">Check</MDBBtn>

                <MDBSpinner v-if="checkRunning" />
                <div v-else class="m-2">
                    <p>
                        <strong>Time Taken:</strong>
                        {{ time }}
                    </p>

                    <p>
                        <strong>Generated Keys:</strong>
                    </p>
                    <pre><code>{{ keys }}</code></pre>

                    <p>
                        <strong>JWS from Generated Keys:</strong>
                    </p>
                    <pre><code>{{ jws }}</code></pre>
                </div>
            </MDBCardBody>
        </MDBCard>
        <MDBCard class="mt-5">
            <MDBCardBody>
                <MDBCardTitle>Key Importer</MDBCardTitle>
                <p v-if="keyErrMsg !== ''" class="note note-danger">{{ keyErrMsg }}</p>
                <MDBCardText>This imports a key as a non-extractable KeyLike object.</MDBCardText>
                <MDBTextarea label="Private Key JSON" rows="8" v-model="keyJson" />
                <MDBBtn color="primary" v-on:click="importKey" class="m-2">Import</MDBBtn>
                <MDBBtn color="primary" v-on:click="forceKeyExport" class="m-2">Force Export</MDBBtn>
                <MDBBtn color="primary" v-on:click="retrieveAndSign" class="m-2">Retrieve and Sign</MDBBtn>

                <MDBSpinner v-if="keyCheckRunning" />
                <div v-else class="m-2">
                    <p>
                        <strong>Key Export:</strong>
                    </p>
                    <pre><code>{{ keyExport }}</code></pre>

                    <p>
                        <strong>JWS from Stored Key:</strong>
                    </p>
                    <pre><code>{{ importJWS }}</code></pre>
                </div>
            </MDBCardBody>
        </MDBCard>
    </MDBContainer>
</template>
