<script setup lang="ts">
    import {
        MDBCol,
        MDBIcon,
    } from "mdb-vue-ui-kit";
    import { ref } from "vue";
    import "linkifyjs/lib/linkify-string";
    import { decodeHtml } from "@/functions/utility";

    import { Static } from 'runtypes';
    import { Article } from '@/types/runtypes/article';

    // define props
    interface Props {
        article: Static<typeof Article>
    }
    const { article} = defineProps<Props>()

    const imgExpand = ref(false);
</script>

<template>
    <div class="card">
        <div class="row justify-content-center align-items-center m-0">
            <MDBCol
                col="12"
                :lg="article.info.publicSquare.package.image != '' && imgExpand == false ? '8' : '12'"
            >
                <div class="card-body p-md-4 px-0 py-2">
                    <div
                        class="card-text"
                        v-html="decodeHtml(article.info.publicSquare.package.description)"
                    ></div>
                </div>
            </MDBCol>
            <MDBCol
                v-if="article.info.publicSquare.package.image != ''"
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
        </div>
    </div>
</template>
