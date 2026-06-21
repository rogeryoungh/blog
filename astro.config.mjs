// @ts-check
import { readdirSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import unocss from 'unocss/astro'

import sitemap from '@astrojs/sitemap';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

const zhPostDir = new URL('./src/content/post/zh/', import.meta.url);
const postRedirects = Object.fromEntries(
	readdirSync(zhPostDir, { recursive: true })
		.filter((file) => typeof file === 'string')
		.filter((file) => file.endsWith('.md'))
		.flatMap((file) => {
			const slug = file.replace(/\.md$/, '');
			return [[`/post/${slug}`, `/zh/post/${slug}`]];
		}),
);

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.rogery.dev/',
	i18n: {
		locales: ['zh', 'en'],
		defaultLocale: 'zh',
		routing: {
			prefixDefaultLocale: true,
		},
	},
	redirects: {
		'/about': '/zh/about',
		'/post': '/zh/post',
		'/rss.xml': '/zh/rss.xml',
		...postRedirects,
	},
	integrations: [mdx(), sitemap(), unocss()],
	markdown: {
		processor: unified({
			rehypePlugins: [rehypeKatex],
			remarkPlugins: [remarkMath],
		}),
		shikiConfig: {
      theme: 'github-light',
    },
	},
	devToolbar: {
		enabled: false
	},
});
