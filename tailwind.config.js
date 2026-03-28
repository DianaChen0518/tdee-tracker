/** @type {import('tailwindcss').Config} */
export default {
  // 核心：开启基于 class 的黑暗模式支持
  darkMode: 'class', 
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
