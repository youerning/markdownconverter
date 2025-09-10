<template>
  <div class="homepage">
    <!-- 主标题区域 -->
    <section class="hero-section">
      <div class="container">
        <h1 class="hero-title">{{ t('home.title') }}</h1>
        <p class="hero-subtitle">{{ t('home.subtitle') }}</p>
      </div>
    </section>
    
    <!-- 转换工具区域 -->
    <section class="converter-section">
      <div class="container">
        <div class="converter-card">
          <!-- 输入方式选择 -->
          <div class="input-tabs">
            <button 
              @click="inputMode = 'upload'" 
              :class="{active: inputMode === 'upload'}"
              class="tab-btn"
            >
              📁 {{ t('home.uploadTab') }}
            </button>
            <button 
              @click="inputMode = 'paste'" 
              :class="{active: inputMode === 'paste'}"
              class="tab-btn"
            >
              📝 {{ t('home.pasteTab') }}
            </button>
          </div>
          
          <!-- 文件上传区域 -->
          <div v-if="inputMode === 'upload'" class="upload-area">
            <div 
              @drop="handleDrop"
              @dragover.prevent
              @dragenter.prevent
              :class="{dragover: isDragOver}"
              @dragenter="isDragOver = true"
              @dragleave="isDragOver = false"
              class="drop-zone"
            >
              <input 
                ref="fileInput"
                type="file"
                accept=".md,.markdown,.txt"
                @change="handleFileSelect"
                style="display: none"
              >
              <div class="drop-content">
                <div class="upload-icon">📄</div>
                <p>{{ t('home.dragDrop') }}</p>
                <button @click="$refs.fileInput.click()" class="select-btn">
                  {{ t('home.selectFile') }}
                </button>
              </div>
            </div>
            <div v-if="selectedFile" class="file-info">
              <span>✅ {{ selectedFile.name }}</span>
            </div>
          </div>
          
          <!-- 文本粘贴区域 -->
          <div v-if="inputMode === 'paste'" class="paste-area">
            <textarea 
              v-model="markdownText"
              :placeholder="t('home.pasteHere')"
              class="markdown-input"
              rows="10"
            ></textarea>
          </div>
          
          <!-- 格式选择和转换 -->
          <div class="conversion-controls">
            <div class="format-selector">
              <label>{{ t('home.formatLabel') }}</label>
              <select v-model="outputFormat" class="format-select">
                <option value="pdf">📄 {{ t('formats.pdf') }}</option>
                <option value="word">📝 {{ t('formats.word') }}</option>
                <option value="png">🖼️ {{ t('formats.png') }}</option>
              </select>
            </div>
            
            <button 
              @click="convertFile"
              :disabled="isConverting || !hasContent"
              class="convert-btn"
            >
              {{ isConverting ? t('home.processing') : t('home.convertBtn') }}
            </button>
          </div>
        </div>
      </div>
    </section>
    
    <!-- 社交分享区域 -->
    <section class="social-section">
      <div class="container">
        <h3>{{ t('home.shareTitle') }}</h3>
        <div class="social-buttons">
          <button @click="shareToTwitter" class="social-btn twitter">🐦 Twitter</button>
          <button @click="shareToFacebook" class="social-btn facebook">📘 Facebook</button>
          <button @click="shareToLinkedIn" class="social-btn linkedin">💼 LinkedIn</button>
          <button @click="copyLink" class="social-btn copy">🔗 Copy Link</button>
        </div>
      </div>
    </section>
    
    <!-- 嵌入代码区域 -->
    <section class="embed-section">
      <div class="container">
        <h3>{{ t('home.embedTitle') }}</h3>
        <div class="embed-code">
          <textarea 
            readonly 
            :value="embedCode"
            class="embed-textarea"
            rows="3"
          ></textarea>
          <button @click="copyEmbedCode" class="copy-embed-btn">
            {{ t('home.embedCode') }}
          </button>
        </div>
      </div>
    </section>
    
    <!-- Markdown介绍区域 -->
    <section class="info-section">
      <div class="container">
        <div class="info-grid">
          <div class="info-card">
            <h3>{{ t('home.aboutMarkdown') }}</h3>
            <p>{{ t('home.markdownDesc') }}</p>
          </div>
          
          <div class="info-card">
            <h3>{{ t('home.helpLinks') }}</h3>
            <ul class="help-links">
              <li><a href="help.html#syntax" target="_blank">{{ t('home.syntaxGuide') }}</a></li>
              <li><a href="help.html#what-is" target="_blank">{{ t('home.whatIsMarkdown') }}</a></li>
              <li><a href="help.html#differences" target="_blank">{{ t('home.differences') }}</a></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { markdownConverter } from '../utils/converter.js'
import { translations } from '../utils/i18n.js'

export default {
  name: 'HomePage',
  props: {
    language: {
      type: String,
      default: 'en'
    }
  },
  data() {
    return {
      inputMode: 'upload', // 'upload' 或 'paste'
      selectedFile: null,
      markdownText: '',
      outputFormat: 'pdf',
      isConverting: false,
      isDragOver: false,
      embedCode: '<iframe src="https://markdowntopdf.top" width="800" height="600" frameborder="0"></iframe>'
    }
  },
  computed: {
    /**
     * 检查是否有内容可以转换
     */
    hasContent() {
      return this.inputMode === 'upload' ? !!this.selectedFile : !!this.markdownText.trim()
    }
  },
  methods: {
    /**
     * 获取翻译文本
     */
    t(key) {
      const keys = key.split('.')
      let value = translations[this.language]
      
      for (const k of keys) {
        value = value?.[k]
      }
      
      return value || key
    },
    
    /**
     * 处理文件拖拽放置
     */
    handleDrop(event) {
      event.preventDefault()
      this.isDragOver = false
      
      const files = event.dataTransfer.files
      if (files.length > 0) {
        this.handleFile(files[0])
      }
    },
    
    /**
     * 处理文件选择
     */
    handleFileSelect(event) {
      const file = event.target.files[0]
      if (file) {
        this.handleFile(file)
      }
    },
    
    /**
     * 处理文件
     */
    handleFile(file) {
      // 检查文件类型
      const validTypes = ['.md', '.markdown', '.txt']
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
      
      if (!validTypes.includes(fileExtension)) {
        alert(this.t('messages.unsupportedFile'))
        return
      }
      
      this.selectedFile = file
      console.log('📁 文件已选择:', file.name)
    },
    
    /**
     * 转换文件
     */
    async convertFile() {
      if (!this.hasContent) {
        alert(this.t('messages.noContent'))
        return
      }
      
      this.isConverting = true
      
      try {
        let content = ''
        
        // 获取markdown内容
        if (this.inputMode === 'upload' && this.selectedFile) {
          content = await this.readFileContent(this.selectedFile)
        } else {
          content = this.markdownText
        }
        
        // 执行转换
        await markdownConverter.convert(content, this.outputFormat)
        
        console.log('✅ 转换完成:', this.outputFormat)
        
      } catch (error) {
        console.error('❌ 转换失败:', error)
        alert(this.t('messages.error'))
      } finally {
        this.isConverting = false
      }
    },
    
    /**
     * 读取文件内容
     */
    readFileContent(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = (e) => reject(e)
        reader.readAsText(file)
      })
    },
    
    /**
     * 分享到Twitter
     */
    shareToTwitter() {
      const url = encodeURIComponent(window.location.href)
      const text = encodeURIComponent('Check out this amazing Markdown to PDF converter!')
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank')
    },
    
    /**
     * 分享到Facebook
     */
    shareToFacebook() {
      const url = encodeURIComponent(window.location.href)
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
    },
    
    /**
     * 分享到LinkedIn
     */
    shareToLinkedIn() {
      const url = encodeURIComponent(window.location.href)
      const title = encodeURIComponent('Markdown to PDF Converter')
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}`, '_blank')
    },
    
    /**
     * 复制链接
     */
    async copyLink() {
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard!')
      } catch (error) {
        console.error('复制失败:', error)
      }
    },
    
    /**
     * 复制嵌入代码
     */
    async copyEmbedCode() {
      try {
        await navigator.clipboard.writeText(this.embedCode)
        alert('Embed code copied to clipboard!')
      } catch (error) {
        console.error('复制失败:', error)
      }
    }
  }
}
</script>

<style scoped>
/* 组件样式在main.css中定义 */
</style>