import { normalizeIndustryValue } from "@/lib/industry-packages";
import type { RiskCategory } from "@prisma/client";

export interface UkRiskStarterHazard {
  key: string;
  title: string;
  context: string;
  whoAtRisk: string;
  category: RiskCategory;
  likelihood: number;
  consequence: number;
  existingControls: string;
  legalRef: string;
  defaultSelected: boolean;
}

export interface UkRiskStarterIndustryOption {
  value: string;
  label: string;
  hint: string;
}

export interface UkRiskStarterGroup {
  id: "workplace" | "industry";
  title: string;
  hazards: UkRiskStarterHazard[];
}

export interface UkRiskStarterPack {
  industry: string;
  label: string;
  groups: UkRiskStarterGroup[];
}

export const UK_RISK_STARTER_INDUSTRIES: readonly UkRiskStarterIndustryOption[] = [
  {
    value: "construction",
    label: "Construction",
    hint: "Sites, fit-out, maintenance and CDM work",
  },
  {
    value: "elektro",
    label: "Electrical and energy",
    hint: "Installations, testing and live work",
  },
  {
    value: "manufacturing",
    label: "Manufacturing",
    hint: "Plant, machinery and production",
  },
  {
    value: "healthcare",
    label: "Healthcare",
    hint: "Care, clinics and patient handling",
  },
  {
    value: "hospitality",
    label: "Hospitality",
    hint: "Kitchens, hotels and front of house",
  },
  {
    value: "retail",
    label: "Retail and service",
    hint: "Shops, warehouses and customer areas",
  },
  {
    value: "transport",
    label: "Transport and logistics",
    hint: "Driving, loading and yards",
  },
  {
    value: "education",
    label: "Education",
    hint: "Schools, colleges and campuses",
  },
  {
    value: "technology",
    label: "Offices and IT",
    hint: "Offices, hybrid and home working",
  },
  {
    value: "agriculture",
    label: "Agriculture",
    hint: "Farms, livestock and plant",
  },
  {
    value: "other",
    label: "General workplace",
    hint: "Common hazards for any employer",
  },
] as const;

const INDUSTRY_PACK_MAP: Record<string, string> = {
  construction: "construction",
  bergverk: "construction",
  offshore: "construction",
  oil_gas: "construction",
  elektro: "elektro",
  manufacturing: "manufacturing",
  healthcare: "healthcare",
  hospitality: "hospitality",
  retail: "retail",
  transport: "transport",
  marine: "transport",
  fiskeri: "transport",
  education: "education",
  technology: "technology",
  agriculture: "agriculture",
  other: "other",
};

const WORKPLACE_HAZARDS: readonly UkRiskStarterHazard[] = [
  {
    key: "slips-trips",
    title: "Slips, trips and falls on the same level",
    context:
      "Wet floors, trailing cables, poor housekeeping and uneven surfaces can cause injury in day-to-day work.",
    whoAtRisk: "Employees, contractors and visitors",
    category: "SAFETY",
    likelihood: 3,
    consequence: 3,
    existingControls:
      "Keep walkways clear, clean spills immediately, suitable footwear, and good lighting.",
    legalRef: "Workplace (Health, Safety and Welfare) Regulations 1992; MHSWR 1999",
    defaultSelected: true,
  },
  {
    key: "fire",
    title: "Fire and emergency evacuation",
    context:
      "Ignition sources, combustible materials and blocked exits can prevent people reaching a place of safety.",
    whoAtRisk: "Everyone on the premises",
    category: "SAFETY",
    likelihood: 2,
    consequence: 5,
    existingControls:
      "Fire risk assessment, maintained extinguishers and alarms, clear escape routes, and recorded drills.",
    legalRef: "Regulatory Reform (Fire Safety) Order 2005",
    defaultSelected: true,
  },
  {
    key: "electricity",
    title: "Electricity",
    context:
      "Damaged leads, overloaded sockets and untested equipment can cause shock, burns or fire.",
    whoAtRisk: "Employees using portable equipment and anyone nearby",
    category: "SAFETY",
    likelihood: 2,
    consequence: 4,
    existingControls:
      "Visual checks before use, PAT where needed, and only competent people on electrical work.",
    legalRef: "Electricity at Work Regulations 1989",
    defaultSelected: true,
  },
  {
    key: "manual-handling",
    title: "Manual handling",
    context:
      "Lifting, carrying, pushing or pulling loads can cause musculoskeletal injury if the task is not designed.",
    whoAtRisk: "Employees who lift or move loads",
    category: "ERGONOMIC",
    likelihood: 3,
    consequence: 3,
    existingControls:
      "Avoid lifting where possible, use trolleys, split loads, and train people in safe handling.",
    legalRef: "Manual Handling Operations Regulations 1992; MHSWR 1999",
    defaultSelected: true,
  },
  {
    key: "dse",
    title: "Display screen equipment",
    context:
      "Poor workstation set-up can cause musculoskeletal pain, eye strain and fatigue.",
    whoAtRisk: "Office and hybrid workers who use screens as a significant part of their work",
    category: "ERGONOMIC",
    likelihood: 3,
    consequence: 2,
    existingControls:
      "Workstation assessment, adjustable chair and screen, and breaks away from the screen.",
    legalRef: "Health and Safety (Display Screen Equipment) Regulations 1992",
    defaultSelected: false,
  },
  {
    key: "stress",
    title: "Work-related stress",
    context:
      "Excessive demands, low control, poor support or change can harm mental health and performance.",
    whoAtRisk: "All employees",
    category: "PSYCHOSOCIAL",
    likelihood: 3,
    consequence: 3,
    existingControls:
      "Clear roles, manageable workload, line-manager support, and a way to raise concerns.",
    legalRef: "HSWA 1974 s.2; MHSWR 1999; HSE Management Standards",
    defaultSelected: false,
  },
];

const INDUSTRY_HAZARDS: Record<string, readonly UkRiskStarterHazard[]> = {
  construction: [
    {
      key: "work-at-height",
      title: "Work at height",
      context:
        "Roofs, scaffolds, ladders and MEWPs. Falls from height remain a leading cause of fatal injury.",
      whoAtRisk: "Operatives, supervisors and anyone below the work",
      category: "SAFETY",
      likelihood: 3,
      consequence: 5,
      existingControls:
        "Avoid work at height where possible, then collective protection, then personal fall protection. Inspect equipment.",
      legalRef: "Work at Height Regulations 2005; CDM 2015",
      defaultSelected: true,
    },
    {
      key: "falling-objects",
      title: "Falling objects",
      context: "Tools, materials or debris dropped from height can strike people below.",
      whoAtRisk: "Anyone working or walking under the activity",
      category: "SAFETY",
      likelihood: 3,
      consequence: 4,
      existingControls:
        "Toe boards, netting, tool lanyards, exclusion zones and hard hats in designated areas.",
      legalRef: "Work at Height Regulations 2005; CDM 2015",
      defaultSelected: true,
    },
    {
      key: "site-plant",
      title: "Plant and workplace transport",
      context:
        "Excavators, dumpers, telehandlers and reversing vehicles on a changing site layout.",
      whoAtRisk: "Pedestrians, plant operators and delivery drivers",
      category: "SAFETY",
      likelihood: 3,
      consequence: 5,
      existingControls:
        "Separate people and vehicles, trained operators, banksmen, and high-visibility clothing.",
      legalRef: "HSWA 1974; CDM 2015; PUWER 1998",
      defaultSelected: true,
    },
    {
      key: "silica-dust",
      title: "Construction dust, including silica",
      context:
        "Cutting, grinding or chasing concrete, stone or mortar can release respirable crystalline silica.",
      whoAtRisk: "Operatives doing cutting or chasing, and people nearby",
      category: "HEALTH",
      likelihood: 3,
      consequence: 4,
      existingControls:
        "On-tool extraction, water suppression, RPE where needed, and COSHH assessment before the work.",
      legalRef: "COSHH 2002; CDM 2015",
      defaultSelected: true,
    },
    {
      key: "asbestos",
      title: "Asbestos in existing buildings",
      context:
        "Refurbishment or demolition can disturb asbestos-containing materials if they have not been identified.",
      whoAtRisk: "Anyone who disturbs the fabric of the building",
      category: "HEALTH",
      likelihood: 2,
      consequence: 5,
      existingControls:
        "Asbestos survey before work, do not disturb unknown materials, licensed contractor where required.",
      legalRef: "Control of Asbestos Regulations 2012; CDM 2015",
      defaultSelected: true,
    },
    {
      key: "excavations",
      title: "Excavations and buried services",
      context:
        "Collapse of sides, falls into excavations, or striking electricity, gas or water.",
      whoAtRisk: "People in or next to the excavation, and the public",
      category: "SAFETY",
      likelihood: 2,
      consequence: 5,
      existingControls:
        "Service drawings and CAT scan, support or batter the sides, edge protection, and a permit where used.",
      legalRef: "CDM 2015; HSWA 1974",
      defaultSelected: false,
    },
  ],
  elektro: [
    {
      key: "live-work",
      title: "Work on or near live electrical systems",
      context:
        "Shock, burns or arc flash if isolation is not proved or a safe system of work is not followed.",
      whoAtRisk: "Electricians and anyone nearby",
      category: "SAFETY",
      likelihood: 2,
      consequence: 5,
      existingControls:
        "Dead working as the default, lock-off, prove dead, permits for live work, and competent persons only.",
      legalRef: "Electricity at Work Regulations 1989; HSWA 1974",
      defaultSelected: true,
    },
    {
      key: "work-at-height-electrical",
      title: "Work at height on electrical installations",
      context: "Ladders, towers or roofs while installing or testing can lead to falls.",
      whoAtRisk: "Electrical operatives",
      category: "SAFETY",
      likelihood: 3,
      consequence: 4,
      existingControls:
        "Avoid height where possible, suitable access equipment, and two-person working where needed.",
      legalRef: "Work at Height Regulations 2005; Electricity at Work Regulations 1989",
      defaultSelected: true,
    },
    {
      key: "test-instruments",
      title: "Test equipment and temporary supplies",
      context: "Faulty instruments or poorly arranged temporary power can energise the wrong circuit.",
      whoAtRisk: "Testers and other trades on site",
      category: "SAFETY",
      likelihood: 2,
      consequence: 4,
      existingControls:
        "Calibrated instruments, labelled isolations, and temporary supplies installed by a competent person.",
      legalRef: "Electricity at Work Regulations 1989; BS 7671",
      defaultSelected: true,
    },
  ],
  manufacturing: [
    {
      key: "machinery",
      title: "Machinery and moving parts",
      context:
        "Entanglement, crushing or impact if guards are removed or isolation is not used.",
      whoAtRisk: "Machine operators, setters and maintenance staff",
      category: "SAFETY",
      likelihood: 3,
      consequence: 5,
      existingControls:
        "Guarding in place, PUWER checks, lock-off for maintenance, and trained operators.",
      legalRef: "PUWER 1998; HSWA 1974",
      defaultSelected: true,
    },
    {
      key: "noise",
      title: "Noise",
      context: "Prolonged exposure above the action values can cause irreversible hearing loss.",
      whoAtRisk: "People working in noisy areas",
      category: "HEALTH",
      likelihood: 3,
      consequence: 3,
      existingControls:
        "Measure exposure, reduce at source, hearing protection zones, and health surveillance where required.",
      legalRef: "Control of Noise at Work Regulations 2005",
      defaultSelected: true,
    },
    {
      key: "forklifts",
      title: "Lift trucks and internal transport",
      context: "Collisions, overturns and struck pedestrians in production and stores.",
      whoAtRisk: "Pedestrians and lift-truck operators",
      category: "SAFETY",
      likelihood: 3,
      consequence: 4,
      existingControls:
        "Trained operators, segregated routes, speed limits, and daily checks.",
      legalRef: "PUWER 1998; HSWA 1974",
      defaultSelected: true,
    },
    {
      key: "coshh-process",
      title: "Hazardous substances in the process",
      context:
        "Chemicals, fumes, oils or dusts used or generated by the process can harm health.",
      whoAtRisk: "Process operators and cleaners",
      category: "HEALTH",
      likelihood: 3,
      consequence: 4,
      existingControls:
        "COSHH assessment, SDS on file, extraction, and suitable PPE as a last resort.",
      legalRef: "COSHH 2002",
      defaultSelected: true,
    },
  ],
  healthcare: [
    {
      key: "patient-handling",
      title: "Moving and handling people",
      context:
        "Lifting or supporting patients can injure staff and the person being moved.",
      whoAtRisk: "Care staff and patients",
      category: "ERGONOMIC",
      likelihood: 3,
      consequence: 3,
      existingControls:
        "Hoists and slides, handling plans, and trained staff. Do not lift unaided.",
      legalRef: "Manual Handling Operations Regulations 1992; MHSWR 1999",
      defaultSelected: true,
    },
    {
      key: "sharps",
      title: "Sharps and blood-borne viruses",
      context: "Needlestick and sharps injuries can transmit infection.",
      whoAtRisk: "Clinical and housekeeping staff",
      category: "HEALTH",
      likelihood: 2,
      consequence: 4,
      existingControls:
        "Safer sharps, sharps bins at the point of use, and an exposure procedure.",
      legalRef: "Health and Safety (Sharp Instruments in Healthcare) Regulations 2013; COSHH 2002",
      defaultSelected: true,
    },
    {
      key: "violence-care",
      title: "Violence and aggression",
      context:
        "People who are distressed, unwell or under the influence may injure staff.",
      whoAtRisk: "Front-line care and reception staff",
      category: "SAFETY",
      likelihood: 3,
      consequence: 3,
      existingControls:
        "Training, panic alarms, staffing levels, and a way to record and review incidents.",
      legalRef: "HSWA 1974 s.2; MHSWR 1999",
      defaultSelected: true,
    },
    {
      key: "infection",
      title: "Infection prevention",
      context: "Contact with body fluids and poorly cleaned equipment can spread infection.",
      whoAtRisk: "Staff, patients and visitors",
      category: "HEALTH",
      likelihood: 3,
      consequence: 3,
      existingControls:
        "Standard precautions, PPE, hand hygiene, and cleaning schedules.",
      legalRef: "COSHH 2002; HSWA 1974",
      defaultSelected: true,
    },
  ],
  hospitality: [
    {
      key: "kitchen-burns",
      title: "Kitchen burns, scalds and hot equipment",
      context: "Ovens, fryers, steam and hot liquids in a busy kitchen.",
      whoAtRisk: "Kitchen and waiting staff",
      category: "SAFETY",
      likelihood: 3,
      consequence: 3,
      existingControls:
        "Dry oven cloths, guarded fryers, clear traffic routes, and training for new starters.",
      legalRef: "MHSWR 1999; HSWA 1974",
      defaultSelected: true,
    },
    {
      key: "kitchen-slips",
      title: "Kitchen and bar slips",
      context: "Grease, water and food on floors during service.",
      whoAtRisk: "Kitchen, bar and waiting staff",
      category: "SAFETY",
      likelihood: 4,
      consequence: 3,
      existingControls:
        "Clean as you go, suitable flooring and footwear, and mats where they do not create a trip.",
      legalRef: "Workplace (Health, Safety and Welfare) Regulations 1992",
      defaultSelected: true,
    },
    {
      key: "gas-catering",
      title: "Gas appliances",
      context: "Poorly maintained catering gas can leak or produce carbon monoxide.",
      whoAtRisk: "Kitchen staff and guests",
      category: "SAFETY",
      likelihood: 2,
      consequence: 5,
      existingControls:
        "Gas Safe registered engineers, interlocks, and ventilation that is kept clear.",
      legalRef: "Gas Safety (Installation and Use) Regulations 1998",
      defaultSelected: true,
    },
    {
      key: "late-night-violence",
      title: "Late-night violence and lone working",
      context: "Closing time, cash handling and intoxicated customers.",
      whoAtRisk: "Front of house and security",
      category: "SAFETY",
      likelihood: 2,
      consequence: 4,
      existingControls:
        "Two people to close, cash handling rules, and a way to call for help.",
      legalRef: "HSWA 1974 s.2; MHSWR 1999",
      defaultSelected: false,
    },
  ],
  retail: [
    {
      key: "loading-bay",
      title: "Deliveries and loading bays",
      context: "Reversing vehicles, pallet trucks and rushed deliveries.",
      whoAtRisk: "Warehouse staff, drivers and customers who wander into the bay",
      category: "SAFETY",
      likelihood: 3,
      consequence: 4,
      existingControls:
        "Keep customers out of the bay, trained pallet-truck users, and a banksman for reversing.",
      legalRef: "HSWA 1974; PUWER 1998",
      defaultSelected: true,
    },
    {
      key: "retail-violence",
      title: "Violence, theft and cash handling",
      context: "Robbery, abusive customers or cash-up at close.",
      whoAtRisk: "Shop-floor and till staff, especially when working alone",
      category: "SAFETY",
      likelihood: 2,
      consequence: 4,
      existingControls:
        "Safe cash limits, CCTV, panic alarm, and two people to close where possible.",
      legalRef: "HSWA 1974 s.2; MHSWR 1999",
      defaultSelected: true,
    },
    {
      key: "stock-handling",
      title: "Stock handling and storage",
      context: "Heavy cages, high shelves and cramped stockrooms.",
      whoAtRisk: "Shop-floor and warehouse staff",
      category: "ERGONOMIC",
      likelihood: 3,
      consequence: 3,
      existingControls:
        "Keep heavy items at waist height, use cages properly, and do not climb on shelving.",
      legalRef: "Manual Handling Operations Regulations 1992; WAHR 2005",
      defaultSelected: true,
    },
  ],
  transport: [
    {
      key: "driving-work",
      title: "Driving for work",
      context: "Fatigue, poor weather, vehicle defects and time pressure on the road.",
      whoAtRisk: "Drivers and other road users",
      category: "SAFETY",
      likelihood: 3,
      consequence: 5,
      existingControls:
        "Licence checks, vehicle checks, realistic schedules, and a mobile-phone policy.",
      legalRef: "HSWA 1974; Road traffic law; MHSWR 1999",
      defaultSelected: true,
    },
    {
      key: "loading-vehicles",
      title: "Loading, unloading and falls from vehicles",
      context: "Falls from tail-lifts, trailers and load shift in transit.",
      whoAtRisk: "Drivers and yard staff",
      category: "SAFETY",
      likelihood: 3,
      consequence: 4,
      existingControls:
        "Secure loads, use tail-lifts as designed, and keep yards free of pedestrians.",
      legalRef: "Work at Height Regulations 2005; HSWA 1974",
      defaultSelected: true,
    },
    {
      key: "yard-vehicles",
      title: "Yard and warehouse vehicle movement",
      context: "Forklifts, HGVs and pedestrians sharing the same space.",
      whoAtRisk: "Pedestrians, drivers and visitors",
      category: "SAFETY",
      likelihood: 3,
      consequence: 5,
      existingControls:
        "Marked walkways, high-visibility clothing, trained operators, and speed limits.",
      legalRef: "HSWA 1974; PUWER 1998",
      defaultSelected: true,
    },
  ],
  education: [
    {
      key: "playground",
      title: "Playgrounds, PE and outdoor activity",
      context: "Falls, collisions and poorly maintained equipment during play and sport.",
      whoAtRisk: "Pupils and supervising staff",
      category: "SAFETY",
      likelihood: 3,
      consequence: 3,
      existingControls:
        "Inspect equipment, adequate supervision, and first-aid cover for activities.",
      legalRef: "HSWA 1974 (duty to non-employees); MHSWR 1999",
      defaultSelected: true,
    },
    {
      key: "science-dt",
      title: "Science, D&T and practical subjects",
      context: "Chemicals, tools, heat and dust in teaching spaces.",
      whoAtRisk: "Pupils, technicians and teachers",
      category: "HEALTH",
      likelihood: 2,
      consequence: 4,
      existingControls:
        "CLEAPSS / equivalent guidance, COSHH for substances, and trained technicians.",
      legalRef: "COSHH 2002; PUWER 1998; MHSWR 1999",
      defaultSelected: true,
    },
    {
      key: "school-violence",
      title: "Violence and challenging behaviour",
      context: "Assault or injury when managing behaviour.",
      whoAtRisk: "Teachers, support staff and other pupils",
      category: "SAFETY",
      likelihood: 2,
      consequence: 3,
      existingControls:
        "Behaviour policy, training, and a way to report and review incidents.",
      legalRef: "HSWA 1974 s.2; MHSWR 1999",
      defaultSelected: false,
    },
  ],
  technology: [
    {
      key: "home-working",
      title: "Home and hybrid working",
      context:
        "Unassessed workstations, isolation, and electrical equipment that is not the employer’s.",
      whoAtRisk: "Remote workers",
      category: "ERGONOMIC",
      likelihood: 3,
      consequence: 2,
      existingControls:
        "DSE assessment for home set-up, a way to stay in contact, and guidance on breaks.",
      legalRef: "DSE Regulations 1992; HSWA 1974; MHSWR 1999",
      defaultSelected: true,
    },
    {
      key: "office-dse",
      title: "Office workstations",
      context: "Long hours at screens without an assessed set-up.",
      whoAtRisk: "Office-based staff",
      category: "ERGONOMIC",
      likelihood: 3,
      consequence: 2,
      existingControls:
        "DSE assessment on starting and after a move, eye tests, and adjustable furniture.",
      legalRef: "Health and Safety (Display Screen Equipment) Regulations 1992",
      defaultSelected: true,
    },
  ],
  agriculture: [
    {
      key: "farm-machinery",
      title: "Tractors, telehandlers and PTO",
      context: "Overturns, run-overs and entanglement with power take-off shafts.",
      whoAtRisk: "Operators, family members and contractors",
      category: "SAFETY",
      likelihood: 3,
      consequence: 5,
      existingControls:
        "Seatbelts, PTO guards, competent operators, and no extra riders.",
      legalRef: "PUWER 1998; HSWA 1974",
      defaultSelected: true,
    },
    {
      key: "livestock",
      title: "Livestock",
      context: "Crush, kick, charge or zoonotic disease when handling animals.",
      whoAtRisk: "Anyone handling or walking among livestock",
      category: "SAFETY",
      likelihood: 3,
      consequence: 4,
      existingControls:
        "Proper handling facilities, never work a bull alone, and hygiene after contact.",
      legalRef: "HSWA 1974; COSHH 2002 (zoonoses)",
      defaultSelected: true,
    },
    {
      key: "ag-chemicals",
      title: "Pesticides and veterinary medicines",
      context: "Mixing, spraying or storing chemicals without assessment.",
      whoAtRisk: "The person applying, family members and bystanders",
      category: "HEALTH",
      likelihood: 2,
      consequence: 4,
      existingControls:
        "COSHH assessment, certified users where required, PPE, and locked stores.",
      legalRef: "COSHH 2002; Plant Protection Products (Sustainable Use) Regulations",
      defaultSelected: true,
    },
    {
      key: "lone-farm",
      title: "Lone working on the farm",
      context: "Injury with no one nearby to raise the alarm.",
      whoAtRisk: "Anyone working alone in fields, sheds or workshops",
      category: "SAFETY",
      likelihood: 3,
      consequence: 4,
      existingControls:
        "Tell someone where you are, carry a phone, and check in at agreed times.",
      legalRef: "MHSWR 1999; HSWA 1974",
      defaultSelected: true,
    },
  ],
  other: [],
};

export function resolveUkRiskStarterIndustry(industry: string | null | undefined): string {
  const normalized = normalizeIndustryValue(industry);
  return INDUSTRY_PACK_MAP[normalized] ?? "other";
}

export function getUkRiskStarterIndustryLabel(industry: string | null | undefined): string {
  const packId = resolveUkRiskStarterIndustry(industry);
  return UK_RISK_STARTER_INDUSTRIES.find((option) => option.value === packId)?.label ?? "General workplace";
}

export function getUkRiskStarterHazards(industry: string | null | undefined): UkRiskStarterHazard[] {
  return getUkRiskStarterPack(industry).groups.flatMap((group) => group.hazards);
}

export function getUkRiskStarterByKeys(
  industry: string | null | undefined,
  keys: string[],
): UkRiskStarterHazard[] {
  const allowed = new Set(keys);
  const seen = new Set<string>();
  const selected: UkRiskStarterHazard[] = [];
  for (const hazard of getUkRiskStarterHazards(industry)) {
    if (!allowed.has(hazard.key) || seen.has(hazard.key)) continue;
    seen.add(hazard.key);
    selected.push(hazard);
  }
  return selected;
}

export function getUkRiskStarterPack(industry: string | null | undefined): UkRiskStarterPack {
  const packId = resolveUkRiskStarterIndustry(industry);
  const label = getUkRiskStarterIndustryLabel(packId);
  const industryHazards = INDUSTRY_HAZARDS[packId] ?? [];
  const groups: UkRiskStarterGroup[] = [
    {
      id: "workplace",
      title: "Every workplace",
      hazards: [...WORKPLACE_HAZARDS],
    },
  ];
  if (industryHazards.length > 0) {
    groups.push({
      id: "industry",
      title: `Typical for ${label.toLowerCase()}`,
      hazards: [...industryHazards],
    });
  }
  return { industry: packId, label, groups };
}
