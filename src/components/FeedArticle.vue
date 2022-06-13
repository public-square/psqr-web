<script setup lang="ts">
    import {
        MDBCol,
        MDBIcon,
    } from "mdb-vue-ui-kit";
    import { ref, toRefs, Ref, onMounted } from "vue";
    import "linkifyjs/lib/linkify-string";
    import 'linkify-plugin-mention';
    import 'linkify-plugin-hashtag';
    import * as timeago from 'timeago.js';
    import { decodeHtml } from "@/functions/utility";

    import { Static } from 'runtypes';
    import { Article } from '@/types/runtypes/article';

    // define props
    interface Props {
        article: Static<typeof Article>
        smallImage?: boolean
    }

    const { article, smallImage = false } = defineProps<Props>()

    const taglineCollapse = ref(false);
    const imgExpand = ref(false);
    const el = ref(null);

    const articleTimestamp = article.info.publicSquare.package.publishDate;
    const articleTime = ref(getReadableDate(articleTimestamp));

    onMounted(() => {
        setTimeOrDate(articleTimestamp);
        makeIntersectionObserver();
    });

    /**
    * Set Time or Date based on the Timestamp
    *
    * @param timestamp
    */
    function setTimeOrDate(timestamp: number) {
        const current = Date.now();
        const difference = current - timestamp;
        const limit = 1 * 60 * 60 * 1000;

        if (difference < limit) {
            articleTime.value = timeago.format(timestamp);
        } else {
            articleTime.value = getReadableDate(timestamp);
        }
    }

    /**
    * Get a Readable Date from the Timestamp
    *
    * @param timestamp
    * @return Date
    */
    function getReadableDate(timestamp: number) {
        const options = {
            hour: 'numeric',
            minute: 'numeric',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }

        return new Date(timestamp).toLocaleString('en-US', options);
    }

    /**
    * Create Intersection Observer associated with each individual Feed Article and Beacon
    */
    function makeIntersectionObserver() {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry && entry.isIntersecting) {
                    observer.unobserve(entry.target);

                    let params = new URLSearchParams({
                        utm_source: 'ology',
                        utm_medium: 'feed',
                        utm_campaign: 'ology.com',
                    });

                    let url = process.env.VUE_APP_BEACON_ENDPOINT + article.infoHash + '?' + params.toString();

                    navigator.sendBeacon(url);
                }
            });
        });

        observer.observe(el.value);
    }

    function replaceByDefault(e: any) {
        e.target.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    }
</script>

<template>
    <div class="card" :id="'article-' + article.infoHash" ref="el">
        <div :class="'card-header ' + (taglineCollapse ? '' : 'p-0')">
            <div class="d-flex flex-column">
                <div
                    class="d-flex align-items-center justify-content-between header-click"
                    @click="taglineCollapse = !taglineCollapse"
                    :aria-controls="'tagline-' + article.infoHash"
                    :aria-expanded="taglineCollapse"
                    :class="taglineCollapse ? '' : 'p-3'"
                >
                    <div class="d-flex align-items-center" :data-url="article.createdBy">
                        <img
                            v-if="article.provenance.publisher.image != ''"
                            class="rounded-circle mx-1"
                            :height="taglineCollapse ? 75 : 35"
                            :src="article.provenance.publisher.image"
                            @error="replaceByDefault"
                            alt=""
                            loading="lazy"
                        />
                        <p
                            class="text-muted m-0 mx-1"
                            :class="taglineCollapse ? 'h3 mx-3' : ''"
                        >{{ article.provenance.publisher.name }}</p>
                        <a
                            v-if="taglineCollapse"
                            :href="article.provenance.publisher.url"
                            target="_blank"
                            color="primary"
                        >
                            <MDBIcon
                                v-if="/twitter.com/.test(article.provenance.publisher.url) === true"
                                icon="twitter"
                                iconStyle="fab"
                                size="md"
                            />
                            <MDBIcon
                                v-if="/twitter.com/.test(article.provenance.publisher.url) === false"
                                icon="link"
                                iconStyle="fas"
                                size="md"
                                class="text-body"
                            />
                        </a>
                    </div>
                    <MDBIcon
                        v-if="taglineCollapse"
                        icon="times"
                        iconStyle="fas"
                        size="lg"
                        class="mx-1"
                    />
                    <MDBIcon v-else icon="plus" iconStyle="fas" size="sm" class="mx-1" />
                </div>
                <div
                    :id="'tagline-' + article.infoHash"
                    :class="'collapse ' + (taglineCollapse ? 'show' : '')"
                >
                    <p
                        class="mt-3 text-muted"
                        v-html="decodeHtml(article.provenance.publisher.tagline || '')"
                    ></p>
                    <router-link
                        :to="`${$router.resolve({name: 'Publisher'}).href}/${article.createdBy}`">View More from {{ article.provenance.publisher.name }}</router-link>
                </div>
            </div>
        </div>
        <div class="row justify-content-center align-items-center m-0">
            <MDBCol
                col="12"
                :lg="article.info.publicSquare.package.image != '' && imgExpand == false ? '8' : '12'"
            >
                <div class="card-body p-md-4 px-0 py-2">
                    <h5
                        class="card-title"
                        v-if="article.info.publicSquare.package.title != ''"
                    >{{ article.info.publicSquare.package.title }}</h5>
                    <div
                        class="card-text"
                        v-html="decodeHtml(article.info.publicSquare.package.description)"
                    ></div>
                    <div class="d-flex align-items-center justify-content-between">
                        <a
                            :href="article.info.publicSquare.package.canonicalUrl"
                            target="_blank"
                            class="text-muted"
                        >
                            View {{ article.contentType || 'Article' }}
                            <MDBIcon
                                v-if="article.contentType == 'Tweet'"
                                icon="twitter"
                                iconStyle="fab"
                                size="md"
                                class="text-primary m-2"
                            />
                        </a>
                        <p
                            class="text-muted m-0 mx-1"
                            :title="getReadableDate(articleTimestamp)"
                        >{{ articleTime }}</p>
                    </div>
                </div>
            </MDBCol>
            <MDBCol
                v-if="article.info.publicSquare.package.image != '' && smallImage === false"
                col="12"
                lg="4"
                class="p-2"
                :class="imgExpand ? 'col-lg-12' : ''"
            >
                <div class="bg-image hover-overlay">
                    <img
                        :class="imgExpand ? 'card-img' : 'card-img limit-height'"
                        :alt="article.provenance.publisher.name"
                        :src="article.info.publicSquare.package.image"
                        loading="lazy"
                    />
                    <button
                        class="d-none d-lg-block d-xl-block border-0"
                        @click="imgExpand = !imgExpand"
                    >
                        <div
                            class="mask overlay d-flex align-items-center justify-content-center text-light card-img"
                            style="background-color: rgba(0, 0, 0, 0.6)"
                        >
                            <MDBIcon v-if="imgExpand" icon="compress" iconStyle="fas" size="3x" />
                            <MDBIcon v-else icon="expand" iconStyle="fas" size="lg" />
                        </div>
                    </button>
                </div>
            </MDBCol>
            <MDBCol
                v-if="article.info.publicSquare.package.image != '' && smallImage"
                col="4"
                class="p-2 d-none d-lg-block"
            >
                <img
                    class="card-img hard-limit-height"
                    :alt="article.provenance.publisher.name"
                    :src="article.info.publicSquare.package.image"
                    loading="lazy"
                />
            </MDBCol>
        </div>
    </div>
</template>

<style>
    .header-click {
        cursor: pointer;
    }

    .card-body {
        font-size: 14px;
    }

    @media (min-width: 992px) {
        .limit-height {
            object-fit: cover;
            max-height: 200px;
        }
    }

    .hard-limit-height {
        object-fit: cover;
        max-height: 200px;
    }
</style>
