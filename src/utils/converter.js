import { marked } from 'marked'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { saveAs } from 'file-saver'
import DOMPurify from 'dompurify'

/**
 * Markdown转换工具类
 * 支持转换为PDF、Word、PNG格式
 */
class MarkdownConverter {
  constructor() {
    // 配置marked解析器
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: false,
      mangle: false
    })
  }
  
  /**
   * 主转换方法
   * @param {string} markdownContent - Markdown内容
   * @param {string} format - 输出格式 ('pdf', 'word', 'png')
   */
  async convert(markdownContent, format) {
    if (!markdownContent.trim()) {
      throw new Error('Markdown内容不能为空')
    }
    
    console.log(`🔄 开始转换为${format.toUpperCase()}格式`)
    
    switch (format) {
      case 'pdf':
        return await this.convertToPDF(markdownContent)
      case 'word':
        return await this.convertToWord(markdownContent)
      case 'png':
        return await this.convertToPNG(markdownContent)
      default:
        throw new Error(`不支持的格式: ${format}`)
    }
  }
  
  /**
   * 转换为PDF格式
   * @param {string} markdownContent - Markdown内容
   */
  async convertToPDF(markdownContent) {
    try {
      // 将markdown转换为HTML
      const html = marked(markdownContent)
      const cleanHtml = DOMPurify.sanitize(html)
      
      // 创建临时DOM元素用于渲染
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = cleanHtml
      tempDiv.style.cssText = `
        width: 800px;
        padding: 40px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        line-height: 1.6;
        color: #333;
        background: white;
        position: absolute;
        top: -9999px;
        left: -9999px;
      `
      
      // 添加样式
      this.applyPDFStyles(tempDiv)
      
      document.body.appendChild(tempDiv)
      
      // 使用html2canvas生成图片
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })
      
      // 清理临时元素
      document.body.removeChild(tempDiv)
      
      // 创建PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210 // A4宽度
      const pageHeight = 295 // A4高度
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      
      let position = 0
      
      // 添加第一页
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      // 如果内容超过一页，添加更多页面
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      // 下载PDF
      pdf.save('markdown-document.pdf')
      
      console.log('✅ PDF转换完成')
      
    } catch (error) {
      console.error('❌ PDF转换失败:', error)
      throw new Error('PDF转换失败: ' + error.message)
    }
  }
  
  /**
   * 转换为Word格式
   * @param {string} markdownContent - Markdown内容
   */
  async convertToWord(markdownContent) {
    try {
      // 简单的markdown到文本转换
      // 注意：这是一个基础实现，复杂的markdown可能需要更高级的解析
      const lines = markdownContent.split('\n')
      const paragraphs = []
      
      for (const line of lines) {
        if (line.trim() === '') {
          continue
        }
        
        // 处理标题
        if (line.startsWith('#')) {
          const level = line.match(/^#+/)[0].length
          const text = line.replace(/^#+\s*/, '')
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: text,
                  bold: true,
                  size: Math.max(24 - level * 2, 16) * 2 // Word使用半点单位
                })
              ],
              spacing: { after: 200 }
            })
          )
        }
        // 处理普通文本
        else {
          const text = line.replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
                          .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
                          .replace(/`(.*?)`/g, '$1') // 移除代码标记
          
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: text
                })
              ],
              spacing: { after: 120 }
            })
          )
        }
      }
      
      // 创建Word文档
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs
        }]
      })
      
      // 生成并下载
      const blob = await Packer.toBlob(doc)
      saveAs(blob, 'markdown-document.docx')
      
      console.log('✅ Word转换完成')
      
    } catch (error) {
      console.error('❌ Word转换失败:', error)
      throw new Error('Word转换失败: ' + error.message)
    }
  }
  
  /**
   * 转换为PNG格式
   * @param {string} markdownContent - Markdown内容
   */
  async convertToPNG(markdownContent) {
    try {
      // 将markdown转换为HTML
      const html = marked(markdownContent)
      const cleanHtml = DOMPurify.sanitize(html)
      
      // 创建临时DOM元素
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = cleanHtml
      tempDiv.style.cssText = `
        width: 800px;
        padding: 40px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 16px;
        line-height: 1.6;
        color: #333;
        background: white;
        position: absolute;
        top: -9999px;
        left: -9999px;
        border: 1px solid #e1e5e9;
        border-radius: 8px;
      `
      
      // 添加样式
      this.applyImageStyles(tempDiv)
      
      document.body.appendChild(tempDiv)
      
      // 生成图片
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })
      
      // 清理临时元素
      document.body.removeChild(tempDiv)
      
      // 下载图片
      canvas.toBlob((blob) => {
        saveAs(blob, 'markdown-document.png')
      }, 'image/png')
      
      console.log('✅ PNG转换完成')
      
    } catch (error) {
      console.error('❌ PNG转换失败:', error)
      throw new Error('PNG转换失败: ' + error.message)
    }
  }
  
  /**
   * 为PDF应用样式
   * @param {HTMLElement} element - 目标元素
   */
  applyPDFStyles(element) {
    const style = document.createElement('style')
    style.textContent = `
      h1, h2, h3, h4, h5, h6 {
        margin-top: 24px;
        margin-bottom: 16px;
        font-weight: 600;
        line-height: 1.25;
      }
      h1 { font-size: 24px; }
      h2 { font-size: 20px; }
      h3 { font-size: 18px; }
      h4 { font-size: 16px; }
      h5 { font-size: 14px; }
      h6 { font-size: 12px; }
      p {
        margin-bottom: 16px;
      }
      code {
        background-color: #f6f8fa;
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 12px;
      }
      pre {
        background-color: #f6f8fa;
        padding: 16px;
        border-radius: 6px;
        overflow-x: auto;
        margin-bottom: 16px;
      }
      blockquote {
        border-left: 4px solid #dfe2e5;
        padding-left: 16px;
        margin-left: 0;
        color: #6a737d;
      }
      ul, ol {
        margin-bottom: 16px;
        padding-left: 24px;
      }
      li {
        margin-bottom: 4px;
      }
    `
    element.appendChild(style)
  }
  
  /**
   * 为图片应用样式
   * @param {HTMLElement} element - 目标元素
   */
  applyImageStyles(element) {
    this.applyPDFStyles(element) // 使用相同的样式
  }
}

// 导出单例实例
export const markdownConverter = new MarkdownConverter()