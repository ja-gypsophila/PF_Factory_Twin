import { ChevronUp, ChevronDown } from "lucide-react";
export default function KpiCard({ label, current, unit, target, good }) {
  // const GapColor = Gap > 0 === good ? "text-[#34d399]" : "text-[#f87171]";
  const calcGap = current - target;

  return (
    <div className="flex flex-col items-start bg-slate-500 w-full">
      <div>{label}</div>
      <div className="text-25">
        {current}
        {unit}
      </div>
      <div>
        목표 {target}
        {unit}
      </div>
      <div className="">
        <div className="flex items-center">
          <div>
            {calcGap > 0 ? (
              <ChevronUp size={12} strokeWidth={2.5} stroke="currentColor" />
            ) : (
              <ChevronDown size={12} strokeWidth={2.5} stroke="currentColor" />
            )}
          </div>
          <span>
            {Number(calcGap.toFixed(1))}
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}
