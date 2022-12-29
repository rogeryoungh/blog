---
author: "rogeryoungh"
title: "迁移博客到 Hugo"
date: "2021-06-09"
description: "迁移博客到 Hugo。"
---

~~啥也没写，先发两篇 Hello World（~~

迁移时遇到了一点问题，在这里记录下。

## 修公式

Markdown 和 TeX 对下划线的解释不一样，还有很多其他的转义问题，导致 KaTeX 不能在浏览器中正常渲染。

解决办法是我写了一个[小脚本](https://github.com/rogeryoungh/preprocessor-md-tex)，它能够提前对字符串进行转义，这样 hugo 吐出来的恰是原内容，就可以正常渲染了。
