---
title: trojan多网站共存(共用443端口)
date: 2024-03-06 16:24:14
tags: 
	- trojan
	- nginx
categories:
        - software
comments: true
typora-root-url: ../../source
---

最近因为自建vaultwarden密码管理器, 遇到了一个棘手的问题。 由于trojan需要运行在443端口（因为要伪装成正常流量），所以导致和vaultwarden或者其他网站产生了端口冲突。网上搜索下来，发现文章都讲得不是很细，踩了很多坑，所以这里详细记录下步骤。
> 参考: [Trojan 共用 443 端口方案 | 程小白](https://www.chengxiaobai.com/trouble-maker/trojan-shared-443-port-scheme.html)

具体原来上面这个引用文章已经介绍的很清晰了，我这里不再赘述，只讲最关键的配置。

# 原理
原理就是通过nginx的stream模块进行四层转发（因为trojan的原因不能在第七层，具体参考引用文章），trojan直接转发即可，自己的服务需要经过nginx本身加上ssl支持，所以需要多转一次


# 具体案例
## 目标
trojan 部署在64411端口，trojan的自定义部署可以参考[one_click_script/README2_CN.md at master · jinwyp/one_click_script · GitHub](https://github.com/jinwyp/one_click_script/blob/master/README2_CN.md)
vaultwarden部署在1888端口
都需要实现通过nginx 443端口反向代理

## 具体配置

nginx配置如下：
```
stream {
    map $ssl_preread_server_name $backend_name {
        bitwarden.lizhecao.cn warden;
        gpt.lizhecao.cn trojan;
        # 默认其他流量转发给trojan，这里没有限制，有其他服务更加适合的都可以配置
        default trojan;
    }
	# 转发给nginx自己监听的端口，因为这里需要nginx来实现ssl访问vaultwarden
    upstream warden {
        server 127.0.0.1:998;
    }
	# 直接转发给trojan的端口即可
    upstream trojan {
        server 127.0.0.1:64411;
    }

    server {
        listen 443 reuseport;
        listen [::]:443 reuseport;
        proxy_pass  $backend_name;
        ssl_preread on;
    }
}


http {
	# ...默认配置忽略

	# 这里用来转发请求给vaultwarden
    server {
        listen 80;
        listen 998 ssl;    # vaultwarden通过998端口转发
        server_name _;    #对应的域名或者ip，把xxx.com改成你们自己的域名就可以了
        ssl_certificate /nginxweb/cert/fullchain.cer;          #申请的xxx.crt文件的位置
        ssl_certificate_key /nginxweb/cert/private.key;        #申请的xxx.key文件的位置
        ssl_session_timeout 5m;
        ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;
        ssl_prefer_server_ciphers on;

        location / {
            proxy_pass http://127.0.0.1:1888; # 最终转发给vaultwarden服务监听的端口
        }
    }
```
## 遇到的问题
### Permission denied while reading upstream

查看nginx的error日志发现vaultwarden的请求一直报这个错误，原来是对应的文件没有权限导致的
```
 chown -R nginx:nginx /var/lib/nginx/tmp/proxy/*
```
参考：[nginx - Permission denied while reading upstream - Server Fault](https://serverfault.com/questions/235154/permission-denied-while-reading-upstream)

### unknown directive "stream" in /etc/nginx/nginx.conf:86
stream 模块不存在，直接安装即可
```
yum install nginx-mod-stream

```
这里要注意你的nginx也需要是通过yum install 的方式才可以，否则通过yum方式并不会安装到你自定义的nginx上

