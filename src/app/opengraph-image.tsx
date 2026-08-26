import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "HSEQ Nova — health and safety software for UK employers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoBuffer = await readFile(join(process.cwd(), "public", "logo-white.png"));
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0d1f18",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          color: "#f6f1e8",
        }}
      >
        <div style={{ display: "flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoBase64} alt="" height={52} style={{ objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "58px",
              fontWeight: 600,
              lineHeight: 1.12,
              maxWidth: "920px",
            }}
          >
            Run health and safety as the work happens
          </div>
          <div
            style={{
              fontSize: "26px",
              color: "#d4cbb8",
              maxWidth: "820px",
              lineHeight: 1.35,
            }}
          >
            Digital accident book, RIDDOR, living policy and inspections. £29/month per
            company, unlimited users.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            fontSize: "22px",
            color: "#86efac",
          }}
        >
          hseqnova.co.uk
        </div>
      </div>
    ),
    { ...size }
  );
}
