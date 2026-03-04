export default {
  content: [
    "./index.html",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#7B2CBF',
          secondary: '#9D4EDD',
          accent: '#C084FC',
          dark: '#07000F',
          sidebar: '#0D0117',
          light: '#E0AAFF',
          surface: '#F3EEFF',
          lightSidebar: '#EDE4FF',
        },
        purple: {
          925: '#160029',
          950: '#0D0117',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'purple-radial': 'radial-gradient(ellipse at top, #1a0030 0%, #07000F 70%)',
        'sidebar-grad': 'linear-gradient(180deg, #0D0117 0%, #160029 50%, #0D0117 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s infinite',
        'gradient-shift': 'gradient-shift 4s ease infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(123,44,191,0.3)' },
          '50%': { boxShadow: '0 0 24px rgba(123,44,191,0.7), 0 0 48px rgba(123,44,191,0.2)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        }
      },
      boxShadow: {
        'purple-sm': '0 0 12px rgba(123,44,191,0.3)',
        'purple-md': '0 0 24px rgba(123,44,191,0.5)',
        'purple-lg': '0 0 40px rgba(123,44,191,0.4), 0 0 80px rgba(123,44,191,0.15)',
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}

