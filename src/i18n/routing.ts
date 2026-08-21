import { defineRouting } from "next-intl/routing";

export const locales = ["en-GB"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en-GB";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "never",
  localeDetection: false,
});
