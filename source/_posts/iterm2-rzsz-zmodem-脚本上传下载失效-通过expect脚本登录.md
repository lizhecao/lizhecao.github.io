---
title: iterm2 rzsz zmodem 脚本上传下载失效(通过expect脚本登录)
date: 2022-01-25 10:57:20
tags: 
	- iterm2
	- expect
categories:
	- 软件折腾
typora-root-url: ../../source
---

# 起因

iterm2本身不支持rzsz命令，所以需要通过本地安装脚本，设置触发器来实现这个功能，具体网上有很多教程。参考：[aikuyun](https://github.com/aikuyun)/**[iterm2-zmodem](https://github.com/aikuyun/iterm2-zmodem)**

但是最近在公司的电脑发现按照网上的教程设置好了之后总是没作用。在用rz、sz命令的时候，虽然弹出了文件选择窗口，但是选择文件后就没有反应了。一开始总是以为是自己的设置出了什么问题，仔细检查了很多次都没作用。



# expect脚本的坑

最后无意间在这个文章[laggardkernel](https://github.com/laggardkernel)/**[iterm2-zmodem](https://github.com/laggardkernel/iterm2-zmodem)**中发现了这么一句话

`This tool may also fail if you are using `expect` or `rlogin` as it expects a mostly-clean 8-bit connection between the two parties.`

开始怀疑起是不是我是通过expect脚本登录的原因。然后在网上查了下，果然有人遇到这种情况，于是按照教程[**mac iterm2 expect 方式sz rz 失效**](https://blog.51cto.com/fulin0532/2439271)设置了环境变量  LC_CTYPE=en_US后，居然就好了，神奇！！！

具体的步骤：

1. 在~/.bashrc 中添加一行 `export LC_CTYPE=en_US`
2. 保存后执行命令`source ~/.bashrc`

由于我使用的是fish，所以步骤有一点差异

1. 在 ~/.config/fish/config.fish 中添加一行 `set -x LC_CTYPE en_US`
2. 保存后执行命令 `source  ~/.config/fish/config.fish`

原理都是设置一个环境变量LC_CTYPE=en_US ，这样expect脚本运行时所在的shell就会使用到这个变量，然后就可以了。

或者也可以按照上述教程，新起一个脚本，在脚本中先export设置环境变量，然后再通过exec执行expect脚本。这样的好处就是不会影响到你的系统环境变量。缺点可能就是比较麻烦，有多个expect脚本可能要写多个额外的脚本。



# 总结

虽然网上已经有教程了，但是感觉都不是很清晰，费了好大劲才找到正确的方法，希望我这篇博文能够帮到也遇到这个问题的小伙伴。

