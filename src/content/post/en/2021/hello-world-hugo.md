---
title: "Migrating My Blog to Hugo"
pubDate: "2021-06-09"
description: "Migrating my blog to Hugo."
---

> Translated by ChatGPT.

~~Nothing much to write, so I will publish two Hello World posts first (~~

I ran into a few issues during the migration, so I am recording them here.

## Fixing formulas

Markdown and TeX interpret underscores differently, and there are many other escaping issues. As a result, KaTeX cannot render normally in the browser.

My solution was to write a [small script](https://github.com/rogeryoungh/preprocessor-md-tex) that escapes strings ahead of time. This way Hugo outputs exactly the original content, and the formulas render correctly.
