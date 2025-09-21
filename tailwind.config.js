/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx}",
    "./src/*.{ts,tsx}"
  ],
  corePlugins: { preflight: true },
  important: "#__plasmo",
  plugins: []
}