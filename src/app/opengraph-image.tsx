import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HSEQ Nova — health and safety software for UK employers";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
        <div style={{ display: "flex", fontSize: "22px", letterSpacing: "0.18em", color: "#86efac" }}>
          HSEQ SOFTWARE FOR UK EMPLOYERS
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: "64px", fontWeight: 600, lineHeight: 1.1, maxWidth: "920px" }}>
            Run health and safety as the work happens
          </div>
          <div style={{ fontSize: "28px", color: "#d4cbb8", maxWidth: "820px", lineHeight: 1.35 }}>
            Digital accident book, RIDDOR, living policy and inspections. £29/month per company,
            unlimited users.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", fontSize: "36px", fontWeight: 700 }}>HSEQ Nova</div>
          <div style={{ display: "flex", fontSize: "22px", color: "#86efac" }}>hseqnova.co.uk</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
