---
title: java wiki
date: 2020-11-25 12:40:43
tags: 
	- java
	- wiki
	- maven
categories:
	- wiki
comments: true
typora-root-url: ../../source
---

记录java开发过程中遇到的坑坑洼洼或者很有意思的比较小的技术点
# maven
## 优先级管理
1. Maven 父pom中dependencyManagement版本优先级高于传递依赖版本，因此会覆盖传递依赖版本。参考链接：[Maven dependencyManagement中的依赖版本会覆盖传递依赖版本](https://blog.csdn.net/jiaobuchong/article/details/81842503)

   特殊说明：由于idea中依赖关系图不能够展示版本号（奇怪）所以导致我一直不知道原来依赖的版本错了。所以最好用mvn dependency:tree -Dverbose -Dincludes=com.github.jsqlparser:jsqlparser 来定位问题
