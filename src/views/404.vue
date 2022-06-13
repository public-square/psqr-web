<template>
    <section class="d-flex align-items-center justify-content-center text-center" style="height: calc(100vh - 70px);">
        <div class="container">
            <h1 class="mt-5">Page not found</h1>
            <p class="lead my-4">Oops! Looks like you found a page that doesnt exist!</p>
            <router-link  :to="{ name: 'Base Feed' }" class="btn btn-primary mb-4">
                Back to homepage
            </router-link>
        </div>
    </section>
</template>
