<script setup lang="ts">
    import Feed from "@/components/Feed.vue";
    import { ref, onMounted } from "vue";
    import { onBeforeRouteUpdate } from 'vue-router';
    import { setFeedUrl } from "@/functions/feed";

    const feedName = ref('home');
    const feedUrl = ref('');

    onMounted(() => {
        feedUrl.value = setFeedUrl(feedName.value);
    })

    onBeforeRouteUpdate((to) => {
        feedUrl.value = setFeedUrl(to.params.feedName as string);
    })
</script>

<template>
    <Feed v-bind:url="feedUrl"/>
</template>
