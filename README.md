# 清明的器灵 · 部署到 GitHub Pages

目标：一个固定地址（`https://<你的用户名>.github.io/workbench/`），手机和电脑打开同一个页面、看到同一份数据，不用域名、不用服务器、不要求电脑开机。

用到的两个仓库（都是免费账号）：

| 仓库 | 可见性 | 放什么 |
| --- | --- | --- |
| `workbench` | 公开 | 只有 `index.html`（+ `.nojekyll`） |
| `workbench-data` | 私有 | `data/workbench.json`，待办、项目、文档、结案都在这 |

页面是静态的，数据存第二个仓库里；页面通过一个 fine-grained Token 读写它。Token 只存在你自己的浏览器 localStorage，不会写进仓库。

---

## 我替你部署时，需要你给两样东西

1. GitHub 用户名
2. 一个 classic PAT（勾 `repo` 权限即可，用完可以删）

给了之后我会：建两个仓库 → 推页面 → 打开 Pages → 初始化数据文件 → 把固定地址发你。你只剩一件事：在页面里点「云同步」，粘一次 Token（手机、电脑各一次）。

---

## 你自己做（约 10 分钟）

### 1. 建页面仓库

GitHub → New repository → 名称 `workbench` → **Public** → Create。
上传 `index.html` 和 `.nojekyll`（Add file → Upload files，拖进去，commit）。

### 2. 打开 Pages

仓库 → Settings → Pages → Source 选 `Deploy from a branch` → Branch 选 `main` / `(root)` → Save。
等 1–2 分钟，地址是：

```
https://<你的用户名>.github.io/workbench/
```

### 3. 建数据仓库

New repository → 名称 `workbench-data` → **Private** → Create。
Add file → Create new file → 文件名 `data/workbench.json` → 内容：

```json
{"version":1,"updatedAt":"","tables":{},"deleted":{},"kv":{}}
```

commit。

### 4. 生成 Token

右上头像 → Settings → Developer settings → **Personal access tokens → Fine-grained tokens** → Generate new token：

- Repository access：Only select repositories → 只勾 `workbench-data`
- Permissions → Repository permissions → **Contents: Read and write**
- Expiration：一年（到期换一次即可）

生成后复制 `github_pat_...`。

### 5. 连上（手机、电脑各一次）

打开 `https://<你的用户名>.github.io/workbench/` → 左下「云同步 · 待配置」。
账号和仓库已经按域名自动填好（`<用户名>/workbench-data`、`main`、`data/workbench.json`），只需要粘 Token → 保存并连接。

连上后左下角显示「云同步」，改动约 1.2 秒后自动上传；换设备打开看到同一份数据。

---

## 同步是怎么做的（出问题看这段）

- 每条记录带毫秒时间戳 `_u`，两台设备冲突时取新的那条。
- 删除不真删，写一条墓碑 `deleted[表][记录]=时间`，避免另一台设备把删掉的条目复活。
- 写失败（409 / 422）会重新拉取合并后重试一次。
- 页面自带本地缓存：断网照常改，联网后补传。

数据源优先级：**云同步 > 资料库在线表 > 本机 localStorage**。没配云同步也能用，只是不跨设备。

## 常见问题

**手机上打不开 / 一直转圈**
GitHub 在国内时快时慢，换网络或等一会儿；页面是单文件，加载完即可离线使用。

**换了浏览器或清了缓存，要重填 Token 吗**
要。Token 在浏览器里，不在仓库里。

**Token 会不会泄露**
只存在你这台设备的 localStorage，不出现在页面源码、不提交到仓库。共用电脑用完点「断开云同步」，会清掉本地配置。

**想换地址 / 换仓库名**
页面里的「仓库」「分支」「路径」都可以手改，改完点保存并连接。

**要不要买 Pro**
不用。公开仓库的 Pages 免费；私有仓库的 Pages 需要 Pro，所以按上面拆成公开页面 + 私有数据。

---

## 一个需要你决定的事

页面仓库是公开的，`index.html` 源码谁都能看，里面目前内嵌了：五款游戏的客户原话、审核红线、项目规则、下单模板字段。

如果这些不能公开，正确做法是把它们从页面里剥离，改成连上云同步后从 `workbench-data`（私有）加载，公开页面只剩空壳。发布前建议先定：**接受公开**，还是**先剥离再发布**。

---

## hello AI 想接不支持的模型（智谱 / OpenAI 等）

有些服务不许浏览器直接调（没有跨域头），会报「连不上」。两种解法：

1. 换服务商：DeepSeek、Moonshot、阿里百炼、硅基流动支持浏览器直连，填 Key 就能用。
2. 加中转：用 `ai-proxy-worker.js`（Cloudflare Worker，免费 10 万次/天）转发，把 Worker 地址填到 hello AI 的「接口地址」。

变量：`UPSTREAM`（上游地址，不带 /chat/completions）、`ALLOW_ORIGIN`（页面域名）、`API_KEY`（可选，填了就不用在页面里填 Key）。
