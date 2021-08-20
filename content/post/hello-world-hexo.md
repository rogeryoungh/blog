---
author: "rogeryoungh"
title: "Hexo 搭建记录"
date: "2021-02-02"
description: "已转 Hugo。"
katex: true
---

**已转 Hugo。**

折腾了一整天，终于把 Hexo 给搭到 GitHub Page 上，我还是太菜了。

又折腾了一天，使用了新的方式重新部署了博客，那也重写一下 Hello World 吧。

## Hexo 本地搭建

装 git 和 npm、换淘宝源。装好之后安装 `hexo-cli`。

```bash
$ npm install -g hexo-cli
```

用 `hexo` 新建目录 `blog`，进入目录。初始化环境

```bash
$ hexo init blog
$ cd blog
$ npm install
```

这时，`source/_posts/` 下可以看到 `hello-world.md` 文档，可以修改试试。

查看一下成果。

```bash
$ hexo serve
```

## 主题配置

最终选定了 [Keep](https://github.com/XPoet/hexo-theme-keep)，简洁大方，深得我心。

Keep 的作者给了一个 [Demo](https://xpoet.cn)，就是他自己的博客。还有两篇文档，[Keep 主题使用指南](https://xpoet.cn/2020/04/Keep-%E4%B8%BB%E9%A2%98%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97/) 和 [Keep 主题配置指南](https://keep.xpoet.cn/2020/11/Keep-%E4%B8%BB%E9%A2%98%E9%85%8D%E7%BD%AE%E6%8C%87%E5%8D%97/) 。这两个文档讲的非常详细，跟着做很容易就配好了。

然后可以根据文档加入想要的插件，比如我加了 search 和 mathjax 等。

我决定通过 submodule 的方式使用主题，这样魔改样式时不会污染文章的时间线。

先 Fork 主题，然后在 blog 项目中引用。

```bash
$ git submodule add https://github.com/RogerYoungh/hexo-theme-keep themes/keep
```

修改 blog 项目的配置，查看一下主题是否变了。接下来就开始喜闻乐见的魔改主题……此处省略八百字

主题是独立的项目，更新需要到 `themes/keep` 目录进行提交。但此时该仓库是游离态，提交修改需要先设置。

```bash
$ git checkout master
```

之后 add、push 即可提交子模块。

> 有时可能直接在主题仓库中修改提交，而主仓库并不会随之更新依赖版本。此时需要更新子模块
> 
> ```bash
> $ git submodule update --remote --merge
> ```
> 

总之，博客仓库中成功拉取主题子模块，之后更新。

```bash
$ git add .
$ git submodule
```

应该可以看到子模块的 SHA 更新了。

## GitHub Action 部署

分别维护代码和网页分支较为麻烦，于是我采用 GitHub Action 做自动部署。

首先在 `_config.yml`里设置部署位置

```yml
deploy:
  type: git
  repo: https://github.com/用户名/用户名.github.io.git
  branch: gh-page
```

在 Google 直接搜 Hexo GitHub Action，第一个应该就是，按照说明填写信息并配置，push 上去应该就成功了。

> push 当然会报错，根据提示设好上游地址，这里我就偷懒不写啦（

现在我们可以在 `用户名.github.io` 里看到我们的文章啦！

clone 下来的时候，不要再 `hexo init` 了，直接 `hexo serve`，根据提示缺啥包就用 `npm install` 把包装上。

## Gitalk 评论

Keep 的文档讲的已经很清楚了，先请求 [OAuth](https://github.com/settings/applications/new)，填写博客地址。我直接把博客地址当 issues 仓库，配置文件里就填博客所在的 Repository 地址。

部署上去后，博主登录会自动创建 issues。编辑删除等需要到仓库的 issus 地址去操作。

想了想，还是把评论关了，看着那 issues 闹心，~~主要也没啥人评论~~。如果想与我联系的，博客和 GitHub 我都留了邮箱。 

等真有人找我说话了，我再把评论打开吧，不然那么多 issues 都只有我一个人，看着怪可怜的。

## MathJax Test

$\mathrm\LaTeX$，勾股定理 $a^2+b^2=c^2$，

$$
\sum_{n=1}^\infty \frac{1}{n^2} = \frac{\pi^2}{6}
$$

## Code Highlight Test

```java
public class Main {
    public static void main(String args[]) {
        System.out.println("Hello World!");
    }
}
```
