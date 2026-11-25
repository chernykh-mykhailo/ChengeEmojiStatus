/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tg: {
          bg: 'var(--tg-theme-bg-color, #ffffff)',
          secondary: 'var(--tg-theme-secondary-bg-color, #f4f4f5)',
          text: 'var(--tg-theme-text-color, #000000)',
          hint: 'var(--tg-theme-hint-color, #71717a)',
          link: 'var(--tg-theme-link-color, #2563eb)',
          button: 'var(--tg-theme-button-color, #2563eb)',
          buttonText: 'var(--tg-theme-button-text-color, #ffffff)',
        },
      },
    },
  },
  plugins: [],
};
