import { Activity, Wrench, Pause, TriangleAlert } from "lucide-react";
import { STATUS_CARD_COLOR } from "../constants/MACHINE_STATUS";

const LEVEL_ICON = {
  RUNNING: Activity,
  REPAIR: Wrench,
  IDLE: Pause,
  DOWN: TriangleAlert,
};

export default function StatusIcon({ status }) {
  const Icon = LEVEL_ICON[status];
  if (!Icon) return null;
  return <Icon size={20} className={STATUS_CARD_COLOR[status]} />;
}
