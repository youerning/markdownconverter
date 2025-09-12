import { Hono } from 'hono';
import type { Env } from 'hono';
import mainMiddleware from './middleware/main.js';

// 定义环境变量类型
interface AppEnv extends Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
}

// 创建一个新的 Hono 应用实例
const app = new Hono<{ Bindings: AppEnv }>();

// 全局中间件，用于记录请求并注入 Google Analytics
app.use('*', mainMiddleware);

// 注册 Daily Hot API 路由
// app.route('/api/daily-hot', createDailyHotApp());

// // 注册根路由
// app.route('/', indexRouter);

// 对于所有其他 GET 请求，尝试从静态资源中提供文件
// 这是处理静态资源的回退方案
app.get('*', (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

// 导出 Hono 应用
export default app;