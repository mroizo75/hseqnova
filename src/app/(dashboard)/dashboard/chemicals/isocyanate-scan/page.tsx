/**
 * Diisocyanate scan — UK REACH restriction (retained EU 2020/1149)
 */

import { Metadata } from "next";
import { IsocyanateScanClient } from "./isocyanate-scan-client";

export const metadata: Metadata = {
  title: "Diisocyanate scan | HSEQ Nova",
  description: "Scan the COSHH register for products containing diisocyanates",
};

export default function IsocyanateScanPage() {
  return <IsocyanateScanClient />;
}
