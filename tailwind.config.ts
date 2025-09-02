import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
module.exports = {
  theme: {
    extend: {
      colors: {
        slate: {
          500: '#64748b', // instead of oklab()
        },
        // repeat for other problem colors
      }
    }
  
  },
  future: {
    // Force Tailwind to use rgb() instead of oklab()
    disableExperimentalCssOklab: true,
  },
  plugins: {
    'postcss-preset-env': {
      stage: 1,
      features: {
        'color-functional-notation': { preserve: true },
      },
    },
  },
}

export default config
