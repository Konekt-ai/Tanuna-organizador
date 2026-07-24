/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      // Paleta cálida de Taluna (misma que el Organizador / estudio.html).
      colors: {
        bg: '#FFFFFF',
        'bg-soft': '#FAF7F2',
        rail: '#FBF9F5',
        card: '#FFFFFF',
        ink: '#2A2622',
        'ink-2': '#4B453D',
        muted: '#938A7C',
        faint: '#B6AD9D',
        camel: '#B07C4B',
        'camel-d': '#8F6231',
        'camel-bg': '#F4EADC',
        burg: '#6E2B39',
        'burg-bg': '#F3E5E8',
        charcoal: '#2C2823',
        good: '#3F7A57',
        warn: '#B5792A',
        bad: '#A23B46',
      },
      fontFamily: {
        // Provistas por next/font en app/layout.js (variables CSS).
        fraunces: ['var(--font-fraunces)', 'Georgia', 'serif'],
        manrope: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '18px',
        '2xl2': '26px',
      },
      boxShadow: {
        taluna: '0 1px 2px rgba(42,38,34,.04), 0 22px 44px -30px rgba(42,38,34,.34)',
        'taluna-sm': '0 1px 2px rgba(42,38,34,.05), 0 8px 22px -18px rgba(42,38,34,.4)',
      },
    },
  },
  plugins: [],
};
