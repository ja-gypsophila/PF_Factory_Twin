import { PRESETS } from "../constants/PRESETS";
import { TIME_ZONE } from "../constants/TIME_ZONE";

export function formatTimestamp(timestamp, preset = "time") {
  return new Date(timestamp).toLocaleString("ko-KR", {
    timeZone: TIME_ZONE,
    ...PRESETS[preset],
  });
}
