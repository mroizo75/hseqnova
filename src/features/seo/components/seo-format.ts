const integerFormatter = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
const percentFormatter = new Intl.NumberFormat("en-GB", { style: "percent", maximumFractionDigits: 1 });
const positionFormatter = new Intl.NumberFormat("en-GB", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/London",
});
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatCount(value: number): string {
  return integerFormatter.format(value);
}

export function formatCtr(value: number): string {
  return percentFormatter.format(value);
}

export function formatPosition(value: number): string {
  return value > 0 ? positionFormatter.format(value) : "—";
}

export function formatDateTime(iso: string | null): string {
  return iso ? dateTimeFormatter.format(new Date(iso)) : "—";
}

export function formatIsoDay(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}
