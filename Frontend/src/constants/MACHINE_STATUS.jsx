export const STATUS_LABEL = {
  RUNNING: "가동중",
  IDLE: "대기",
  DOWN: "이상",
  REPAIR: "정비",
};

// SCADA 칩: 다크 반투명 배경 + 네온 텍스트 + 얇은 링 (뱃지 span에 붙는 클래스)
export const STATUS_COLOR = {
  RUNNING: "bg-ok/10 text-ok ring-1 ring-ok/30",
  IDLE: "bg-warning/10 text-warning ring-1 ring-warning/30",
  DOWN: "bg-danger/10 text-danger ring-1 ring-danger/30",
  REPAIR: "bg-accent/10 text-accent ring-1 ring-accent/30",
};

export const STATUS_CARD_COLOR = {
  RUNNING: "text-ok",
  IDLE: "text-warning",
  DOWN: "text-danger",
  REPAIR: "text-accent",
};

// LED 도트 (발광). 상태 표시등처럼 쓰고 싶을 때
export const STATUS_DOT = {
  RUNNING: "bg-ok shadow-glow-ok",
  IDLE: "bg-warning shadow-glow-warning",
  DOWN: "bg-danger shadow-glow-danger animate-pulse",
  REPAIR: "bg-accent shadow-glow-accent",
};
