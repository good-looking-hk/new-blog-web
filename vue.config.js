'use strict'
const path = require('path')
const defaultSettings = require('./src/modules/index/settings.js')
const isDebug = process.env.NODE_ENV !== 'production'
console.error('当前环境为:' + process.env.NODE_ENV)
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
// npm run build:prod index，值为index
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
  outputDir: 'dist/' + projectname,
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
    config.plugins.delete('preload')
    config.plugins.delete('prefetch')

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
    config
      // https://webpack.js.org/configuration/devtool/#development
      .when(process.env.NODE_ENV === 'development',
        config => config.devtool('cheap-source-map')
      )
  },
  transpileDependencies: [
    'vue-echarts',
    'resize-detector'
  ]
}
