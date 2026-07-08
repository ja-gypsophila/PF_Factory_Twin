export const TYPE_SENSORS = {
  PRESS: [
    { key: "load", label: "프레스 하중", unit: "ton" },
    { key: "spm", label: "분당 스트로크", unit: "SPM" },
  ],
  WELDER: [
    { key: "current", label: "용접 전류", unit: "A" },
    { key: "weldTemp", label: "용접 온도", unit: "°C" },
  ],
  INJECTION: [
    { key: "pressure", label: "사출 압력", unit: "bar" },
    { key: "moldTemp", label: "금형 온도", unit: "°C" },
  ],
  INSPECTION: [{ key: "passRate", label: "검사 통과율", unit: "%" }],
};
