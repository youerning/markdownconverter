import type { Context, Next, MiddlewareHandler } from 'hono';

// 定义 HTMLRewriter 相关类型
declare global {
  interface HTMLRewriter {
    on(selector: string, handler: any): HTMLRewriter;
    transform(response: Response): Response;
  }
  
  interface Element {
    append(content: string, options?: { html?: boolean }): void;
  }
}

// --- Google Analytics 注入逻辑 ---

const gaScript = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QZWS21RCLH"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-QZWS21RCLH');
</script>

<!-- Bing Clarity -->
<script type="text/javascript">
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "sf1930vsh8");
</script>
`;

/**
 * HTMLRewriter 处理器，用于向 <head> 标签中注入脚本。
 */
const footerHTML = `
<footer style="text-align: center; padding: 20px; font-size: 14px; color: #888; border-top: 1px solid #eee; margin-top: 40px;">
  <p>
    联系邮箱: <a href="mailto:mail@youerning.top" style="text-decoration: none;">mail@youerning.top</a>
  </p>
  <p>
    小红书: <a href="https://www.xiaohongshu.com/user/profile/67ac9987000000000e01256d" style="text-decoration: none;">邓胖的建站日记</a> | 微信公众号: <a href="https://youerning.top/images/youerbiji.png" style="text-decoration: none;">又耳笔记</a>
  </p>
</footer>
`;

/**
 * HTMLRewriter 处理器，用于向 <body> 标签追加页脚。
 */
// 注入页脚
class BodyInjector {
  private html: string;

  /**
   * @param html 要注入的 HTML 字符串
   */
  constructor(html: string) {
    this.html = html;
  }

  /**
   * 当遇到 <body> 元素时，向其追加页脚。
   * @param element HTMLRewriter 元素
   */
  element(element: any): void {
    element.append(this.html, { html: true });
  }
}

// 在head注入各种script标签，比如Google analytics，bing clarity
class HeadInjector {
  private script: string;

  /**
   * @param script 要注入的 HTML 脚本字符串
   */
  constructor(script: string) {
    this.script = script;
  }

  /**
   * 当遇到 <head> 元素时，向其追加脚本。
   * @param element HTMLRewriter 元素
   */
  element(element: any): void {
    element.append(this.script, { html: true });
  }
}

const mainMiddleware: MiddlewareHandler = async (c: Context, next: Next): Promise<void> => {
  // 记录请求
  // console.log(`请求: ${c.req.method} ${c.req.url}`);

  // 执行下游中间件和路由
  await next();

  // 在响应发送前注入 GA 脚本
  try {
    const contentType = c.res.headers.get('Content-Type');
    // 调试日志：输出所有响应头
    // console.log('--- 响应头信息 ---');
    // for (const [key, value] of c.res.headers.entries()) {
    //   console.log(`${key}: ${value}`);
    // }
    // console.log('--------------------');

    if (contentType && contentType.includes('text/html')) {
      // console.log('检测到 HTML 响应，正在注入 Google Analytics...');
      const rewriter = new HTMLRewriter()
        .on('head', new HeadInjector(gaScript))
        .on('body', new BodyInjector(footerHTML));
      c.res = rewriter.transform(c.res);
    }
  } catch (e) {
    console.error('Google Analytics 注入失败:', e);
  }
}

export default mainMiddleware