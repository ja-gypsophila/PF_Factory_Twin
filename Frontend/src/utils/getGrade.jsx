export const getGrade = (oee) => {
  if (oee >= 90) return <span className="text-green-500  font-bold">양호</span>;
  if (oee >= 70) return <span className="text-yellow-500 font-bold">주의</span>;
  return <span className="text-red-500 font-bold">위험</span>;
};
