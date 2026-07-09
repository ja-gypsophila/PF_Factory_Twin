// ────────────────────────────────────────────────────────────
// 설비 이벤트 카탈로그 (데모용)
//
// 실제 서버 연동 시에는 서버가 이벤트 "코드"(예: "OVERLOAD")만 보내고,
// 프론트가 이 사전에서 표시 문구·레벨을 찾는 구조가 된다.
// 지금은 데모라 프론트에 코드+타임라인을 고정으로 둔다.
//
// level 은 theme/levels 의 등급과 동일 (ok / warn / danger) → 색·아이콘 재사용
// ────────────────────────────────────────────────────────────

// [1] 코드 → { level, text } 사전 (단일 진실 공급원)
export const EVENT_CATALOG = {
  // 공통
  RECOVERED:        { level: "ok",     text: "정상 복구" },
  MAINTENANCE_DONE: { level: "ok",     text: "정기 점검 완료 (오일 교환)" },
  STARTUP:          { level: "ok",     text: "설비 기동 완료" },

  // 프레스
  OVERLOAD:         { level: "danger", text: "과부하 감지 — 자동 감속 실행" },
  VIBRATION_HIGH:   { level: "warn",   text: "진동 센서 임계치 근접 (4.8 mm/s)" },
  LUBRICANT_LOW:    { level: "warn",   text: "윤활유 잔량 30% 이하" },

  // 용접
  WELD_CURRENT_SPIKE: { level: "danger", text: "용접 전류 이상 급증" },
  TIP_WEAR:           { level: "warn",   text: "토치 팁 마모 경고" },

  // 사출
  MOLD_TEMP_HIGH:   { level: "danger", text: "금형 온도 상한 초과" },
  PRESSURE_DROP:    { level: "warn",   text: "사출 압력 저하 감지" },

  // 검사
  DEFECT_SPIKE:     { level: "danger", text: "불량률 급증 감지" },
  CALIBRATION_DUE:  { level: "warn",   text: "검사기 교정 주기 도래" },
};

// [2] 설비 종류별 데모 타임라인 (시각 + 코드만; 내용은 카탈로그에서 조회)
const TYPE_EVENTS = {
  PRESS: [
    { time: "15:07", code: "OVERLOAD" },
    { time: "15:18", code: "RECOVERED" },
    { time: "12:01", code: "LUBRICANT_LOW" },
    { time: "09:42", code: "MAINTENANCE_DONE" },
    { time: "08:15", code: "VIBRATION_HIGH" },
  ],
  WELDER: [
    { time: "14:33", code: "WELD_CURRENT_SPIKE" },
    { time: "14:40", code: "RECOVERED" },
    { time: "11:20", code: "TIP_WEAR" },
    { time: "08:05", code: "STARTUP" },
  ],
  INJECTION: [
    { time: "13:52", code: "MOLD_TEMP_HIGH" },
    { time: "13:58", code: "RECOVERED" },
    { time: "10:15", code: "PRESSURE_DROP" },
    { time: "08:00", code: "STARTUP" },
  ],
  INSPECTION: [
    { time: "16:10", code: "DEFECT_SPIKE" },
    { time: "12:30", code: "CALIBRATION_DUE" },
    { time: "09:00", code: "MAINTENANCE_DONE" },
    { time: "08:10", code: "STARTUP" },
  ],
};

// [3] 조회 헬퍼: 설비 종류 → 표시용 이벤트 목록
// 각 항목에 카탈로그의 level/text 를 합쳐서 돌려준다.
export function getMachineEvents(type) {
  const timeline = TYPE_EVENTS[type] ?? [];
  return timeline.map((e) => ({
    time: e.time,
    code: e.code,
    ...EVENT_CATALOG[e.code], // { level, text } 합침
  }));
}