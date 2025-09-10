import { createApp } from 'vue'
import App from './App.vue'
import './styles/main.css'

// 创建Vue应用实例
const app = createApp(App)

// 全局配置
app.config.globalProperties.$version = '1.0.0'

// 挂载应用到DOM
app.mount('#app')

// 开发环境下的调试信息
if (import.meta.env.DEV) {
  console.log('🚀 Markdown Converter App 已启动')
  console.log('📝 支持的格式: PDF, Word, PNG')
}