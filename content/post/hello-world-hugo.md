---
author: "rogeryoungh"
title: "迁移博客到 Hugo"
date: "2021-06-09"
description: "迁移博客到 Hugo。"
katex: true
---

~~啥也没写，先发两篇 Hello World（~~

迁移时遇到了一点问题，在这里记录下。

## 修公式

当我把文档从 TeXmacs 转到博客时，发现公式没有渲染，看了半天才明白是下划线被转成 `<em>` 标签。

解决办法是创建 Hugo 的 shortcode，可以设定其不被 Markdown 解析。在主题创建 `layouts/shortcodes/display-math.html`，内容是

```html
<p> $${{ .Inner }}$$ </p>
```

现在行间公式改为如下包裹

<div class="highlight"><pre tabindex="0" class="chroma"><code class="language-html hljs xml" data-lang="html">{{&lt; display-math &gt;}}
(\operatorname{DFT}_{\omega})^{-1} = \frac{1}{n} (\operatorname{DFT}_{-1})
{{&lt; /display-math &gt;}}
</code></pre><button class="copy-code">copy</button></div>

行内公式也是一样，但是因为行内公式很少特别复杂，所以我只改了行间公式。
