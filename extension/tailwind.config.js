/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,js,html}',
    './src/ui/**/*.ts',
    './src/popup/**/*.html'
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      colors: {
        'pauseshop': {
          'primary': '#4F46E5',      // indigo-600
          'secondary': '#6366F1',    // indigo-500
          'accent': '#EC4899',       // pink-500
          'glass': 'rgba(15, 23, 42, 0.8)',  // slate-900 with opacity
          'glass-light': 'rgba(30, 41, 59, 0.85)', // slate-800 with opacity
          'glass-lighter': 'rgba(51, 65, 85, 0.7)', // slate-700 with opacity
        }
      },
      backdropBlur: {
        'pauseshop': '20px'
      },
      boxShadow: {
        'pauseshop': '-10px 0 30px rgba(0, 0, 0, 0.5)',
        'pauseshop-card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'pauseshop-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      },
      animation: {
        'slide-in-right': 'slideInRight 0.5s ease-in-out',
        'slide-out-right': 'slideOutRight 0.5s ease-in-out',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-out': 'fadeOut 0.3s ease-in-out',
        'expand': 'expand 0.4s ease-in-out',
        'collapse': 'collapse 0.4s ease-in-out'
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' }
        },
        expand: {
          '0%': { maxHeight: '0', opacity: '0', transform: 'translateY(-10px)' },
          '100%': { maxHeight: '600px', opacity: '1', transform: 'translateY(0)' }
        },
        collapse: {
          '0%': { maxHeight: '600px', opacity: '1', transform: 'translateY(0)' },
          '100%': { maxHeight: '0', opacity: '0', transform: 'translateY(-10px)' }
        }
      },
      spacing: {
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        '100': '25rem',   // 400px - sidebar width
        '112': '28rem',   // 448px
        '128': '32rem'    // 512px
      },
      zIndex: {
        '999998': '999998',
        '999999': '999999'
      }
    }
  },
  plugins: [],
  // Ensure we don't conflict with existing styles
  corePlugins: {
    preflight: false // Disable Tailwind's CSS reset to avoid conflicts
  }
}