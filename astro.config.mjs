// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import unocss from 'unocss/astro'

import sitemap from '@astrojs/sitemap';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.rogery.dev/',
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
