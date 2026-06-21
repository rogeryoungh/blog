import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../../consts';
import { getLocale, getLocalizedPostPath, getPostsByLocale, locales } from '../../i18n';

export function getStaticPaths() {
	return locales.map((locale) => ({ params: { locale } }));
}

export async function GET(context: any) {
	const locale = getLocale(context.params.locale);
	const posts = getPostsByLocale(await getCollection('post'), locale);
	return rss({
		title: `${SITE_TITLE} (${locale})`,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: getLocalizedPostPath(locale, post),
		})),
	});
}
