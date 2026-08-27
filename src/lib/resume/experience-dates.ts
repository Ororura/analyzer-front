import { differenceInCalendarMonths, differenceInMonths, format, isAfter, isValid, parse, parseISO } from "date-fns";

const PRESENT_VALUES = new Set(["present", "current", "настоящее время", "по настоящее время", "сейчас"]);
const UNKNOWN_VALUES = new Set(["", "unknown", "неизвестно", "не указано"]);

export type NormalizedExperienceDate = string | "present" | null;

export interface ExperiencePeriodInput {
  startDate: string | null;
  endDate: string | null;
}

export interface CalculatedExperiencePeriod {
  startDate: string | null;
  endDate: NormalizedExperienceDate;
  durationMonths: number | null;
  isFuture: boolean | null;
  isCurrent: boolean;
}

export const formatCurrentDate = (date: Date): string => format(date, "yyyy-MM-dd");

export const normalizeExperienceDate = (
  value: string | null | undefined,
  allowPresent = true,
): NormalizedExperienceDate => {
  if (value === null || value === undefined) return null;

  const normalized = value.trim().toLocaleLowerCase("ru-RU");
  if (UNKNOWN_VALUES.has(normalized)) return null;
  if (allowPresent && PRESENT_VALUES.has(normalized)) return "present";

  const parsedDate = parseExperienceDate(normalized);
  return parsedDate ? normalized : null;
};

export const calculateExperiencePeriod = (
  period: ExperiencePeriodInput,
  currentDate: Date,
): CalculatedExperiencePeriod => {
  const startDate = normalizeExperienceDate(period.startDate, false);
  const endDate = normalizeExperienceDate(period.endDate);
  const isCurrent = endDate === "present";

  if (!startDate) {
    return { startDate: null, endDate, durationMonths: null, isFuture: null, isCurrent };
  }

  const parsedStart = parseExperienceDate(startDate);
  const parsedEnd = isCurrent ? currentDate : endDate ? parseExperienceDate(endDate) : null;
  if (!parsedStart || !parsedEnd) {
    return { startDate, endDate, durationMonths: null, isFuture: null, isCurrent };
  }

  const explicitEndIsFuture = !isCurrent && isAfter(parsedEnd, currentDate);
  const isFuture = isAfter(parsedStart, currentDate) || explicitEndIsFuture;
  const invalidRange = isAfter(parsedStart, parsedEnd);
  const durationMonths = isFuture || invalidRange ? null : differenceInKnownMonths(startDate, endDate, parsedStart, parsedEnd);

  return { startDate, endDate, durationMonths, isFuture, isCurrent };
};

export const calculateExperienceDurationMonths = (
  periods: readonly ExperiencePeriodInput[],
  currentDate: Date,
): number | null => {
  const durations = periods
    .map((period) => calculateExperiencePeriod(period, currentDate).durationMonths)
    .filter((duration): duration is number => duration !== null);

  return durations.length > 0 ? durations.reduce((total, duration) => total + duration, 0) : null;
};

export const formatExperienceDuration = (durationMonths: number | null): string | null => {
  if (durationMonths === null) return null;
  if (durationMonths === 0) return "меньше месяца";

  const years = Math.floor(durationMonths / 12);
  const months = durationMonths % 12;
  return [
    years > 0 ? `${years} ${pluralize(years, "год", "года", "лет")}` : null,
    months > 0 ? `${months} ${pluralize(months, "месяц", "месяца", "месяцев")}` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(" ");
};

const parseExperienceDate = (value: string): Date | null => {
  let parsedDate: Date;
  let expectedFormat: string;

  if (/^\d{4}$/.test(value)) {
    expectedFormat = "yyyy";
    parsedDate = parse(value, expectedFormat, new Date(0));
  } else if (/^\d{4}-\d{2}$/.test(value)) {
    expectedFormat = "yyyy-MM";
    parsedDate = parse(value, expectedFormat, new Date(0));
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    expectedFormat = "yyyy-MM-dd";
    parsedDate = parseISO(value);
  } else {
    return null;
  }

  return isValid(parsedDate) && format(parsedDate, expectedFormat) === value ? parsedDate : null;
};

const differenceInKnownMonths = (
  startDate: string,
  endDate: NormalizedExperienceDate,
  parsedStart: Date,
  parsedEnd: Date,
): number => {
  const bothHaveDayPrecision =
    /^\d{4}-\d{2}-\d{2}$/.test(startDate) &&
    (endDate === "present" || (typeof endDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(endDate)));

  return Math.max(
    0,
    bothHaveDayPrecision
      ? differenceInMonths(parsedEnd, parsedStart)
      : differenceInCalendarMonths(parsedEnd, parsedStart),
  );
};

const pluralize = (value: number, one: string, few: string, many: string): string => {
  const modulo100 = value % 100;
  if (modulo100 >= 11 && modulo100 <= 14) return many;
  const modulo10 = value % 10;
  if (modulo10 === 1) return one;
  if (modulo10 >= 2 && modulo10 <= 4) return few;
  return many;
};
