---
title: npm hexo-renderer-sass Mac安装报错
date: 2021-10-13 15:00:43
tags: 
	- hexo
	- blog
categories:
	- 软件折腾
comments: true
typora-root-url: ../../source

---



起因是要用hexo更换新的主题Maupassant，于是按照教程安装，https://www.haomwei.com/technology/maupassant-hexo.html，安装的时候发现```npm install hexo-renderer-sass --save ``` 一直失败，报错如下

```
node_modules/node-sass: Command failed.
......
1 error generated.
make: *** [Release/obj.target/binding/src/binding.o] Error 1
gyp ERR! build error 
gyp ERR! stack Error: `make` failed with exit code: 2
gyp ERR! stack     at ChildProcess.onExit (/Users/andrzej/apps/stimulus_infinite_scroll/node_modules/node-gyp/lib/build.js:262:23)
gyp ERR! stack     at ChildProcess.emit (node:events:365:28)
gyp ERR! stack     at Process.ChildProcess._handle.onexit (node:internal/child_process:290:12)
gyp ERR! System Darwin 19.6.0
gyp ERR! command "/usr/local/Cellar/node/16.0.0/bin/node" "/Users/andrzej/apps/stimulus_infinite_scroll/node_modules/node-gyp/bin/node-gyp.js" "rebuild" "--verbose" "--libsass_ext=" "--libsass_cflags=" "--libsass_ldflags=" "--libsass_library="
gyp ERR! cwd /Users/andrzej/apps/stimulus_infinite_scroll/node_modules/node-sass
gyp ERR! node -v v16.0.0
gyp ERR! node-gyp -v v3.8.0
gyp ERR! not ok
```

网上看的方法大部分都是说是网络的原因，可以通过下面两个方法解决

1. 更换淘宝镜像（https://github.com/tufu9441/maupassant-hexo/issues/225）
2. 使用代理

但是我都试了之后发现还是不行，一直报上面的错误。最后终于找到了一篇文章：https://dev.to/andrzejkrzywda/fixing-the-node-sass-problem-in-rails-node-downgrade-helps-16lh，里面说是**node版本**的原因，改成**node14**就可以了。

操作如下

```
brew remove node
brew install node@14
```

改完之后再重新npm install hexo-renderer-sass --save，发现还是有点问题，于是打开了**终端的代理**。再试了下，可以了。



# 总结

1. node版本改成14
2. 打开终端代理（使用vpn）
