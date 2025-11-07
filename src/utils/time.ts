import { DAY, HOUR, MINUTE, SECOND } from "../constants/time.js";

export const timeToString = (ms: number): string => {
  const timeUnits = [
    { label: "day", value: DAY },
    { label: "hour", value: HOUR },
    { label: "minute", value: MINUTE },
    { label: "second", value: SECOND },
  ];

  const formatTime = (remaining: number, units: typeof timeUnits): string => {
    if (remaining === 0 || units.length === 0) {
      return "";
    }

    const [currentUnit, ...restUnits] = units;
    const count = Math.floor(remaining / currentUnit.value);
    const remainder = remaining % currentUnit.value;

    if (count === 0) {
      return formatTime(remainder, restUnits);
    }

    const currentString = `${count} ${currentUnit.label}${count === 1 ? "" : "s"}`;
    const restString = formatTime(remainder, restUnits);

    return restString ? `${currentString}, ${restString}` : currentString;
  };

  const result = formatTime(ms, timeUnits);
  return result || "0 seconds";
};
