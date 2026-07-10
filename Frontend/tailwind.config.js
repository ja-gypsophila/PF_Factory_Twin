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
        // 수치/라벨용 기술 모노 (HMI 리드아웃 느낌)
        mono: ["JetBrains Mono", "IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
      colors: {
        // ── SCADA/HMI 표면 계층 (near-black → raised) ──
        base: "#080b10",       // 최하단 배경 (거의 검정, 살짝 청색)
        panel: "#0d1219",      // 패널 표면
        raised: "#131b25",     // 강조 표면 (호버/헤더)
        hairline: "#1e2a38",   // 얇은 구분선
        edge: "#2b3a4d",       // 밝은 테두리

        // ── 상태 색 (네온, 발광 계열) — 레벨 시스템이 이걸 씀 ──
        ok: "#22e0a1",         // 가동/양호 (네온 그린)
        warning: "#ffb443",    // 주의 (앰버)
        danger: "#ff4d61",     // 위험 (레드)
        accent: "#38e0ff",     // 강조 (시안)
        info: "#38e0ff",

        // ── 텍스트 계층 ──
        ink: "#e8eef5",        // 주 텍스트
        muted: "#8a99ad",      // 보조
        faint: "#556173",      // 흐린 라벨
      },
      boxShadow: {
        // 상태 발광 (LED 느낌)
        "glow-ok": "0 0 12px -2px rgba(34,224,161,0.55)",
        "glow-warning": "0 0 12px -2px rgba(255,180,67,0.55)",
        "glow-danger": "0 0 14px -2px rgba(255,77,97,0.6)",
        "glow-accent": "0 0 16px -3px rgba(56,224,255,0.5)",
        // 패널 입체감
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.8)",
      },
    },
  },
  plugins: [],
}
