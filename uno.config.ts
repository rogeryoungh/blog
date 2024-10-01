import { defineConfig, presetUno, transformerDirectives } from 'unocss'

export default defineConfig({
	shortcuts: {
		'bg-base': 'bg-white dark:bg-black',
		'color-base': 'text-black dark:text-white',
		'border-base': 'border-[#8884]',
	},
	presets: [
		presetUno()
	],
	transformers: [transformerDirectives()],
	theme: {
		fontFamily: {
			serif: 'Noto CJK SC, Source Han Serif CN, 思源宋体 CN, Noto Serif SC, Simsun, serif',
			mono: 'Maple Mono, Jetbrains Mono',
			emoji: 'Apple Color Emoji, Noto Color Emoji'
		}
	}
});
