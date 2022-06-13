import 'bootstrap/dist/css/bootstrap.min.css'
import '../mdb/scss/index.free.scss'
//import 'mdb-vue-ui-kit/css/mdb.min.css'
import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import 'bootstrap'
import router from './router'

createApp(App)
    .use(router)
    .mount('#app')
