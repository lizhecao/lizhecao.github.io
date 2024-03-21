master分支用来hexo的发布、展示。通过hexo指令发布后就会修改master分支的相应文件。
发布命令：hexo clean && hexo g && hexo d

hexo分支用来保存hexo相关的配置以及博客的文章。
通过git命令来更新保存


## 注意
1. hexo themes目录下的主题如果更新的话, 要rm掉.git目录才能够添加到仓库中.

