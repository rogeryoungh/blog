import { defineConfig, presetIcons, presetUno, transformerDirectives } from 'unocss'

export default defineConfig({
	shortcuts: {
		'bg-base': 'bg-white dark:bg-black',
		'color-base': 'text-black dark:text-white',
		'border-base': 'border-[#8884]',
	},
	presets: [
		presetIcons(),
		presetUno()
	],
	transformers: [transformerDirectives()],
	theme: {
		colors: {
			primary: '#000',
			secondary: '#555',
			link: '#a80000'
		},
		fontFamily: {
			serif: 'Noto Serif CJK SC, Source Han Serif CN, 思源宋体 CN, Noto Serif SC, Simsun, serif',
			mono: 'Maple Mono, Jetbrains Mono',
			emoji: 'Apple Color Emoji, Noto Color Emoji'
		}
	}
});
