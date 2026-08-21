import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "./routing";

type MessageObject = Record<string, unknown>;

export default getRequestConfig(async () => {
  const messages = (await import(`./messages/${defaultLocale}.json`)).default as MessageObject;

  return {
    locale: defaultLocale,
    messages,
    timeZone: "Europe/London",
    now: new Date(),
  };
});

export type { Locale } from "./routing";
