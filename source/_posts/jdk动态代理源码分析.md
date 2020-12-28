---
title: jdk 动态代理源码分析
date: 2020-12-27 11:58:29
tags:
	- java
	- 源码
categories:
	- 工具开发
typora-root-url: ../../source
---

> 闲来无事，撸撸源码

# 食用方法
直接看代码吧。。

```java
package com.test.demo.proxy;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

/**
 * 每个代理对象 内部都有一个实现了InvocationHandler接口的 类的实例
 *
 * InvocationHandler 顾名思义就是 代理对象的方法调用的处理类(调用它的invoke方法)
 *
 * @author lizhecao 2018/4/19
 * @version 1.0
 */
public class InvocationHandlerImpl implements InvocationHandler {
  // 目标对象
  private Object target;

  public InvocationHandlerImpl(Object target) {
    this.target = target;
  }

  @Override
  public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
    // 代理方法简单地打下日志，这其实就是spring aop的简单实现
    System.out.println("start");

	// 调用目标对象的实际方法
    Object result = method.invoke(target, args);

    System.out.println("end");

    return  result;
  }

  /**
   * 通过Proxy.newProxyInstance 生成代理对象（重要的方法）
   */
  public Object getProxy() {
    return Proxy.newProxyInstance(Thread.currentThread().getContextClassLoader(),
        target.getClass().getInterfaces(), this);
  }

  public static void main(String[] args) {
    // 实例化目标对象
    User user = new UserImpl();

    // 用目标对象实例化InvocationHandler
    InvocationHandlerImpl invocationHandler = new InvocationHandlerImpl(user);

    // 生成代理对象
    User proxyUser = (User) invocationHandler.getProxy();

    // 调用代理对象的方法，实际上就是调用了invocationHandler的invoke方法
    proxyUser.sayHello();
  }
}
```

```java
package com.test.demo.proxy;

/**
 * 目标类的接口，jdk动态代理的类一定要实现某一个接口
 *
 * @author lizhecao 2018/4/19
 * @version 1.0
 */
public interface User {
  void sayHello();
}
```

```java
package com.test.demo.proxy;

/**
 * 目标对象的具体类
 *
 * @author lizhecao 2018/4/19
 * @version 1.0
 */
public class UserImpl implements User {
  @Override
  public void sayHello() {
    System.out.println("hello");
  }
}
```

运行了InvocationHandlerImpl中的main方法我们会得到结果：
```
start
hello
end
```

# 理解原理
通过上面的例子可以看到，生成代理对象的重点是
```java
Proxy.newProxyInstance(Thread.currentThread().getContextClassLoader(),
        target.getClass().getInterfaces(), this);
```
这个方法，我们进入这个方法看看jdk动态代理的具体实现。
去繁就简，删掉一些不关注的东西，有兴趣的自己一一过下
```java
	/**
     * 返回指定接口的代理类实例，并分配方法的调用给指定的invocationHandler
     *
     * @param   loader 用来define代理类的 类加载器
     * @param   interfaces 代理类要实现的接口（这里也说明了jdk动态代理对象必须实现接口）
     * @param   h 用来分配方法调用的 invocation handler
     * @return  一个实现了特定接口，用特定的class loader define的包含特定的invocation hanlder的代理类的实例
     */
    @CallerSensitive
    public static Object newProxyInstance(ClassLoader loader,
                                          Class<?>[] interfaces,
                                          InvocationHandler h)
        throws IllegalArgumentException
    {
	    // 不允许hanlder 为空（不然搞啥）
        Objects.requireNonNull(h);
		// 防止接口被改
        final Class<?>[] intfs = interfaces.clone();

        /*
         * 查找或生产指定代理类（也就是说有缓存机制）（这里是重点，生产了代理类的Class！！）
         */
        Class<?> cl = getProxyClass0(loader, intfs);

        /*
         * 用我们的handler 作为proxy class的构造方法的参数，创建proxy class实例
         */
        final Constructor<?> cons = cl.getConstructor(constructorParams);
        final InvocationHandler ih = h;
        // 强行修改构造方法访问权限为公有
        if (!Modifier.isPublic(cl.getModifiers())) {
            AccessController.doPrivileged(new PrivilegedAction<Void>() {
                public Void run() {
                    cons.setAccessible(true);
                    return null;
                }
            });
        }
        return cons.newInstance(new Object[]{h});
    }
```
继续看这个getProxyClass0(loader, intfs) 是怎么生产代理类的

```java
    private static Class<?> getProxyClass0(ClassLoader loader,
                                           Class<?>... interfaces) {
        // 接口的数量不能超过65535个（呵呵）
        if (interfaces.length > 65535) {
            throw new IllegalArgumentException("interface limit exceeded");
        }
        
        // 从WeakCache的缓存中获取，如果没有就创建
        return proxyClassCache.get(loader, interfaces);
    }
```
这里是通过WeakCache缓存了代理类的实例，就是这货
```java
    /**
     * a cache of proxy classes
     */
    private static final WeakCache<ClassLoader, Class<?>[], Class<?>>
        proxyClassCache = new WeakCache<>(new KeyFactory(), new ProxyClassFactory());
```
这里简单讲下WeakCache，不然没玩过的朋友可能看不下去了。
WeakCache\<K, P, V\> 缓存的是\<key, sub-key\> -> value这样的键值对，key和value是弱引用的，sub-key是强引用的（当然，这不重要）K， P， V分别表示key，参数，value的类型。有人会好奇，那sub-key呢？参数用来干嘛？我们重点看它的构造方法
```java
    /**
     * @param subKeyFactory 一个这样 (key, parameter) -> sub-key 的函数
     * @param valueFactory  一个那样 (key, parameter) -> value的函数
     */
    public WeakCache(BiFunction<K, P, ?> subKeyFactory,
                     BiFunction<K, P, V> valueFactory) {
        this.subKeyFactory = Objects.requireNonNull(subKeyFactory);
        this.valueFactory = Objects.requireNonNull(valueFactory);
    }
```
可以看到，只要传入两个函数类，就可以通过key 和 parameter 分别生成 sub-key和value了，这样我们就可以理解生成代理对象的这一句 
```java
// 第一次获取proxy class就会通过loader 和 interfaces 分别生成缓存的subkey 和 value， 并且返回value
return proxyClassCache.get(loader, interfaces);
```
那么我们也知道了这个value是通过valueFactory生成的，参数是loader 和 interface，那么看下proxyClassCache的实例化方法： new WeakCache\<\>(new KeyFactory(), new ProxyClassFactory()) 就知道了这个ProxyClassFactory类就是真正实现了(loader, interface) -> proxyClass 的函数式类了，赶紧看下
```java
   /**
     * 使用给定的ClassLoader 和 接口数组来 生成，define，返回代理类的函数工厂
     */
    private static final class ProxyClassFactory
        implements BiFunction<ClassLoader, Class<?>[], Class<?>>
    {
        // 所有代理类名称的前缀（有时候debug不是会经常看到这个名称吗哈哈）
        private static final String proxyClassNamePrefix = "$Proxy";

        // 代理类名称的后面跟着的整数（自增的序列）
        private static final AtomicLong nextUniqueNumber = new AtomicLong();

		// 真正搞事情的地方
        @Override
        public Class<?> apply(ClassLoader loader, Class<?>[] interfaces) {

            Map<Class<?>, Boolean> interfaceSet = new IdentityHashMap<>(interfaces.length);
            for (Class<?> intf : interfaces) {
                /*
                 * 验证下Class loader根据类的名称 解析出来的 class跟我们传进来的是否一样（相当于看下是不是同一个loader加载的吧）
                 */
                Class<?> interfaceClass = null;
                try {
                    interfaceClass = Class.forName(intf.getName(), false, loader);
                } catch (ClassNotFoundException e) {
                }
                // 如果不一样，抛异常（loader说我不认识这个接口class）
                if (interfaceClass != intf) {
                    throw new IllegalArgumentException(
                        intf + " is not visible from class loader");
                }
                /*
                 * 验证是否接口（又强调了一定要是接口吧）
                 */
                if (!interfaceClass.isInterface()) {
                    throw new IllegalArgumentException(
                        interfaceClass.getName() + " is not an interface");
                }
                /*
                 * 验证是否重复
                 */
                if (interfaceSet.put(interfaceClass, Boolean.TRUE) != null) {
                    throw new IllegalArgumentException(
                        "repeated interface: " + interfaceClass.getName());
                }
            }

            String proxyPkg = null;     // package to define proxy class in
            int accessFlags = Modifier.PUBLIC | Modifier.FINAL;

            /*
             * 这下面一大段就是确定下代理类要放在哪个包下
             * 如果存在非public的接口，那么proxy class就要放在跟她同一个目录下
             * 而且非public的接口一定要在同一个目录下（不然放哪里都有问题）
             */
            for (Class<?> intf : interfaces) {
                int flags = intf.getModifiers();
                if (!Modifier.isPublic(flags)) {
                    accessFlags = Modifier.FINAL;
                    String name = intf.getName();
                    int n = name.lastIndexOf('.');
                    String pkg = ((n == -1) ? "" : name.substring(0, n + 1));
                    if (proxyPkg == null) {
                        proxyPkg = pkg;
                    } else if (!pkg.equals(proxyPkg)) {
                        throw new IllegalArgumentException(
                            "non-public interfaces from different packages");
                    }
                }
            }

			// 如果接口都public，那么就是放到com.sun.proxy 包下
            if (proxyPkg == null) {
                proxyPkg = ReflectUtil.PROXY_PACKAGE + ".";
            }

            /*
             * 用原子数字自增产生的一个代理类的唯一的代号
             */
            long num = nextUniqueNumber.getAndIncrement();
            String proxyName = proxyPkg + proxyClassNamePrefix + num;

            /*
             * 上面啪啦啪啦一大堆，其实都是一些验证啊，确定包的位置啊，名称啊的细碎的东西
             * 下面这一句才是重点，通过ProxyGenerator产生了代理类的 class 文件的字节数组
             */
            byte[] proxyClassFile = ProxyGenerator.generateProxyClass(
                proxyName, interfaces, accessFlags);
            try {
	            // 最后通过native方法 来生成Class 对象
                return defineClass0(loader, proxyName,
                                    proxyClassFile, 0, proxyClassFile.length);
            } catch (ClassFormatError e) {
                throw new IllegalArgumentException(e.toString());
            }
        }
    }
```
ProxyGenerator 是sun.misc包里面的方法，没有开源，所以我们简单撸一下即可
```java
  public static byte[] generateProxyClass(final String var0, Class<?>[] var1, int var2) {
    ProxyGenerator var3 = new ProxyGenerator(var0, var1, var2);
    // 生成class文件的字节数组
    final byte[] var4 = var3.generateClassFile();
    // 如果saveGeneratedFiles为true，那么将.class文件写到硬盘中
    if (saveGeneratedFiles) {
      // 省略具体保存文件方法
    }

    return var4;
  }
```
看下这个保存文件的条件
```java
  private static final boolean saveGeneratedFiles = ((Boolean)AccessController.doPrivileged(new GetBooleanAction("sun.misc.ProxyGenerator.saveGeneratedFiles"))).booleanValue();
```
也就是说只要我们设置了这个"**sun.misc.ProxyGenerator.saveGeneratedFiles**" 系统值为true就可以保存文件了
话不多说来看看jdk动态代理给我们自动生成的这个class文件长什么样吧，用以下代码来测试

```java
package com.test.demo.proxy;

import sun.misc.ProxyGenerator;

import java.io.FileOutputStream;
import java.io.IOException;

/**
 * 写代理类文件到磁盘中
 *
 * @author lizhecao 2018/4/20
 * @version 1.0
 */
public class ProxyClassGen {
  public static void main(String[] args) throws IOException {

//    // 第一种方法，直接将生成的字节数组写到文件中
//    byte[] bytes = ProxyGenerator.generateProxyClass("$Proxy33", UserImpl.class.getInterfaces());
//
//    try(FileOutputStream outputStream = new FileOutputStream(
//        "/Users/lizhecao/java/demo/src/main/java/com/test/demo/proxy/$Proxy33.class")) {
//      outputStream.write(bytes);
//    }
    // 第二种方法，设置系统属性值，有jdk自动写
    System.setProperty("sun.misc.ProxyGenerator.saveGeneratedFiles", "true");
    ProxyGenerator.generateProxyClass("$Proxy34", UserImpl.class.getInterfaces());
  }
}
```
运行之后可以看到在项目的根目录下产生了$Proxy34.class 这么一个文件，用ide直接打开可以看到如下内容
```java
//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by Fernflower decompiler)
//

import com.test.demo.proxy.User;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.lang.reflect.UndeclaredThrowableException;

public final class $Proxy34 extends Proxy implements User {
  private static Method m1;
  private static Method m3;
  private static Method m2;
  private static Method m0;

  public $Proxy34(InvocationHandler var1) throws  {
    super(var1);
  }

  // 除了接口方法之外，还实现了Object的equals, hashCode和toString方法
  public final boolean equals(Object var1) throws  {
    try {
      return ((Boolean)super.h.invoke(this, m1, new Object[]{var1})).booleanValue();
    } catch (RuntimeException | Error var3) {
      throw var3;
    } catch (Throwable var4) {
      throw new UndeclaredThrowableException(var4);
    }
  }
  // 实现了我们的User接口的sayHello方法
  public final void sayHello() throws  {
    try {
      // 内部其实就是调用了invokeHandler实例的invoke方法
      // 在最下面可以看到m3 就是通过反射获取的User接口的sayHello Method
      // Class.forName("com.test.demo.proxy.User").getMethod("sayHello");
      super.h.invoke(this, m3, (Object[])null);
    } catch (RuntimeException | Error var2) {
      throw var2;
    } catch (Throwable var3) {
      throw new UndeclaredThrowableException(var3);
    }
  }

  public final String toString() throws  {
    try {
      return (String)super.h.invoke(this, m2, (Object[])null);
    } catch (RuntimeException | Error var2) {
      throw var2;
    } catch (Throwable var3) {
      throw new UndeclaredThrowableException(var3);
    }
  }

  public final int hashCode() throws  {
    try {
      return ((Integer)super.h.invoke(this, m0, (Object[])null)).intValue();
    } catch (RuntimeException | Error var2) {
      throw var2;
    } catch (Throwable var3) {
      throw new UndeclaredThrowableException(var3);
    }
  }

  static {
    try {
      m1 = Class.forName("java.lang.Object").getMethod("equals", Class.forName("java.lang.Object"));
      m3 = Class.forName("com.test.demo.proxy.User").getMethod("sayHello");
      m2 = Class.forName("java.lang.Object").getMethod("toString");
      m0 = Class.forName("java.lang.Object").getMethod("hashCode");
    } catch (NoSuchMethodException var2) {
      throw new NoSuchMethodError(var2.getMessage());
    } catch (ClassNotFoundException var3) {
      throw new NoClassDefFoundError(var3.getMessage());
    }
  }
}
```

到了这里，jdk动态代理就已经是拨开云雾见青天，一清二楚了

感谢以下的博主分享：
[JDK动态代理实现原理](http://rejoy.iteye.com/blog/1627405)