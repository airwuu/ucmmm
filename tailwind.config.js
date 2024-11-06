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
            background:"#1c1b1d",
            content1:"#2a282b", //cards
            content2:"#1c1b1d", //navbar
            content3:"#232224", //stations
            content4:"#4a3730", //items
            default:"#1c1b1d", // text/github
            primary: {
              DEFAULT: "#deaf9d",
              foreground: "#000000",
            },
            focus: "#daa900",
          },
        },
        light: {
          colors: {
            background:"#eeeeee",
            content1:"#fefefe", //cards
            content2:"#D5BDAF", //navbar
            content3:"#E3D5CA", //stations
            content4:"#fefefe", //items
            default:"#000000",
            primary: {
              DEFAULT: "#163d59",
              foreground: "#000000",
            },
          },
        },
      },
    }),
  ],
};
