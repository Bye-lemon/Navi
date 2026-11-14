# AGENTS.md

面向 AI 编码代理（也供人类维护者参考）的仓库说明。目标：让「维护这个导航站」这件事**可重复、可验证、不弄坏线上站点**。

> 文件名 `AGENTS.md` 是目前通用的代理约定（Codex、DSH、Cursor、Aider 等都会自动读取仓库根目录下的它）。若你更习惯 Claude Code，可在同目录放一个只写 `@AGENTS.md` 的 `CLAUDE.md` 指向本文件。

---

## 1. 一句话

Hugo 静态网址导航：**仓库根目录本身是主题**，`exampleSite/` 才是站点内容。日常维护 = 改 `exampleSite/data/webstack.yml`，push 到 `main` 后由 GitHub Actions 自动构建并发布到 <https://bye-lemon.github.io/Navi/>。

## 2. 关键事实（2026-11-14 核对）

| 项 | 值 |
|---|---|
| 项目类型 | Hugo 主题 + 自建站点（WebStack-Hugo 的魔改版，纯静态） |
| 线上地址 | <https://bye-lemon.github.io/Navi/> |
| 代码仓库 | <https://github.com/Bye-lemon/Navi> |
| 发布分支 | `main` → Actions 构建 → 产物推到同仓库 `gh-pages` |
| 构建工具 | Hugo **0.122.0**（非 extended）；仓库没有 Node 构建步骤 |
| 前端 | 原生 HTML/CSS/ES2020；jQuery/Bootstrap 只服务主题旧脚本，新代码不依赖 |
| 站点语言 | 中文 `zh-CN`；标题 `LML - Li's Misc Library` |
| 当前规模 | 7 个分类 / 18 个子分类 / **140** 条网址（首页 `class="url-card"` 数量应等于此值） |
| 许可 | MIT（`LICENSE`，版权人仍是模板占位符 `YOUR_NAME_HERE`） |

当前各分类基线（改动后若数量变化，请顺手更新本节）：

| 分类 | 子分类数 | 链接数 |
|---|---:|---:|
| 常用推荐 | 0（直挂） | 11 |
| AI 相关 | 5 | 52 |
| 开发相关 | 4 | 27 |
| 科研办公 | 2 | 21 |
| 素材资源 | 2 | 7 |
| 资讯学习 | 4 | 19 |
| 冷备份 | 1 | 3 |
| **合计** | **18** | **140** |

## 3. 目录地图

| 路径 | 作用 | 改动频率 |
|---|---|---|
| `exampleSite/data/webstack.yml` | **全部导航数据**（分类 / 子分类 / 链接） | 日常主战场 |
| `exampleSite/config.toml` | 站点参数：标题、作者、logo、默认深色、天气 key、统计、页脚 | 偶尔，改前确认 |
| `exampleSite/data/headers.yml` | 顶部横向菜单（首页 / 作者） | 偶尔 |
| `exampleSite/content/about.md` | “关于网站”页正文 | 偶尔 |
| `layouts/index.html` | 首页拼装顺序（header → sidebar → 搜索 → 卡片 → 页脚） | 很少 |
| `layouts/partials/*.html` | 各区块模板，见下一节 | 改样式/结构时 |
| `layouts/_default/single.html` | 内容页（about）模板，无侧边栏 | 很少 |
| `layouts/404.html` | 404 页（完整布局 + 返回首页） | 很少 |
| `static/assets/css/custom-style.css` | **本项目的自定义样式** | 视觉调整 |
| `static/assets/js/site.js` | 主题切换、原生 `<dialog>` 搜索、图片兜底、加载动画 | 交互改动 |
| `static/assets/js/content-search.js` | 搜索框百度联想（原生 JS + JSONP） | 很少 |
| `static/assets/css/style-3.03029.1.css` 等 | 第三方压缩样式/脚本 | **只读** |
| `static/assets/fontawesome-5.15.4/` | Font Awesome 5 全套资源 | **只读** |
| `static/assets/images/` | 站点图片、`logos/default.webp` 兜底 logo | 加本地 logo 时 |
| `.github/workflows/hugo.yml` | 构建 + 部署流水线 | 一般不动 |
| `.history/` | JetBrains 本地历史，已 gitignore | **永远不要读取或提交** |

模板分工：

- `header.html`：`<head>`、CSS/JS 引入、统计代码、`<title>`
- `sidebar.html`：`<body>` 与主题 class、左侧分类导航、页面加载动画
- `content_header.html`：顶部横幅、横向菜单、天气、一言
- `content_search.html` / `modal_search.html`：首页搜索区 / 右下角搜索弹窗
- `content_main.html`：按 `webstack.yml` 渲染卡片（**两套几乎重复的循环**：有 `list` 与直挂 `links`）
- `content_footer.html` / `footer.html`：页脚按钮（回到顶部/搜索/主题）、脚本加载；主题逻辑在 `site.js`

## 4. 数据模型（webstack.yml）

文件以 `---` 开头，是 YAML 文档起始标记（`---`/`...` 分隔文档），**不要删**。两种结构可混用：

```yaml
# 形态 A：分类 → 子分类(term) → 链接
- taxonomy: AI 相关
  icon: far fa-gem fa-lg
  list:
    - term: AI 产品
      links:
        - title: ChatGPT
          logo: https://chatgpt.com/cdn/assets/favicon-eex17e9e.ico
          url: https://chat.openai.com/chat
          description: ''

# 形态 B：分类 → 直接挂链接（没有子分类，侧边栏一级项）
- taxonomy: 常用推荐
  icon: far fa-star
  links:
    - title: GitHub
      logo: https://github.githubassets.com/favicons/favicon-dark.svg
      url: https://github.com/
      description: ''
```

字段规则：

| 字段 | 必填 | 说明 |
|---|---|---|
| `taxonomy` | 是 | 一级分类显示名，同时是侧边栏一级项 |
| `icon` | 是 | Font Awesome 5 的 class（`fas`/`far`/`fab` + 图标名，可加 `fa-lg`） |
| `list` | 二选一 | 子分类数组；与 `links` 互斥（同一分类不要两者都有） |
| `links` | 二选一 | 链接数组；形态 B 时直接挂在分类下 |
| `term` | 形态 A 必填 | 子分类显示名 |
| `title` | 是 | 站点名，保持官方写法（ChatGPT 不写成“聊天GPT”） |
| `logo` | 是 | 见下方解析规则 |
| `url` | 是 | `https://` 开头（历史遗留的 3 个 http 站点保持原样即可） |
| `description` | 否 | 一句话中文说明；同时用于卡片副标题与悬停 tooltip；可为空字符串 |
| `qrcode` | 否 | 可选；有值时卡片变成“显示二维码”而不跳转。当前没有任何条目使用 |

**logo 解析规则**（`content_main.html`）：

1. 以 `http(s)://` 开头 → 原样使用；
2. 否则拼成 `{{logosPath}}/{{logo}}`，即 `static/assets/images/logos/<文件名>`；
3. 加载失败 → `site.js` 捕获 `error`，回退到 `data-fallback` 指向的 `defaultLogo`（`assets/images/logos/default.webp`）。

目前 140 条**全部使用外链 logo**，`static/assets/images/logos/` 里只有 `default.webp`。要放本地 logo，把图片放进该目录，`logo` 只写文件名。

**锚点规则（重要）**：

- 子分类标题的 `id` = `md5(term)`，例如 `AI 产品` → `34dd8486af108e037f606b15bbb2ad34`；
- 直挂式分类的 `id` = `md5(taxonomy)`；
- 侧边栏一级项跳到该分类**第一个子分类**的锚点。

所以**重命名 `term`/`taxonomy` 会改变锚点，旧的 `#hash` 深链全部失效**。除非用户明确要求，不要重命名已有分类；新增分类不受影响。

## 5. 编辑硬规则

1. 缩进 **2 空格，禁止 Tab**；保持现有缩进层级（`taxonomy` 0、`icon/list` 2、`- term` 4、`title` 6/8）。
2. 只改目标条目，**不要整文件重排、格式化、重排字段顺序**（diff 越小越好审）。
3. 同一 URL 不重复收录（当前 0 重复）。新增前先全文搜域名。
4. YAML 字符串里出现 `:`、`#`、`{`、`[`、`&`、`*`、`!` 等符号时加引号；描述里不要出现换行。
5. `icon` 只用 Font Awesome **5 免费**图标（`box-archive` 是 FA6 名称，FA5 用 `archive`）；新分类不要与现有分类重复。
6. logo 优先官网 favicon 直链；官网取不到才用 `https://favicon.im/<域名>` 或 `https://a.favicon.im/<域名>`。**不要新增带哈希/版本号的 CDN 图片地址**（现有若干条是历史遗留，会随站点发版而失效）。
7. 不要新增 URL 短链、返利/推广参数、需要登录才能判断真假的站点；不确定的域名先核实再收录。
8. 不要把 `public/`、`resources/`、临时构建目录、`.hugo_build.lock` 提交进仓库。
9. **不要在仓库根目录创建 `config.toml`、`data/`、`content/`**——站点内容只属于 `exampleSite/`；CI 会把 `exampleSite/*` 拷到根目录，根目录出现同名内容会造成数据被覆盖或双份加载。
10. 不要执行 CI 里的 `cp -R exampleSite/* .` 来本地构建（会污染工作区），用第 7 节的方式。
11. 新增交互写进 `static/assets/js/site.js`（主题、对话框、图片兜底、加载动画）或 `content-search.js`；不要新增 jQuery 插件，也不要写内联 `onclick`/`onerror`/`javascript:`。
12. 主题偏好固定存 `localStorage["color-scheme"]`（`light`/`dark`）；默认值由 `config.toml` 的 `nightMode` 决定，不要改键名或默认值。

## 6. 常见任务

### 6.1 新增一个网址

1. 在文件里找到最匹配的子分类（形态 A）或“常用推荐”（形态 B）；找不到合适的子分类就先向用户提案，不要硬塞。
2. 按模板追加到该子分类 **末尾**（或用户指定位置），默认不排序、不插队。
3. 字段顺序沿用邻居：`title` → `logo` → `url` → `description`（少数条目是 `url` 在 `logo` 前，保持该条目自身风格即可，不要顺手改）。
4. 描述写一句中文，说明“这是什么/用来做什么”，不重复标题，尽量 ≤ 40 字；拿不准就留空 `''`。
5. 构建验证 + 卡片计数 +1。
6. 提交信息示例：`nav: add Hugging Face Papers`。

### 6.2 新增 / 调整分类

- 新分类追加到 `webstack.yml` 末尾，并补齐 `icon`；侧边栏会自动出现，**无需改模板**。
- 需要子分类就用 `list`，扁平展示就用 `links`，不要两种混用。
- 重命名 / 合并 / 删除分类会破坏锚点与侧边栏，**必须先得到用户确认**，并同步更新第 2 节的基线数字。
- 分类顺序就是侧边栏与首页顺序；调整顺序会产生大 diff，非必要不做。

### 6.3 调整外观

- 颜色、间距、网格背景、卡片圆角 → 只改 `static/assets/css/custom-style.css`，追加到文件末尾并写中文注释说明用途。
- 不要改 `style-3.03029.1.css`（上游压缩样式）；要覆盖就写在 `custom-style.css`。
- 改模板（`layouts/partials/*`）后必须全站构建，并确认首页、`/about/`、404 三处都正常。
- 站点级开关（默认深色、预加载文字、logo、页脚版权、天气）在 `exampleSite/config.toml`。天气 key 是客户端 key，明文公开，**不要往仓库里加任何真正的私密 token**。

### 6.4 修改 About 页

`exampleSite/content/about.md`，正文是 Markdown，构建后路径为 `/about/`。注意：`config.toml` 里的 `params.about` 当前指向作者 GitHub 主页（`https://github.com/Bye-lemon`），模板并未使用它，改它不会改变 About 页。当前正文是上游主题的说明，可按需替换成自己的介绍。

## 7. 本地构建与验证

CI 固定 Hugo 0.122.0（非 extended）。本机若未安装，先装同版本；高版本通常也能构建，但**上线前以 0.122.0 的结果为准**。

关键技巧：`exampleSite` 的上一级目录是仓库，仓库的上一级作为 `--themesDir`，主题名正好解析回仓库本身，所以**不需要拷贝文件**：

```powershell
# 一次性构建到临时目录（推荐给代理用，不污染仓库）
cd exampleSite
hugo --themesDir ../.. --baseURL http://127.0.0.1:1313/Navi/ --destination "$env:TEMP\navi-public"
```

```powershell
# 本地预览（baseURL 必须带 /Navi/，否则 CSS/JS 会 404）
cd exampleSite
hugo server --themesDir ../.. --baseURL http://127.0.0.1:1313/Navi/ --port 1313
```

Bash 等价：

```bash
cd exampleSite
hugo --themesDir ../.. --baseURL http://127.0.0.1:1313/Navi/ -d /tmp/navi-public
```

> 前提：仓库目录名必须是 `Navi`（`config.toml` 里 `theme = "Navi"`）。如果克隆到了别的目录名，要么改名，要么加 `--theme <实际目录名>`。

构建后检查：

1. 退出码 0，无 `ERROR`；唯一可忽略的告警是 `found no layout file for "html" for kind "taxonomy"`（Hugo 默认 tags/categories 没有模板，不影响页面）。
2. 卡片数：

```powershell
(Select-String -Path "$env:TEMP\navi-public\index.html" -Pattern 'class="url-card' -AllMatches).Matches.Count
```

   应等于 140 加上本次新增数。数量对不上说明 YAML 结构或缩进错了。
3. 首页与 `/about/` 均返回 200；随机点开 2–3 个新条目确认能跳转。
4. JS 语法自检（不需要 Node 构建）：

```powershell
node --check static/assets/js/site.js
node --check static/assets/js/content-search.js
```
5. `git diff --stat` 只应包含你打算改的文件；`git status` 里不应出现构建产物。

## 8. 发布流程

- push 到 `main` → Actions：checkout → 安装 Hugo 0.122.0 → `cp -R exampleSite/* .` → `hugo --themesDir ../ --baseURL https://bye-lemon.github.io/Navi/` → 用 `peaceiris/actions-gh-pages` 推到 `gh-pages`。
- `gh-pages` 是产物分支（`force_orphan`，每次部署重置历史），**不要手改，也不要当作源码**。
- 线上生效通常需要几分钟；如果页面没变，先确认 Actions 是否成功，而不是怀疑缓存。
- `mine` 是与 `main` 分叉的旧分支（大幅删减条目），**不要在其上发布或直接合并**；要参考它时先和当前数据对比。

提交建议：

- 一个提交只做一类事：`nav: add ...` / `nav: update ...` / `fix: ...` / `style: ...` / `chore: ...`
- 历史提交信息全是 `update sites`，不需要模仿。
- **代理默认不要自动 commit / push**，除非用户明确要求；改完先汇报 diff 与验证结果。

## 9. 已知问题与坑（改到相关文件前先看这里）

| # | 现象 | 位置 | 处理建议 |
|---|---|---|---|
| 1 | 没有站内导航全文搜索，搜索只转发到第三方引擎 | `content_search.html`、`modal_search.html`、`app-mini.js` | 这是功能缺口，不是改数据能解决的 |
| 2 | 首页搜索区与搜索弹窗都存在 `id="search"`（上游遗留的重复 ID） | `content_search.html`、`modal_search.html` | 改 ID 会牵动 `app-mini.js` 的 `parents('#search')`，没有充分测试不要动 |
| 3 | 所有 logo 都是外链，加载失败只回退到 `default.webp` | `webstack.yml` | 外链失效时只显示默认图；不要因此批量换 logo |
| 4 | 和风天气 key 明文 | `exampleSite/config.toml` | 公开仓库可见；如需保密改为不提交或代理 |
| 5 | 侧栏、回到顶部、搜索分组、移动端抽屉仍由 jQuery 主题脚本驱动 | `static/assets/js/app-mini.js`、`app-anim.js` | 与 `site.js` 分工；不要为了“去 jQuery”重写它们 |
| 6 | 主题默认值来自 `nightMode`，用户选择存 `localStorage`，不跟随系统 | `header.html`、`sidebar.html`、`site.js` | 要改“跟随系统”是产品决策，先确认；不要恢复 22:00–06:00 自动切换 |
| 7 | `io-black-mode` / `io-grey-mode` 是第三方 CSS 依赖的 class | 全站 | 不要改名；新样式沿用这两个 class |
| 8 | About 页为独立窄版式（无侧边栏）；404 已改为完整布局 | `single.html`、`404.html` | 现状如此；要统一版式属改版需求 |
| 9 | `qrcode` 字段当前无人使用 | `webstack.yml`、`content_main.html` | 启用前先验证按钮/提示结构，当前卡片使用 `button` 包块级内容 |
| 10 | `mine` 是与 `main` 分叉的旧分支（大幅删减条目） | 分支 | 不要在其上发布或直接合并 |

## 9.1 浏览器支持策略

- 目标：**Baseline Widely Available**（Chrome/Edge 121+、Firefox 121+、Safari 17.4+ 一类的现代浏览器）。
- 使用但不引入 polyfill：原生 `<dialog>`、`color-scheme`、`:has()`、`appearance: none`、`loading="lazy"`、`scrollbar-color`、`scroll-behavior`。
- 唯一显式降级：`closedby="any"` 在旧浏览器不存在时，由 `site.js` 用 pointerdown/pointerup 补“点击遮罩关闭”；不要为此引入弹窗库。
- 不支持原生 `<dialog>` 的浏览器不在支持范围内；不要用 `overflow:hidden` 锁定页面滚动来模拟模态。

## 10. 不要做的事

- ❌ 不要为了“整理”而重命名/删除分类、批量改描述或批量换 logo（会产生巨大 diff，且破坏深链）。
- ❌ 不要升级/替换 jQuery、Bootstrap、Font Awesome、Fancybox 等 vendor 文件（没有回归测试，风险高）。
- ❌ 不要改 `.history/`、`public/`、`resources/`、`gh-pages`。
- ❌ 不要写内联事件处理器或 `javascript:` 链接；交互统一放 `site.js` / `content-search.js` 并用 `addEventListener`。
- ❌ 不要把主题逻辑改回按时间（22:00–06:00）自动切换。
- ❌ 不要在没有本地构建验证的情况下 push `main`（等于直接上线）。
- ❌ 不要把本项目重构成 Astro/Next/其他框架，除非用户明确要求。
- ❌ 不要把 API key、token、内网地址写进数据或模板。

## 11. 代理工作流（每次任务照此执行）

1. **读**：本文件 → 目标数据/模板文件（不要先读 `.history/`）。
2. **确认范围**：列出要改的文件与条目；涉及分类改名、删除、批量修改时先问用户。
3. **最小改动**：只动必要行，保留原缩进、字段顺序与引号风格。
4. **验证**：按第 7 节构建 + 计数 + 抽查链接；必要时起 `hugo server` 看版面。
5. **汇报**：改了什么（文件:行）、怎么验证的、计数变化、遗留问题；是否 commit/push 听用户指令。

完成标准（修改导航数据时）：

- [ ] `hugo` 构建成功，无 ERROR
- [ ] 首页卡片数 = 原数量 + 新增数
- [ ] 新 URL / logo 可访问（Cloudflare 站点返回 403 可接受，但要人工确认域名正确）
- [ ] 无重复 URL
- [ ] `git diff` 只含预期改动
- [ ] 若数量变化，已更新第 2 节基线
- [ ] 未自动提交（除非用户要求）