---
name: translate-blog-post
description: Translate this Astro bilingual blog's Markdown posts between Chinese and English. Use when asked to translate, fill, update, or create the matching language version of files under src/content/post/zh or src/content/post/en, including frontmatter title/description/tags and Markdown body while preserving the existing URL slug and blog structure.
---

# Translate Blog Post

## Scope

Translate posts in this repository's bilingual content tree:

- Chinese: `src/content/post/zh/<year>/<slug>.md`
- English: `src/content/post/en/<year>/<slug>.md`

Treat matching files with the same `<year>/<slug>` as translations of the same article. Keep the slug and year directory unchanged.

## Workflow

1. Read the source file and the target file if it exists.
2. Preserve target frontmatter keys required by `src/content.config.ts`: `title`, `description`, `pubDate`, optional `updatedDate`.
3. Translate `title` and `description` into the target language.
4. Translate `tags` when present. Use Chinese tags in `zh` files and English tags in `en` files.
5. Translate the Markdown body while preserving structure, code, math, links, images, tables, headings, lists, admonitions, and HTML.
6. Keep code blocks, inline code identifiers, CLI commands, URLs, file paths, API names, and variable names unchanged unless the surrounding prose clearly requires a human-readable phrase.
7. Preserve image/link targets exactly unless the target-language article already uses a different valid target.
8. If the target file is a placeholder with only frontmatter, replace or append the translated body after the frontmatter.
9. Run `pnpm build` after editing unless the user explicitly asks not to.

## Translation Style

- Chinese output: natural technical Chinese, concise, not overly formal. Prefer existing Chinese terminology in nearby posts.
- English output: natural technical English, direct and readable. Do not over-polish into marketing copy.
- Keep the author's casual tone when present.
- Do not summarize, omit, or add claims. Translate the article, not a rewritten article.
- Keep punctuation idiomatic for the target language.

## Empty Or Partial Targets

If the target language file is missing, create it beside the matching language tree with the same `<year>/<slug>.md`.

For an empty placeholder target, derive `pubDate`, `updatedDate`, images, and any non-language metadata from the source. Translate language-facing metadata (`title`, `description`, `tags`).

If the source has metadata not covered here, preserve it unless it is clearly language-facing.

## Validation

After changes:

- Confirm both language files exist for the translated post.
- Confirm the post URL remains `/zh/post/<year>/<slug>/` and `/en/post/<year>/<slug>/`.
- Confirm frontmatter parses.
- Run `pnpm build`.
