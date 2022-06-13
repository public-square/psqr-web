<script setup lang="ts">
    import { ref, onMounted } from "vue";
    import {
        MDBIcon,
        MDBSpinner,
    } from "mdb-vue-ui-kit";
    import FeedArticle from "@/components/FeedArticle.vue";
    import ReplyArticle from "@/components/ReplyArticle.vue";
    import { CompactSign } from "jose-browser-runtime";

    import { addArticleToList, getKeyPair } from '@/functions/store';
    import { extractRef } from '@/functions/utility';
    import axios from 'axios';

    const encoder = new TextEncoder();

    // define props
    const props = defineProps({
        thread: {
            type: Array,
            required: true
        },
        editMode: {
            type: Boolean,
            required: true
        },
        addList: {
            type: String,
            required: true
        },
        feedUrl: {
            type: String,
            required: true
        },
    });

    const threadItems = ref(props.thread);
    const addingArticle = ref(-1);
    const deletingArticle = ref(-1);

    /**
    * Add Article to List at Desired Position
    *
    * @param article Article to add to to List
    * @param i Desired Index
    */
    async function addArticle(article: any, i: number) {
        addingArticle.value = i;
        const articleObj = JSON.parse(JSON.stringify(article));
        await addArticleToList(props.addList, articleObj.feedCopy);

        addingArticle.value = -1
    }

    let feedEditKeyPair: any;
    const feedEditKeyName = localStorage.getItem('feedEditKey');


    /**
    * Delete Article from List at Desired Location
    *
    * @param article Article to Delete
    * @param i Desired Index
    */
    async function deleteArticle(article: any, i: number) {
        deletingArticle.value = i;
        const articleObj = JSON.parse(JSON.stringify(article));

        // assemble url
        const hash = articleObj.infoHash;
        const urlObj = new URL(props.feedUrl);
        const url = 'https://' + urlObj.hostname + '/api/article/' + hash;

        try {
            // create JWS of article
            const JWS = await new CompactSign(encoder.encode(JSON.stringify(articleObj)))
                .setProtectedHeader({
                    alg: 'ES384',
                    kid: feedEditKeyPair.kid
                })
                .sign(feedEditKeyPair.private);

            const resp = await axios.delete(url, {
                data: {
                    token: JWS
                },
            });

            console.log(resp);

            // remove item from thread
            let newItems = extractRef(threadItems);
            newItems.splice(i, 1);
            threadItems.value = newItems;
        } catch (error) {
            console.error(error);

            if (error instanceof Error) {
                alert(error.message);
            }
        }

        deletingArticle.value = -1
    }

    onMounted(async () => {
        if (feedEditKeyName != null) {
            feedEditKeyPair = await getKeyPair(feedEditKeyName);
        }
    });
</script>

<template>
    <div
        class="row justify-content-center my-3"
        v-for="(article, index) in threadItems"
        :key="'article-' + article.infoHash"
    >
        <div class="col-12 col-lg-8" v-if="index == 0">
            <FeedArticle v-bind:article="article" />
        </div>
        <div class="col-1 d-flex align-items-center justify-content-center" v-if="index != 0">
            <MDBIcon icon="caret-right" iconStyle="fas" size="2x" />
        </div>
        <div class="col-11 col-lg-7" v-if="index != 0">
            <ReplyArticle v-bind:article="article" />
        </div>

        <div
            class="col-1 d-flex flex-column align-items-center justify-content-center p-4 edit-panel"
            v-if="editMode"
        >
            <div v-if="addList.length > 0">
                <MDBIcon
                    v-if="addingArticle !== index"
                    icon="plus"
                    iconStyle="fas"
                    size="2x"
                    title="Add to list"
                    @click="addArticle(article, index)"
                />
                <MDBSpinner v-else />
            </div>

            <div v-if="feedEditKeyName != null" class="mt-2">
                <MDBIcon
                    v-if="deletingArticle !== index"
                    icon="trash"
                    iconStyle="fas"
                    size="2x"
                    title="Delete from Feed"
                    @click="deleteArticle(article, index)"
                />
                <MDBSpinner v-else />
            </div>
        </div>
    </div>
</template>

<style scoped>
    .edit-panel i {
        cursor: pointer;
    }
</style>
