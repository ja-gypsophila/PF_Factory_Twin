// 단순 수치 타일
export default function StatTile({ label, value, unit }) {
  return (
    <div className="flex flex-col items-start border border-gray-700 rounded-lg p-4">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-25 font-bold">
        {value}
        {unit}
      </span>
    </div>
  );
}
