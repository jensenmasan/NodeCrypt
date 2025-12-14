# Cloudflare Pages 部署指南

## 部署配置

在Cloudflare Pages中，请使用以下设置：

### 构建设置
- **框架预设**: None (或选择 Vite)
- **构建命令**: `npm run build`
- **构建输出目录**: `dist`
- **Node.js 版本**: 18 (已通过 .node-version 文件指定)

### 环境变量
无需额外的环境变量。

## 常见问题排查

### 问题1: npm audit 警告导致构建失败
如果因为安全审计警告导致构建失败，可以尝试以下解决方案：

1. **本地修复依赖** (推荐):
   ```bash
   npm audit fix
   npm audit fix --force  # 如果上面的命令无法解决
   ```

2. **忽略审计** (临时方案):
   在 `package.json` 中修改构建命令:
   ```json
   "build": "npm install --legacy-peer-deps && vite build"
   ```

### 问题2: 构建超时
如果构建超时，可能是因为依赖安装太慢。解决方案：
- 使用 `npm ci` 代替 `npm install`
- 在构建命令中添加: `npm ci && npm run build`

### 问题3: Worker 需要单独配置
注意：此项目包含 Cloudflare Worker，需要额外配置：

1. Worker 不能直接通过 Cloudflare Pages 部署
2. 需要使用 Wrangler CLI 部署 Worker
3. 部署命令: `npm run deploy`

## 推荐部署方式

### 方式1: 仅部署静态页面到 Cloudflare Pages
如果只需要前端页面：
1. Cloudflare Pages 构建命令: `npm run build`
2. 输出目录: `dist`

### 方式2: 完整部署 (Pages + Worker)
使用 Wrangler CLI 完整部署：
```bash
# 首先构建前端
npm run build

# 然后部署 Worker (包含静态资源)
npm run deploy
```

这会同时部署静态资源和 Worker。

## 当前项目架构

此项目是一个混合架构：
- **前端**: Vite + 原生 JavaScript
- **后端**: Cloudflare Worker + Durable Objects
- **静态资源**: Cloudflare Pages

## 解决当前部署失败

根据截图，建议：

1. **检查 Cloudflare Pages 设置**
   - 确保构建命令是 `npm run build`
   - 确保输出目录是 `dist`

2. **清除缓存重新部署**
   - 在 Cloudflare Pages 控制台，点击 "重新部署"
   - 勾选 "清除缓存" 选项

3. **使用 Wrangler 部署** (推荐)
   而不是使用 Cloudflare Pages UI，直接使用命令行：
   ```bash
   npm run deploy
   ```

## 注意事项

- **Durable Objects**: 需要付费计划才能使用
- **Worker 限制**: 免费计划有调用次数限制
- **域名绑定**: 部署后需要在 Worker 设置中绑定自定义域名
