<script setup lang="ts">
    import Feed from "@/components/Feed.vue";
    import { ref, onMounted } from "vue";
    import { useRoute, onBeforeRouteUpdate } from 'vue-router';
    import { setFeedUrl } from "@/functions/feed";

    const route = useRoute();
    const feedName = ref(route.params.feedName);
    const feedUrl = ref('');

    onMounted(() => {
        feedUrl.value = setFeedUrl(feedName.value as string);
    })

    onBeforeRouteUpdate((to) => {
        feedUrl.value = setFeedUrl(to.params.feedName as string);
    })
</script>

<template>
    <Feed v-bind:url="feedUrl"/>
</template>
