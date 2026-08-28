import { generateAIResponse } from "@/lib/ai";
import { requireAiAddon } from "@/lib/ai-gate";

const UK_SYSTEM_PROMPT = `You are an experienced HSEQ consultant specialising in UK health and safety law.
You provide practical advice based on:
- Health and Safety at Work etc. Act 1974 (HSWA)
- Management of Health and Safety at Work Regulations 1999 (MHSWR)
- RIDDOR 2013
- COSHH 2002
- CDM 2015
- Regulatory Reform (Fire Safety) Order 2005
- ISO 45001 / 14001 / 9001

Always respond in British English. Be concise, practical and cite relevant legislation.`;

async function callAI(tenantId: string, userPrompt: string, model = "gpt-4o-mini"): Promise<string> {
  await requireAiAddon(tenantId);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("AI is not configured. Set OPENAI_API_KEY in environment.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: UK_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 2500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function parseJSON<T>(raw: string, fallback: T): T {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return fallback;
  try {
    return JSON.parse(match[0]);
  } catch {
    return fallback;
  }
}

// ─── Risk Assessment Generator ───────────────────────────────────────

export interface GeneratedRiskAssessment {
  title: string;
  description: string;
  hazards: string[];
  whoAtRisk: string[];
  existingControls: string[];
  additionalControls: string[];
  likelihoodBefore: number;
  severityBefore: number;
  likelihoodAfter: number;
  severityAfter: number;
  legalReference: string;
}

export async function generateRiskAssessment(
  tenantId: string,
  input: {
    activity: string;
    location?: string;
    industry?: string;
    existingRisks?: string[];
  },
): Promise<GeneratedRiskAssessment> {
  const prompt = `Generate a UK-compliant risk assessment for the following activity.

Activity: ${input.activity}
${input.location ? `Location: ${input.location}` : ""}
${input.industry ? `Industry: ${input.industry}` : ""}
${input.existingRisks?.length ? `Existing risks already assessed: ${input.existingRisks.join(", ")}` : ""}

Respond ONLY with valid JSON in this exact format:
{
  "title": "concise risk title",
  "description": "description of the hazard and scenario",
  "hazards": ["hazard 1", "hazard 2"],
  "whoAtRisk": ["employees", "contractors", "visitors"],
  "existingControls": ["control already likely in place"],
  "additionalControls": ["recommended additional control 1", "control 2", "control 3"],
  "likelihoodBefore": 3,
  "severityBefore": 4,
  "likelihoodAfter": 2,
  "severityAfter": 3,
  "legalReference": "HSWA 1974 s.2; MHSWR 1999 reg.3"
}

Requirements:
- Scores 1-5 (1=very low, 5=very high)
- Max 5 hazards, 4 controls each
- Cite relevant UK legislation in legalReference
- Do not repeat risks already assessed`;

  const raw = await callAI(tenantId, prompt);
  return parseJSON<GeneratedRiskAssessment>(raw, {
    title: "",
    description: "",
    hazards: [],
    whoAtRisk: [],
    existingControls: [],
    additionalControls: [],
    likelihoodBefore: 3,
    severityBefore: 3,
    likelihoodAfter: 2,
    severityAfter: 2,
    legalReference: "MHSWR 1999 reg.3",
  });
}

// ─── Incident Analysis ──────────────────────────────────────────────

export interface IncidentAnalysis {
  rootCauses: string[];
  contributingFactors: string[];
  riddorCategory: string | null;
  riddorReportable: boolean;
  riddorReason: string;
  recommendedActions: Array<{ action: string; priority: "HIGH" | "MEDIUM" | "LOW"; deadline: string }>;
  lessonsLearned: string[];
  legalReferences: string[];
}

export async function analyseIncident(
  tenantId: string,
  input: {
    title: string;
    description: string;
    type: string;
    injuryDetails?: string;
    location?: string;
  },
): Promise<IncidentAnalysis> {
  const prompt = `Analyse this workplace incident and provide a structured investigation summary.

Incident title: ${input.title}
Description: ${input.description}
Type: ${input.type}
${input.injuryDetails ? `Injury details: ${input.injuryDetails}` : ""}
${input.location ? `Location: ${input.location}` : ""}

Respond ONLY with valid JSON:
{
  "rootCauses": ["root cause 1", "root cause 2"],
  "contributingFactors": ["factor 1", "factor 2"],
  "riddorCategory": "death | specified_injury | over_seven_day | dangerous_occurrence | disease | null",
  "riddorReportable": true,
  "riddorReason": "explanation of why this is or is not RIDDOR-reportable",
  "recommendedActions": [
    {"action": "specific corrective action", "priority": "HIGH", "deadline": "Immediate / 7 days / 30 days"}
  ],
  "lessonsLearned": ["lesson 1"],
  "legalReferences": ["RIDDOR 2013 reg.4", "HSWA 1974 s.2"]
}

Base RIDDOR assessment on RIDDOR 2013 regulations 4-9 and Schedule 2.
Identify at least 2 root causes using the 5 Whys technique.
Suggest at least 3 corrective actions with realistic deadlines.`;

  const raw = await callAI(tenantId, prompt);
  return parseJSON<IncidentAnalysis>(raw, {
    rootCauses: [],
    contributingFactors: [],
    riddorCategory: null,
    riddorReportable: false,
    riddorReason: "",
    recommendedActions: [],
    lessonsLearned: [],
    legalReferences: [],
  });
}

// ─── Toolbox Talk Generator ─────────────────────────────────────────

export interface ToolboxTalk {
  title: string;
  duration: string;
  objectives: string[];
  keyPoints: Array<{ point: string; detail: string }>;
  discussionQuestions: string[];
  legalBasis: string;
  signOffStatement: string;
}

export async function generateToolboxTalk(
  tenantId: string,
  input: {
    topic: string;
    industry?: string;
    recentIncidents?: string[];
    specificHazards?: string[];
  },
): Promise<ToolboxTalk> {
  const prompt = `Generate a toolbox talk for a UK construction/workplace safety briefing.

Topic: ${input.topic}
${input.industry ? `Industry: ${input.industry}` : ""}
${input.recentIncidents?.length ? `Recent incidents to reference: ${input.recentIncidents.join("; ")}` : ""}
${input.specificHazards?.length ? `Specific hazards to cover: ${input.specificHazards.join(", ")}` : ""}

Respond ONLY with valid JSON:
{
  "title": "Toolbox Talk: [topic]",
  "duration": "10-15 minutes",
  "objectives": ["By the end of this talk, workers will..."],
  "keyPoints": [
    {"point": "Key safety point", "detail": "Explanation with practical examples"}
  ],
  "discussionQuestions": ["Question to engage workers"],
  "legalBasis": "Relevant UK legislation and HSE guidance",
  "signOffStatement": "I confirm I have attended this toolbox talk and understand the key points discussed."
}

Requirements:
- 4-6 key points with practical, real-world detail
- 2-3 discussion questions that encourage participation
- Reference specific UK legislation (HSWA, MHSWR, CDM, COSHH etc.)
- Suitable for a 10-15 minute briefing on site`;

  const raw = await callAI(tenantId, prompt);
  return parseJSON<ToolboxTalk>(raw, {
    title: `Toolbox Talk: ${input.topic}`,
    duration: "10-15 minutes",
    objectives: [],
    keyPoints: [],
    discussionQuestions: [],
    legalBasis: "",
    signOffStatement: "I confirm I have attended this toolbox talk and understand the key points discussed.",
  });
}
