import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createHtmlPlugin } from 'vite-plugin-html'
// import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs'
// import { resolve } from 'path'
// import { minify } from 'html-minifier-terser'
import fs from 'fs'
import path from 'path'

// Vite配置文件 - 支持Vue.js开发和构建
export default defineConfig({
  plugins: [
    vue(),
    createHtmlPlugin({
      minify: {
        // 移除HTML注释
        removeComments: true,
        // 移除多余空白
        collapseWhitespace: true,
        // 移除属性引号（当安全时）
        removeAttributeQuotes: true,
        // 移除空属性
        removeEmptyAttributes: true
      }
    }),
    // 自定义插件处理public目录中的静态文件
    {
      name: 'minify-public-files',
      generateBundle: async function(options, bundle) {
        const { minify } = await import('html-minifier-terser')
        const CleanCSS = (await import('clean-css')).default
        
        // 处理public目录中的HTML文件
        const publicDir = path.resolve('public')
        const distDir = path.resolve('dist')
        
        // 确保dist目录存在
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true })
        }
        
        // 递归处理public目录
        const processDirectory = async (srcDir, destDir) => {
          const items = fs.readdirSync(srcDir)
          
          for (const item of items) {
            const srcPath = path.join(srcDir, item)
            const destPath = path.join(destDir, item)
            const stat = fs.statSync(srcPath)
            
            if (stat.isDirectory()) {
              // 创建目录
              if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true })
              }
              await processDirectory(srcPath, destPath)
            } else if (stat.isFile()) {
              const ext = path.extname(item).toLowerCase()
              
              if (ext === '.html') {
                // 处理HTML文件
                const content = fs.readFileSync(srcPath, 'utf8')
                const minified = await minify(content, {
                  removeComments: true,
                  collapseWhitespace: true,
                  removeAttributeQuotes: true,
                  removeEmptyAttributes: true,
                  minifyCSS: true,
                  minifyJS: true
                })
                fs.writeFileSync(destPath, minified)
              } else if (ext === '.css') {
                // 处理CSS文件
                const content = fs.readFileSync(srcPath, 'utf8')
                const cleanCSS = new CleanCSS({ level: 2 })
                const result = cleanCSS.minify(content)
                fs.writeFileSync(destPath, result.styles)
              } else {
                // 直接复制其他文件
                fs.copyFileSync(srcPath, destPath)
              }
            }
          }
        }
        
        await processDirectory(publicDir, distDir)
      }
    }
  ],
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