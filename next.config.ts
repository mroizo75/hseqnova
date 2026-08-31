import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Cloudflare R2 presigned URLs
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      // Valgfritt: eget R2-domene om satt opp
      ...(process.env.NEXT_PUBLIC_R2_PUBLIC_URL
        ? [{ protocol: "https" as const, hostname: new URL(process.env.NEXT_PUBLIC_R2_PUBLIC_URL).hostname }]
        : []),
    ],
  },
  // jsPDF → fflate bruker dynamisk Worker-sti; Turbopack klarer ikke å bundle det. Last fra node_modules på serveren.
  serverExternalPackages: ["jspdf", "jspdf-autotable", "fflate"],
  async redirects() {
    const toDashboard = (source: string) => [
      { source, destination: "/dashboard", permanent: false },
      { source: `${source}/:path*`, destination: "/dashboard", permanent: false },
    ];
    const toHome = (source: string) => [
      { source, destination: "/", permanent: true },
      { source: `${source}/:path*`, destination: "/", permanent: true },
    ];

    return [
      { source: "/priser", destination: "/pricing", permanent: true },
      { source: "/registrer-bedrift", destination: "/register", permanent: true },
      { source: "/registrer-bedrift/:path*", destination: "/register", permanent: true },
      { source: "/digital-hms-tavle", destination: "/digital-safety-board", permanent: true },
      { source: "/digital-hms-tavle-hotell", destination: "/digital-safety-board", permanent: true },
      { source: "/hms-handbok", destination: "/health-and-safety-policy", permanent: true },
      {
        source: "/dashboard/hms-handbok",
        destination: "/dashboard/health-safety-policy",
        permanent: true,
      },
      { source: "/hms-system", destination: "/health-safety-software", permanent: true },
      { source: "/hms-system/:path*", destination: "/health-safety-software", permanent: true },
      { source: "/gratis-hms-system", destination: "/register", permanent: true },
      { source: "/gratis-hms-system/:path*", destination: "/register", permanent: true },
      ...toHome("/komplett-pakke"),
      ...toHome("/bedriftshelsetjeneste"),
      ...toHome("/bransjer"),
      ...toHome("/blogg"),
      ...toHome("/varsling"),
      ...toHome("/hms-kurs"),
      ...toHome("/hms-statistikk"),
      ...toHome("/hms-lover-regler"),
      ...toHome("/hva-er-hms-nova"),
      ...toHome("/anmeldelser"),
      ...toHome("/vernerunde-guide"),
      ...toHome("/risikovurdering-mal"),
      ...toHome("/iso-9001-sjekkliste"),
      ...toHome("/tavle-registrering"),
      { source: "/beste-hms-system-bygg", destination: "/", permanent: true },
      { source: "/beste-hms-system-helse", destination: "/", permanent: true },
      { source: "/beste-hms-system-transport", destination: "/", permanent: true },
      { source: "/beste-hms-system-kontor", destination: "/", permanent: true },
      { source: "/beste-hms-system-sma-bedrifter", destination: "/", permanent: true },
      { source: "/beste-hms-system-iso-9001", destination: "/", permanent: true },
      { source: "/dashboard/procedures", destination: "/dashboard/documents", permanent: false },
      { source: "/dashboard/procedures/:path*", destination: "/dashboard/documents", permanent: false },
      { source: "/dashboard/rutiner", destination: "/dashboard/documents", permanent: false },
      { source: "/dashboard/rutiner/:path*", destination: "/dashboard/documents", permanent: false },
      { source: "/dashboard/juridisk-register", destination: "/dashboard/health-safety-policy", permanent: false },
      { source: "/dashboard/risk-register", destination: "/dashboard/risks", permanent: false },
      { source: "/dashboard/incidents/statistics", destination: "/dashboard/incidents", permanent: false },
      { source: "/dashboard/meetings", destination: "/dashboard/health-safety-policy", permanent: false },
      { source: "/dashboard/meetings/:path*", destination: "/dashboard/health-safety-policy", permanent: false },
      ...toDashboard("/dashboard/wellbeing"),
      ...toDashboard("/dashboard/complaints"),
      ...toDashboard("/dashboard/feedback"),
      ...toDashboard("/dashboard/bcm"),
      ...toDashboard("/dashboard/annual-hms-plan"),
      ...toDashboard("/dashboard/time-registration"),
      ...toDashboard("/dashboard/medarbeidersamtale"),
      ...toDashboard("/dashboard/goals"),
      ...toDashboard("/dashboard/hms-cockpit"),
      ...toDashboard("/dashboard/benchmark"),
      ...toDashboard("/dashboard/transport"),
      ...toDashboard("/dashboard/bht-nattarbeid"),
      ...toDashboard("/dashboard/ik-mat"),
      ...toDashboard("/dashboard/aktivitetssikkerhet"),
      ...toDashboard("/dashboard/beredskap-reiseliv"),
      ...toDashboard("/dashboard/samsvarserklaringer"),
      ...toDashboard("/dashboard/ruh"),
      ...toDashboard("/dashboard/hms-pulse"),
      { source: "/ansatt/rutiner", destination: "/ansatt", permanent: false },
      { source: "/ansatt/rutiner/:path*", destination: "/ansatt", permanent: false },
      { source: "/ansatt/medarbeidersamtale", destination: "/ansatt", permanent: false },
      { source: "/ansatt/medarbeidersamtale/:path*", destination: "/ansatt", permanent: false },
      { source: "/ansatt/ruh", destination: "/ansatt/avvik", permanent: false },
      { source: "/ansatt/ruh/:path*", destination: "/ansatt/avvik", permanent: false },
      { source: "/ansatt/timeregistrering", destination: "/ansatt", permanent: false },
      { source: "/ansatt/samsvarserklaringer", destination: "/ansatt", permanent: false },
      { source: "/admin/bht", destination: "/admin", permanent: false },
      { source: "/admin/bht/:path*", destination: "/admin", permanent: false },
      { source: "/admin/intelligence", destination: "/admin", permanent: false },
      { source: "/admin/intelligence/:path*", destination: "/admin", permanent: false },
      { source: "/admin/blog", destination: "/admin", permanent: false },
      { source: "/admin/routine-library", destination: "/admin", permanent: false },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb", // Øk til 50MB for dokumentopplasting
    },
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore — outputFileTracingIgnores finnes i runtime men mangler i TS-typer for denne versjonen
    outputFileTracingIgnores: ["**/storage/**"],
  },
  output: "standalone",
};

export default withNextIntl(nextConfig);
