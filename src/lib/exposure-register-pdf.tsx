import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import { fitnessForWorkLabel } from "@/lib/health-record-uk";

// Bruk innebygde skrifter (ingen nettlasting)
Font.registerHyphenationCallback((word) => [word]);

const BRAND = {
  navy: "#0f172a",
  blue: "#1e40af",
  blueLight: "#dbeafe",
  blueMid: "#3b82f6",
  slate: "#475569",
  slateLight: "#f1f5f9",
  border: "#e2e8f0",
  white: "#ffffff",
  green: "#166534",
  greenBg: "#dcfce7",
  greenBorder: "#86efac",
  orange: "#9a3412",
  orangeBg: "#ffedd5",
  orangeBorder: "#fdba74",
  red: "#991b1b",
  redBg: "#fee2e2",
  redBorder: "#fca5a5",
  muted: "#94a3b8",
  text: "#0f172a",
  textSecondary: "#64748b",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: BRAND.white,
    paddingBottom: 52,
  },
  // ── Header stripe ────────────────────────────────────────────────────────
  headerStripe: {
    backgroundColor: BRAND.navy,
    paddingHorizontal: 36,
    paddingTop: 28,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: BRAND.white,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 3,
    letterSpacing: 0.2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerBadge: {
    backgroundColor: BRAND.blue,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerBadgeText: {
    color: BRAND.white,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  headerMeta: {
    color: "#94a3b8",
    fontSize: 8,
    marginTop: 4,
  },
  // ── Meta bar ─────────────────────────────────────────────────────────────
  metaBar: {
    backgroundColor: BRAND.slateLight,
    paddingHorizontal: 36,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  metaItem: {
    flexDirection: "column",
    gap: 1,
  },
  metaLabel: {
    fontSize: 7,
    color: BRAND.muted,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 9,
    color: BRAND.text,
    fontFamily: "Helvetica-Bold",
  },
  // ── Body ─────────────────────────────────────────────────────────────────
  body: {
    paddingHorizontal: 36,
    paddingTop: 20,
  },
  // ── Section heading ───────────────────────────────────────────────────────
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  sectionAccent: {
    width: 3,
    height: 14,
    backgroundColor: BRAND.blue,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND.navy,
    letterSpacing: 0.2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
    marginBottom: 14,
  },
  // ── Legal box ─────────────────────────────────────────────────────────────
  legalBox: {
    backgroundColor: BRAND.blueLight,
    borderWidth: 1,
    borderColor: BRAND.blueMid,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    gap: 10,
  },
  legalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND.blue,
    marginTop: 2,
  },
  legalText: {
    flex: 1,
    fontSize: 8.5,
    color: "#1e3a8a",
    lineHeight: 1.5,
  },
  legalBold: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: "#1e3a8a",
  },
  // ── Entry card ────────────────────────────────────────────────────────────
  entryCard: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 6,
    marginBottom: 10,
    overflow: "hidden",
  },
  entryCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: BRAND.slateLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.border,
  },
  entryIndex: {
    fontSize: 7,
    color: BRAND.muted,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  entryChemical: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BRAND.navy,
    flex: 1,
    marginHorizontal: 8,
  },
  statusPill: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.3,
  },
  entryBody: {
    padding: 12,
  },
  fieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  fieldCell: {
    width: "33.33%",
    paddingBottom: 8,
    paddingRight: 8,
  },
  fieldCellHalf: {
    width: "50%",
    paddingBottom: 8,
    paddingRight: 8,
  },
  fieldCellFull: {
    width: "100%",
    paddingBottom: 8,
  },
  fieldLabel: {
    fontSize: 7,
    color: BRAND.muted,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 9,
    color: BRAND.text,
    lineHeight: 1.4,
  },
  fieldValueMono: {
    fontSize: 8.5,
    color: BRAND.text,
    fontFamily: "Courier",
  },
  // health check states
  healthGood: { fontSize: 9, color: BRAND.green, fontFamily: "Helvetica-Bold" },
  healthBad: { fontSize: 9, color: BRAND.red, fontFamily: "Helvetica-Bold" },
  healthNeutral: { fontSize: 9, color: BRAND.muted },
  // ── Links row ─────────────────────────────────────────────────────────────
  linkRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  linkPill: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  linkPillText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
  },
  riskScorePill: {
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
    marginRight: 3,
  },
  // ── Separator ─────────────────────────────────────────────────────────────
  separator: {
    height: 8,
  },
  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    paddingHorizontal: 36,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: {
    fontSize: 7,
    color: BRAND.muted,
  },
  footerRight: {
    fontSize: 7,
    color: BRAND.muted,
  },
  // ── Signature page ────────────────────────────────────────────────────────
  signaturePage: {
    paddingHorizontal: 36,
    paddingTop: 36,
  },
  signatureBox: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
  },
  signatureTitle: {
    fontSize: 9,
    color: BRAND.textSecondary,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#94a3b8",
    marginTop: 24,
    marginBottom: 4,
  },
  signatureLineLabel: {
    fontSize: 7.5,
    color: BRAND.muted,
  },
  signatureGrid: {
    flexDirection: "row",
    gap: 16,
  },
  signatureCell: {
    flex: 1,
  },
  // ── Empty state ───────────────────────────────────────────────────────────
  emptyBox: {
    borderWidth: 1,
    borderColor: BRAND.border,
    borderRadius: 6,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 10,
    color: BRAND.muted,
    fontFamily: "Helvetica-Oblique",
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────

const EXPOSURE_TYPE_LABELS: Record<string, string> = {
  INHALATION: "Inhalation",
  SKIN: "Skin contact",
  NOISE: "Noise",
  VIBRATION: "Vibration",
  BIOLOGICAL: "Biological",
  RADIATION: "Radiation",
  OTHER: "Other",
};

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function StatusPill({ status }: { status: string }) {
  const cfg =
    status === "ACTIVE"
      ? { bg: BRAND.orangeBg, border: BRAND.orangeBorder, color: BRAND.orange, label: "Ongoing" }
      : { bg: BRAND.slateLight, border: BRAND.border, color: BRAND.slate, label: "Ended" };
  return (
    <View style={[styles.statusPill, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function RiskScore({ score }: { score: number }) {
  const cfg =
    score >= 12
      ? { bg: BRAND.redBg, border: BRAND.redBorder, color: BRAND.red }
      : score >= 6
      ? { bg: BRAND.orangeBg, border: BRAND.orangeBorder, color: BRAND.orange }
      : { bg: BRAND.greenBg, border: BRAND.greenBorder, color: BRAND.green };
  return (
    <View style={[styles.riskScorePill, { backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.border }]}>
      <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: cfg.color }}>{score}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  mono = false,
  size = "third",
}: {
  label: string;
  value: string;
  mono?: boolean;
  size?: "third" | "half" | "full";
}) {
  const cellStyle =
    size === "full"
      ? styles.fieldCellFull
      : size === "half"
      ? styles.fieldCellHalf
      : styles.fieldCell;
  return (
    <View style={cellStyle}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={mono ? styles.fieldValueMono : styles.fieldValue}>{value || "–"}</Text>
    </View>
  );
}

// ── Main document ──────────────────────────────────────────────────────────

export interface ExposureEntry {
  id: string;
  exposureAgent: string;
  exposureType: string;
  exposureStartDate: Date | string;
  exposureEndDate: Date | string | null;
  duration: string | null;
  ppeUsed: string | null;
  healthCheckRequired: boolean;
  healthCheckDone: boolean;
  healthCheckDate: Date | string | null;
  fitnessForWork?: string | null;
  homeAddress?: string | null;
  retentionUntilDate: Date | string;
  status: string;
  comment: string | null;
  department: string | null;
  jobTitle: string;
  workLocation: string;
  registeredBy: string;
  chemical: { productName: string; casNumber: string | null } | null;
  ruhReport: { ruhNummer: string | null; title: string } | null;
  risk: { title: string; score: number } | null;
}

interface DocProps {
  employeeName: string;
  companyName: string;
  generatedAt: string;
  entries: ExposureEntry[];
}

function PageFooter({ employeeName }: { employeeName: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerLeft}>
        Health records – {employeeName} · Confidential personnel document
      </Text>
      <Text
        style={styles.footerRight}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

function ExposureDocument({ employeeName, companyName, generatedAt, entries }: DocProps) {
  return (
    <Document
      title={`Health records – ${employeeName}`}
      author="HSEQ Nova"
      creator="HSEQ Nova"
      subject="Personal health and exposure records"
    >
      {/* ── Side 1: Forside + info ───────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerStripe}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Health records</Text>
              <Text style={styles.headerSubtitle}>
                Personal health and exposure records · HSEQ Nova
              </Text>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>CONFIDENTIAL</Text>
              </View>
              <Text style={styles.headerMeta}>Generated {generatedAt}</Text>
            </View>
          </View>
        </View>

        {/* Meta bar */}
        <View style={styles.metaBar}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Employee</Text>
            <Text style={styles.metaValue}>{employeeName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Organisation</Text>
            <Text style={styles.metaValue}>{companyName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Number of records</Text>
            <Text style={styles.metaValue}>{entries.length}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Retained until</Text>
            <Text style={styles.metaValue}>
              {entries.length > 0
                ? Math.max(...entries.map((e) => new Date(e.retentionUntilDate).getFullYear()).filter(Boolean)).toString()
                : "–"}
            </Text>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {/* Legal box */}
          <View style={styles.legalBox}>
            <View style={styles.legalDot} />
            <Text style={styles.legalText}>
              <Text style={styles.legalBold}>Legal basis: </Text>
              This document is the employee’s personal health record (COSHH 2002
              reg.11(4)(a)). It is kept for 40 years from the last entry. It is
              not sent to the HSE in the ordinary course. Clinical test results
              are not included — those stay with occupational health.
            </Text>
          </View>

          {/* Hjemler */}
          <View style={{ marginBottom: 16 }}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Legal references</Text>
            </View>
            {[
              "COSHH 2002 regulation 11 — health surveillance and health records (40 years from last entry)",
              "HSE: name, home address, National Insurance number, substance or process, protective measures, fitness for work",
              "UK GDPR / DPA 2018 — personal data; medical records stay with occupational health",
            ].map((ref, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 5, marginBottom: 3 }}>
                <Text style={{ fontSize: 8, color: BRAND.blue, marginTop: 1 }}>›</Text>
                <Text style={{ fontSize: 8, color: BRAND.textSecondary, lineHeight: 1.4 }}>{ref}</Text>
              </View>
            ))}
          </View>

          {/* Empty state på forside */}
          {entries.length === 0 && (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No exposures recorded</Text>
            </View>
          )}
        </View>

        <PageFooter employeeName={employeeName} />
      </Page>

      {/* ── Side 2+: Eksponeringer ───────────────────────────────────── */}
      {entries.length > 0 && (
        <Page size="A4" style={styles.page}>
          {/* Header (gjentatt, kompakt) */}
          <View style={[styles.headerStripe, { paddingTop: 14, paddingBottom: 12 }]}>
            <View style={styles.headerRow}>
              <Text style={[styles.headerTitle, { fontSize: 14 }]}>
                Recorded exposures
              </Text>
              <Text style={styles.headerMeta}>{employeeName} · {companyName}</Text>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.separator} />

            {entries.map((entry, i) => {
              const chemical = entry.chemical?.productName ?? entry.exposureAgent;
              const cas = entry.chemical?.casNumber ?? null;
              const periodEnd = entry.exposureEndDate
                ? fmtDate(entry.exposureEndDate)
                : "ongoing";

              let healthLabel = "Not required";
              let healthStyle = styles.healthNeutral;
              if (entry.healthCheckRequired) {
                if (entry.healthCheckDone) {
                  healthLabel = `Completed${entry.healthCheckDate ? "  " + fmtDate(entry.healthCheckDate) : ""}`;
                  healthStyle = styles.healthGood;
                } else {
                  healthLabel = "Not completed";
                  healthStyle = styles.healthBad;
                }
              }

              return (
                <View key={entry.id} style={styles.entryCard} wrap={false}>
                  {/* Card header */}
                  <View style={styles.entryCardHeader}>
                    <Text style={styles.entryIndex}>#{i + 1}</Text>
                    <Text style={styles.entryChemical}>{chemical}</Text>
                    <StatusPill status={entry.status} />
                  </View>

                  {/* Card body */}
                  <View style={styles.entryBody}>
                    <View style={styles.fieldGrid}>
                      <Field label="Substance / agent" value={chemical} size="half" />
                      {cas && <Field label="CAS number" value={cas} mono size="third" />}
                      <Field
                        label="Type of exposure"
                        value={EXPOSURE_TYPE_LABELS[entry.exposureType] ?? entry.exposureType}
                        size="third"
                      />
                      <Field label="From" value={fmtDate(entry.exposureStartDate)} size="third" />
                      <Field label="To" value={periodEnd} size="third" />
                      {entry.duration && (
                        <Field label="Duration" value={entry.duration} size="third" />
                      )}
                      <Field label="Workplace" value={entry.workLocation} size="half" />
                      <Field label="Job title" value={entry.jobTitle} size="half" />
                      {entry.department && (
                        <Field label="Department" value={entry.department} size="half" />
                      )}
                      {entry.ppeUsed && (
                        <Field label="PPE" value={entry.ppeUsed} size="full" />
                      )}
                    </View>

                    {/* Helsekontroll */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
                      <Text style={styles.fieldLabel}>HEALTH SURVEILLANCE</Text>
                      <Text style={healthStyle}>{healthLabel}</Text>
                    </View>
                    {entry.fitnessForWork && (
                      <Field
                        label="Fitness for work"
                        value={fitnessForWorkLabel(entry.fitnessForWork)}
                        size="full"
                      />
                    )}

                    {/* Oppbevaring */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
                      <Text style={styles.fieldLabel}>RETAINED UNTIL</Text>
                      <Text style={styles.fieldValue}>{fmtDate(entry.retentionUntilDate)}</Text>
                    </View>

                    {/* Lenker */}
                    {(entry.ruhReport || entry.risk) && (
                      <View style={styles.linkRow}>
                        {entry.ruhReport && (
                          <View style={[styles.linkPill, { backgroundColor: "#eff6ff", borderColor: "#93c5fd" }]}>
                            <Text style={[styles.linkPillText, { color: "#1d4ed8" }]}>
                              Accident book {entry.ruhReport.ruhNummer ?? ""} – {entry.ruhReport.title}
                            </Text>
                          </View>
                        )}
                        {entry.risk && (
                          <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <RiskScore score={entry.risk.score} />
                            <View style={[styles.linkPill, { backgroundColor: BRAND.slateLight, borderColor: BRAND.border }]}>
                              <Text style={[styles.linkPillText, { color: BRAND.slate }]}>
                                {entry.risk.title}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Kommentar */}
                    {entry.comment && (
                      <View style={{ marginTop: 6 }}>
                        <Text style={styles.fieldLabel}>NOTES</Text>
                        <Text style={[styles.fieldValue, { fontFamily: "Helvetica-Oblique", color: BRAND.textSecondary }]}>
                          {entry.comment}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <PageFooter employeeName={employeeName} />
        </Page>
      )}

      {/* ── Signaturside ─────────────────────────────────────────────── */}
      <Page size="A4" style={styles.page}>
        <View style={[styles.headerStripe, { paddingTop: 14, paddingBottom: 12 }]}>
          <Text style={[styles.headerTitle, { fontSize: 14 }]}>Confirmation and access</Text>
        </View>

        <View style={styles.signaturePage}>
          <View style={styles.separator} />

          {/* Innsynstekst */}
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>About this document</Text>
            <Text style={[styles.fieldValue, { lineHeight: 1.6 }]}>
              The employee confirms they have received access to their own health records
              under UK GDPR / DPA 2018.{"\n\n"}
              This document may be shown to a doctor, occupational health or the HSE as
              evidence of exposure to hazardous substances at work.{"\n\n"}
              The document is generated by HSEQ Nova and is an official print of the health record.
            </Text>
          </View>

          {/* Signaturer */}
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitle}>Signatures</Text>

            <View style={styles.signatureGrid}>
              <View style={styles.signatureCell}>
                <Text style={[styles.fieldLabel, { marginBottom: 16 }]}>EMPLOYEE SIGNATURE</Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLineLabel}>{employeeName}</Text>
              </View>
              <View style={[styles.signatureCell, { maxWidth: 100 }]}>
                <Text style={[styles.fieldLabel, { marginBottom: 16 }]}>DATE</Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLineLabel}> </Text>
              </View>
            </View>

            <View style={{ height: 16 }} />

            <View style={styles.signatureGrid}>
              <View style={styles.signatureCell}>
                <Text style={[styles.fieldLabel, { marginBottom: 16 }]}>HSE MANAGER SIGNATURE</Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLineLabel}>{companyName}</Text>
              </View>
              <View style={[styles.signatureCell, { maxWidth: 100 }]}>
                <Text style={[styles.fieldLabel, { marginBottom: 16 }]}>DATE</Text>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLineLabel}> </Text>
              </View>
            </View>
          </View>

          {/* Regelverksreferanse */}
          <View style={[styles.legalBox, { marginTop: 4 }]}>
            <View style={styles.legalDot} />
            <Text style={styles.legalText}>
              Legal basis: COSHH 2002 regulation 11 · UK GDPR / DPA 2018
              · Generated by HSEQ Nova {generatedAt}
            </Text>
          </View>
        </View>

        <PageFooter employeeName={employeeName} />
      </Page>
    </Document>
  );
}

// ── Export renderToBuffer ──────────────────────────────────────────────────

export async function renderExposureRegisterPDF(props: DocProps): Promise<Buffer> {
  const buffer = await renderToBuffer(<ExposureDocument {...props} />);
  return Buffer.from(buffer);
}
