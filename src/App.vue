<template>
  <div id="app">
    <!-- 导航栏 -->
    <nav class="navbar" role="navigation" aria-label="主导航">
      <div class="nav-container">
        <!-- Logo和品牌名 -->
        <div class="nav-brand">
          <h1 aria-label="Markdown转换器主页">📝 Markdown Converter</h1>
        </div>
        
        <!-- 导航菜单 -->
        <div class="nav-menu" role="menubar">
          <a href="#" 
             @click="currentPage = 'home'" 
             :class="{active: currentPage === 'home'}"
             role="menuitem"
             :aria-current="currentPage === 'home' ? 'page' : null"
             aria-label="Return to home page">{{ t('nav.home') }}</a>
          <a href="/help.html" 
             role="menuitem"
             aria-label="help">{{ t('nav.help') }}</a>
          <a href="/about.html" 
             role="menuitem"
             aria-label="about us">{{ t('nav.about') }}</a>
        </div>
        
        <!-- 语言切换 -->
        <div class="language-switch">
          <button @click="toggleLanguage" 
                  class="lang-btn"
                  :aria-label="`切换到${currentLang === 'en' ? '中文' : '英文'}语言`"
                  :title="`当前语言: ${currentLang === 'en' ? 'English' : '中文'}`">
            {{ currentLang === 'en' ? '中文' : 'English' }}
          </button>
        </div>
      </div>
    </nav>
    
    <!-- 主要内容区域 -->
    <main class="main-content" 
          role="main" 
          aria-label="主要内容区域"
          :aria-live="currentPage === 'home' ? 'polite' : null">
      <!-- 主页组件 -->
      <HomePage v-if="currentPage === 'home'" 
                :language="currentLang" 
                aria-label="Markdown converter home page" />
    </main>
    
    <!-- 页脚 -->
    <footer class="footer" 
            role="contentinfo" 
            aria-label="网站信息">
      <div class="footer-content">
        <p>&copy; 2025 Markdown Converter. {{ t('footer.rights') }}</p>
        <p>{{ t('footer.contact') }}: 
          <a href="mailto:clairescott2205@gmail.com" 
             aria-label="Send email to developer"
             title="Contact us">clairescott2205@gmail.com</a>
        </p>
      </div>
    </footer>
  </div>
</template>

<script>
import HomePage from './components/HomePage.vue'
import { translations } from './utils/i18n.js'

export default {
  name: 'App',
  components: {
    HomePage
  },
  data() {
    return {
      currentPage: 'home',
      currentLang: 'en', // 默认英文
      translations
    }
  },
  methods: {
    /**
     * 切换语言
     */
    toggleLanguage() {
      this.currentLang = this.currentLang === 'en' ? 'zh' : 'en'
      // 保存语言偏好到本地存储
      localStorage.setItem('preferred-language', this.currentLang)
      // 更新HTML lang属性用于SEO
      document.documentElement.lang = this.currentLang === 'zh' ? 'zh-CN' : 'en'
    },
    
    /**
     * 获取翻译文本
     * @param {string} key - 翻译键
     * @returns {string} 翻译后的文本
     */
    t(key) {
      const keys = key.split('.')
      let value = this.translations[this.currentLang]
      
      for (const k of keys) {
        value = value?.[k]
      }
      
      return value || key
    }
  },
  
  mounted() {
    // 从本地存储恢复语言偏好
    const savedLang = localStorage.getItem('preferred-language')
    if (savedLang && ['en', 'zh'].includes(savedLang)) {
      this.currentLang = savedLang
    }
    
    // 设置HTML lang属性
    document.documentElement.lang = this.currentLang === 'zh' ? 'zh-CN' : 'en'
    
    console.log('🌐 current language:', this.currentLang)
  }
}
</script>

<style>
/* 全局样式在main.css中定义 */
</style>