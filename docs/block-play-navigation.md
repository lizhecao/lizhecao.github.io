# 页面导航、室内引导与 12 个原创玩法

实施变更：`streamline-block-play-navigation`。起点为正式源 `74a792c`、正式发布 `142c117`、离线版本 `20261010-v18`，原页面通过锚点及 `scrollIntoView` 串联作品、教程、实验和任务，图案在分步模式还会推进一步。

本次把它们改成互斥页面：四个栏目 Tab，安装/离线独立设置；作品、实验、任务和作品创作分别进入详情。`navigation.mjs` 复用现有渲染器，`routes.mjs` 负责稳定 ID 和旧入口兼容。会话内保存筛选、搜索、加载范围、列表位置和故事步骤；浏览器返回/前进恢复，刷新由 hash 路由和原进度重建页面。图案点击不推进，步骤按钮才推进。短提示在主图上方，前后按钮固定底部。

成品使用独立 `#/preview/<modelId>`：六套完整场景直接三维，其余造型使用 SVG。关闭成品恢复搭建视图；直达时关闭去同模型搭建。室内步骤按 zone/objectId 或旧 role 自动打开楼层、开墙、聚焦家具。同一家具连续步骤不强制重置相机；本步积木用红色描边及底面放置轮廓，地板/支撑保留。无三维时将当前家具与附近支撑放大成 SVG。只有一个活动上下文，目录不保留后台查看器。

## 新造型与来源

新增 `play-models.js`，12 个稳定 `play-*` ID：摇尾巴小狗、长耳小兔、抱抱小熊、背脊小剑龙、三球冰淇淋、生日蛋糕、彩虹棒棒糖、救援直升机、水果小货车、冰淇淋小摊、寻宝小宝箱、公园野餐长椅。每个含逐块步骤、材料和三个玩法挑战。直升机旋翼为固定造型，宝箱无铰链活动盖；材料/玩法不承诺没有实现的机械运动。

主题参考已查阅：

- LEGO Education [Creative DUPLO Brick Set](https://education.lego.com/en-us/products/creative-lego-duplo-brick-set-by-lego-education/45019/)，创意搭建主题与启发卡。
- LEGO [Ice Cream Truck](https://www.lego.com/en-us/product/ice-cream-truck-10586)，冰淇淋商店和点单角色游戏。
- LEGO [3in1 Dinosaurs on Wheels](https://www.lego.com/en-us/product/3in1-dinosaurs-on-wheels-10451)，恐龙主题。

本轮 Sensight 小红书检索先发生代理 TLS 握手失败，使用 `NO_PROXY/no_proxy` 绕开代理后仍在 30 秒超时，没有取得可靠帖子，未引用或标注为小红书原图复刻。模型布局和步骤均为本站原创，来源链接仅表示主题灵感。原有 64 个模型归一化后的完整数据与 `74a792c` 比较一致，总计 76 个；原进度键、12 个故事实验及 20 个参考造型保留。创意任务原文案写 12 个，实际只有 6 条数据，本次修正显示数且保留全部六条。

## 验证

在实现前添加失败用例，确认原页面没有 Tab/详情路由、室内步骤不会自动启用三维，以及新造型模块不存在。通过后运行以下当前入口：

```sh
node test/verify-block-play-routing.mjs
node test/verify-block-play-play-models.mjs
node test/verify-block-play-3d-state.mjs
node test/verify-block-play-3d-geometry.mjs
node test/verify-block-play-patterns.mjs
node test/verify-block-play-rich-scenes.mjs
node test/verify-block-play-scenes.mjs
node test/verify-block-play-page.mjs
node test/verify-dca-page.mjs
```

浏览器检查使用外部 Playwright、Chromium 路径与 loopback HTTP 服务（`NODE_PATH=/tmp/block-play-check/node_modules`，`CHROME_PATH=/home/lizhecao.by/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`，`NO_PROXY=127.0.0.1,localhost`），从源工作区执行：

```sh
node test/verify-block-play-navigation.cjs [正式或本地URL]
node test/verify-block-play-interior-guidance.cjs [正式或本地URL]
node test/verify-block-play-routed-scenes.cjs [正式或本地URL]
node test/verify-block-play-production-upgrade.cjs
node test/verify-block-play-cache-upgrade.cjs
```

覆盖四栏目、一次点击进入、保存搜索/加载数量/滚动/故事、返回前进、旧锚点与未知 ID、刷新/离线首次深链、12 新造型逐个开始/成品/返回、原第 80 步、完整二层成品、两张床实例、同家具相机稳定、镜像、点按不推进、SVG 近景、无 WebGL/上下文丢失、损坏模块恢复与缓存回滚。尺寸为 390×844、768×1024、1024×768、1194×834，检查主步骤按钮可达、无横向溢出，模型/故事/任务页面标题与隐藏隔离。

500 块场景实际绘制全部 500 块，软件 WebGL 指标为 40 draw calls、20 几何、164472 三角形；它验证实例化和规模，**不是 iPad 帧率**。连续五次进出成品/目录确认目录没有画布，三维最多一个活动画布。原长页/弹窗专用浏览器脚本的入口假设已被新页面流程替代，当前交互以以上 routed 检查为准；原模型/故事/零件的数据检查继续运行。

截图复核修正了三点：长耳兔/小熊耳朵改为有间距的轮廓；手机短步骤提示移到图上方；iPad 沉浸页去掉隐藏 Tab 后的空白，主画布高度避开固定底部步骤按钮。截图使用 Linux Chromium，环境缺少中文字体会显示字形占位；功能断言验证的是完整中文文本，不将截图当作真实设备显示结果。

## 发布、回滚与未测项

新 SW/PWA 版本为 `20261020-v19`；三个新本地资源（play-models、navigation、routes）全部进入 CORE。`verify-block-play-production-upgrade.cjs` 从真实 `142c117`（v18、64 模型）快照升级至新版，确认原第 80 步、新模型进度独立、预览缓存/键不迁入正式、离线首次三维。数据键仍为 `block-lab-progress-v4`，没有布局或进度迁移。

发布使用独立 master 起点的 worktree，只复制构建后的 `block-play/`，两个统计脚本各保留一次；不改博客、DCA、`block-play-preview/sw.js`。提交非 master 分支并立即推送，再非强制同步发布分支。线上核对 runtime 字节与路径 MIME，检查新玩法、返回、室内与离线，预览首页/benchmark 继续 404。

回滚使用已知发布资产恢复 `block-play/`，给 SW/PWA 一个全新一致版本，不能复用 v18 或 v19；运行损坏模块/缓存回滚检查，回读资产并验证旧进度和离线。

本次取代旧 `explore-interactive-building-scenes` 中“默认 SVG、用户主动开启三维、SVG 点击推进、弹窗作为主要放大入口”的交互；旧零件、家具布局、实物和真实性要求继续适用。真实 iPad 型号/系统、室内可辨认反馈、触摸与性能实测未取得，保持本变更 5.5 和旧变更相关实机/实物项待验收，不归档为全任务完成。

## 正式发布证据

源码实现提交 `d47317f`，正式发布提交 `b31e158`。线上读回 23 个运行时资产与生成结果一致，另核对预览退役 SW 和 DCA 共 25 个文件，ES 模块 MIME 正确；预览首页与 benchmark 继续返回 404。正式网址通过 navigation、interior-guidance、routed-scenes 三组浏览器检查，包含全部 12 新造型和离线首次页面/三维。

本次流程复盘：发布目录的 `.gitattributes` 是 Git 元数据，不属于运行时资产，GitHub Pages 不提供它；在线字节核对应使用生成目录资产清单或排除点文件。三维加载失败是异步过程，室内 `data-focus` 就绪并不表示 SVG 已回退，测试必须等 SVG 实际可见后判断；这条已在正式网址回归通过。500 块测试还需断言真正绘制 500 块，避免残留家具聚焦只绘制少量零件却报告通过。
