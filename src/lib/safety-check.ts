/**
 * Workplace safety check for the public site.
 * Indicative self-assessment only — not an audit or a certificate.
 * Duties cited on each question: HSWA 1974, MHSWR 1999, RIDDOR 2013,
 * COSHH 2002, CDM 2015, PUWER 1998, DSE 1992, Fire Safety Order 2005,
 * MHOR 1992, First-Aid Regulations 1981.
 */

export const SAFETY_CHECK_PATH = "/free-safety-check";

export const BOOK_DEMO_URL = "https://www.hseqnova.co.uk/book-a-demo";

export const SAFETY_CHECK_RECIPIENT = "callum@hseqnova.co.uk";

export const SAFETY_CHECK_DISCLAIMER =
  "This is an indicative self-assessment. It is not a formal audit, inspection or certification, and it does not confirm that your arrangements meet health and safety law.";

export const PRIORITY_CTA =
  "You've identified areas of your health and safety arrangements that may need attention. HSEQ Nova can help you understand the gaps and put practical systems in place.";

const QUESTION_COUNT = 6;
const MAX_POINTS_PER_QUESTION = 3;

export type ScoreBand = "priority" | "strengthen" | "maintain";

export type SafetyAnswerOption = {
  id: string;
  label: string;
  points: 0 | 1 | 2 | 3;
};

export type SafetyQuestion = {
  id: string;
  topic: string;
  prompt: string;
  legalHook: string;
  recommendation: string;
  options: readonly [
    SafetyAnswerOption,
    SafetyAnswerOption,
    SafetyAnswerOption,
    SafetyAnswerOption,
  ];
};

export type SafetyIndustry = {
  id: string;
  title: string;
  summary: string;
  questions: readonly [
    SafetyQuestion,
    SafetyQuestion,
    SafetyQuestion,
    SafetyQuestion,
    SafetyQuestion,
    SafetyQuestion,
  ];
};

export type SafetyCheckAnswer = {
  prompt: string;
  legalHook: string;
  label: string;
  points: 0 | 1 | 2 | 3;
  topic: string;
  recommendation: string;
};

export type SafetyCheckResult = {
  industryId: string;
  industryTitle: string;
  score: number;
  band: ScoreBand;
  bandTitle: string;
  message: string;
  answers: SafetyCheckAnswer[];
  recommendations: string[];
};

const BAND_TITLE: Record<ScoreBand, string> = {
  priority: "Prioritise the gaps",
  strengthen: "Strengthen what is already there",
  maintain: "Keep the standard under review",
};

function options(
  questionId: string,
  labels: readonly [string, string, string, string],
): SafetyQuestion["options"] {
  return [
    { id: `${questionId}-0`, label: labels[0], points: 0 },
    { id: `${questionId}-1`, label: labels[1], points: 1 },
    { id: `${questionId}-2`, label: labels[2], points: 2 },
    { id: `${questionId}-3`, label: labels[3], points: 3 },
  ];
}

function question(
  id: string,
  topic: string,
  prompt: string,
  legalHook: string,
  recommendation: string,
  labels: readonly [string, string, string, string],
): SafetyQuestion {
  return { id, topic, prompt, legalHook, recommendation, options: options(id, labels) };
}

export const SAFETY_INDUSTRIES: readonly SafetyIndustry[] = [
  {
    id: "construction",
    title: "Construction",
    summary: "Sites, contractors and CDM duty holders.",
    questions: [
      question(
        "construction-policy",
        "your written health and safety policy",
        "If you have five or more employees, where does your written health and safety policy sit?",
        "HSWA 1974 s.2(3)",
        "Publish a written policy with a statement of intent, organisation and arrangements, and keep it where people actually work.",
        [
          "We do not have a written policy",
          "There is an old PDF, and most people have not seen it",
          "We have a policy, but it is not reviewed when the work changes",
          "The policy is written, shared and reviewed",
        ],
      ),
      question(
        "construction-cdm",
        "your construction phase arrangements",
        "How do you plan health and safety before work starts on site?",
        "CDM 2015",
        "Write down the duty holders and the construction phase arrangements before work starts, and update them when the job changes.",
        [
          "We start work and sort safety on the day",
          "Someone mentions it, with nothing written down",
          "We have a construction phase plan, but it is not updated",
          "Duty holders, the plan and site rules are in place and used",
        ],
      ),
      question(
        "construction-rams",
        "your RAMS",
        "Before higher-risk tasks, how do you set out the method and the risks?",
        "MHSWR 1999; CDM 2015",
        "Write RAMS for the tasks that can hurt people, and brief the people who do the work.",
        [
          "We rely on experience on the day",
          "A supervisor explains the job, with no written method",
          "We have RAMS, but they are copied across jobs and not briefed",
          "Task-specific RAMS are written, briefed and followed",
        ],
      ),
      question(
        "construction-accident",
        "your accident book",
        "When someone is injured, or there is a near miss, what happens?",
        "Accident book; RIDDOR 2013",
        "Keep an accident book, record near misses, and know the RIDDOR clocks: without delay, 10 days and 15 days.",
        [
          "Injuries are rarely written down",
          "Someone notes it in a message or a pad that goes missing",
          "We have an accident book, but near misses and RIDDOR deadlines are unclear",
          "Injuries and near misses are recorded, and reportable events are timed",
        ],
      ),
      question(
        "construction-inspections",
        "your site inspections",
        "How often is the site inspected, and what happens to the actions?",
        "MHSWR 1999",
        "Inspect the site on a set rhythm and close the actions, rather than leaving them in a chat thread.",
        [
          "We do not inspect",
          "A walk-round happens when someone remembers",
          "Inspections are recorded, but actions often stay open",
          "Inspections are regular, and actions are owned and closed",
        ],
      ),
      question(
        "construction-induction",
        "your site induction and competence",
        "How do people new to the site learn the risks and show they are competent?",
        "HSWA 1974 s.2(2)(c); CDM 2015",
        "Induct everyone who comes on site, and keep a record of the training and competence the work needs.",
        [
          "People start without an induction",
          "A quick chat covers the basics, with no record",
          "Induction exists, but competence for the task is not checked",
          "Induction and task competence are recorded before work starts",
        ],
      ),
    ],
  },
  {
    id: "manufacturing",
    title: "Manufacturing and workshops",
    summary: "Machinery, substances and the shop floor.",
    questions: [
      question(
        "manufacturing-policy",
        "your written health and safety policy",
        "If you have five or more employees, where does your written health and safety policy sit?",
        "HSWA 1974 s.2(3)",
        "Publish a written policy with a statement of intent, organisation and arrangements, and review it when the process changes.",
        [
          "We do not have a written policy",
          "There is an old document that does not match the factory",
          "We have a policy, but it is not reviewed when equipment or shifts change",
          "The policy is written, shared and reviewed",
        ],
      ),
      question(
        "manufacturing-machinery",
        "your machinery assessments",
        "How are risks from machinery and work equipment assessed and controlled?",
        "PUWER 1998; MHSWR 1999",
        "Assess work equipment, keep guards and checks in place, and update the record when a machine or a process changes.",
        [
          "Machines are used as they are",
          "Guards and checks depend on who is on shift",
          "Assessments exist, but they are not updated after changes",
          "Equipment is assessed, guarded and checked, and the record matches the floor",
        ],
      ),
      question(
        "manufacturing-coshh",
        "your COSHH assessments",
        "How do you assess hazardous substances — dusts, fumes, oils, solvents and cleaning chemicals?",
        "COSHH 2002",
        "Assess the substances you actually use, keep the safety data sheets with them, and match the controls to the work.",
        [
          "We do not assess substances",
          "Safety data sheets are in a folder nobody uses",
          "Some COSHH assessments exist, but they miss substances in use",
          "Assessments, data sheets and controls match the substances in use",
        ],
      ),
      question(
        "manufacturing-accident",
        "your accident book",
        "When someone is injured, or there is a near miss, what is recorded?",
        "Accident book; RIDDOR 2013",
        "Keep an accident book on the shop floor, record near misses, and time any RIDDOR report.",
        [
          "Injuries stay as a verbal report",
          "Notes are taken, then lost",
          "We have an accident book, but near misses and RIDDOR deadlines are unclear",
          "Injuries and near misses are recorded, and reportable events are timed",
        ],
      ),
      question(
        "manufacturing-inspections",
        "your workplace inspections",
        "How do you inspect the workshop, and what happens to what you find?",
        "MHSWR 1999",
        "Inspect the workplace on a set rhythm and give each finding an owner and a close-out.",
        [
          "We look only after something goes wrong",
          "A walk-round happens when production allows",
          "Inspections are recorded, but actions often stay open",
          "Inspections are regular, and actions are owned and closed",
        ],
      ),
      question(
        "manufacturing-competence",
        "your competent person and training",
        "Who helps you meet your health and safety duties, and how is training recorded?",
        "MHSWR 1999 reg. 7; HSWA 1974 s.2(2)(c)",
        "Appoint competent help, and keep training records for the work people actually do.",
        [
          "Nobody is named",
          "A manager handles it alongside everything else, with no training record",
          "A person is named, but training is patchy",
          "Competent help is in place, and training is recorded",
        ],
      ),
    ],
  },
  {
    id: "office",
    title: "Office and professional services",
    summary: "Desks, fire safety and the people in the building.",
    questions: [
      question(
        "office-policy",
        "your written health and safety policy",
        "If you have five or more employees, where does your written health and safety policy sit?",
        "HSWA 1974 s.2(3)",
        "Publish a written policy with a statement of intent, organisation and arrangements, and share it with the people it covers.",
        [
          "We do not have a written policy",
          "A template was downloaded and never used",
          "We have a policy, but it is not reviewed",
          "The policy is written, shared and reviewed",
        ],
      ),
      question(
        "office-dse",
        "your display screen assessments",
        "How do you assess display screen work for people who use a screen as a significant part of the day?",
        "Health and Safety (Display Screen Equipment) Regulations 1992",
        "Assess workstations for people who use a screen as a significant part of their day, and review them when the desk or the person changes.",
        [
          "We have not assessed workstations",
          "People set up their own desks",
          "We did assessments once and have not repeated them",
          "Assessments are done and reviewed when the workstation or the person changes",
        ],
      ),
      question(
        "office-fire",
        "your fire safety arrangements",
        "How is fire safety arranged in the premises you control?",
        "Regulatory Reform (Fire Safety) Order 2005",
        "Keep a current fire risk assessment, run drills, and close the actions that come out of them.",
        [
          "We have not assessed fire risk",
          "Extinguishers are on the wall, with no written assessment or drills",
          "There is a fire risk assessment, but drills and actions slip",
          "The fire risk assessment, drills and actions are current",
        ],
      ),
      question(
        "office-accident",
        "your accident book",
        "When someone is injured at work, or there is a near miss, what is recorded?",
        "Accident book; RIDDOR 2013",
        "Keep an accident book, including for smaller offices, and know when an injury becomes reportable.",
        [
          "Nothing is written down",
          "Someone sends an email, and that is the record",
          "We have an accident book, but it is not clear who decides on RIDDOR",
          "Injuries and near misses are recorded, and reportable events are timed",
        ],
      ),
      question(
        "office-stress",
        "your arrangements for work-related stress",
        "How do you look at work-related stress?",
        "MHSWR 1999",
        "Treat work-related stress as a risk you assess: demands, control, support and a way to review them.",
        [
          "We do not look at it",
          "People are told to speak up, with no arrangement behind it",
          "Stress is mentioned in a policy that is not used",
          "Demands, support and review are part of how work is managed",
        ],
      ),
      question(
        "office-first-aid",
        "your first aid and training",
        "How are first aid and basic health and safety training covered?",
        "Health and Safety (First-Aid) Regulations 1981; HSWA 1974 s.2(2)(c)",
        "Decide what first aid the workplace needs, name the cover, and keep training in date.",
        [
          "We have not decided what first aid we need",
          "There is a first-aid box, and training is informal",
          "First aiders are named, but training records are out of date",
          "First-aid needs are assessed, and training is in date",
        ],
      ),
    ],
  },
  {
    id: "care",
    title: "Care and support",
    summary: "Moving and handling, infection and lone working.",
    questions: [
      question(
        "care-policy",
        "your written health and safety policy",
        "If you have five or more employees, where does your written health and safety policy sit?",
        "HSWA 1974 s.2(3)",
        "Publish a written policy that covers the work your staff actually do, including visits and regulated activities.",
        [
          "We do not have a written policy",
          "A policy exists for the regulator, and staff have not seen it",
          "We have a policy, but it is not reviewed when packages of care change",
          "The policy is written, shared and reviewed",
        ],
      ),
      question(
        "care-handling",
        "your moving and handling assessments",
        "How do you assess moving and handling for the people you support and the loads you move?",
        "Manual Handling Operations Regulations 1992",
        "Assess moving and handling for the person or the load, and train staff to the assessment you wrote.",
        [
          "Staff are expected to know how to lift",
          "Techniques are shown on the job, with nothing written",
          "Some assessments exist, but they are not updated when needs change",
          "Assessments match the person or the task, and staff are trained to them",
        ],
      ),
      question(
        "care-infection",
        "your infection and COSHH controls",
        "How do you control infection risks and hazardous substances such as cleaning chemicals?",
        "COSHH 2002",
        "Assess infection risks and the substances staff use, and make the controls part of the visit or the shift.",
        [
          "We rely on common sense",
          "Gloves and aprons are available, with no written assessment",
          "Some assessments exist, but they do not cover what staff actually use",
          "Infection risks and substances are assessed, and the controls are used",
        ],
      ),
      question(
        "care-accident",
        "your accident book",
        "When a member of staff is injured, or there is a near miss, what is recorded?",
        "Accident book; RIDDOR 2013",
        "Record staff injuries and near misses in an accident book, separate from care notes, and time any RIDDOR report.",
        [
          "It stays in a handover note",
          "A paper book is used sometimes",
          "There is an accident book, but RIDDOR decisions are unclear",
          "Staff injuries and near misses are recorded, and reportable events are timed",
        ],
      ),
      question(
        "care-violence",
        "your arrangements for violence and lone working",
        "How do you manage violence, aggression and lone working?",
        "MHSWR 1999",
        "Assess violence and lone working, and build the controls into the rota rather than dealing with them after an incident.",
        [
          "We deal with incidents after they happen",
          "Staff are told to be careful",
          "There is a procedure, but it is not used on the rota",
          "The risks are assessed, and the controls are built into the work",
        ],
      ),
      question(
        "care-supervision",
        "your induction and supervision",
        "How are new staff supervised until they are competent?",
        "HSWA 1974 s.2(2)(c)",
        "Induct new staff, supervise them until they are competent, and keep the record.",
        [
          "They shadow someone and then work alone",
          "Supervision depends on who is on shift",
          "Induction exists, but competence is not signed off",
          "Induction, supervision and competence are recorded before unsupervised work",
        ],
      ),
    ],
  },
  {
    id: "transport",
    title: "Transport and logistics",
    summary: "Driving for work, the yard and the warehouse.",
    questions: [
      question(
        "transport-policy",
        "your written health and safety policy",
        "If you have five or more employees, where does your written health and safety policy sit?",
        "HSWA 1974 s.2(3)",
        "Publish a written policy that covers the depot and driving for work, not only the office.",
        [
          "We do not have a written policy",
          "Head office has a policy the drivers have not seen",
          "We have a policy, but it does not cover driving or the yard",
          "The policy covers the depot and driving, and it is reviewed",
        ],
      ),
      question(
        "transport-driving",
        "your driving-for-work arrangements",
        "How do you manage driving for work — vans, HGVs and cars used for work?",
        "HSWA 1974 s.2",
        "Check licences, vehicles and the journeys people make for work, and keep the record.",
        [
          "Drivers are left to it",
          "Licences are glanced at occasionally",
          "There is a driving policy, but vehicles and journeys are not reviewed",
          "Licences, vehicles and journey risks are checked and recorded",
        ],
      ),
      question(
        "transport-handling",
        "your manual handling assessments",
        "How is manual handling assessed in the warehouse or at the tail lift?",
        "Manual Handling Operations Regulations 1992",
        "Assess the loads people actually move, and match aids and training to that work.",
        [
          "People lift what the job needs",
          "Lifting is mentioned at induction only",
          "Some assessments exist, but they do not match the loads",
          "Loads are assessed, and aids and training match the work",
        ],
      ),
      question(
        "transport-accident",
        "your accident book",
        "When someone is injured at the depot or on a work journey, what is recorded?",
        "Accident book; RIDDOR 2013",
        "Keep an accident book for depot injuries and work-related road incidents, and time any RIDDOR report.",
        [
          "Drivers mention it later, if at all",
          "It is written on a defect sheet or a group chat",
          "We have an accident book, but work-related road incidents are unclear",
          "Depot and work-journey injuries are recorded, and reportable events are timed",
        ],
      ),
      question(
        "transport-yard",
        "your yard and vehicle checks",
        "How are the yard, vehicles and loading areas checked?",
        "MHSWR 1999; PUWER 1998",
        "Record yard and vehicle checks, and close defects before they become the way the job is done.",
        [
          "We look when something goes wrong",
          "Drivers report defects when they remember",
          "Checks are recorded, but defects stay open",
          "Checks are recorded and defects are closed",
        ],
      ),
      question(
        "transport-fatigue",
        "your arrangements for hours and fatigue",
        "How do you manage driver hours, fatigue and competence?",
        "HSWA 1974 s.2; HSWA 1974 s.2(2)(c)",
        "Manage hours and fatigue, and keep competence for the vehicle and the route under review.",
        [
          "Hours are not reviewed",
          "Drivers are told not to drive tired",
          "Hours are logged, but fatigue and training are not reviewed together",
          "Hours, fatigue and competence are managed and recorded",
        ],
      ),
    ],
  },
];

export function bandForScore(score: number): ScoreBand {
  if (score < 50) return "priority";
  if (score < 80) return "strengthen";
  return "maintain";
}

export function scoreFromPoints(points: readonly number[]): number {
  if (points.length !== QUESTION_COUNT) {
    throw {
      code: "INVALID_ASSESSMENT",
      message: "Answer every question.",
    };
  }
  const total = points.reduce((sum, value) => sum + value, 0);
  const max = QUESTION_COUNT * MAX_POINTS_PER_QUESTION;
  return Math.round((total / max) * 100);
}

function formatTopics(topics: readonly string[]): string {
  if (topics.length <= 1) return topics[0] ?? "";
  if (topics.length === 2) return `${topics[0]} and ${topics[1]}`;
  return `${topics.slice(0, -1).join(", ")} and ${topics[topics.length - 1]}`;
}

function messageFor(score: number, band: ScoreBand, topics: readonly string[]): string {
  const gap = topics.length > 0 ? ` — particularly ${formatTopics(topics)}` : "";
  if (band === "priority") {
    return `Your score of ${score} out of 100 shows health and safety arrangements that need attention${gap}. Prioritise those gaps and get support in place. ${PRIORITY_CTA}`;
  }
  if (band === "strengthen") {
    return `Your score of ${score} out of 100 shows health and safety arrangements you can strengthen${gap}. There is a clear opportunity to build on what you already do. HSEQ Nova can help you tighten those arrangements and keep them practical.`;
  }
  return `Your score of ${score} out of 100 suggests your health and safety arrangements are largely in place. Keep that standard, and review them so they stay current${gap}. HSEQ Nova can help you maintain the review and catch anything that starts to slip.`;
}

const MAINTAIN_RECOMMENDATION =
  "Keep a dated review of the policy, the accident book and training so the picture you have described stays true.";

export function assessSafetyCheck(
  industryId: string,
  answerIds: readonly string[],
): SafetyCheckResult | null {
  const industry = SAFETY_INDUSTRIES.find((item) => item.id === industryId);
  if (!industry || answerIds.length !== QUESTION_COUNT) return null;

  const answers: SafetyCheckAnswer[] = [];
  for (let index = 0; index < QUESTION_COUNT; index += 1) {
    const prompt = industry.questions[index];
    const selected = prompt?.options.find((option) => option.id === answerIds[index]);
    if (!prompt || !selected) return null;
    answers.push({
      prompt: prompt.prompt,
      legalHook: prompt.legalHook,
      label: selected.label,
      points: selected.points,
      topic: prompt.topic,
      recommendation: prompt.recommendation,
    });
  }

  const score = scoreFromPoints(answers.map((answer) => answer.points));
  const band = bandForScore(score);
  const weak = answers.filter((answer) => answer.points <= 1);
  const partial = answers.filter((answer) => answer.points < MAX_POINTS_PER_QUESTION);
  const focus = (weak.length > 0 ? weak : partial)
    .slice()
    .sort((left, right) => left.points - right.points)
    .slice(0, 3);
  const recommendations =
    focus.length > 0 ? focus.map((answer) => answer.recommendation) : [MAINTAIN_RECOMMENDATION];

  return {
    industryId: industry.id,
    industryTitle: industry.title,
    score,
    band,
    bandTitle: BAND_TITLE[band],
    message: messageFor(score, band, focus.map((answer) => answer.topic)),
    answers,
    recommendations,
  };
}
