# AIGEO 文章生成与事实核查系统

基于 **React + Netlify Functions + 火山方舟（豆包）联网搜索 API** 开发的轻量级 AIGEO 携程笔记生成与事实核查网页。

---

## 🌟 核心功能

1. **三元素极简输入**：
   - 长尾关键词
   - 目标品牌的基本信息和产品元素
   - 希望文章采用的主题方向或内容备注
2. **全自动三步生成流程**：
   - **第一步**：使用豆包/火山方舟联网 API 搜索长尾词，自动分析并提取搜索结果中**排名第一的品牌**、**主要推荐理由**以及**引用信源和链接**。
   - **第二步**：根据第一名的推荐逻辑，结合目标品牌真实拥有的产品元素生成携程笔记初稿，并列出**目标品牌可以对应的产品元素**。
   - **第三步**：再次调用联网模型进行事实核查，自动修正设施、位置、交通、活动等事实，无法确认的标记为 `[待确认]`。
3. **安全架构**：
   - API 调用全部运行在 Netlify Functions 服务端（`netlify/functions/generate.mjs`），API Key 从环境变量中读取，切勿暴露在网页前端。

---

## 🚀 本地运行与开发

```bash
# 1. 进入项目目录
cd aigeo-article-generator

# 2. 安装依赖
npm install

# 3. 运行本地前端开发服务器
npm run dev
```

前端服务启动后访问 `http://localhost:3000` 即可。

---

## 📦 GitHub 上传与 Netlify 部署说明

### 1. 上传至 GitHub

```bash
git init
git add .
git commit -m "feat: initial commit of AIGEO article generator"
git branch -M main
git remote add origin https://github.com/your-username/aigeo-article-generator.git
git push -u origin main
```

### 2. 部署至 Netlify

1. 登录 [Netlify 官网](https://www.netlify.com/)，点击 **"Add new site"** -> **"Import an existing project"**。
2. 选择 **GitHub** 并授权选择您刚刚创建的 `aigeo-article-generator` 仓库。
3. 部署设置参数填写：
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions` (项目根目录下的 `netlify.toml` 已自动配置)
4. **配置环境变量 (Environment Variables)**：
   在 Netlify 项目设置中（`Site configuration` -> `Environment variables`）新增环境变量：
   - `VOLC_API_KEY`: 您的火山方舟 (Volcengine Ark) API Key（必须）
   - `ARK_ENDPOINT_ID`: 您的推理接入点 Endpoint ID，如 `ep-2025xxxxxx`（可选，默认使用 `doubao-pro-32k`）
5. 点击 **"Deploy site"**，等待构建完成后即可访问部署好的公开网址！

---

## 🔒 隐私与安全性

- 本项目无账号系统、无数据库存储，轻量干净。
- 火山方舟 API Key 严格保存在 Netlify 服务端环境变量中。

---

## 📄 许可证

MIT License
