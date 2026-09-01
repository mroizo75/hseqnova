import localFont from "next/font/local";

export const displayFont = localFont({
  src: "./fraunces-latin-wght-normal.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "100 900",
});

export const marketingFont = localFont({
  src: "./source-sans-3-latin-wght-normal.woff2",
  variable: "--font-marketing",
  display: "swap",
  weight: "200 900",
});
