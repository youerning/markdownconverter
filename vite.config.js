import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import { minify } from 'html-minifier-terser'

// Vite配置文件 - 支持Vue.js开发和构建
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 优化构建性能
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue'],
          markdown: ['marked', 'dompurify'],
          export: ['jspdf', 'html2canvas', 'docx', 'file-saver']
        }
      },
      plugins: [
        {
          name: 'copy-and-minify-html-files',
          async writeBundle() {
            // HTML压缩配置
            const minifyOptions = {
              removeComments: true,
              removeRedundantAttributes: true,
              removeScriptTypeAttributes: true,
              removeStyleLinkTypeAttributes: true,
              useShortDoctype: true,
              collapseWhitespace: true,
              removeEmptyAttributes: true,
              minifyCSS: true,
              minifyJS: true,
              removeAttributeQuotes: false
            }
            
            // 复制并压缩help.html和about.html到dist目录
            const files = ['help.html', 'about.html']
            for (const file of files) {
              const src = resolve(file)
              const dest = resolve('dist', file)
              if (existsSync(src)) {
                try {
                  // 读取原始HTML文件
                  const htmlContent = readFileSync(src, 'utf8')
                  // 压缩HTML内容
                  const minifiedHtml = await minify(htmlContent, minifyOptions)
                  // 写入压缩后的文件
                  writeFileSync(dest, minifiedHtml, 'utf8')
                  console.log(`已复制并压缩 ${file} 到 dist 目录`)
                } catch (error) {
                  console.error(`压缩 ${file} 时出错:`, error.message)
                  // 如果压缩失败，则复制原文件
                  copyFileSync(src, dest)
                  console.log(`已复制 ${file} 到 dist 目录（未压缩）`)
                }
              }
            }
            
            // 压缩dist目录中的index.html
            const indexPath = resolve('dist', 'index.html')
            if (existsSync(indexPath)) {
              try {
                const indexContent = readFileSync(indexPath, 'utf8')
                const minifiedIndex = await minify(indexContent, minifyOptions)
                writeFileSync(indexPath, minifiedIndex, 'utf8')
                console.log('已压缩 index.html')
              } catch (error) {
                console.error('压缩 index.html 时出错:', error.message)
              }
            }
          }
        }
      ]
    }
  },
  // SEO优化 - 确保静态资源正确加载
  base: './',
  // 开发时的代理配置（如果需要）
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  }
})