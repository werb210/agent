export type RoiRow = {
  utm_source: string | null;
  utm_campaign?: string | null;
  booked?: boolean;
  funded?: boolean;
};

export type RoiSummary = Record<
  string,
  {
    leads: number;
    bookings: number;
    funded: number;
  }
>;

export function calculateROI(data: RoiRow[]): RoiSummary {
  const grouped: RoiSummary = {};

  data.forEach((row) => {
    const source = row.utm_source ?? "unknown";

    if (!grouped[source]) {
      grouped[source] = {
        leads: 0,
        bookings: 0,
        funded: 0
      };
    }

    grouped[source].leads += 1;
    if (row.booked) grouped[source].bookings += 1;
    if (row.funded) grouped[source].funded += 1;
  });

  return grouped;
}
