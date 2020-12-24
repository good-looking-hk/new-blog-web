'use strict'
const path = require('path')
const defaultSettings = require('./src/modules/index/settings.js')
const isDebug = process.env.NODE_ENV !== 'production'

// 定义压缩文件类型
const productionGzipExtensions = ['js', 'css']

function resolve(dir) {
  return path.join(__dirname, dir)
}

const CompressionPlugin = require('compression-webpack-plugin')
const webpack = require('webpack')
const glob = require('glob')
const name = defaultSettings.title // 网址标题
const port = 8013 // 端口配置
const projectname = process.argv[3]

function getEntry() {
  var entries = {}
  if (process.env.NODE_ENV === 'production') {
    entries = {
      index: {
        // page的入口
        entry: 'src/modules/' + projectname + '/main.js',
        // 模板来源
        template: 'public/index.html',
        // 在 dist/index.html 的输出
        filename: 'index.html',
        title: projectname,
        chunks: ['chunk-vendors', 'chunk-common', 'index']
      }
    }
  } else {
    var items = glob.sync('./src/modules/*/*.js')
    for (var i in items) {
      var filepath = items[i]
      var fileList = filepath.split('/')
      var fileName = fileList[fileList.length - 2]
      entries[fileName] = {
        entry: `src/modules/${fileName}/main.js`,
        // 模板来源
        template: `public/index.html`,
        // 在 dist/index.html 的输出
        filename: `${fileName}.html`,
        // 提取出来的通用 chunk 和 vendor chunk。
        chunks: ['chunk-vendors', 'chunk-common', fileName]
      }
    }
  }
  // console.log(process.env.NODE_ENV, process.argv, process.env, entries)
  return entries
}

// All configuration item explanations can be find in https://cli.vuejs.org/config/
module.exports = {
  // hash 模式下可使用
  // publicPath: process.env.NODE_ENV === 'development' ? '/' : './',
  // publicPath: '/',
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  outputDir: 'dist',
  // assetsDir: 'static',
  assetsDir: './',
  lintOnSave: process.env.NODE_ENV === 'development',
  productionSourceMap: false,
  pages: getEntry(),
  devServer: {
    port: port,
    // 是否自动打开浏览器
    open: true,
    overlay: {
      warnings: false,
      errors: true
    },
    proxy: {
      '/api': {
        target: process.env.VUE_APP_BASE_API,
        changeOrigin: true,
        pathRewrite: {
          '^/api': 'api'
        }
      },
      '/auth': {
        target: process.env.VUE_APP_BASE_API,
        changeOrigin: true,
        pathRewrite: {
          '^/auth': 'auth'
        }
      }
    }
  },
  configureWebpack: {
    // provide the app's title in webpack's name field, so that
    // it can be accessed in index.html to inject the correct title.
    name: name,
    resolve: {
      alias: {
        '@': resolve('src/modules/index'),
        '@crud': resolve('src/modules/index/components/Crud')
      }
    },
    plugins: [
      new CompressionPlugin({
        filename: '[path].gz[query]',
        algorithm: 'gzip',
        test: new RegExp('\\.(' + productionGzipExtensions.join('|') + ')$'), // 匹配文件名
        threshold: 10240, // 对10K以上的数据进行压缩
        minRatio: 0.8,
        deleteOriginalAssets: false // 是否删除源文件
      }),
      new webpack.DefinePlugin({
        'process.env': {
          IS_DEBUG: isDebug
        }
      })
    ]
  },
  chainWebpack(config) {
    config.plugins.delete('preload') // TODO: need test
    config.plugins.delete('prefetch') // TODO: need test

    // set svg-sprite-loader
    config.module
      .rule('svg')
      .exclude.add(resolve('src/modules/index//assets/icons'))
      .end()
    config.module
      .rule('icons')
      .test(/\.svg$/)
      .include.add(resolve('src/modules/index/assets/icons'))
      .end()
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })
      .end()

    // set preserveWhitespace
    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap(options => {
        options.compilerOptions.preserveWhitespace = true
        return options
      })
      .end()

    config
      // https://webpack.js.org/configuration/devtool/#development
      .when(process.env.NODE_ENV === 'development',
        config => config.devtool('cheap-source-map')
      )

    config
      .when(process.env.NODE_ENV !== 'development',
        config => {
          config
            .plugin('ScriptExtHtmlWebpackPlugin')
            .after('html')
            .use('script-ext-html-webpack-plugin', [{
            // `runtime` must same as runtimeChunk name. default is `runtime`
              inline: /runtime\..*\.js$/
            }])
            .end()
          config
            .optimization.splitChunks({
              chunks: 'all',
              cacheGroups: {
                libs: {
                  name: 'chunk-libs',
                  test: /[\\/]node_modules[\\/]/,
                  priority: 10,
                  chunks: 'initial' // only package third parties that are initially dependent
                },
                elementUI: {
                  name: 'chunk-elementUI', // split elementUI into a single package
                  priority: 20, // the weight needs to be larger than libs and app or it will be packaged into libs or app
                  test: /[\\/]node_modules[\\/]_?element-ui(.*)/ // in order to adapt to cnpm
                },
                commons: {
                  name: 'chunk-commons',
                  test: resolve('src/modules/index/components'), // can customize your rules
                  minChunks: 3, //  minimum common number
                  priority: 5,
                  reuseExistingChunk: true
                }
              }
            })
          config.optimization.runtimeChunk('single')
        }
      )
  },
  transpileDependencies: [
    'vue-echarts',
    'resize-detector'
  ]
}
