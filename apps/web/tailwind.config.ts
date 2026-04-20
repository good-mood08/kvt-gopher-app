import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './app.vue',
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './error.vue',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#477DFF',
          50: '#eef4ff',
          100: '#dce7ff',
          200: '#c0d3ff',
          300: '#97b5ff',
          400: '#6b93ff',
          500: '#477DFF',
          600: '#2f61dc',
          700: '#244bb0',
          800: '#223f8f',
          900: '#223978',
        },
        surface: '#EFEFEF',
      },
      fontFamily: {
        gothic: ['Gothic 60', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
    },
  },
}
