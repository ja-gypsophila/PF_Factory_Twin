import { ChevronUp, ChevronDown } from "lucide-react";

export default function Card({ label, value, unit, sub, delta, good }) {
  return (
    <div>
      <div>{label}</div>
      <div>
        {value} {unit}
      </div>
      <div>{sub}</div>
      <div>
        {delta} {good}
      </div>

      <ChevronUp size={12} strokeWidth={2.5} stroke="currentColor" />
      <ChevronDown size={12} strokeWidth={2.5} stroke="currentColor" />
    </div>
  );
}
