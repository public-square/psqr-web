<script setup lang="ts">
    import { ref, Ref, onMounted } from "vue";
    import {
        MDBAccordion,
        MDBAccordionItem,
        MDBContainer,
        MDBCard,
        MDBBtn,
        MDBTextarea,
        MDBInput,
        MDBSpinner,
        MDBCardBody,
        MDBCardTitle,
        MDBCardText,
        MDBFile,
        MDBListGroup,
        MDBListGroupItem,
        MDBIcon,
    } from "mdb-vue-ui-kit";
    import axios from "axios";

    import { getAllLists, getAllConfigs, importConfig, importList, deleteKeyPair, deleteList, parseListKey } from '@/functions/store';
    import { extractRef } from '@/functions/utility';
    import { CurateKey } from '@/types/CurateKey';
    import { List } from '@/types/List';

    // setup refs
    const errMsg = ref('');
    const successMsg = ref('');
    const configImportFile = ref();
    const configImportText = ref('');
    const importingConfig = ref(false);
    const keyPairList: Ref<CurateKey[]> = ref([]);
    const curateKeys: Ref<CurateKey[]> = ref([]);
    const feedConfiguration = ref({
        test: true,
        data: [
            1,2,3,4
        ]
    });
    const activeItemAdvanced = ref('advanced-section-1');
    const feedEditKey = ref(localStorage.getItem('feedEditKey'));

    // list setup
    const listImportName = ref('');
    const listImportEndpoint = ref('');
    const listCurateKey = ref();
    const listImportFile = ref();
    const listImportUrl = ref('');
    const importingList = ref(false);
    const lists: Ref<List[]> = ref([]);

    /**
    * Parses a String for the DID JSON Config and Imports New Config
    */
    async function importNewConfig() {
        // clear msg values
        errMsg.value = '';
        successMsg.value = '';

        importingConfig.value = true;
        let configString = '';
        if (configImportText.value.length > 0) {
            configString = configImportText.value;
        } else if (typeof configImportFile.value !== 'undefined') {
            configString = await configImportFile.value[0].text();
        } else {
            errMsg.value = `No config specified`;
            importingConfig.value = false;
            window.scrollTo(0,0);
            return false;
        }

        // ensure valid json
        let config;
        try {
            config = JSON.parse(configString);
        } catch (error) {
            const msg = 'Invalid Config JSON due to: '
            let msgSimple = 'Unable to Verify';
            console.log(msg);
            console.error(error);

            if (error instanceof Error) {
                errMsg.value = msg + error.message;
            } else {
                errMsg.value = msg + msgSimple;
            }

            importingConfig.value = false;
            window.scrollTo(0,0);
            return false;
        }

        // once properly imported store available configs
        const importResp = await importConfig(config);

        if (importResp.success) {
            successMsg.value = `Successfully imported the config for ${config.name} (${config.identity.didDoc.id})`;
            await updateKeyPairList();
        } else {
            errMsg.value = importResp.message;
            window.scrollTo(0,0);
        }

        importingConfig.value = false;
    }

    /**
    * Update the Key Pair List based on all available configs
    */
    async function updateKeyPairList() {
        keyPairList.value = [];
        curateKeys.value = [];

        const configs = await getAllConfigs();
        for (let i = 0; i < configs.length; i++) {
            const config = configs[i];

            // find all keys that are granted curate perms
            const curateList = [];
            const authList = config.identity.didDoc.psqr.permissions;
            for (let ii = 0; ii < authList.length; ii++) {
                const authItem = authList[ii];

                if (authItem.grant.includes('curate')) {
                    curateList.push(authItem.kid);
                }
            }

            // add in the keys
            const keyPairs = config.identity.keyPairs;
            for (let iii = 0; iii < keyPairs.length; iii++) {
                const pair = keyPairs[iii];
                keyPairList.value.push(pair);

                if (curateList.includes(pair.kid)) {
                    curateKeys.value.push(pair);
                }
            }
        }
    }

    /**
    * Remove a Key Pair from the Key Pair List
    */
    async function removePair(kid: string) {
        await deleteKeyPair(kid);
        const list = keyPairList.value;

        for (let i = 0; i < list.length; i++) {
            const pair = list[i];

            if (pair.kid === kid) {
                list.splice(i, 1);
                break;
            }
        }

        keyPairList.value = list;
    }

    /**
    * Import a New List
    */
    async function importNewList() {
        // clear msg values
        errMsg.value = '';
        successMsg.value = '';

        importingList.value = true;

        if (listImportName.value === '') {
            errMsg.value = `No list name specified`;
            importingList.value = false;
            window.scrollTo(0,0);
            return false;
        }

        if (listImportEndpoint.value === '') {
            errMsg.value = `No list endpoint url specified`;
            importingList.value = false;
            window.scrollTo(0,0);
            return false;
        }

        if (typeof listCurateKey.value === 'undefined') {
            errMsg.value = `No curate key specified`;
            importingList.value = false;
            window.scrollTo(0,0);
            return false;
        }

        let listString = '';
        try {
            if (listImportUrl.value.length > 0) {
                const response = await axios.get(listImportUrl.value);
                listString = response.data;
            } else if (typeof listImportFile.value !== 'undefined') {
                listString = await listImportFile.value[0].text();
            }
        } catch (error) {
            const msg = 'Error retrieving list data: '
            let msgSimple = 'Unable to Verify';
            console.log(msg);
            console.error(error);

            if (error instanceof Error) {
                errMsg.value = msg + error.message;
            } else {
                errMsg.value = msg + msgSimple;
            }

            importingList.value = false;
            window.scrollTo(0,0);
            return false;
        }

        const importResp = await importList(listImportName.value, listImportEndpoint.value, listCurateKey.value, listString);

        if (importResp.success) {
            successMsg.value = `Successfully imported the list`;
            await updateLists();
        } else {
            errMsg.value = importResp.message;
        }

        importingList.value = false;
    }

    /**
    * Update All Lists
    */
    async function updateLists() {
        const allLists = await getAllLists();
        lists.value = allLists;
    }

    /**
    * Remove List with listname from Set of Lists
    *
    * @param name List with name to remove
    */
    async function removeList(name: string) {
        await deleteList(name);
        const currentLists = lists.value;

        for (let i = 0; i < currentLists.length; i++) {
            const list = currentLists[i];

            if (list.name === name) {
                currentLists.splice(i, 1);
                break;
            }
        }

        lists.value = currentLists;
    }

    function setFeedEditKey() {
        localStorage.setItem('feedEditKey', extractRef(feedEditKey));
    }

    onMounted(async () => {
        await updateKeyPairList();
        await updateLists();

        feedConfiguration.value = JSON.parse(localStorage.getItem("feed_configuration") || '{}');
    });
</script>

<template>
    <MDBContainer>
        <p v-if="errMsg !== ''" class="note note-danger mt-3">
            {{ errMsg }}
        </p>
        <p v-if="successMsg !== ''" class="note note-success mt-3">
            {{ successMsg }}
        </p>

        <MDBCard class="mt-3">
            <MDBCardBody>
                <MDBCardTitle>Import Config</MDBCardTitle>

                <MDBCardText>
                    Select the appropriate config file or paste the json into the field below in order to import an ology config.
                    Text in the text field is used over a provided file if both are present.
                </MDBCardText>
                <MDBFile class="mt-3" v-model="configImportFile" />
                <MDBTextarea
                    class="mt-3"
                    label="Import Config Text"
                    rows="8"
                    v-model="configImportText"
                />
                <MDBSpinner v-if="importingConfig" class="mt-3"/>
                <MDBBtn v-else color="primary" v-on:click="importNewConfig" class="mt-3">Import</MDBBtn>
            </MDBCardBody>
        </MDBCard>

        <MDBCard class="mt-3">
            <MDBCardBody>
                <MDBCardTitle>List Management</MDBCardTitle>

                <MDBCardText>
                    Create and manage PSQR lists.
                </MDBCardText>

                <MDBInput class="my-4" type="text" size="lg" label="Import List Name" v-model="listImportName" />
                <MDBInput class="my-4" type="text" size="lg" label="Import List Url Endpoint" v-model="listImportEndpoint" />

                <label class="form-label" for="curateKeySelect">List Curate Key</label>
                <select id="curateKeySelect" class="form-select" aria-label="List Curate Key" v-model="listCurateKey">
                    <option v-for="pair in curateKeys" :key="'curatekeys-' + pair.kid" :value="pair.kid">
                        {{ pair.kid }}
                    </option>
                </select>

                <label class="mt-4 form-label" >Import List Content</label>
                <MDBFile v-model="listImportFile" />
                <MDBInput class="mt-3" type="url" label="Import Content Url" v-model="listImportUrl" />
                <MDBSpinner v-if="importingList" class="mt-3"/>
                <MDBBtn v-else color="primary" v-on:click="importNewList" class="my-3">Import</MDBBtn>

                <MDBCardTitle v-if="lists.length > 0">Lists</MDBCardTitle>
                <MDBListGroup>
                    <MDBListGroupItem v-for="list in lists" :key="list.name">
                        <div class="d-flex justify-content-between align-items-center p-2">
                            <h4 class="m-0">
                                <MDBIcon icon="th-list" iconStyle="fas" />
                                {{ list.name }}
                            </h4>
                            <p class="m-0">{{ list.articles.length }} articles</p>
                            <div class="justify-content-right">
                                <MDBBtn color="primary" floating>
                                    <router-link :to="{ name: 'List', params: { listKey: parseListKey(list.name) }}">
                                        <MDBIcon icon="edit" iconStyle="fas" />
                                    </router-link>
                                </MDBBtn>
                                <MDBBtn color="danger" v-on:click="removeList(list.name)" floating>
                                    <MDBIcon icon="trash" iconStyle="fas" />
                                </MDBBtn>
                            </div>
                        </div>
                    </MDBListGroupItem>
                </MDBListGroup>
            </MDBCardBody>
        </MDBCard>

        <MDBCard class="mt-3">
            <MDBCardBody>
                <MDBCardTitle>Feed Management</MDBCardTitle>

                <label class="form-label" for="curateKeySelect">Feed Edit Key</label>
                <select id="feedEditSelect" class="form-select" aria-label="Feed Edit Key" v-model="feedEditKey">
                    <option v-for="pair in curateKeys" :key="'feedEditKeys-' + pair.kid" :value="pair.kid">
                        {{ pair.kid }}
                    </option>
                </select>
                <MDBBtn color="primary" v-on:click="setFeedEditKey" class="my-3">Save</MDBBtn>
            </MDBCardBody>
        </MDBCard>

        <MDBCard class="mt-3" v-if="keyPairList.length > 0">
            <MDBCardBody>
                <MDBCardTitle>Key Pairs</MDBCardTitle>

                <MDBCardText>
                    These are all Key Pairs that are stored locally.
                </MDBCardText>

                <MDBListGroup>
                    <MDBListGroupItem v-for="pair in keyPairList" :key="'allkeys-' + pair.kid">
                        <div class="d-flex justify-content-between align-items-center p-2">
                            <h4 class="m-0">
                                <MDBIcon icon="key" iconStyle="fas fa" />
                                {{ pair.kid }}
                            </h4>
                            <MDBBtn color="danger" v-on:click="removePair(pair.kid)" floating>
                                <MDBIcon icon="trash" iconStyle="fas" />
                            </MDBBtn>
                        </div>
                    </MDBListGroupItem>
                </MDBListGroup>
            </MDBCardBody>
        </MDBCard>

        <MDBAccordion classes="mt-3 mb-3" v-model="activeItemAdvanced">
            <MDBAccordionItem
                headerTitle="Advanced"
                collapseId="advanced-section-1"
                >
                <MDBCardText>
                    Feed Configuration:
                </MDBCardText>
                <pre class="p-3 bg-dark text-white"><code>{{ JSON.stringify(feedConfiguration, null, 4) }}</code></pre>
            </MDBAccordionItem>
        </MDBAccordion>
    </MDBContainer>
</template>

<style scoped>
    button.btn i {
        color: #fff;
    }
</style>
