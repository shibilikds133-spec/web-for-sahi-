/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ssf: {
          primary: '#065F46',
          gold: '#D4AF37',
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          text: '#0F172A',
          "text-muted": '#64748B',
        },
      },
      fontFamily: {
        poppins: ["Poppins_400Regular"],
        "poppins-bold": ["Poppins_700Bold"],
        "poppins-black": ["Poppins_900Black"],
        cooper: ["CooperBlack"],
      },
    },
  },
  plugins: [],
}
