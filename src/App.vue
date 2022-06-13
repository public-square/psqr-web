<script setup lang="ts">
    import SidebarNav from "@/components/SidebarNav.vue";
    import {
        MDBNavbar,
        MDBIcon,
        MDBBtn
    } from "mdb-vue-ui-kit";
    import { ref } from "vue";

    const refreshing = ref(false);
    const registration = ref();
    const updateExists = ref(false);

    // Listen for our custom event from the SW registration
    document.addEventListener('swUpdated', updateAvailable, { once: true })

    // Prevent multiple refreshes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing.value) return
        refreshing.value = true
        // Here the actual reload of the page occurs
        window.location.reload()
    });

    // Store the SW registration so we can send it a message
    // We use `updateExists` to control whatever alert, toast, dialog, etc we want to use
    // To alert the user there is an update they need to refresh for
    function updateAvailable(event) {
        registration.value = event.detail
        updateExists.value = true
    }

    // Called when the user accepts the update
    function refreshApp() {
        console.log('Refreshing App to update');
        updateExists.value = false
        // Make sure we only send a 'skip waiting' message if the SW is waiting
        if (!registration.value || !registration.value.waiting) return
        // send message to SW to skip the waiting and activate the new SW
        registration.value.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
</script>

<template>
    <SidebarNav>
    </SidebarNav>
    <header class="sticky-top" v-if="$route.name !== 'Splash'">
        <!-- Navbar -->
        <MDBNavbar expand="lg" dark bg="dark" container>
            <router-link :to="{ name: 'Base Feed' }" class="navbar-brand align-items-center">
                <img
                    src="./assets/ology-icon.png"
                    alt="Logo"
                    class="company-logo"
                />
                <h3 class="company-name m-0 mx-1">Ology Newswire</h3>
            </router-link>
            <button class="px-2 text-white bg-transparent border-0" data-bs-toggle="offcanvas" data-bs-target="#offcanvas-menu" aria-controls="offcanvas-menu">
                <MDBIcon
                    icon="bookmark"
                    iconStyle="fa"
                    size="md"
                />
            </button>
        </MDBNavbar>
        <div v-if="updateExists" class="alert alert-warning text-center" role="alert" data-mdb-color="warning">
          An update is available:
          <MDBBtn color="primary" @click="refreshApp">Update</MDBBtn>
        </div>
    </header>
    <router-view />
</template>

<style scoped>
    #app {
    font-family: Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    }

    .company-name {
        font-family: 'Montserrat', sans-serif;
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 3px;
        display: none;
    }
    .company-logo {
        max-width: 100%;
        height: auto;
        max-height: 30px;
    }

    .bookmark-nav .dropdown-toggle::after {
        display: none;
    }

    a.dropdown-item {
        cursor: pointer;
    }

    @media (min-width: 992px) {
        .company-name {
            display: block;
        }
    }

    /* sliding nav css */
    .slidein {
    max-width: 600px;
    padding: 2em 3em;
    padding-top: 5em;
    position: fixed;
    z-index: 100;
    top: 0;
    right: 0;
    background: #ddd;
    height: 100%;
    box-shadow: 1px 1px 10px rgba(0, 0, 0, 0.5);
    transition: all 0.5s ease-in-out;
    }

    /* before the element is shown, start off the screen to the right */
    .slide-enter, .slide-leave-active {
    right: -100%;
    }

    .close-btn {
    border: none;
    font-weight: bold;
    font-size: 2em;
    background: transparent;
    position: absolute;
    top: 0;
    left: 0;
    padding: 0.5em;
    }
</style>
