// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig, fontProviders } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import mdx from '@astrojs/mdx';
import unocss from 'unocss/astro'

import sitemap from '@astrojs/sitemap';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

const postLocales = ['zh', 'en'];

/**
 * @param {string} locale
 */
function getPostRedirectEntries(locale) {
	const postDir = new URL(`./src/content/post/${locale}/`, import.meta.url);
	return readdirSync(postDir, { recursive: true })
		.filter((file) => typeof file === 'string')
		.filter((file) => file.endsWith('.md'))
		.flatMap((file) => {
			const slug = file.replace(/\.md$/, '');
			const content = readFileSync(new URL(file, postDir), 'utf8');
			const year = content.match(/pubDate:\s*["']?(\d{4})/)?.[1];
			if (!year) {
				throw new Error(`Missing pubDate year in ${locale}/${file}`);
			}
			const legacySlug = slug.startsWith(`${year}/`) ? slug.slice(year.length + 1) : slug;
			const localizedOldPath = `/${locale}/post/${legacySlug}`;
			const localizedNewPath = `/${locale}/post/${slug}`;
			const entries = [[localizedOldPath, localizedNewPath]];
			if (locale === 'zh') {
				entries.push([`/post/${legacySlug}`, localizedNewPath]);
			}
			return entries;
		});
}

const postRedirects = Object.fromEntries(
	postLocales.flatMap(getPostRedirectEntries),
);

function rehypeScrollTables() {
	/**
	 * @param {any} node
	 */
	function wrapTables(node) {
		if (!Array.isArray(node.children)) {
			return;
		}

		const isScrollWrapper = node.type === 'element'
			&& node.tagName === 'div'
			&& Array.isArray(node.properties?.className)
			&& node.properties.className.includes('scroll-wrapper');

		node.children = node.children.map(/** @param {any} child */ (child) => {
			if (!isScrollWrapper && child.type === 'element' && child.tagName === 'table') {
				return {
					type: 'element',
					tagName: 'div',
					properties: { className: ['scroll-wrapper'] },
					children: [child],
				};
			}

			wrapTables(child);
			return child;
		});
	}

	return wrapTables;
}

const redirects = {
	'/about': '/zh/about',
	'/post': '/zh/post',
	'/rss.xml': '/zh/rss.xml',
	...postRedirects,
};

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.rogery.dev/',
	fonts: [{
		name: 'Noto Serif SC',
		cssVariable: '--font-noto-serif-sc',
		provider: fontProviders.google(),
		weights: ['200 900'],
		styles: ['normal'],
		subsets: ['latin', 'chinese-simplified'],
	}],
	i18n: {
		locales: ['zh', 'en'],
		defaultLocale: 'zh',
		routing: {
			prefixDefaultLocale: true,
		},
	},
	redirects,
	integrations: [mdx(), sitemap(), unocss()],
	markdown: {
		processor: unified({
			rehypePlugins: [rehypeKatex, rehypeScrollTables],
			remarkPlugins: [remarkMath],
		}),
		shikiConfig: {
			themes: {
				light: 'github-light',
				dark: 'github-dark',
			},
			defaultColor: false,
		},
	},
	devToolbar: {
		enabled: false
	},
});
