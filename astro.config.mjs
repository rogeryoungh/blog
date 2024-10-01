// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

import sitemap from '@astrojs/sitemap';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.rogery.dev/',
	integrations: [mdx(), sitemap()],
	markdown: {
		rehypePlugins: [rehypeKatex],
		remarkPlugins: [remarkMath]
	}
});
