/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Base colors
        "dark-slate": "hsl(var(--dark-slate))",
        "neon-green": "hsl(var(--neon-green))",
        "electric-blue": "hsl(var(--electric-blue))",
        "luminous-yellow": "hsl(var(--luminous-yellow))",
        "crimson-red": "hsl(var(--crimson-red))",
        "true-black": "hsl(var(--true-black))",
        "true-white": "hsl(var(--true-white))",
        "slate-dark": "hsl(var(--slate-dark))",

        // Semantic colors
        background: "hsl(var(--background))",
        "background-secondary": "hsl(var(--background-secondary))",
        foreground: "hsl(var(--foreground))",
        primary: "hsl(var(--primary))",
        secondary: "hsl(var(--secondary))",
        warning: "hsl(var(--warning))",
        error: "hsl(var(--error))",
        success: "hsl(var(--success))",
        info: "hsl(var(--info))",
      },
    },
  },
  plugins: [],
};
