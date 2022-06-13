<script setup lang="ts">
    import { ref, onMounted, watch, Ref } from "vue";
    import { onBeforeRouteLeave } from "vue-router";
    import ArticleThread from "@/components/ArticleThread.vue";
    import { MDBSpinner, MDBBtn, MDBIcon, MDBFooter } from "mdb-vue-ui-kit";
    import * as utility from '@/functions/utility';
    import * as feed from '@/functions/feed';
    import { getAllLists, parseListKey } from '@/functions/store';
    import axios from "axios";
    import { Thread } from '@/types/Thread';

    // define props
    interface Props {
        url: string
    }

    const props = defineProps<Props>()

    // setup universal vars
    let updateInterval: any;
    const spinnerMin = 1500;
    const threads: Ref<Thread[]> = ref([]);
    const gettingArticles = ref(false);

    // set up spinner visibility and watcher
    const spinnerVisible = ref(false);
    watch(gettingArticles, (gettingArticles) => spinnerVisible.value = gettingArticles);

    // setup parent feeds
    let feeds: any = {};
    const feedUrl = ref(props.url || null);
    const feedEditKeyName = localStorage.getItem('feedEditKey');

    /**
    * Get Articles for a given Feed
    *
    * @param currentFeed Current Feed to fetch articles (specified in case it gets changed)
    * @param etag entity tage
    * @param link URL
    * @return array of articles
    */
    async function getArticles(currentFeed: any, etag = '', link: string | null = null) {
        // get articles from url
        const ingestedArticles = [];

        let urlObj = new URL(currentFeed.feedUrl);
        urlObj.searchParams.append('cb', window.location.hostname);

        link = urlObj.href;

        try {
            let config: any = {
                validateStatus: function (status: number) {
                    return status == 200 || status == 304;
                },
                url: link,
            };

            if (etag != '') {
                config.headers = {
                    'If-None-Match': etag
                };
            }

            const response = await axios.request(config);

            if (response.status === 304) {
                return [];
            }

            currentFeed.latestEtag = response.headers.etag || '';
            const articleList = response.data.split("\n");

            for (let i = 0; i < articleList.length; i++) {
                const line = articleList[i];

                if (line !== "") {
                    try {
                        const parsedArticle = JSON.parse(line);
                        let convertedArticle = JSON.parse(JSON.stringify(parsedArticle.metainfo));
                        convertedArticle.feedCopy = JSON.parse(JSON.stringify(parsedArticle));

                        ingestedArticles.push(convertedArticle);
                    } catch (e) {
                        console.log("Skipped invalid line: " + line);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }

        // filter out articles that have already been displayed
        let newArticles = [];
        for (let j = 0; j < ingestedArticles.length; j++) {
            const article = ingestedArticles[j];

            if (/twitter.com\/.+\/status/.test(article.info.publicSquare.package.canonicalUrl)) {
                article.contentType = 'Tweet';
            }

            if (currentFeed.hashes.includes(article.infoHash) == false) {
                newArticles.push(article);
                // include in allArticles
                currentFeed.allArticles.push(article);
            }
        }

        return newArticles;
    }

    /**
    * Add Articles to the current visible feed
    */
    async function addArticles() {
        if (gettingArticles.value) {
            return;
        }

        gettingArticles.value = true;
        const startTime = Date.now();
        console.log(`Getting new articles for feed ${feedUrl.value}`);

        // set feed to be used through entire process
        if (feedUrl.value === null) {
            gettingArticles.value = false;
            console.log(`FeedUrl is undefined`);
            return;
        }
        const currentFeed = feeds[feedUrl.value];
        if (typeof currentFeed === 'undefined') {
            gettingArticles.value = false;
            console.log(`${feedUrl.value} feed not created yet`);
            return;
        }

        const newArticles = await getArticles(currentFeed, currentFeed.latestEtag);
        console.log(`Found ${newArticles.length} new articles`);

        const sortedArticles = newArticles.sort((a, b) => {
            if (
                a.info.publicSquare.package.publishDate >
                b.info.publicSquare.package.publishDate
            ) {
                return 1; // use b first
            } else {
                return -1; // use a first
            }
        });

        for (let i = 0; i < sortedArticles.length; i++) {
            let article = sortedArticles[i];

            const valid = await utility.validateArticle(article);

            if (!valid) {
                continue;
            }

            currentFeed.hashes.push(article.infoHash);
            article = await feed.addReplyThread(currentFeed, article);

            // skip if duplicate
            if (currentFeed.duplicateArticles.includes(article.infoHash)) {
                continue;
            }

            const articleTime = article.info.publicSquare.package.publishDate;

            if (currentFeed.articles.at(0).info.publicSquare.package.publishDate < articleTime) {
                // check if article is newer than first
                currentFeed.articles.unshift(article);

                if (feedUrl.value !== currentFeed.feedUrl) {
                    continue;
                }

                // if feed hasn't changed, add new article to thread list
                threads.value.unshift(feed.convertArticleToThread(article));
            } else if (currentFeed.articles.at(-1).info.publicSquare.package.publishDate > articleTime) {
                // check if article is older than last
                currentFeed.articles.push(article);

                if (feedUrl.value !== currentFeed.feedUrl) {
                    continue;
                }

                // if feed hasn't changed, add new article to thread list
                threads.value.push(feed.convertArticleToThread(article));
            } else {
                // place article correctly
                for (let j = 0; j < currentFeed.articles.length; j++) {
                    const present = currentFeed.articles[j];
                    const presentTime = present.info.publicSquare.package.publishDate;

                    if (articleTime > presentTime) {
                        currentFeed.articles.splice(j, 0, article);

                        // if feed hasn't changed, add new article to thread list
                        if (feedUrl.value === currentFeed.feedUrl) {
                            threads.value.splice(j, 0, feed.convertArticleToThread(article));
                        }
                        break;
                    }
                }
            }

            if (i % 10 === 0) {
                // force it to render every 10 elements
                await utility.skipFrame();
            }
        }

        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < spinnerMin) {
            setTimeout(
                () => { gettingArticles.value = false },
                spinnerMin
            )
        } else {
            gettingArticles.value = false
        }
    }

    /**
    * Fetch the Initial Articles for a Feed
    */
    async function makeInitialArticles() {
        if (feedUrl.value === null) {
            console.log(`FeedUrl is undefined`);
            return;
        }

        gettingArticles.value = true;
        const startTime = Date.now();
        console.log(`Getting initial articles for ${feedUrl.value}`);
        console.debug(`${Date.now()} Starting makeInitialArticles`);

        // setup new feed object
        feeds[feedUrl.value] = {
            feedUrl: feedUrl.value,
            latestEtag: '',
            articles: [],
            duplicateArticles: [],
            hashes: [],
            allArticles: []
        }
        // set feed to be used through entire process
        const currentFeed = feeds[feedUrl.value];

        const initialArticles = await getArticles(currentFeed);

        console.log(`Found ${initialArticles.length} initial articles`);
        console.debug(`${Date.now()} Retrieved articles from getArticles`)

        const sortedArticles = initialArticles.sort((a, b) => {
            if (
                a.info.publicSquare.package.publishDate <
                b.info.publicSquare.package.publishDate
            ) {
                return 1; // use b first
            } else {
                return -1; // use a first
            }
        });

        for (let j = 0; j < sortedArticles.length; j++) {
            let article = sortedArticles[j];

            const valid = await utility.validateArticle(article);

            if (!valid) {
                continue;
            }

            currentFeed.hashes.push(article.infoHash);
            article = await feed.addReplyThread(currentFeed, article);

            // skip if duplicate
            if (currentFeed.duplicateArticles.includes(article.infoHash)) {
                continue;
            }

            // add to articles and thread if not a duplicate
            currentFeed.articles.push(article);

            if (feedUrl.value !== currentFeed.feedUrl) {
                continue;
            }

            // if feed hasn't changed, add new article to thread list
            threads.value.push(feed.convertArticleToThread(article));

            if (j % 10 === 0) {
                // force it to render every 10 elements
                await utility.skipFrame();

                // hide the spinner after the first 20
                if (j === 20 && spinnerVisible.value === true) {
                    spinnerVisible.value = false;
                }
            }
        }

        console.debug(`${Date.now()} All valid articles have been added`)

        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < spinnerMin) {
            setTimeout(
                () => { gettingArticles.value = false },
                spinnerMin
            )
        } else {
            gettingArticles.value = false
        }
    }

   /**
    * Switch Feeds to new specified feed
    *
    * @param url Feed URL
    */
    async function switchFeeds(url: string) {
        threads.value = [];
        console.log(`Switched feeds to ${url}`)
        feedUrl.value = url;

        // reset update interval
        clearInterval(updateInterval);
        setInterval(addArticles, 60 * 1000);

        // if undefined feed needs to be created
        const currentFeed = feeds[url];
        if (typeof currentFeed === 'undefined') {
            await makeInitialArticles();
        } else {
            gettingArticles.value = true;
            const startTime = Date.now();
            const articles = currentFeed.articles;
            for (let i = 0; i < articles.length; i++) {
                const article = articles[i];

                if (feedUrl.value !== currentFeed.feedUrl) {
                    // check if feed has changed
                    break;
                }

                // add thread to list
                threads.value.push(feed.convertArticleToThread(article));

                if (i % 10 === 0) {
                    // force it to render every 10 elements
                    await utility.skipFrame();
                }
            }

            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < spinnerMin) {
                setTimeout(
                    () => { gettingArticles.value = false },
                    spinnerMin
                )
            } else {
                gettingArticles.value = false
            }
        }
    }

    // setup add to list functionality
    const lists: Ref<any[]> = ref([]);
    const addList = ref('');
    const editMode = ref(false);
    const showEditBtn = ref(false);

   /**
    * Get All Lists
    */
    async function getLists() {
        lists.value = await getAllLists();

        if (lists.value.length > 0) {
            addList.value = lists.value[0].name;
        }
    }

    onMounted(async () => {
        await makeInitialArticles();
        await getLists();

        showEditBtn.value = (lists.value.length > 0 || feedEditKeyName != null);
        updateInterval = setInterval(addArticles, 60 * 1000);
    });

    // enable feed switching
    watch(
        () => props.url,
        (val) => switchFeeds(val)
    );

    // ensure interval doesn't run in the background elsewhere
    onBeforeRouteLeave(() =>
        clearInterval(updateInterval)
    )
</script>

<template>
    <MDBBtn
        color="primary"
        floating
        size="lg"
        :class="spinnerVisible ? 'loader-div loading' : 'loader-div'"
    >
        <MDBSpinner />
    </MDBBtn>

    <MDBBtn
        color="primary"
        v-if="gettingArticles === false && showEditBtn && editMode === false"
        floating
        size="lg"
        class="loader-div loading"
    >
        <MDBIcon
            icon="edit"
            title="Add Feed articles to List"
            iconStyle="fas"
            v-on:click="() => editMode = true"
        />
    </MDBBtn>

    <div class="container-fluid container-lg bg-light mt-4">
        <div class="row justify-content-center">
            <h4 class="col-12 col-lg-8 text-center">
                Learn
                <a href="https://ology.substack.com/p/the-time-has-come" target="_blank">more</a>
                and
                <a
                    href="https://ology.substack.com/about"
                    target="_blank"
                >subscribe</a>
                for updates.
            </h4>
        </div>

        <ArticleThread
            v-for="thread in threads"
            :key="'thread-' + thread[0].infoHash"
            :thread="thread"
            :editMode="editMode"
            :addList="addList"
            :feedUrl="feedUrl"
        ></ArticleThread>

        <div class="row" v-if="threads.length == 0">
            <div class="col-12 d-flex align-items-center justify-content-center">
                <p>{{ gettingArticles ? 'Loading articles...' : 'No articles available' }}</p>
            </div>
        </div>
    </div>

    <MDBFooter
        v-if="gettingArticles === false && editMode"
        bg="primary"
        :text="['white', 'center']"
        class="fixed-bottom p-3"
    >
        <div class="container">
            <div class="row justify-content-center align-items-center">
                <div class="col-4 align-items-center" v-if="addList != ''">
                    <h3 class="m-0">List:</h3>
                </div>
                <div class="col-4 align-items-center" v-if="addList != ''">
                    <select
                        id="listSelect"
                        class="form-select"
                        aria-label="List to Add Articles to"
                        v-model="addList"
                    >
                        <option
                            v-for="list in lists"
                            :key="'list-' + parseListKey(list.name)"
                            :value="list.name"
                        >{{ list.name }}</option>
                    </select>
                </div>
                <div class="col-4 align-items-center">
                    <router-link
                        v-if="addList != ''"
                        :to="{ name: 'List', params: { listKey: parseListKey(addList) } }"
                        class="me-2"
                    >
                        <MDBIcon icon="edit" iconStyle="fas" size="2x" title="View and Edit List" />
                    </router-link>
                    <MDBIcon
                        icon="times"
                        title="Stop Editing"
                        iconStyle="fas"
                        size="2x"
                        v-on:click="() => editMode = false"
                    />
                </div>
            </div>
        </div>
    </MDBFooter>
</template>

<style scoped lang="scss">
    .header-brand {
        justify-content: center;
        align-items: center;
        .company-logo {
            max-height: 30px;
        }
        .company-name {
            font-size: 23px;
            display: block;
        }
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
    a i {
        color: #fff;
        cursor: pointer;
    }

    @media (min-width: 576px) {
        .header-brand {
            .company-logo {
                max-height: 50px;
            }
            .company-name {
                font-size: 45px;
                display: block;
            }
        }
    }

    @media (min-width: 1400px) {
        .header-brand {
            .company-logo {
                max-height: 75px;
            }
            .company-name {
                font-size: 65px;
            }
        }
    }
</style>
