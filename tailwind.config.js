/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-mute': 'var(--ink-mute)',
        'ink-red': 'var(--ink-red)',
        'ink-green': 'var(--ink-green)',
        'ink-blue': 'var(--ink-blue)',
        'ink-yellow': 'var(--ink-yellow)',
        'ink-cream': 'var(--ink-cream)',
        paper: 'var(--paper)',
        'paper-2': 'var(--paper-2)',
        rule: 'var(--rule)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        highlight: 'var(--highlight)',
      },
      fontFamily: {
        display: ['"Funnel Display"', 'system-ui', 'sans-serif'],
        sans: ['"Funnel Sans"', 'system-ui', 'sans-serif'],
        hand: ['Caveat', 'cursive'],
      },
      letterSpacing: {
        tightest: '-0.05em',
        tighter: '-0.04em',
      },
    },
  },
  plugins: [],
}
