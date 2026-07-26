export const NOW_PAGE_LAST_UPDATED_ISO = "2026-06-14";

const nowPageLastUpdatedDate = new Date(
  `${NOW_PAGE_LAST_UPDATED_ISO}T00:00:00Z`
);

export const NOW_PAGE_LAST_UPDATED_DISPLAY = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
}).format(nowPageLastUpdatedDate);
