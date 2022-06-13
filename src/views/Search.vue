<script setup lang="ts">
    import { ref, onMounted, watch, Ref } from "vue";
    import ArticleThread from "@/components/ArticleThread.vue";
    import { MDBSpinner, MDBBtn } from "mdb-vue-ui-kit";
    import { useRoute } from 'vue-router';
    import * as utility from '@/functions/utility';
    import * as feed from '@/functions/feed';
    import Observer from "@/components/Observer.vue";
    import axios from "axios";
    import { Thread } from '@/types/Thread';
    import { Feed } from "@/types/Feed";

    const spinnerVisible = ref(false);
    const gettingArticles = ref(false);
    const noMoreResults = ref(false);
    const threads: Ref<Thread[]> = ref([]);
    const feedUrl = ref('');
    const searchParam = ref('');
    const currentPage = ref(1);
    const route = useRoute();

    /**
    * Get Search Data based on Term and Specified Page
    *
    * @param nextPage Boolean to allow more pages to be fetched
    */
    async function getData (nextPage: boolean) {
        if (gettingArticles.value == true) {
            return;
        }

        if (noMoreResults.value === true) {
            return;
        }

        if (nextPage === true) {
            ++currentPage.value;
        }

        spinnerVisible.value = true;
        gettingArticles.value = true;

        let response;

        const currentFeed = ref<Feed>({
            feedUrl: feedUrl.value,
            latestEtag: '',
            articles: Array<Thread>(),
            duplicateArticles: Array<string>(),
            hashes: Array<string>(),
            allArticles: Array<Thread>(),
        });

        let url = process.env.VUE_APP_API_ENDPOINT + '/api/search';

        try {
            response = await axios.post(url, {
                term: searchParam.value,
                page: currentPage.value,
            });
        } catch (e) {
            gettingArticles.value = false;
            spinnerVisible.value = false;
            console.error(e);
        }

        const ingestedArticles = Array<Thread>();
        let results = response?.data?.results;

        if (results.length === 0 || typeof(results) === 'undefined') {
            noMoreResults.value = true;
            spinnerVisible.value = false;
            gettingArticles.value = false;
            return;
        }

        for (let i = 0; i < results.length; i++) {
            const parsedArticle = results[i];

            let convertedArticle = parsedArticle.metainfo;
            convertedArticle.feedCopy = parsedArticle;

            ingestedArticles.push(convertedArticle);
        }

        // filter out articles that have already been displayed
        let newArticles = Array<Thread>();
        for (let j = 0; j < ingestedArticles.length; j++) {
            const article = ingestedArticles[j];

            const valid = await utility.validateArticle(article);

            if (!valid) {
                continue;
            }

            if (article.info.publicSquare.package.canonicalUrl && /twitter.com\/.+\/status/.test(article.info.publicSquare.package.canonicalUrl)) {
                article.contentType = 'Tweet';
            }

            if (currentFeed.value.hashes.includes(article.infoHash) == false) {
                newArticles.push(article);
                // include in allArticles
                currentFeed.value.allArticles.push(article);
            }
        }

        for (let i = 0; i < newArticles.length; i++) {
            let article = newArticles[i];

            currentFeed.value.hashes.push(article.infoHash);
            article = await feed.addReplyThread(currentFeed as unknown as Feed, article);

            // skip if duplicate
            if (currentFeed.value.duplicateArticles.includes(article.infoHash)) {
                continue;
            }

            // add to articles and thread if not a duplicate
            currentFeed.value.articles.push(article);

            if (feedUrl.value !== currentFeed.value.feedUrl) {
                continue;
            }

            // if feed hasn't changed, add new article to thread list
            // @ts-ignore
            threads.value.push(feed.convertArticleToThread(article));

            if (i % 10 === 0) {
                // force it to render every 10 elements
                await utility.skipFrame();

                // hide the spinner after the first 20
                if (i === 20 && spinnerVisible.value === true) {
                    spinnerVisible.value = false;
                }
            }
        }

        spinnerVisible.value = false;
        gettingArticles.value = false;
    }

    async function intersected () {
        await getData(true);
    }

    onMounted(async () => {
        currentPage.value = 1;

        let search = route.params.param ? route.params.param : null;

        searchParam.value = search as string;

        await getData(false);
    })

    watch(
        () => route.params.param,
        async newSearch => {
            searchParam.value = newSearch as string;
            currentPage.value = 1;
            noMoreResults.value = false;
            threads.value = [];

            if (typeof(searchParam.value) !== 'undefined' && searchParam.value !== null) {
                await getData(false);
            }
        }
    )
</script>

<template>
    <MDBBtn color="primary" floating size="lg" :class="spinnerVisible ? 'loader-div loading' : 'loader-div'">
        <MDBSpinner/>
    </MDBBtn>

    <div class="container-fluid container-lg bg-light mt-4">
        <div class="row justify-content-center">
            <h4 class="col-12 col-lg-8 text-center">
                Learn
                <a href="https://ology.substack.com/p/the-time-has-come" target="_blank">more</a>
                and
                <a href="https://ology.substack.com/about" target="_blank">subscribe</a>
                for updates.
            </h4>
        </div>

        <ArticleThread v-for="thread in threads"
            :key="'thread-' + thread[0].infoHash"
            :thread="thread"
            :feedUrl="feedUrl">
        </ArticleThread>
        <Observer :options="{ rootMargin: '1000px' }" @intersect="intersected"></Observer>

        <div class="row" v-if="threads.length == 0">
            <div class="col-12 d-flex align-items-center justify-content-center">
                <p>{{ gettingArticles ? 'Finding articles...' : 'No articles available' }}</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
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
