import { DateTime } from "luxon";

export const validateTime = (date: string, time: string) => {
  const dt = DateTime.fromFormat(`${date} ${time}`, "yyyy-MM-dd h:mma");

  if (!dt.isValid) {
    return null;
  }

  if (dt < DateTime.now()) {
    return null;
  }

  const end = dt.plus({ minutes: 30 });

  return {
    startISO: dt.toISO(),
    endISO: end.toISO()
  };
};
