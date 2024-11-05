import {nextui} from '@nextui-org/theme'

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  darkMode: "class",
  plugins: [
    nextui({
      themes: {
        dark: {
          colors: {
            background:"#100e27",
            content1:"#26253c", //cards
            content2:"#100e27", //navbar
            content3:"#110f24", //stations
            content4:"#26253c", //items
            primary: {
              DEFAULT: "#daa900",
              foreground: "#000000",
            },
            focus: "#daa900",
          },
        },
        light: {
          colors: {
            background:"#eeeeee",
            content1:"#fefefe", //cards
            content2:"#debc4b", //navbar
            content3:"#ebf3ff", //stations
            content4:"#fefefe", //items
            default:"#000000",
            primary: {
              DEFAULT: "#103550",
              foreground: "#000000",
            },
          },
        },
      },
    }),
  ],
};
