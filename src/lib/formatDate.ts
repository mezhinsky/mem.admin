export function formatDate(isoString?: string | Date | null): string {
  if (!isoString) return "-";

  const date = new Date(isoString);

  return date.toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
