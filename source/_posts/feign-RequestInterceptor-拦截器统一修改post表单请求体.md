---
title: feign RequestInterceptor 拦截器统一修改post表单请求体
date: 2020-12-26 16:05:43
tags:
        - 源码学习
		- java
categories:
        - java
typora-root-url: ../../source
---

# RequestInterceptor介绍

现在很多开发都是用feign来请求三方接口。feign很方便，通过接口的方式来请求三方，有助于我们以面向接口编程，也简化了之前手工创建httpclient等麻烦的流程。但是对于三方接口中需要统一添加签名要怎么办呢？

莫慌，Feign给我们预留了一个RequestInterceptor接口，它可以在我们的请求发送之前对请求内容（包装成一个RequestTemplate）做统一的处理。那我们就可以在这里对请求参数做一些统一处理了



# 拦截并修改post json请求体

我们有一个三方的接口是post json的，并且有统一的参数如下

```json
{
  "appId": xxx,
  "sign": xxx,
  "timestampe": xxx,
  "data": {"a": xxx} //真正的数据以json格式放在data中
}
```

那我们声明的feign接口，使用的时候不可能每次都去构造这些通用的参数，应该只需要传变化的东西进来就好了。例如上面的{"a": xxx}。那么不变的部分在哪里添加呢？答案就是我们的RequestInterceptor

```java
public class FeignInterceptor implements RequestInterceptor {
  @Override
  public void apply(RequestTemplate template) {
    // 通过template获取到请求体（已经被转成json）
    String jsonBody = template.requestBody().asString();
    // 构造通用的请求体
    BaseReq baseReq = translateToBaseReq(jsonBody);
    // 替换请求体
    String baseReqStr = JSON.toJSONString(baseReq);
    template.body(baseReqStr);
  }
}
```

然后在我们需要的Feign接口的注解中配置configuration，标明使用这个拦截器配置就可以了

```java
@FeignClient(name = "hello", url = "hello", configuration = FeignInterceptor.class)
public interface HelloFeign {
  @PostMapping("test")
  void test(@RequestBody ConcreteData data);
}
```

这样就ok了，是不是很简单，然后我们的接口参数中只需要写实际要传的具体数据的类就行了。



# 拦截并修改post form请求体

post json搞定了，但接下来又出现了一个三方。它的接口是post表单形式的。有同学说，post表单我会。

网上也有很多这方面的教程，例如：[2018-06-19 SpringCloud Feign Post表单请求](https://www.jianshu.com/p/08a5dd04093e)，但是关键是post表单了之后，怎么处理统一的请求体呢？很明显，像上面直接通过template.body方式替换是不行的，这样请求体就是json字符串了。而form格式是a=xxx&b=xxx这样的。那有同学就说，我自己这样构造不就可以了？可以是可以，但是这就是在重复造轮子了。feign既然能发送post form的请求，说明它已经实现过了。那我们是不是可以借鉴下呢？

## 一览源码

那我们就顺着请求来看看feign是怎么post form的吧。（debug模式中在调用feign接口的地方step into）来到了ReflectiveFeign类的 public Object invoke(Object proxy, Method method, Object[] args)方法。继续往下走在return dispatch.get(method).invoke(args);这里继续step into来到了SynchronousMethodHandler类的invoke方法。

```java
public Object invoke(Object[] argv) throws Throwable {
  //这里将参数构造成了最终的RequestTemplate，我们从这里进去看看
    RequestTemplate template = buildTemplateFromArgs.create(argv);
    ....
}
```



```java
 @Override
    public RequestTemplate create(Object[] argv) {
      // 通过元数据初始化了一个RequestTemplate（不包含请求体）
      RequestTemplate mutable = RequestTemplate.from(metadata.template());
      ......
  		// 这里才是生成最后的template的地方，继续进去
      RequestTemplate template = resolve(argv, mutable, varBuilder);
      ......
    }
```

```java
protected RequestTemplate resolve(Object[] argv,
                                      RequestTemplate mutable,
                                      Map<String, Object> variables) {
   			......
        // 在这里对template的body进行了组装
        encoder.encode(formVariables, Encoder.MAP_STRING_WILDCARD, mutable);
     		......
  }
```

从这里encode方法就会调用SpringFormEncoder的encode方法，然后就会到FormEncoder的encode，最后调用到UrlencodedFormContentProcessor的process方法

```java
@Override
  public void process (RequestTemplate template, Charset charset, Map<String, Object> data) throws EncodeException {
    val bodyData = new StringBuilder();
    // 这里对请求体中的参数进行处理（Map<String,?>）
    for (Entry<String, Object> entry : data.entrySet()) {
      if (entry == null || entry.getKey() == null) {
        continue;
      }
      // 参数之间用&连接
      if (bodyData.length() > 0) {
        bodyData.append(QUERY_DELIMITER);
      }
      // 参数key value之间用=号连接
      bodyData.append(createKeyValuePair(entry, charset));
    }

    // 构造application/x-www-form-urlencoded的请求头和charset
    val contentTypeValue = new StringBuilder()
        .append(getSupportedContentType().getHeader())
        .append("; charset=").append(charset.name())
        .toString();

    val bytes = bodyData.toString().getBytes(charset);
    val body = Request.Body.encoded(bytes, charset);
		// 清空原来的header，然后设置新的header以及替换上面的body
    template.header(CONTENT_TYPE_HEADER, Collections.<String>emptyList()); // reset header
    template.header(CONTENT_TYPE_HEADER, contentTypeValue);
    template.body(body);
  }
```

# 分析改造

从上面的源码中，我们可以看到其实feign就是通过SpringFormEncoder的encode方法，来将template的body替换成需要的表单数据的。那么这么encoder其实也是我们在post form的时候自己配置了@Bean注入的，那么我们同样也可以拿来用啊。

于是开始改造原来的Interceptor。

```java
public class FeignFormInterceptor implements RequestInterceptor {
  @Autowired
  SpringFormEncoder encoder;

  @Override
  public void apply(RequestTemplate template) {
    // 通过template获取到请求体（已经被转成json）
    String jsonBody = template.requestBody().asString();
    // 构造通用的请求体
    BaseReq baseReq = translateToBaseReq(jsonBody);
    // 通过encoder的encode方法，将我们的数据 改成表单数据，并替换掉原来的template中的body
    encoder.encode(baseReq, Encoder.MAP_STRING_WILDCARD, template);
  }
}
```

```java
@FeignClient(name = "hello", url = "hello", configuration = FeignFormInterceptor.class)
public interface HelloFeign {
  @PostMapping(value = "testForm", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
  void testForm(@RequestBody ConcreteData data);
}
```



看起来似乎ok了？nonono，还是出问题了。因为我们取出来的原来的body中的数据（通过template.requestBody().asString()）不是json字符串。因为我们的feign接口定义的是post表单的，所以请求参数就被改造成a=xxx&b=xxx的形式了。所以这样就导致我们取出来的不是json串，那这样我们实际发送的data，也就是baseReq中的data的数据就是a=xxx&b=xxx，但实际我们要求的是json形式的。

那这可咋办？看起来似乎只能够改造这个数据成json格式了。但这样未免稍嫌麻烦，而且也不知道中间有什么坑没有。我们不是想获得json串吗？那我接口还是定义成post json的不就可以了吗？机智

```java
@FeignClient(name = "hello", url = "hello", configuration = FeignFormInterceptor.class)
public interface HelloFeign {
  @PostMapping(value = "testForm")
  void testForm(@RequestBody ConcreteData data);
}
```

但是这样的话，请求三方的header就又变成application/json的，并且数据也是json格式的。有人会说，不是encode里面会将header改造成application/x-www-form-urlencoded的吗？但那是在我们设置了consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE才会进入到最后的process方法。看下这个FormCoder的encode方法就知道了

```java
@Override
  @SuppressWarnings("unchecked")
  public void encode (Object object, Type bodyType, RequestTemplate template) throws EncodeException {
    String contentTypeValue = getContentTypeValue(template.headers());
    // 这里获取了我们设置的header类型，也就是默认的application/json
    val contentType = ContentType.of(contentTypeValue);
    // 没有处理这个contentType的processors，就直接返回了。
    if (!processors.containsKey(contentType)) {
      delegate.encode(object, bodyType, template);
      return;
    }
    ......
    val charset = getCharset(contentTypeValue);
    // 而我们之前设置consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE的时候就会到这里，然后调用到UrlencodedFormContentProcessor的process方法。那里才能改造header
    processors.get(contentType).process(template, charset, data);
  }
```



知道了原理后，那其实我们只要在进入这个encode方法之前，将我们的header改成application/x-www-form-urlencoded不就可以了吗？于是乎

```java
public class FeignFormInterceptor implements RequestInterceptor {
  @Autowired
  SpringFormEncoder encoder;

  @Override
  public void apply(RequestTemplate template) {
    // 通过template获取到请求体（已经被转成json）
    String jsonBody = template.requestBody().asString();
    // 构造通用的请求体
    BaseReq baseReq = translateToBaseReq(jsonBody);
    // 先改造下header成表单头，magic就出现了哈
    template.header(CONTENT_TYPE_HEADER, Collections.<String>emptyList()); // reset header
    template.header(CONTENT_TYPE_HEADER, URLENCODED.getHeader());
    // 通过encoder的encode方法，将我们的数据 改成表单数据，并替换掉原来的template中的body
    encoder.encode(baseReq, Encoder.MAP_STRING_WILDCARD, template);
  }
}
```

到此，重要成功地拦截了feign的post表单请求，并统一加上了公用参数、签名等。

## 总结

啪啪一通，总结下最后的解决方案吧。

1. 还是按照正常的post json的方式去写feign接口
2. 在Interceptor中
   1. 获取到json串并改造成最后的请求对象
   2. 修改header为application/x-www-form-urlencoded
   3. 通过springEncoder的encode方法构造最终的表单请求体，并替换掉template中的（SpringFormEncoder还是要我们自己注入到容器的，在feign的post表单教程中都会提到）



# 为什么不直接用aop

有的同学会说，整那么多事，直接搞个aop不就行。无论是post表单还是json，改造下请求参数就可以了。这里我也想过要试试aop，但是有个需求aop不好满足，就是我还要根据feign的url来修改请求体。通过aop的话，可能不是很好获得这个url。而拦截器通过template可以轻松取到。所以整体来说还是Interceptor功能更强劲些。毕竟是原生的扩展😁

