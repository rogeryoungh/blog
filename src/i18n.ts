import type { CollectionEntry } from "astro:content";

export const locales = ["zh", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh";

export const localeMeta: Record<Locale, { label: string; htmlLang: string }> = {
	zh: { label: "中文", htmlLang: "zh-CN" },
	en: { label: "English", htmlLang: "en" },
};

export const ui = {
	zh: {
		home: "首页",
		articles: "文章",
		about: "关于",
		archiveTitle: "目录",
		homeIntro: "我是 Roger Young，喜欢数学和编程。",
		homeNotice: "博客正在改版中，可能会有奇奇怪怪的问题。",
		myArticles: "文章目录",
		aboutMe: "关于我",
		noArticles: "暂无文章。",
	},
	en: {
		home: "Home",
		articles: "Articles",
		about: "About",
		archiveTitle: "Articles",
		homeIntro: "I'm Roger Young. I like mathematics and programming.",
		homeNotice: "This blog is being rebuilt, so some parts may still be rough.",
		myArticles: "My articles",
		aboutMe: "About me",
		noArticles: "No articles yet.",
	},
} as const;

export function isLocale(value: string | undefined): value is Locale {
	return locales.includes(value as Locale);
}

export function getLocale(value: string | undefined): Locale {
	return isLocale(value) ? value : defaultLocale;
}

export function getLocalePath(locale: Locale, path = "") {
	const cleanPath = path.replace(/^\/+|\/+$/g, "");
	return cleanPath ? `/${locale}/${cleanPath}/` : `/${locale}/`;
}

export function getPostInfo(post: CollectionEntry<"post">) {
	const [locale, ...slugParts] = post.id.split("/");
	return {
		locale: getLocale(locale),
		slug: slugParts.join("/"),
	};
}

export function getLocalizedPostPath(locale: Locale, post: CollectionEntry<"post">) {
	return getLocalePath(locale, `post/${getPostSlug(post)}`);
}

export function getPostsByLocale(posts: CollectionEntry<"post">[], locale: Locale) {
	return posts.filter((post) => getPostInfo(post).locale === locale);
}

export function getPostSlug(post: CollectionEntry<"post">) {
	return getPostInfo(post).slug;
}

export function getPostTranslationKey(post: CollectionEntry<"post">) {
	return getPostSlug(post).split("/").at(-1) ?? getPostSlug(post);
}

export function findPostTranslation(
	posts: CollectionEntry<"post">[],
	post: CollectionEntry<"post">,
	locale: Locale,
) {
	const slug = getPostTranslationKey(post);
	return posts.find((item) => {
		const info = getPostInfo(item);
		return info.locale === locale && getPostTranslationKey(item) === slug;
	});
}
