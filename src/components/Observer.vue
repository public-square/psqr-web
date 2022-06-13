<script setup lang="ts">
    import { onMounted, onUnmounted, ref, Ref } from "vue";

    // define props
    interface Props {
        options?: any
    }
    const defaultOptions = {
        root: null,
        threshold: 0,
        rootMargin: '200px',
    }

    const { options = defaultOptions } = defineProps<Props>();
    const emit = defineEmits(['intersect']);

    const observeEl: Ref<Element | null> = ref(null);
    let observer: any;

    onMounted(() => {
        observer = new IntersectionObserver(([entry]) => {
            if (entry && entry.isIntersecting) {
                emit('intersect');
            }
        }, options);

        if (observeEl.value === null) {
            return;
        }

        observer.observe(observeEl.value);
    });

    onUnmounted(() => {
        observer.disconnect();
    });
</script>

<template>
    <div class="observer" ref="observeEl"></div>
</template>
