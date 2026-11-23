import type { Config } from 'tailwindcss';

// TODO: flesh out brand color palette, fonts, spacing scale per design system (roadmap Phase 1 step 3)
const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1d4ed8',
          // TODO: secondary/accent/trust colors
        },
      },
    },
  },
  plugins: [
    // TODO: add @tailwindcss/forms, @tailwindcss/typography if needed
  ],
};

export default config;
