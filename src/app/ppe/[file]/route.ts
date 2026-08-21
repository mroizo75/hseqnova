import { NextResponse } from "next/server";
import { getPpePictogram } from "@/lib/pictograms";

const svgHeader = `<?xml version="1.0" encoding="UTF-8"?>`;

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function buildPpeSvg(code: string, name: string) {
  const safeCode = escapeXml(code);
  const safeName = escapeXml(name);

  return `${svgHeader}
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="ppeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#dbeafe" />
      <stop offset="100%" stop-color="#bfdbfe" />
    </linearGradient>
  </defs>
  <rect x="8" y="8" width="112" height="112" rx="18" fill="url(#ppeGradient)" stroke="#3b82f6" stroke-width="4"/>
  <text x="64" y="68" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="36" font-weight="700" fill="#1d4ed8">
    ${safeCode}
  </text>
  <text x="64" y="98" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="600" fill="#1e3a8a">
    ${safeName}
  </text>
</svg>`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> }
) {
  const { file } = await context.params;
  const decoded = decodeURIComponent(file);
  const pictogram = getPpePictogram(decoded);

  const svg = buildPpeSvg(pictogram?.id ?? "PPE", pictogram?.name ?? decoded.replace(/\..+$/, ""));

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

