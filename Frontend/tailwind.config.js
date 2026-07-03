/** @type {import('tailwindcss').Config} */

// gap-15, p-15, w-200 처럼 숫자를 그대로 px 값으로 쓸 수 있게 0~1000까지 매핑 생성
const pxSpacing = Object.fromEntries(
  Array.from({ length: 1001 }, (_, i) => [i, `${i}px`])
)

export default {
  content: ["./src/**/*.{html,jsx}"],
  theme: {
    extend: {
      spacing: pxSpacing,
      fontSize: pxSpacing,
      fontFamily: {
        sans: ["Pretendard Variable", "Pretendard", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
}

