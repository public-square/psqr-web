process.env.VUE_APP_VERSION = process.env.npm_package_version;

module.exports = {
  pwa: {
    name: 'Ology Newswire',
    themeColor: '#35c2ff'
  },
  chainWebpack: (config) => {
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap((options) => {
        return {
          ...options,
          reactivityTransform: true
        }
      })
  }
}
