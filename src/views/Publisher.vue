<script setup lang="ts">
    import Feed from "@/components/Feed.vue";
    import { ref, onMounted } from "vue";
    import { useRoute, onBeforeRouteUpdate } from 'vue-router';
    import axios from "axios";
    import { setFeedUrl } from "@/functions/feed";

    const route = useRoute();
    const publisherData = ref('');
    const feedUrl = ref('');

    let publisher = ref(route.params.publisher ? route.params.publisher : null);

    /**
    * Get Articles Pertaining to the Provided DID
    *
    * @param did
    */
    async function getData(did: string) {
        let response;

        let link = process.env.VUE_APP_API_ENDPOINT + '/api/feed';

        try {
            response = await axios.put(link, {
                dids: [
                    did
                ],
            });
        } catch (e) {
            console.error(e);
        }

        let results = response?.data;

        publisherData.value = typeof(results) === 'undefined' ? '' : results;

        feedUrl.value = results.feedUrl;
    }

    onMounted(async () => {
        await getData(publisher.value as string);
    })

    onBeforeRouteUpdate((to) => {
        feedUrl.value = setFeedUrl(to.params.feedName as string);
    })
</script>

<template>
    <Feed v-bind:url="feedUrl"/>
</template>
