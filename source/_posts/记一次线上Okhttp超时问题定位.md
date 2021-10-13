---
title: 记一次线上Okhttp超时问题定位
date: 2020-11-26 19:24:14
tags: 
	- java
	- okhttp
categories:
        - java
comments: true
typora-root-url: ../../source
---

# 问题	

这几天突然发现线上调三方接口有些超时时间达到了16分钟，我们是通过feign okhttp的方式来调用的，而且设置了feign的okhttp超时时间的。而且我也看到有些请求确实是按照限制的10秒超时的。 

```yaml
feign:
  okhttp:
    enabled: true
  client:
    config:
      default:
        connectTimeout: 10000
        readTimeout: 10000
```

# 排查

看日志的过程中发现有一个这个16分钟的超时的错误虽然也是socketTimeout，但是它的timeout是在write的时候发生的。而其他正常的超时是在read的时候发生的。

16分钟超时的日志：

```
java.net.SocketTimeoutException: timeout at okio.SocketAsyncTimeout.newTimeoutException(Okio.kt:159) at okio.AsyncTimeout.exit$jvm(AsyncTimeout.kt:203) at okio.AsyncTimeout$sink$1.write(AsyncTimeout.kt:110)
```

10秒超时的日志：

```
java.net.SocketTimeoutException: timeout at okio.SocketAsyncTimeout.newTimeoutException(Okio.kt:159) at okio.AsyncTimeout.exit$jvm(AsyncTimeout.kt:203) at okio.AsyncTimeout$source$1.read(AsyncTimeout.kt:163) 
```

然后接下来我了解了下readTimeout和 connectTimeout的概念，也知道了okhttp原来还有writeTimeout的说法。

参考：

[A Quick Guide to Timeouts in OkHttp](https://www.baeldung.com/okhttp-timeouts)

[HTTP 在什么情况下会请求超时？ - 严振杰的回答 - 知乎](https://www.zhihu.com/question/21609463/answer/160100810)

简单说下okhttp的这几个概念

- connectTimeout：这个比较简单，就是建立连接的超时时间
- readTimeout：从建立连接开发，接收服务端的两个数据包之间的最大等待时间。
  - 例如说下载文件的时候，虽然下载很久但是也没有超时。就是因为服务端一直在给你喂数据，没停过。所以不会触发这个读超时
- writeTimeout：写超时是从客户端发送数据给服务端的时候，发送两个数据包之间最大的等待时间。
- callTimeout：调用超时，顾名思义，就是整个调用过程的超时时间。包括了上面所有的时间，还有dns域名解析。

根据上面的日志可以知道，16m的超时的时候我们还在write，发送请求。这就是为什么readTimeout没有生效的原因。因为都还没到read 服务端响应的时候。

于是我本地测试了下，在上传一个大文件的时候，即使上传的时间已经超过了readTimeout规定的时间，但还是没有触发readTimeout，等到上传完成的时候才触发。

那我是不是给他设置一个writeTimeout就可以了呢？但debug发现，原来okhttpClient默认就设置了writeTimeout为10秒。那为啥线上还是搞到了16m？注意下writeTimeout的定义，发送两个数据包之间最大的等待时间。那只要我一直在发，那就无法触发这个writeTimeout了。

于是我又测试了下，还是上传一个大文件，writeTimeout是默认的10秒。结果上传了3分钟还是没有触发write超时，还是一样write完了直接触发readTimeout。然后我将writeTimeout的时间设置到很小，例如10毫秒，结果就发现很快就触发了writeTimeout。跟线上的错误一样的异常日志。说明两个请求数据包之间间隔的时间超过了10毫秒。

# 结论

那问题就比较明朗了，就是线上其实一直都在写，只是对方带宽，网络环境等原因，导致发送请求很慢，但是一直在发。可能几秒发几个字节这样。所以没有触发writeTimeout，更不用说readTimeout。直到最后可能快结束了，出现了一些不可名状的原因，导致触发了writeTimeout。。。最后这个解释有点牵强，我也不清楚为什么最后的超时时间都是16分钟。

# 解决方案

通过设置okhttp的 callTimeout可以完美解决这个问题，简单粗暴。我不管你中间发生了什么，反正我一调用我就开始计时，超时了我就关闭io，然后给你返回个 InterruptIOException。