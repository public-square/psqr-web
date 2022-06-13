<script setup lang="ts">
    import { computed } from 'vue'

    // define props
    interface Props {
        maxVisibleButtons?: number,
        totalPages: number,
        total: number,
        perPage: number,
        currentPage: number,
        loading: boolean
    }

    const { maxVisibleButtons = 5, totalPages, total, perPage, currentPage, loading } = defineProps<Props>();

    // define computed variables
    const startPage = computed(() => {
        if (currentPage < 3) {
            return 1;
        }

        if (currentPage === totalPages) {
            return totalPages - maxVisibleButtons + 1;
        }

        return currentPage - 2;
    });

    const endPage = computed(() => Math.min(startPage.value + maxVisibleButtons - 1, totalPages));

    const pages = computed(() => {
        const range = [];

        for (let i = startPage.value; i <= endPage.value; i += 1) {
            range.push({
                name: i,
                isDisabled: i === currentPage || loading === true
            });
        }

        return range;
    });

    const isInFirstPage = computed(() => loading ? true : currentPage === 1);
    const isInLastPage = computed(() => loading ? true : currentPage === totalPages);

    // define emits and functions
    const emit = defineEmits<{
        (e: 'pagechanged', value: number): void
    }>()

    function onClickFirstPage() {
        emit('pagechanged', 1);
    }

    function onClickPreviousPage() {
        emit('pagechanged', currentPage - 1);
    }

    function onClickPage(page: number) {
        emit('pagechanged', page);
    }

    function onClickNextPage() {
        emit('pagechanged', currentPage + 1);
    }

    function onClickLastPage() {
        emit('pagechanged', totalPages);
    }

    function isPageActive(page: number) {
        return currentPage === page;
    }
</script>

<template>
    <ul class="pagination justify-content-center">
        <li class="page-item">
            <button class="page-link" type="button" @click="onClickFirstPage" :disabled="isInFirstPage"
                aria-label="Go to first page">
                First
            </button>
        </li>

        <li class="page-item">
            <button class="page-link" type="button" @click="onClickPreviousPage" :disabled="isInFirstPage"
                aria-label="Go to previous page">
                Previous
            </button>
        </li>

        <li v-for="page in pages" :class="'page-item ' + (isPageActive(page.name) ? 'active' : '')" :key="page">
            <button class="page-link" type="button" @click="onClickPage(page.name)" :disabled="page.isDisabled"
                :id="`page-${page.name}`" :aria-label="`Go to page number ${page.name}`">
                {{ page.name }}
            </button>
        </li>

        <li class="page-item">
            <button class="page-link" type="button" @click="onClickNextPage" :disabled="isInLastPage"
                aria-label="Go to next page">
                Next
            </button>
        </li>

        <li class="page-item">
            <button class="page-link" type="button" @click="onClickLastPage" :disabled="isInLastPage"
                aria-label="Go to last page">
                Last
            </button>
        </li>
    </ul>
</template>
