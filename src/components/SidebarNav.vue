<script setup lang="ts">
    import slugify from 'slugify';
    import { Offcanvas, Collapse } from 'bootstrap';
    import { onMounted, ref, Ref } from 'vue';
    import router from '@/router';
    import { FeedTemplate, FeedConfig } from '@/types/FeedConfig';



    const config: Ref<FeedConfig> = ref({
        feeds: {},
        feed_default: {
            name: 'Congress & Senate',
            slug: 'congress-senate',
            url: 'https://feed.ology.com/feed/politics-senators/latest.jsonl',
            canDelete: false
        },
        version: 0,
    });

    const version = process.env.VUE_APP_VERSION;

    const feed_url = ref("");
    const feed_name = ref("");
    const search_term = ref("");

    /**
    * Create FeedTemplate from Data and Add Feed to Feeds
    */
    function addFeed() {
        const slug = slugify(feed_name.value, {
            lower: true,
            strict: true,
            trim: true,
        });

        const feed_config: FeedTemplate = {
            name: feed_name.value,
            slug: slug,
            url: feed_url.value,
            canDelete: true,
        }

        config.value.feeds[slug] = feed_config;
        localStorage.setItem("feed_configuration", JSON.stringify(config.value));

        feed_url.value = "";
        feed_name.value = "";

        //@ts-ignore
        Collapse.getInstance(document.getElementById('add-feed-form')).hide();
    }

    /**
    * Remove Feed from Feeds
    *
    * @param slug Feed with Slug to remove
    */
    function removeFeed(slug: string) {
        delete config.value.feeds[slug]
    }

    function closeSidebar() {
        //@ts-ignore
        Offcanvas.getInstance(document.getElementById('offcanvas-menu')).hide();
    }

    function search() {
        if (search_term.value.length > 0) {
            closeSidebar();
            router.push({ name: 'Search', params: { param: search_term.value } });
        }
    }

    onMounted(() => {
        const saved = localStorage.getItem("feed_configuration");

        if (saved) {
            Object.assign(config.value, JSON.parse(saved));
        }

        let newVersion = false;

        if ((config.value.version || false) !== process.env.VUE_APP_CONFIG_VERSION) {
            // we need to change the version
            config.value.version = process.env.VUE_APP_CONFIG_VERSION;
            newVersion = true;
        }

        if (Object.keys(config.value.feeds).length == 0 || newVersion == true) {
            // if there is no feed, these are the default values.
            // or if it's a new version

            delete config.value.feeds.home;

            config.value.feed_default = {
                name: 'Congress & Senate',
                slug: 'congress-senate',
                url: 'https://feed.ology.com/feed/politics-senators/latest.jsonl',
                canDelete: false,
            }

            config.value.feeds['congress-senate'] = {
                name: 'Congress & Senate',
                slug: 'congress-senate',
                url: 'https://feed.ology.com/feed/politics-senators/latest.jsonl',
                canDelete: false,
            }

            delete config.value.feeds['politics-right-leaning'];

            config.value.feeds['politics-right'] = {
                name: 'Politics Right',
                slug: 'politics-right',
                url: 'https://feed.ology.com/feed/politics-right-leaning/latest.jsonl',
                canDelete: false,
            }

            config.value.feeds['politics-left'] = {
                name: 'Politics Left',
                slug: 'politics-left',
                url: 'https://feed.ology.com/feed/politics-left-leaning/latest.jsonl',
                canDelete: false,
            }

            config.value.feeds['political-news-opinion'] = {
                name: 'Political News & Opinion',
                slug: 'political-news-opinion',
                url: 'https://feed.ology.com/feed/politics-mainstream/latest.jsonl',
                canDelete: false,
            }

            localStorage.setItem("feed_configuration", JSON.stringify(config.value));
        }
    })
</script>

<template>
    <div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvas-menu" aria-labelledby="offcanvas-menu">
        <div class="offcanvas-header">
            <h5 class="offcanvas-title">Ology Navigation - {{ version }}</h5>
            <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div class="offcanvas-body">
            <ul class="nav flex-column">
                <li class="nav-item position-relative" v-for="(feed) in config.feeds" :key="feed.slug">
                    <router-link @click="closeSidebar" class="nav-link"
                        :to="{ name: 'Named Feed', params: { feedName: feed.slug } }">{{ feed.name }}</router-link>
                    <button v-if="feed.canDelete !== false" class="remove-feed-btn btn btn-danger btn-sm"
                        @click="removeFeed(feed.slug)">
                        <i class="fa fa-trash"></i>
                    </button>
                </li>
                <li>
                    <hr>
                </li>
                <li class="nav-item">
                    <router-link class="nav-link" @click="closeSidebar" :to="{ name: 'Settings' }">Settings</router-link>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="https://ology.substack.com/about" target="_blank">About</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" role="button" data-bs-toggle="collapse"
                        data-bs-target="#add-feed-form">Add Feed</a>
                </li>
                <li>
                    <hr>
                </li>
            </ul>
            <div class="collapse" id="add-feed-form">
                <form class="my-2" @submit.prevent="addFeed">
                    <div class="mb-3">
                        <label class="form-label">Feed Name</label>
                        <input class="form-control" v-model="feed_name" placeholder="Feed Name..." />
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Feed URL</label>
                        <input class="form-control" v-model="feed_url" placeholder="Feed URL..." />
                    </div>
                    <button :disabled="feed_url.length === 0 || feed_name.length === 0"
                        class="btn btn-primary btn-block mt-2">
                        Add Feed
                    </button>
                </form>
            </div>
            <div class="" id="search-form">
                <form class="my-2" @submit.prevent="search">
                    <div class="mb-3">
                        <label class="form-label">Search</label>
                        <input required class="form-control" v-model="search_term" placeholder="Search For..." />
                    </div>
                    <button class="btn btn-primary btn-block mt-2">
                        Search
                    </button>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
    @media (hover: hover) {
        .remove-feed-btn {
            display: none;
        }

        .nav-item:hover .remove-feed-btn {
            display: block;
        }
    }

    .remove-feed-btn {
        position: absolute;
        top: 0;
        right: 0;
    }
</style>
