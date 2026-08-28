/**
 * Miljørapport-generator for Miljøfyrtårn-godkjenning
 * Genererer profesjonell årlig miljørapport med Adobe PDF Services
 */

import { format } from "date-fns";
import { enGB } from "date-fns/locale/en-GB";
import {
  PDFServices,
  MimeType,
  CreatePDFJob,
  CreatePDFResult,
  SDKError,
  ServiceUsageError,
  ServiceApiError,
} from "@adobe/pdfservices-node-sdk";
import { Readable } from "stream";
import type {
  EnvironmentalAspect,
  EnvironmentalMeasurement,
  Goal,
  Measure,
  User,
} from "@prisma/client";

interface ReportData {
  tenant: {
    id: string;
    name: string;
    orgNumber: string | null;
    address: string | null;
    city: string | null;
    postalCode: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    industry: string | null;
  };
  year: number;
  aspects: Array<
    EnvironmentalAspect & {
      owner: Pick<User, "name" | "email"> | null;
      goal: Pick<Goal, "title" | "targetValue" | "currentValue" | "unit"> | null;
      measurements: EnvironmentalMeasurement[];
    }
  >;
  measurements: Array<
    EnvironmentalMeasurement & {
      aspect: { title: string; category: string };
      responsible: { name: string | null } | null;
    }
  >;
  goals: Array<
    Goal & {
      measurements: Array<{ measurementDate: Date; value: number; }>;
    }
  >;
  measures: Array<
    Measure & {
      responsible: { name: string | null };
      environmentalAspect: { title: string; category: string } | null;
    }
  >;
}

// CO2 konverteringsfaktorer
const CO2_FACTORS = {
  ENERGY: 0.385,
  WATER: 0.001,
  WASTE: 0.5,
  EMISSIONS: 1.0,
  RESOURCE_USE: 0.2,
};

export async function generateEnvironmentalReport(data: ReportData): Promise<Buffer> {
  try {
    // Generer HTML-rapport
    const html = generateEnvironmentalReportHTML(data);

    // Konverter HTML til PDF med Adobe PDF Services
    const pdfBuffer = await convertHTMLToPDF(html, data);

    return pdfBuffer;
  } catch (error) {
    console.error("Error generating environmental report:", error);
    throw new Error("Kunne ikke generere miljørapport");
  }
}

async function convertHTMLToPDF(html: string, data: ReportData): Promise<Buffer> {
  try {
    // Opprett credentials
    const credentials = {
      clientId: process.env.ADOBE_CLIENT_ID!,
      clientSecret: process.env.ADOBE_CLIENT_SECRET!,
    };

    // Opprett PDF Services instans
    const pdfServices = new PDFServices({ credentials });

    // Konverter HTML string til readable stream
    const htmlStream = Readable.from(Buffer.from(html, "utf-8"));

    // Opprett asset fra HTML
    const inputAsset = await pdfServices.upload({
      readStream: htmlStream,
      mimeType: MimeType.HTML,
    });

    // Opprett PDF-konverteringsjobb
    const job = new CreatePDFJob({ inputAsset });

    // Kjør jobben
    const pollingURL = await pdfServices.submit({ job });
    const pdfServicesResponse = await pdfServices.getJobResult({
      pollingURL,
      resultType: CreatePDFResult,
    });

    // Hent resultat
    const resultAsset = pdfServicesResponse.result.asset;
    const streamAsset = await pdfServices.getContent({ asset: resultAsset });

    // Konverter stream til buffer
    const chunks: Buffer[] = [];
    for await (const chunk of streamAsset.readStream) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  } catch (error) {
    if (error instanceof SDKError || error instanceof ServiceUsageError || error instanceof ServiceApiError) {
      console.error("Adobe PDF Services error:", error);
    }
    throw error;
  }
}

function generateEnvironmentalReportHTML(data: ReportData): string {
  const totalAspects = data.aspects.length;
  const criticalAspects = data.aspects.filter((a) => a.significanceScore >= 20).length;
  const totalMeasurements = data.measurements.length;
  const goalsAchieved = data.goals.filter((g) => g.status === "ACHIEVED").length;
  const totalGoals = data.goals.length;
  const completedMeasures = data.measures.filter((m) => m.status === "DONE").length;
  const totalMeasures = data.measures.length;

  // Beregn CO2
  let totalCO2Savings = 0;
  const co2ByCategory: Record<string, number> = {};
  
  data.measurements.forEach((m) => {
    const category = m.aspect.category as keyof typeof CO2_FACTORS;
    const factor = CO2_FACTORS[category] || 0;
    if (m.targetValue && m.measuredValue < m.targetValue) {
      const savings = (m.targetValue - m.measuredValue) * factor;
      totalCO2Savings += savings;
      co2ByCategory[category] = (co2ByCategory[category] || 0) + savings;
    }
  });

  const trees = Math.round(totalCO2Savings / 21);
  const cars = totalCO2Savings / 4600;

  const generatedDate = format(new Date(), "d. MMMM yyyy", { locale: enGB });

  return `
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Miljørapport ${data.year} - ${data.tenant.name}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1f2937;
    }

    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 2cm;
    }

    .cover-logo {
      font-size: 72pt;
      margin-bottom: 30px;
    }

    .cover-title {
      font-size: 36pt;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .cover-year {
      font-size: 48pt;
      font-weight: bold;
      margin-bottom: 30px;
    }

    .cover-company {
      font-size: 24pt;
      margin-bottom: 40px;
    }

    .cover-subtitle {
      font-size: 14pt;
      opacity: 0.9;
    }

    .cover-footer {
      position: absolute;
      bottom: 2cm;
      font-size: 10pt;
      opacity: 0.8;
    }

    h1 {
      font-size: 24pt;
      color: #10b981;
      margin-top: 20px;
      margin-bottom: 15px;
      border-bottom: 3px solid #10b981;
      padding-bottom: 10px;
      page-break-after: avoid;
    }

    h2 {
      font-size: 18pt;
      color: #059669;
      margin-top: 25px;
      margin-bottom: 12px;
      page-break-after: avoid;
    }

    h3 {
      font-size: 14pt;
      color: #047857;
      margin-top: 15px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }

    p {
      margin-bottom: 10px;
      text-align: justify;
    }

    .page-break {
      page-break-before: always;
    }

    .key-stats {
      background: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin: 20px 0;
      page-break-inside: avoid;
    }

    .key-stats ul {
      list-style: none;
      margin-left: 0;
    }

    .key-stats li {
      padding: 5px 0;
    }

    .key-stats li:before {
      content: "✓ ";
      color: #10b981;
      font-weight: bold;
      margin-right: 8px;
    }

    .info-box {
      background: #eff6ff;
      border: 1px solid #3b82f6;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
      page-break-inside: avoid;
    }

    .warning-box {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
      page-break-inside: avoid;
    }

    .success-box {
      background: #d1fae5;
      border: 1px solid #10b981;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
      page-break-inside: avoid;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      page-break-inside: avoid;
    }

    th {
      background: #10b981;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }

    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
    }

    tr:nth-child(even) {
      background: #f9fafb;
    }

    .aspect-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 15px;
      margin: 15px 0;
      page-break-inside: avoid;
    }

    .aspect-card h4 {
      color: #10b981;
      margin-bottom: 8px;
    }

    .aspect-meta {
      font-size: 9pt;
      color: #6b7280;
      margin-top: 8px;
    }

    .co2-highlight {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      text-align: center;
      margin: 20px 0;
      page-break-inside: avoid;
    }

    .co2-value {
      font-size: 48pt;
      font-weight: bold;
      margin: 10px 0;
    }

    .co2-equivalents {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin: 20px 0;
    }

    .equivalent-card {
      background: white;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }

    .equivalent-icon {
      font-size: 32pt;
      margin-bottom: 10px;
    }

    .equivalent-value {
      font-size: 24pt;
      font-weight: bold;
      color: #10b981;
      margin: 10px 0;
    }

    .equivalent-label {
      font-size: 10pt;
      color: #6b7280;
    }

    .signature-line {
      margin-top: 40px;
      padding-top: 50px;
      border-top: 2px solid #1f2937;
      width: 300px;
    }

    .signature-label {
      font-size: 9pt;
      color: #6b7280;
      margin-top: 5px;
    }

    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      font-size: 9pt;
      color: #6b7280;
      text-align: center;
    }

    .toc {
      margin: 30px 0;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px dotted #d1d5db;
    }

    .toc-title {
      font-weight: bold;
      color: #374151;
    }

    .toc-page {
      color: #6b7280;
    }
  </style>
</head>
<body>

<!-- FORSIDE -->
<div class="cover-page">
  <div class="cover-logo">🌿</div>
  <div class="cover-title">MILJØRAPPORT</div>
  <div class="cover-year">${data.year}</div>
  <div class="cover-company">${data.tenant.name}</div>
  <div class="cover-subtitle">
    Årlig rapport for Miljøfyrtårn-sertifisering<br>
    I henhold til ISO 14001:2015
  </div>
  <div class="cover-footer">
    Generert: ${generatedDate}<br>
    HSEQ Nova — health, safety, environment and quality software
  </div>
</div>

<!-- INNHOLDSFORTEGNELSE -->
<div class="page-break">
  <h1>Innholdsfortegnelse</h1>
  <div class="toc">
    <div class="toc-item">
      <span class="toc-title">1. Sammendrag</span>
      <span class="toc-page">3</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">2. Om bedriften</span>
      <span class="toc-page">4</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">3. Miljøaspekter og påvirkning</span>
      <span class="toc-page">5</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">4. Miljømål og resultater</span>
      <span class="toc-page">6</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">5. Målinger og data</span>
      <span class="toc-page">7</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">6. CO₂-fotavtrykk og besparelser</span>
      <span class="toc-page">8</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">7. Tiltak og handlingsplan</span>
      <span class="toc-page">9</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">8. Konklusjon og neste steg</span>
      <span class="toc-page">10</span>
    </div>
    <div class="toc-item">
      <span class="toc-title">Vedlegg</span>
      <span class="toc-page">11</span>
    </div>
  </div>
</div>

<!-- 1. SAMMENDRAG -->
<div class="page-break">
  <h1>1. Sammendrag</h1>
  
  <p>
    Dette er ${data.tenant.name} sin miljørapport for ${data.year}. Rapporten dokumenterer bedriftens 
    miljøprestasjon, mål, tiltak og resultater i henhold til kravene for Miljøfyrtårn-sertifisering 
    og ISO 14001:2015.
  </p>

  <div class="key-stats">
    <h3>Nøkkeltall for ${data.year}:</h3>
    <ul>
      <li>Registrerte miljøaspekter: ${totalAspects} (${criticalAspects} kritiske)</li>
      <li>Gjennomførte målinger: ${totalMeasurements}</li>
      <li>Miljømål oppnådd: ${goalsAchieved} av ${totalGoals}</li>
      <li>Tiltak gjennomført: ${completedMeasures} av ${totalMeasures}</li>
      <li>Estimert CO₂-besparelse: ${totalCO2Savings.toFixed(0)} kg</li>
    </ul>
  </div>

  <p>
    Bedriften har i ${data.year} arbeidet systematisk med miljøstyring og har oppnådd gode resultater 
    innenfor reduksjon av miljøpåvirkning. Rapporten viser en positiv utvikling og kontinuerlig forbedring.
  </p>
</div>

<!-- 2. OM BEDRIFTEN -->
<div class="page-break">
  <h1>2. Om bedriften</h1>
  
  <h2>Bedriftsinformasjon</h2>
  <table>
    <tr>
      <td style="font-weight: bold; width: 30%;">Bedriftsnavn</td>
      <td>${data.tenant.name}</td>
    </tr>
    ${data.tenant.orgNumber ? `
    <tr>
      <td style="font-weight: bold;">Organisasjonsnummer</td>
      <td>${data.tenant.orgNumber}</td>
    </tr>
    ` : ''}
    ${data.tenant.address ? `
    <tr>
      <td style="font-weight: bold;">Adresse</td>
      <td>${data.tenant.address}${data.tenant.postalCode && data.tenant.city ? `, ${data.tenant.postalCode} ${data.tenant.city}` : ''}</td>
    </tr>
    ` : ''}
    ${data.tenant.contactEmail ? `
    <tr>
      <td style="font-weight: bold;">E-post</td>
      <td>${data.tenant.contactEmail}</td>
    </tr>
    ` : ''}
    ${data.tenant.contactPhone ? `
    <tr>
      <td style="font-weight: bold;">Telefon</td>
      <td>${data.tenant.contactPhone}</td>
    </tr>
    ` : ''}
    ${data.tenant.industry ? `
    <tr>
      <td style="font-weight: bold;">Bransje</td>
      <td>${data.tenant.industry}</td>
    </tr>
    ` : ''}
  </table>

  <h2>Miljøpolicy</h2>
  <p>
    ${data.tenant.name} er forpliktet til å drive virksomheten på en miljømessig forsvarlig måte. 
    Vi jobber kontinuerlig for å redusere vår miljøpåvirkning gjennom systematisk miljøstyring i 
    henhold til ISO 14001 og Miljøfyrtårn-kravene.
  </p>

  <div class="success-box">
    <h3>Våre forpliktelser:</h3>
    <ul>
      <li>Forebygge forurensning og redusere miljøpåvirkning</li>
      <li>Overholde gjeldende miljølovgivning og forskrifter</li>
      <li>Sette målbare miljømål og arbeide for kontinuerlig forbedring</li>
      <li>Involvere ansatte i miljøarbeidet</li>
      <li>Være åpne om vår miljøprestasjon</li>
    </ul>
  </div>
</div>

<!-- 3. MILJØASPEKTER -->
<div class="page-break">
  <h1>3. Miljøaspekter og påvirkning</h1>
  
  <p>
    Bedriften har identifisert ${totalAspects} miljøaspekter som er vurdert for betydning. 
    Nedenfor følger en oversikt over de mest vesentlige miljøaspektene.
  </p>

  ${generateAspectsHTML(data.aspects)}
</div>

<!-- 4. MILJØMÅL -->
<div class="page-break">
  <h1>4. Miljømål og resultater</h1>
  
  ${data.goals.length === 0 ? `
    <p>Ingen miljømål er registrert for dette året.</p>
  ` : `
    <p>
      Bedriften har satt ${totalGoals} miljømål for ${data.year}. 
      Nedenfor følger en oversikt over målene og status.
    </p>
    ${generateGoalsHTML(data.goals)}
  `}
</div>

<!-- 5. MÅLINGER -->
<div class="page-break">
  <h1>5. Målinger og data</h1>
  
  ${totalMeasurements === 0 ? `
    <p>Ingen målinger er registrert for dette året.</p>
  ` : `
    <p>
      Totalt ${totalMeasurements} målinger er gjennomført i ${data.year}. 
      Nedenfor følger en oppsummering av måledata.
    </p>
    ${generateMeasurementsHTML(data.measurements)}
  `}
</div>

<!-- 6. CO2 -->
<div class="page-break">
  <h1>6. CO₂-fotavtrykk og besparelser</h1>
  
  <div class="co2-highlight">
    <div style="font-size: 14pt; margin-bottom: 10px;">Total CO₂-besparelse for ${data.year}</div>
    <div class="co2-value">${totalCO2Savings.toFixed(0)} kg</div>
    <div style="font-size: 10pt; opacity: 0.9;">Basert på ${totalMeasurements} registrerte målinger</div>
  </div>

  ${Object.keys(co2ByCategory).length > 0 ? `
    <h2>Besparelse per kategori</h2>
    <table>
      <thead>
        <tr>
          <th>Kategori</th>
          <th style="text-align: right;">Besparelse (kg CO₂)</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(co2ByCategory).map(([cat, value]) => `
          <tr>
            <td>${getCategoryLabel(cat)}</td>
            <td style="text-align: right; font-weight: bold;">${value.toFixed(1)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}

  <h2>Dette tilsvarer:</h2>
  <div class="co2-equivalents">
    <div class="equivalent-card">
      <div class="equivalent-icon">🌲</div>
      <div class="equivalent-value">${trees}</div>
      <div class="equivalent-label">Trær som absorberer CO₂ i ett år</div>
    </div>
    ${cars >= 0.1 ? `
      <div class="equivalent-card">
        <div class="equivalent-icon">🚗</div>
        <div class="equivalent-value">${cars.toFixed(1)}</div>
        <div class="equivalent-label">Biler fjernet fra veien i ett år</div>
      </div>
    ` : ''}
  </div>

  <div class="info-box" style="font-size: 9pt;">
    <strong>Beregningsmetode:</strong> Beregninger er basert på standardfaktorer for norske forhold 
    og er estimater. Energi: ${CO2_FACTORS.ENERGY} kg CO₂/kWh, Vann: ${CO2_FACTORS.WATER * 1000} kg CO₂/m³, 
    Avfall: ${CO2_FACTORS.WASTE} kg CO₂/kg.
  </div>
</div>

<!-- 7. TILTAK -->
<div class="page-break">
  <h1>7. Tiltak og handlingsplan</h1>
  
  ${totalMeasures === 0 ? `
    <p>Ingen miljøtiltak er registrert for dette året.</p>
  ` : `
    <p>
      Totalt ${totalMeasures} miljøtiltak er registrert for ${data.year}. 
      Status: ${completedMeasures} fullført, ${data.measures.filter(m => m.status === 'IN_PROGRESS').length} pågående, 
      ${data.measures.filter(m => m.status === 'PENDING').length} planlagt.
    </p>
    ${generateMeasuresHTML(data.measures)}
  `}
</div>

<!-- 8. KONKLUSJON -->
<div class="page-break">
  <h1>8. Konklusjon og neste steg</h1>
  
  <p>
    ${data.tenant.name} har i ${data.year} arbeidet systematisk med miljøstyring og kontinuerlig forbedring. 
    Bedriften har oppnådd ${goalsAchieved} av ${totalGoals} miljømål og gjennomført ${completedMeasures} miljøtiltak.
  </p>

  <p>
    Resultatene viser en positiv utvikling, og bedriften oppfyller kravene til Miljøfyrtårn-sertifisering. 
    Miljøstyringssystemet er velfungerende og bidrar til redusert miljøpåvirkning.
  </p>

  <h2>Planer for neste år</h2>
  <ul>
    <li>Videreføre systematisk miljøovervåking og måling</li>
    <li>Oppdatere og forsterke miljømål basert på årets resultater</li>
    <li>Gjennomføre planlagte miljøtiltak</li>
    <li>Involvere ansatte i kontinuerlig forbedring</li>
    <li>Evaluere og oppdatere miljøaspekter årlig</li>
  </ul>

  <p style="margin-top: 40px;">
    <strong>Godkjent av ledelsen, ${generatedDate}</strong>
  </p>

  <div class="signature-line">
    <div class="signature-label">Signatur</div>
  </div>
</div>

<!-- VEDLEGG -->
<div class="page-break">
  <h1>Vedlegg</h1>
  
  <h2>A. Definisjoner og forkortelser</h2>
  <table>
    <tr>
      <td style="font-weight: bold; width: 30%;">ISO 14001</td>
      <td>Internasjonal standard for miljøledelse</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Miljøfyrtårn</td>
      <td>Norsk miljøsertifiseringsordning</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Miljøaspekt</td>
      <td>Element i virksomhetens aktiviteter som kan påvirke miljøet</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Betydning</td>
      <td>Kombinasjon av alvorlighet og sannsynlighet (1-25)</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">CO₂-ekvivalent</td>
      <td>Mengde klimagasser målt i karbondioksid-ekvivalenter</td>
    </tr>
  </table>

  <h2>B. Beregningsmetoder</h2>
  <div class="info-box">
    <strong>CO₂-faktorer brukt i rapporten:</strong>
    <ul>
      <li>Energi: ${CO2_FACTORS.ENERGY} kg CO₂/kWh (norsk strømmiks)</li>
      <li>Vann: ${CO2_FACTORS.WATER * 1000} kg CO₂/m³</li>
      <li>Avfall: ${CO2_FACTORS.WASTE} kg CO₂/kg</li>
      <li>Utslipp: ${CO2_FACTORS.EMISSIONS} kg CO₂/kg (direkte)</li>
      <li>Ressursbruk: ${CO2_FACTORS.RESOURCE_USE} kg CO₂/enhet</li>
    </ul>
    <p style="font-size: 9pt; margin-top: 10px;">
      Faktorer er basert på norske forhold og standarder fra Miljødirektoratet og Statistisk sentralbyrå.
    </p>
  </div>

  <h2>C. Kontaktinformasjon</h2>
  <p>For spørsmål om denne rapporten, kontakt:</p>
  <div class="info-box">
    <strong>${data.tenant.name}</strong><br>
    ${data.tenant.contactEmail ? `E-post: ${data.tenant.contactEmail}<br>` : ''}
    ${data.tenant.contactPhone ? `Telefon: ${data.tenant.contactPhone}` : ''}
  </div>

  <div class="footer">
    <p>
      This report was generated by HSEQ Nova — health, safety, environment and quality software<br>
      www.hseqnova.com • Environmental report ${data.year} • Page 11 of 11
    </p>
  </div>
</div>

</body>
</html>
  `;
}

// Hjelpefunksjoner for HTML-generering

function generateAspectsHTML(aspects: ReportData['aspects']): string {
  const categories = {
    ENERGY: "Energibruk",
    WATER: "Vannforbruk",
    WASTE: "Avfallshåndtering",
    EMISSIONS: "Utslipp til luft",
    RESOURCE_USE: "Ressursbruk",
    BIODIVERSITY: "Biologisk mangfold",
    OTHER: "Annet",
  };

  let html = '';

  Object.entries(categories).forEach(([key, label]) => {
    const aspectsInCategory = aspects.filter((a) => a.category === key);
    if (aspectsInCategory.length === 0) return;

    html += `<h2>${label}</h2>`;

    aspectsInCategory.slice(0, 3).forEach((aspect) => {
      html += `
        <div class="aspect-card">
          <h4>${aspect.title}</h4>
          ${aspect.description ? `<p>${aspect.description}</p>` : ''}
          <div class="aspect-meta">
            Betydning: ${aspect.significanceScore}/25 • 
            Status: ${getStatusLabel(aspect.status)}
            ${aspect.controlMeasures ? ` • Kontrolltiltak: ${aspect.controlMeasures}` : ''}
          </div>
        </div>
      `;
    });

    if (aspectsInCategory.length > 3) {
      html += `<p style="font-size: 9pt; color: #6b7280;">... og ${aspectsInCategory.length - 3} flere aspekter</p>`;
    }
  });

  return html;
}

function generateGoalsHTML(goals: ReportData['goals']): string {
  let html = '';

  goals.forEach((goal, index) => {
    const status = getGoalStatusLabel(goal.status);
    const progress = goal.targetValue && goal.currentValue
      ? Math.round((goal.currentValue / goal.targetValue) * 100)
      : 0;

    html += `
      <div class="aspect-card">
        <h3>Mål ${index + 1}: ${goal.title}</h3>
        ${goal.description ? `<p>${goal.description}</p>` : ''}
        <p><strong>Status:</strong> ${status}</p>
        ${goal.targetValue ? `
          <p>
            <strong>Målverdi:</strong> ${goal.targetValue} ${goal.unit || ''} • 
            <strong>Oppnådd:</strong> ${goal.currentValue || 0} ${goal.unit || ''} (${progress}%)
          </p>
        ` : ''}
        ${goal.deadline ? `
          <p><strong>Frist:</strong> ${format(new Date(goal.deadline), 'd. MMMM yyyy', { locale: enGB })}</p>
        ` : ''}
      </div>
    `;
  });

  return html;
}

function generateMeasurementsHTML(measurements: ReportData['measurements']): string {
  const measurementsByCategory: Record<string, typeof measurements> = {};
  measurements.forEach((m) => {
    const cat = m.aspect.category;
    if (!measurementsByCategory[cat]) {
      measurementsByCategory[cat] = [];
    }
    measurementsByCategory[cat].push(m);
  });

  let html = '';

  Object.entries(measurementsByCategory).forEach(([category, measurements]) => {
    const categoryLabel = getCategoryLabel(category);
    const values = measurements.map((m) => m.measuredValue);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const compliant = measurements.filter((m) => m.status === "COMPLIANT").length;

    html += `
      <h2>${categoryLabel}</h2>
      <div class="info-box">
        <p><strong>Antall målinger:</strong> ${measurements.length}</p>
        <p><strong>Gjennomsnitt:</strong> ${avg.toFixed(2)} ${measurements[0].unit || ''}</p>
        <p><strong>Min:</strong> ${min.toFixed(2)} • <strong>Maks:</strong> ${max.toFixed(2)}</p>
        <p><strong>I samsvar:</strong> ${compliant}/${measurements.length} målinger</p>
      </div>
    `;
  });

  return html;
}

function generateMeasuresHTML(measures: ReportData['measures']): string {
  const completed = measures.filter((m) => m.status === "DONE");
  const inProgress = measures.filter((m) => m.status === "IN_PROGRESS");
  const pending = measures.filter((m) => m.status === "PENDING");

  let html = '';

  if (completed.length > 0) {
    html += '<h2>Gjennomførte tiltak</h2>';
    completed.slice(0, 5).forEach((measure) => {
      html += `
        <div class="aspect-card">
          <h4>${measure.description}</h4>
          ${measure.environmentalAspect ? `<p><strong>Relatert til:</strong> ${measure.environmentalAspect.title}</p>` : ''}
          ${measure.responsible?.name ? `<p><strong>Ansvarlig:</strong> ${measure.responsible.name}</p>` : ''}
          ${measure.completedAt ? `<p><strong>Fullført:</strong> ${format(new Date(measure.completedAt), 'd. MMMM yyyy', { locale: enGB })}</p>` : ''}
        </div>
      `;
    });
  }

  if (inProgress.length > 0 || pending.length > 0) {
    html += '<h2>Pågående og planlagte tiltak</h2><ul>';
    [...inProgress, ...pending].slice(0, 5).forEach((measure) => {
      html += `<li>${measure.description}</li>`;
    });
    html += '</ul>';
  }

  return html;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: "Aktiv",
    MONITORED: "Overvåket",
    CLOSED: "Lukket",
  };
  return labels[status] || status;
}

function getGoalStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: "Aktiv",
    ACHIEVED: "Oppnådd",
    AT_RISK: "I risiko",
    FAILED: "Ikke oppnådd",
    ARCHIVED: "Arkivert",
  };
  return labels[status] || status;
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    ENERGY: "Energibruk",
    WATER: "Vannforbruk",
    WASTE: "Avfallshåndtering",
    EMISSIONS: "Utslipp til luft",
    RESOURCE_USE: "Ressursbruk",
    BIODIVERSITY: "Biologisk mangfold",
    OTHER: "Annet",
  };
  return labels[category] || category;
}
