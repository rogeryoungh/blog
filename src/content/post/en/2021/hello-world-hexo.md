---
title: "Setting Up Hexo"
pubDate: "2021-02-02"
description: "Moved to Hugo."
---

> Translated by ChatGPT.

**Moved to Hugo.**

After tinkering for a whole day, I finally got Hexo deployed on GitHub Pages. I am still too inexperienced.

After another day of tinkering, I redeployed the blog in a new way, so I might as well rewrite Hello World too.

## Setting up Hexo locally

Install git and npm, and switch to the Taobao mirror. After that, install `hexo-cli`.

```bash
$ npm install -g hexo-cli
```

Use `hexo` to create a new directory `blog`, then enter it and initialize the environment.

```bash
$ hexo init blog
$ cd blog
$ npm install
```

At this point, you can find the `hello-world.md` document under `source/_posts/`, and you can modify it to try things out.

Take a look at the result.

```bash
$ hexo serve
```

## Theme configuration

In the end I chose [Keep](https://github.com/XPoet/hexo-theme-keep). It is simple and elegant, exactly to my taste.

The author of Keep provides a [demo](https://xpoet.cn), which is his own blog. There are also two documents, [Keep Theme Usage Guide](https://xpoet.cn/2020/04/Keep-%E4%B8%BB%E9%A2%98%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97/) and [Keep Theme Configuration Guide](https://keep.xpoet.cn/2020/11/Keep-%E4%B8%BB%E9%A2%98%E9%85%8D%E7%BD%AE%E6%8C%87%E5%8D%97/). They explain things in great detail, and following them makes configuration easy.

Then you can add the plugins you want according to the docs, such as search and mathjax, which I added.

I decided to use the theme through a submodule, so style tweaks would not pollute the article timeline.

First fork the theme, then reference it in the blog project.

```bash
$ git submodule add https://github.com/RogerYoungh/hexo-theme-keep themes/keep
```

Modify the blog project's config and check whether the theme has changed. Then comes the much-loved theme hacking... eight hundred words omitted here.

The theme is an independent project, so updates need to be committed inside `themes/keep`. But at this point the repository is detached, so set it up before committing changes.

```bash
$ git checkout master
```

After that, add and push to commit the submodule.

> Sometimes you may directly modify and commit inside the theme repository, while the main repository will not automatically update the dependency version. In that case, update the submodule:
>
> ```bash
> $ git submodule update --remote --merge
> ```
>

In short, after the blog repository successfully pulls the theme submodule, update it.

```bash
$ git add .
$ git submodule
```

You should be able to see that the submodule SHA has been updated.

## GitHub Action deployment

Maintaining the code branch and the webpage branch separately is troublesome, so I used GitHub Actions for automatic deployment.

First set the deployment target in `_config.yml`:

```yml
deploy:
  type: git
  repo: https://github.com/用户名/用户名.github.io.git
  branch: gh-page
```

Search Google directly for Hexo GitHub Action. The first result should be the one. Fill in the information and configure it according to the instructions, then push and it should work.

> The push will of course error out; just set the upstream address according to the prompt. I will be lazy and skip writing it here (

Now we can see our posts at `用户名.github.io`!

When cloning the repository later, do not run `hexo init` again. Just run `hexo serve`, and install whatever packages are missing with `npm install` according to the prompts.

## Gitalk comments

Keep's documentation explains this clearly. First request an [OAuth](https://github.com/settings/applications/new), and fill in the blog address. I directly used the blog repository as the issues repository, so the config file just contains the repository address of the blog.

After deployment, logging in as the blog owner will automatically create issues. Editing and deleting comments need to be done on the repository's issues page.

After thinking about it, I still turned comments off. Looking at those issues is annoying, ~~mainly because nobody comments anyway~~. If someone wants to contact me, I have left my email on both the blog and GitHub.

When someone actually comes to talk to me, I will turn comments back on. Otherwise, having so many issues with only me in them looks a bit pitiful.

## MathJax Test

$\mathrm\LaTeX$, Pythagorean theorem $a^2+b^2=c^2$,

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
