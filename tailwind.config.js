/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(200 30% 15%)", // dark-slate
        foreground: "hsl(0 0% 100%)", // true-white
        primary: "hsl(156 100% 50%)", // neon-green
        secondary: "hsl(210 82% 57%)", // electric-blue
        accent: "hsl(40 100% 67%)", // luminous-yellow
        destructive: "hsl(3 100% 59%)", // crimson-red
        muted: "hsl(200 30% 10%)", // darker shade of background
        "muted-foreground": "hsl(0 0% 70%)", // muted text
        card: "hsl(200 30% 20%)", // slightly lighter than background
        "card-foreground": "hsl(0 0% 100%)", // true-white
        border: "hsl(200 30% 25%)", // explicit border color definition
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
      },
    },
  },
  plugins: [],
};
