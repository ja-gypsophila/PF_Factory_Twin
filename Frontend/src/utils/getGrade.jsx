import { getLevel, LEVEL_TEXT, LEVEL_LABEL } from "../theme/levels";

// OEE(%) → 등급 뱃지 (양호/주의/위험). 색·기준은 theme/levels에서 통제.
export const getGrade = (oee) => {
  const level = getLevel("oee", oee);
  return <span className={`${LEVEL_TEXT[level]} font-bold`}>{LEVEL_LABEL[level]}</span>;
};