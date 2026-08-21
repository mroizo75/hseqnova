/**
 * ISOCYANAT-SKANNING
 * 
 * Verktøy for å skanne eksisterende stoffkartotek og identifisere
 * kjemikalier som inneholder diisocyanater
 */

import { Metadata } from "next";
import { IsocyanateScanClient } from "./isocyanate-scan-client";

export const metadata: Metadata = {
  title: "Isocyanat-skanning | HMS Nova",
  description: "Skann stoffkartoteket for produkter med diisocyanater",
};

export default function IsocyanateScanPage() {
  return <IsocyanateScanClient />;
}
