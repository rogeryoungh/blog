// @ts-check
import { defineConfig } from 'astro/config';
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
		shikiConfig: {
      theme: 'github-light',
    },
		rehypePlugins: [rehypeKatex],
		remarkPlugins: [remarkMath]
	},
	devToolbar: {
		enabled: false
	},
});
