import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1920px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Horizon UI Brand Colors
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#422AFB', // Main brand purple
          600: '#3418c9',
          700: '#2713a3',
          800: '#1e0f7b',
          900: '#160b5c',
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Horizon UI Semantic Colors
        navy: {
          50: '#f0f1f9',
          100: '#dfe2f2',
          200: '#c0c5e6',
          300: '#9ca3d5',
          400: '#7d87c4',
          500: '#1B2559', // Horizon main navy
          600: '#161d47',
          700: '#111836',
          800: '#0c1224',
          900: '#070c16',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Horizon UI specific
        'horizon': '20px', // Main card border radius
        'horizon-sm': '14px',
        'horizon-lg': '30px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Horizon UI Typography Scale
        'heading-1': ['48px', { lineHeight: '56px', fontWeight: '700' }],
        'heading-2': ['36px', { lineHeight: '44px', fontWeight: '700' }],
        'heading-3': ['28px', { lineHeight: '36px', fontWeight: '700' }],
        'heading-4': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'heading-5': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'heading-6': ['18px', { lineHeight: '24px', fontWeight: '600' }],
      },
      spacing: {
        // Horizon UI Standard Spacing (20px base)
        'horizon': '20px',
        'horizon-sm': '12px',
        'horizon-md': '16px',
        'horizon-lg': '24px',
        'horizon-xl': '32px',
        'horizon-2xl': '40px',
      },
      boxShadow: {
        // Horizon UI Shadow System
        'horizon-sm': '0px 4px 12px rgba(0, 0, 0, 0.04)',
        'horizon': '0px 8px 24px rgba(0, 0, 0, 0.06)',
        'horizon-md': '0px 12px 32px rgba(0, 0, 0, 0.08)',
        'horizon-lg': '0px 16px 48px rgba(0, 0, 0, 0.10)',
        'horizon-xl': '0px 24px 64px rgba(0, 0, 0, 0.14)',
        'card': '0px 4px 12px rgba(0, 0, 0, 0.04)',
        'card-hover': '0px 8px 24px rgba(0, 0, 0, 0.08)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
      },
      backgroundImage: {
        // Horizon UI Gradients
        'gradient-brand': 'linear-gradient(135deg, #422AFB 0%, #8B5CF6 100%)',
        'gradient-navy': 'linear-gradient(135deg, #1B2559 0%, #2D3561 100%)',
      },
      maxWidth: {
        'screen-2xl': '1920px', // Full width max for Horizon UI
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
