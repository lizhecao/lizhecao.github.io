# 积木场景 3D 实施与验收

对应 OpenSpec：`explore-interactive-building-scenes`。实现分支：`worktree-block-play-3d-apply`，独立工作区 `.claude/worktrees/block-play-3d-apply`。本文件记录实现证据；不把桌面触控模拟写成 iPad 实机通过。

## 使用方式

完整场景维持搭建图入口，新增「3D 旋转查看」。三维中单指旋转、双指缩放/平移；按钮提供左转、右转、放大、缩小、前后移动、俯视、复位和全屏。选择一层/二层会隐藏其他层和屋顶、打开外墙、保留边界与门窗轮廓；可以恢复外墙。

点家具或家具列表会突出整件家具、显示名称/用途、实际材料及逐块搭建段。家具近景暂时隐藏其他家具和遮挡的层；「回到楼层视图」恢复原层。普通/全屏迁移同一画布。三维中点击、旋转和缩放都不会推进步骤；仍使用「我搭好了」。原 SVG 下轻点全屏图进入下一步保持原行为。

成品与搭建分别保存楼层、外墙开合、对象及相机；成品始终使用全部步骤，搭建只显示已放零件。继续搭建时新零件若不在所选层，会切换到零件所在层；同层不重置相机。切换模型重置视图。WebGL 2 不支持、加载失败和上下文丢失会恢复 SVG，保留进度与区域。

## 场景与实际零件

原来 61 个模型与 `block-lab-progress-v4` 语义保留，总数 64。三个新版另用 ID：

| 新模型 | 逐块步骤 | 家具实例 | 房间用途 |
| --- | ---: | ---: | --- |
| `scene-courtyard-home-v2` | 215 | 10 | 一层客厅餐厨；二层卧室书房 |
| `scene-forest-lodge-v2` | 208 | 10 | 营地休息和装备；树屋睡眠与森林观察 |
| `scene-play-school-v2` | 211 | 9 | 阅读教室；两张独立午睡床与手工活动 |

主体 16×12 凸点，放在 24×24 凸点基板上，中央留 2 凸点宽通道。新版在家具上使用 `objectId`、`roomId`，不同床不合并。相同零件坐标生成 SVG、三维、材料表和教程，不另维护效果图。

砖体的宽高比依据 [LDraw 3437 大颗粒 2×2 砖](https://library.ldraw.org/parts/6083) 的 80×48×80 LDU；只参考尺寸，几何由程序独立生成，未复制 LDraw 网格。门框包含打开的门板，窗框留开口；坡顶和弧砖只在平顶绘凸点，滑梯为斜槽和双侧护栏，其高端位于三块普通砖高度。

扶手/椅背/柜侧板需要 [DUPLO 4066，1×2 凸点双高窄砖](https://www.bricklink.com/v2/catalog/catalogitem.page?P=4066)。初稿把窄件当作普通高度，目录核对后已改为双高，删掉未确认的一凸点小砖。厨房用蓝色薄板代表水槽、红色薄板代表灶台，说明与实际形状一致。8×4 凸点半高楼板、三高门框、滑梯等沿用旧场景配件假设；实际库存、接口和楼板刚度仍需试搭确认。

## 自动化证据

先写失败用例，再接入状态、几何、家具和离线缓存；新增测试覆盖：

- 步骤/成品/楼层可见集合、隐藏外墙、多个家具实例与镜像后稳定映射。
- 标准砖/半高板/基板比例、门窗开口、打开门板、弧坡方向和滑梯高端（含镜像）。
- 新版全部零件网格、有效基板范围、体积碰撞、逐块承托、通道与房间/对象归属。
- 原模型第 80 步与新模型独立保存，六套场景每个区域的三维可见集合。
- 拖动、双指缩放/平移、家具点选不推进；跨层显示新件、同层相机、成品相机恢复、一个全屏画布。
- 完成离线准备后从未打开过三维即断网，仍能首次进入三维。
- 不支持 WebGL、初始化模块损坏和上下文丢失回到 SVG；新 SW 版本删除损坏缓存，离线恢复三维且原第 80 步保留。

截图：本机 `/tmp/block-play-3d-ipad.png`、`/tmp/block-play-rich-home-first.png`、`/tmp/block-play-rich-home-second.png`。它们来自桌面 Chromium 的 iPad 尺寸/触控模拟。多角度截图另存 `/tmp/block-play-3d-front.png`、`/tmp/block-play-3d-side.png`、`/tmp/block-play-3d-back.png`。主机缺少中文字体会在截图显示方框，不代表真实 iPad 的字体效果；几何、取景、触控目标及进度由浏览器断言验证。

本轮复盘：逐砖墙轮廓最初形成密集线框，视觉检查后改成区域边界和门窗轮廓；焦点家具最初仍受前排家具遮挡，点选实测后改为家具近景并加入返回楼层。这些问题仅检查零件数量发现不了。

## 复现与依赖

服务只绑定本机回环地址：

```sh
NO_PROXY=127.0.0.1,localhost python3 -m http.server 8765 --bind 127.0.0.1 --directory source
node test/verify-block-play-3d-state.mjs
node test/verify-block-play-3d-geometry.mjs
node test/verify-block-play-rich-scenes.mjs
node test/verify-block-play-patterns.mjs
node test/verify-block-play-scenes.mjs
```

浏览器脚本需要 Playwright 和 Chromium；本机工具已存在：

```sh
export NODE_PATH=/tmp/block-play-check/node_modules
export CHROME_PATH=/home/lizhecao.by/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome
export NO_PROXY=127.0.0.1,localhost
node test/verify-block-play-browser.cjs
node test/verify-block-play-preview.cjs
node test/verify-block-play-scenes-browser.cjs
node test/verify-block-play-3d-browser.cjs
node test/verify-block-play-rich-scenes-browser.cjs
node test/verify-block-play-cache-upgrade.cjs
```

固定 Three.js 0.186.1 / esbuild 0.28.2，本地 ES2020 模块约 597 KB。重复砖体/凸点共享几何并实例化；静止时无连续渲染循环；DPR 最高 1.5。500 块桌面软件 WebGL 回归记录为 44 次绘制调用、24 个几何对象、164472 个三角形，仅用于实例化/资源数量检查，不能代替真实 iPad 性能。销毁时释放实例、轮廓、材质、几何、监听器和 WebGL 上下文。重建方式独立于 Hexo 依赖：

```sh
npm ci --prefix tools/block-play-3d
npm --prefix tools/block-play-3d run build
```

锁文件、入口与构建脚本在 `tools/block-play-3d/`，MIT 许可保存在 `source/block-play/vendor/THREE-LICENSE.txt`。运行时不访问引擎 CDN。打包引擎含上游 GLSL 字符串，保留其原始空白；`.gitattributes` 仅将这个生成文件标记为生成内容并豁免空白风格检查，不放宽自有代码检查。SW `20261009-v17` 完整缓存查看器、适配器、场景数据和引擎；两个现有统计脚本保持各一次。

构建站点沿用现有 Hexo 依赖，`hexo generate` 后运行 `node test/verify-block-play-page.mjs` 与 `node test/verify-dca-page.mjs`，前者比较 28 个源/生成文件的实际字节，后者验证 DCA 页面未受影响。

## 仍需实物与真实 iPad 验收

目前没有收到参考 iPad 型号/iPadOS，也未进行真实 Safari 30 秒触控测试、亲子无名称识别或积木试搭。因此 OpenSpec 的 1.1、4.5、5.4 和线上发布 6.3 不能勾选完成；不能宣称 P95 ≤33.3ms 或实物结构已验证。本分支保持默认 SVG，三维为主动选择入口；实机验收通过前不替换线上版本。

提供独立实机性能页 `test/block-play-3d-benchmark.html`。从工作区根目录用另一个回环端口服务，通过自己的 SSH 隧道在 iPad Safari 访问 `/test/block-play-3d-benchmark.html`。测试使用 500 块合成压力场景（包含住宅特殊件，增加砖体只用于绘制压力，非搭建教程），记录真实设备/系统、首次绘制、30 秒帧间隔 P95 和绘制调用/几何数量。开始后必须持续真实单指/双指操作，并确认视觉正确；桌面运行该页也不构成实机验收。

识别/试搭待验收：隐藏家具名称后记录家长与孩子分别对床、椅、沙发、柜的辨认；用实际 4066 和半高板搭家具模块；检查楼板受力/锁合、门口通道、上下层连接和滑梯平台接口。几何有接触只能证明坐标合理，不能证明实物承重稳定。

## 发布与回滚

实机验收后，在独立发布工作区基于 `origin/master`，只复制构建的 `public/block-play/` 为 `block-play/`。禁止复制其他博客生成内容。提交后立即推送；等待 Pages 完成后比较线上核心资产与源字节，并运行三维、普通/全屏、旧进度和离线回归。

出现三维故障时先用「查看搭建图」或自动回退继续搭建。需要回滚部署内容时，恢复已知可用 `block-play/` 资产，同时在 `sw.js` / `pwa.js` 使用全新的 SW 版本（不能仅复用旧版本），再构建与发布。`verify-block-play-cache-upgrade.cjs` 已在独立临时站点验证“损坏模块 -> SVG -> 恢复模块 + 新版本 -> 删除损坏缓存 -> 离线三维恢复”，不修改当前工作区或线上内容。
