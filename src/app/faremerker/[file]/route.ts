import { NextResponse } from "next/server";
import { getHazardPictogram } from "@/lib/pictograms";

const svgHeader = `<?xml version="1.0" encoding="UTF-8"?>`;

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function buildHazardSvg(code: string, name: string) {
  const safeCode = escapeXml(code);
  const safeName = escapeXml(name);

  return `${svgHeader}
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <rect x="10" y="10" width="140" height="140" fill="none"/>
  <g transform="translate(80,80)">
    <rect x="-50" y="-50" width="100" height="100" rx="6" transform="rotate(45)" fill="#fff" stroke="#dc2626" stroke-width="8"/>
    <text text-anchor="middle" dy="8" font-family="Inter, Arial, sans-serif" font-size="36" font-weight="700" fill="#b91c1c">
      ${safeCode}
    </text>
  </g>
  <text x="80" y="150" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="600" fill="#7f1d1d">
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
  const pictogram = getHazardPictogram(decoded);

  const svg = buildHazardSvg(pictogram?.code ?? "GHS", pictogram?.name ?? decoded.replace(/\..+$/, ""));

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

