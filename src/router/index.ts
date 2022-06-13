import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Base Feed',
    component: () => import(/* webpackChunkName: "feed" */ '../views/BaseFeed.vue')
  },
  {
    path: '/feed/:feedName',
    name: 'Named Feed',
    component: () => import(/* webpackChunkName: "namedfeed" */ '../views/NamedFeed.vue')
  },
  {
    path: '/article/:infoHash',
    name: 'Article',
    component: () => import(/* webpackChunkName: "article" */ '../views/Article.vue')
  },
  {
    path: '/search/:param',
    name: 'Search',
    component: () => import(/* webpackChunkName: "search" */ '../views/Search.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import(/* webpackChunkName: "settings" */ '../views/Settings.vue')
  },
  {
    path: '/list/:listKey',
    name: 'List',
    component: () => import(/* webpackChunkName: "list" */ '../views/List.vue')
  },
  {
    // because slashes can exist in publisher dids we must write the named route like this:
    // :to="`${$router.resolve({name: 'Publisher'}).href}/${publisher}`"
    path: '/pub/:publisher(.*)?',
    name: 'Publisher',
    component: () => import(/* webpackChunkName: "publisher" */ '../views/Publisher.vue')
  },
  {
    path: '/check',
    name: 'AlgoChecker',
    component: () => import(/* webpackChunkName: "checker" */ '../views/AlgoChecker.vue')
  },
  {
    path: '/:catchAll(.*)',
    name: 'NotFound',
    component: () => import(/* webpackChunkName: "404" */ '../views/404.vue')
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
