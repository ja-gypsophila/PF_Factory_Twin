import { ChevronUp, ChevronDown } from "lucide-react";

export default function KpiCard({
  label,
  current,
  unit,
  target,
  good,
  dec = 1,
}) {
  const calcGap = Number((current - target).toFixed(dec));
  const isGood = good ? calcGap >= 0 : calcGap <= 0;
  const gapColor = isGood ? "text-[#34d399]" : "text-[#f87171]";

  return (
    <div className="flex flex-col items-start bg-slate-500 w-full">
      <div>{label}</div>
      <div className="text-25">
        {Number(current).toFixed(dec)}
        {unit}
      </div>
      <div>
        목표 {Number(target).toFixed(dec)}
        {unit}
      </div>
      <div className="">
        <div className={`flex items-center ${gapColor}`}>
          <div>
            {calcGap > 0 ? (
              <ChevronUp size={12} strokeWidth={2.5} stroke="currentColor" />
            ) : (
              <ChevronDown size={12} strokeWidth={2.5} stroke="currentColor" />
            )}
          </div>
          <span>
            {calcGap}
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}
