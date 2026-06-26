// OEE = Availability x Performance x Quality
export function calculateOee({ plannedTimeSec, runTimeSec, idealCycleTimeSec, totalCount, goodCount }) {
  const availability = plannedTimeSec > 0 ? runTimeSec / plannedTimeSec : 0;
  const performance =
    runTimeSec > 0 ? Math.min(1, (idealCycleTimeSec * totalCount) / runTimeSec) : 0;
  const quality = totalCount > 0 ? goodCount / totalCount : 1;

  return {
    availability,
    performance,
    quality,
    oee: availability * performance * quality,
  };
}
