# 把工作台放到 GitHub Pages（手机电脑同一份）

一句话：页面文件放 GitHub Pages（免费、固定地址、不用开机），数据放你自己的 GitHub 仓库，两边填同一份配置就同步了。

全文约 15 分钟，只需要一个 GitHub 账号，不用买域名、不用服务器。

---

## 先说清楚一件事：数据要不要公开

GitHub Pages 的站点是公开的，页面源码谁都能看。数据的安全性取决于你把它放在哪个仓库：

- **方案 A（省事，1 个仓库）**：页面和数据放同一个公开仓库。好处是最少步骤；代价是**数据文件也公开**，知道仓库地址的人能看到你的任务、项目、客户名。只适合放不含客户敏感信息的版本。
- **方案 B（推荐，2 个仓库）**：页面放一个公开仓库（只有 index.html，没有数据），数据放一个**私有仓库**。页面通过令牌读私有仓库，别人打开页面看不到内容。免费账号完全支持私有仓库。

下面按方案 B 写，方案 A 就是把两个仓库合并成一个、跳过第 4 步。

---

## 1. 建「页面仓库」（公开）

1. 打开 https://github.com/new
2. Repository name 填 `workbench`（名字随意，会成为网址的一部分）
3. 选 **Public**
4. 勾上 `Add a README file`
5. Create repository

## 2. 把页面传上去

1. 在仓库页点 **Add file → Upload files**
2. 把本目录的 `index.html` 拖进去
3. 底部点 **Commit changes**

## 3. 打开 Pages

1. 仓库页 **Settings → 左侧 Pages**
2. Source 选 **Deploy from a branch**
3. Branch 选 **main**，目录选 **/ (root)**，Save
4. 等 1–2 分钟，页面上方会出现地址：`https://你的用户名.github.io/workbench/`

这个地址就是固定入口，手机和电脑都用它。手机可以「添加到主屏幕」，用起来跟 App 差不多。

## 4. 建「数据仓库」（私有）

1. 再开一次 https://github.com/new
2. 名字填 `workbench-data`
3. 选 **Private**
4. 勾上 `Add a README file`，Create

不需要手动建数据文件，第一次保存时页面会自动写 `data/workbench.json`。

## 5. 生成令牌（只给数据仓库）

1. 右上头像 → **Settings**
2. 左下 **Developer settings**
3. **Personal access tokens → Fine-grained tokens → Generate new token**
4. 填：
   - Token name：`workbench`
   - Expiration：90 days（到期重新生成一次就行）
   - Repository access：**Only select repositories** → 选 `workbench-data`
   - Permissions → **Contents: Read and write**（其它都留 No access）
5. Generate token，复制那串 `github_pat_...`（只显示一次）

## 6. 在页面里填配置

1. 打开 `https://你的用户名.github.io/workbench/`
2. 左下角点 **云同步**
3. 填：
   - 仓库：`你的用户名/workbench-data`（注意是**数据仓库**，不是页面仓库）
   - 分支：`main`
   - 数据文件路径：`data/workbench.json`
   - 访问令牌：粘贴第 5 步的 `github_pat_...`
4. **保存并连接** → 页面会拉一次数据并刷新
5. 侧栏底部显示 **云同步**，说明连上了

## 7. 手机上也填一次

手机上打开同一个地址 → 云同步 → 填**完全一样**的四项 → 保存并连接。

之后：

- 电脑改的东西，手机刷新就能看到（打开页面会自动拉一次）
- 手机改的东西，电脑刷新就能看到
- 同一条记录两边同时改，以最后一次保存为准

---

## 常见问题

**令牌会不会被盗？**
令牌只存在你这台设备的浏览器 localStorage 里，不会上传到任何服务器。它只对 `workbench-data` 这一个仓库有 Contents 读写权限，就算泄露也只能改那个仓库的数据，碰不到你的其他代码。公用电脑用完记得点面板里的「断开云同步」。

**国内打不开 github.io 怎么办？**
GitHub Pages 在国内时好时坏。备选是同仓库部署到 Cloudflare Pages（同样免费、同样固定地址、支持私有仓库），把 `index.html` 连过去即可，页面代码不用改。

**数据存在哪、会不会丢？**
GitHub 仓库里，每次改动都是一次 commit，误删可以去仓库历史里找回。也可以随时在本机点「导出备份」存一份 JSON。

**能多人一起用吗？**
能，但要各自生成自己的令牌，填同一个数据仓库。两个人同时改同一条会互相覆盖，谁后保存谁生效。

**换了令牌 / 过期了怎么办？**
重新生成一个，打开云同步面板把新令牌贴进去，保存并连接。

**手机上表单好用吗？**
输入框按 16px 做过处理（iOS 聚焦不会放大），按钮触控高度 ≥44px，导航可以横向滑动。日期用系统原生日历。

## hello AI 想接不支持的模型（智谱 / OpenAI 等）

有些服务不许浏览器直接调（没有跨域头），会报「连不上」。两种解法：

1. **换服务商**：DeepSeek、Moonshot、阿里百炼、硅基流动都支持浏览器直连，填 Key 就能用。
2. **加一层中转**：用 `ai-proxy-worker.js`（Cloudflare Worker，免费 10 万次/天）转发。部署后把 Worker 地址填到工作台「hello AI → 接口地址」，模型名照上游文档填。

Worker 用到的变量：`UPSTREAM`（上游地址，不带 /chat/completions）、`ALLOW_ORIGIN`（你的页面域名）、`API_KEY`（可选，填了就把 Key 放服务端，页面里不用填）。
