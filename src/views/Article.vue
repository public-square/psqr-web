<script setup lang="ts">
    import { ref, onMounted, Ref } from "vue";
    import {
        MDBContainer,
        MDBCard,
        MDBSpinner,
        MDBCardBody,
        MDBCardTitle,
        MDBCardText,
        MDBBtn,
    } from "mdb-vue-ui-kit";
    import { useRoute } from 'vue-router';
    import axios from "axios";
    import { Article } from "@/types/Article";

    const route = useRoute();
    const spinnerVisible = ref(false);
    const gettingArticle = ref(false);
    const articleData: Ref<Article | null> = ref(null);
    let article = ref(route.params.infoHash ? route.params.infoHash : null);
    let infoHash = article.value || '';

    /**
    * Get Article based on the provided infoHash
    *
    * @param infoHash
    */
    async function getData(infoHash: string) {
        spinnerVisible.value = true;
        gettingArticle.value = true;

        let response;
        let link = process.env.VUE_APP_API_ENDPOINT + '/api/article/' + infoHash;

        try {
            response = await axios.get(link);
        } catch (e) {
            articleData.value = null;
            console.log(e);
            gettingArticle.value = false;
            spinnerVisible.value = false;
        }

        let results = response?.data?.data;

        articleData.value = typeof(results) === 'undefined' ? null : results;

        spinnerVisible.value = false;
        gettingArticle.value = false;
    }

    onMounted(async () => {
        await getData(infoHash as string);
    });
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
        <hr />

        <MDBContainer>
            <MDBCard class="mt-3" v-if="articleData !== null">
                <MDBCardBody>
                    <MDBCardTitle>{{ articleData.metainfo.info.publicSquare.package.title }}</MDBCardTitle>

                    <MDBCardText>
                        {{ articleData.metainfo.info.publicSquare.package.description }}
                    </MDBCardText>

                    <a :href="(articleData.metainfo.info.publicSquare.package.canonicalUrl || '')" target="_blank" class="btn btn-primary">View Original</a>
                </MDBCardBody>
            </MDBCard>
        </MDBContainer>

        <div class="row" v-if="articleData === null">
            <div class="col-12 d-flex align-items-center justify-content-center">
                <p>{{ gettingArticle ? 'Finding article...' : 'Article Not Found' }}</p>
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
