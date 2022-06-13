<script setup lang="ts">
    import { ref, Ref, onMounted } from "vue";
    import { useRoute } from 'vue-router';
    import {
        MDBBtn,
        MDBSpinner,
        MDBIcon,
        MDBFooter,
    } from "mdb-vue-ui-kit";
    import { CompactSign } from "jose-browser-runtime";
    import axios from "axios";
    import FeedArticle from "@/components/FeedArticle.vue";
    import { getList, putList, getKeyPair } from '@/functions/store';
    import { extractRef } from '@/functions/utility';
    import { List } from '@/types/List';
    import { Article } from "@/types/Article";

    const encoder = new TextEncoder();
    const route = useRoute();

    // setup universal vars
    const gettingArticles = ref(false);
    const editMode = ref(true);
    const unsavedChanges = ref(false);
    const processingList = ref(false);
    const list = ref<List>({
        key:   '',
        name:  '',
        articles: [],
        url:   ''
    });
    const articles: Ref<Article[]> = ref([]);
    const listKey = route.params.listKey;

    /**
    * Get Articles for the List
    */
    async function getArticles() {
        gettingArticles.value = true;

        const storedList = await getList(listKey as string) as unknown as List;
        list.value = storedList;

        for (let i = 0; i < storedList.articles.length; i++) {
            const article = storedList.articles[i];

            articles.value.push(article);
        }

        gettingArticles.value = false;
    }

    /**
    * Remove Article from the List
    *
    * @param i Array Location of Article
    */
    function removeArticle(i: number) {
        unsavedChanges.value = true;
        articles.value.splice(i, 1);
    }

    /**
    * Save Current Changes to List
    */
    async function saveCurrentList() {
        processingList.value = true;

        // save current articles
        const currentList = extractRef(list);
        currentList.articles = extractRef(articles);

        // store current list
        try {
            await putList(currentList);
        } catch (error) {
            return console.error(error);
        }

        processingList.value = false;
        unsavedChanges.value = false;
    }

    /**
    * Reset all changes to Current List
    */
    async function resetCurrentList() {
        processingList.value = true;

        // get old list
        const oldList = extractRef(list);
        articles.value = [];

        for (let i = 0; i < oldList.articles.length; i++) {
            const article = oldList.articles[i];

            articles.value.push(article)
        }

        processingList.value = false;
        unsavedChanges.value = false;
    }

    /**
    * Upload List to Designated URL Endpoint
    */
    async function uploadList() {
        if (unsavedChanges.value) await saveCurrentList();

        processingList.value = true;

        let listToUpload = list.value !== null ? list.value : null;

        if (listToUpload === null) {
            throw 'List is Not Defined';
        }

        // get key to use with upload
        const keyObj = await getKeyPair(listToUpload.key);

        // get articles and convert to jsonl
        let articleList = '';
        const currentArticles = extractRef(articles);

        for (let i = 0; i < currentArticles.length; i++) {
            const article = currentArticles[i];

            articleList += JSON.stringify(article) + '\n'
        }

        // sign and upload article string
        let JWS;

        try {
            JWS = await new CompactSign(
                encoder.encode(articleList)
            )
            .setProtectedHeader({
                alg: 'ES384',
                kid: listToUpload.key
            })
            .sign(keyObj.private);

            // upload list
            const resp = await axios({
                url: listToUpload.url,
                method: 'PUT',
                data: {
                    token: JWS
                },
            });

            console.log(resp.data)
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                alert(error.message);
            }
        }

        processingList.value = false;
        unsavedChanges.value = false;
    }

    /**
    * Download List from URL
    */
    async function downloadList() {
        processingList.value = true;

        let listToDownload = list.value !== null ? list.value : null;

        if (listToDownload === null) {
            throw 'List is Not Defined';
        }

        // parse list download url
        let dl = listToDownload.url;
        dl = dl.replace('/api', '');
        dl += '/index.jsonl';

        // get list from dl url
        let newArticles = [];

        try {
            // dl list
            const resp = await axios.get(dl);

            // parse data
            const rawList = resp.data.split("\n");
            for (let i = 0; i < rawList.length; i++) {
                const item = rawList[i];
                if (item === '') continue;
                const parsedItem = JSON.parse(item);

                newArticles.push(parsedItem);
            }
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                alert(error.message);
            }
        }

        articles.value = newArticles;

        processingList.value = false;
        unsavedChanges.value = true;
    }

    /**
    * Change Positioning of a Article in a list
    *
    * @param current Current Article Location
    * @param newPos Article's Desired New Location
    */
    function changeListPosition(current: number, newPos: number) {
        // remove specified article
        const article = articles.value.splice(current, 1)[0];

        // place in new position
        articles.value.splice(newPos, 0, article);
        unsavedChanges.value = true;
    }

    onMounted(async () => {
        await getArticles();
    });
</script>

<template>
    <MDBBtn color="primary" floating size="lg" :class="gettingArticles ? 'loader-div loading' : 'loader-div'">
        <MDBSpinner/>
    </MDBBtn>

    <div class="container-fluid container-lg bg-light mt-4 mb-8">
        <draggable v-model="articles" @change="() => { unsavedChanges = true }">
            <transition-group>
                <div class="row justify-content-center my-3" v-for="(article, index) in articles" :key="'article-' + article.infoHash">
                    <div v-if="editMode" class="col-2 edit-icon move-icon flex-column">
                        <MDBIcon v-on:click="changeListPosition(index, 0)"
                            title="Move to beginning of list"
                            icon="angle-double-up" iconStyle="fas" size="2x" />
                        <MDBIcon v-on:click="changeListPosition(index, --index)"
                            title="Move up 1 position"
                            icon="angle-up" iconStyle="fas" size="2x" />
                        <MDBIcon icon="grip-lines" iconStyle="fas" size="2x"
                            title="Move article"/>
                        <MDBIcon v-on:click="changeListPosition(index, ++index)"
                            title="Move down 1 position"
                            icon="angle-down" iconStyle="fas" size="2x" />
                        <MDBIcon v-on:click="changeListPosition(index, --articles.length)"
                            title="Move to end of list"
                            icon="angle-double-down" iconStyle="fas" size="2x" />
                    </div>
                    <div :class="editMode ? 'col-8' : 'col-12 col-lg-8'">
                        <FeedArticle v-bind:article="article.metainfo" :smallImage="editMode"/>
                    </div>
                    <div v-if="editMode" class="col-2 edit-icon">
                        <MDBIcon icon="trash" title="Remove article" iconStyle="fas" size="2x" v-on:click="removeArticle(index)"/>
                    </div>
                </div>
            </transition-group>
        </draggable>

        <div class="row" v-if="articles.length == 0">
            <div class="col-12 d-flex align-items-center justify-content-center">
                <p>{{ gettingArticles ? `Getting List articles..` : 'No articles available' }}</p>
            </div>
        </div>
    </div>

    <MDBFooter v-if="gettingArticles === false && editMode" bg="primary" :text="['white', 'center']" class="fixed-bottom p-3">
        <div class="container d-flex align-items-center justify-content-around">
            <div class="d-none d-lg-flex align-items-center">
                <h3 class="m-0">{{ list.name }}</h3>
                <h5 class="m-0 ms-4">{{ articles.length }} articles</h5>
                <MDBIcon v-if="unsavedChanges" class="ms-4" icon="exclamation-circle" iconStyle="fas"  title="There are unsaved changes"/>
            </div>
            <MDBSpinner v-if="processingList" />
            <div v-else class="d-flex align-items-center justify-content-center">
                <MDBIcon v-if="unsavedChanges" v-on:click="saveCurrentList" icon="save" iconStyle="fas" size="2x" class="me-4" title="Save List Changes"/>
                <MDBIcon v-if="unsavedChanges" v-on:click="resetCurrentList" icon="undo" iconStyle="fas" size="2x" class="me-4" title="Undo All List Changes"/>
                <MDBIcon v-on:click="downloadList" icon="cloud-download-alt" iconStyle="fas" size="2x" class="me-4" title="Download List to get Updates"/>
                <MDBIcon v-on:click="uploadList" icon="cloud-upload-alt" iconStyle="fas" size="2x" class="me-4" :title="unsavedChanges ? 'Save and Upload List' : 'Upload List'"/>
                <MDBIcon icon="times" title="Stop Editing" iconStyle="fas" size="2x" v-on:click="() => editMode = false"/>
            </div>
        </div>
    </MDBFooter>
    <MDBBtn color="primary" v-if="gettingArticles === false && editMode === false" floating size="lg" class="loader-div loading">
        <MDBIcon icon="edit" title="Edit List" iconStyle="fas" v-on:click="() => editMode = true"/>
    </MDBBtn>
</template>

<style scoped>
    i {
        cursor: pointer;
    }
    .edit-icon {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .move-icon i.fa-grip-lines {
        cursor: row-resize;
    }
    .loader-div {
        position: fixed;
        bottom: -100px;
        right: 0;
        margin: 15px;
        z-index: 1000;
        transition-duration: 0.3s;
        transition-property: all;
        line-height: 0;
    }
    .loader-div.loading {
        bottom: 0;
    }
</style>
