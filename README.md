master分支用来hexo的发布、展示。通过hexo指令发布后就会修改master分支的相应文件。
发布命令：hexo clean && hexo g && hexo d

hexo分支用来保存hexo相关的配置以及博客的文章。
通过git命令来更新保存


## 注意
1. hexo themes目录下的主题如果更新的话, 要rm掉.git目录才能够添加到仓库中.


## 独立静态应用

积木想象工坊位于 `source/block-play/`，发布地址为 `https://lizhecao.github.io/block-play/`。
`_config.yml` 的 `skip_render` 必须保留 `block-play/**`，让 Hexo 原样复制 HTML、JS、manifest 和图标。
生成后运行 `node test/verify-block-play-page.mjs` 和 `node test/verify-dca-page.mjs`。
发布使用 `.claude/worktrees/` 中基于远端 `hexo`、`master` 的独立 worktree；源码同步到 `hexo`，将 `public/block-play/` 复制到发布 worktree 的 `block-play/`，只提交该目录并普通推送到 `master`，保留博客与 DCA。
离线检查：用浏览器打开 `/block-play/`，等待“当前窗口离线准备完成”，断网重载后仍能查看造型和操作步骤；Service Worker scope 应仅为 `/block-play/`。
