import { DEFAULT_VALIDITY_MONTHS } from "@/features/training-sales/lib/follow-up";

export const TRAINING_COURSES = [
  {
    key: "work-at-height",
    title: "Work at height and fall protection",
    audience: "Anyone who works where a fall could cause injury, and the people who plan that work.",
    law: "Work at Height Regulations 2005; PPE at Work Regulations 1992",
    defaultValidityMonths: DEFAULT_VALIDITY_MONTHS,
    topics: [
      "Planning the task and choosing collective protection before personal equipment",
      "Forces, fall distances and the limits of a harness system",
      "Selecting, fitting and using personal fall-protection equipment",
      "Storage, maintenance and pre-use inspection",
      "Tool tethering, so dropped objects are controlled",
      "Rescue planning if someone is left suspended",
      "Ladders and stepladders, including when they are the wrong choice",
    ],
  },
  {
    key: "mewp",
    title: "Mobile elevating work platforms",
    audience: "People who will operate a specific MEWP, and those who supervise that work.",
    law: "PUWER 1998 reg. 9; LOLER 1998; Work at Height Regulations 2005",
    defaultValidityMonths: DEFAULT_VALIDITY_MONTHS,
    topics: [
      "How the machine is built and how it moves",
      "Stability, ground conditions and outriggers",
      "Operating limits, wind and overhead hazards",
      "Vertical platforms, boom lifts and vehicle-mounted platforms — matched to the machine in use",
      "Pre-use checks, faults and how to report them",
      "Safe use, including rescue from the platform",
    ],
  },
  {
    key: "pallet-truck",
    title: "Pedestrian pallet trucks",
    audience: "People who move loads with a pedestrian pallet truck in a warehouse, yard or shop.",
    law: "PUWER 1998 reg. 9",
    defaultValidityMonths: DEFAULT_VALIDITY_MONTHS,
    topics: [
      "How the truck works and what it is rated to carry",
      "Pre-use checks",
      "Load handling, stacking and travelling with a load",
      "Pedestrians, ramps, dock edges and other traffic",
      "Common causes of pallet-truck accidents",
    ],
  },
  {
    key: "scaffold-5m",
    title: "Prefabricated scaffold, up to 5 metres",
    audience: "People who erect, alter or dismantle prefabricated system scaffold up to 5 metres.",
    law: "Work at Height Regulations 2005; PUWER 1998",
    defaultValidityMonths: DEFAULT_VALIDITY_MONTHS,
    topics: [
      "When prefabricated scaffold is the right access method",
      "Components, ties and a stable foundation",
      "Erecting, altering and dismantling in sequence",
      "Inspection before use and after alteration",
      "Stopping the work when the scaffold is incomplete",
    ],
  },
  {
    key: "scaffold-9m",
    title: "Prefabricated scaffold, 5 to 9 metres",
    audience: "People who already work on lower scaffold and will erect, alter or dismantle up to 9 metres.",
    law: "Work at Height Regulations 2005; PUWER 1998",
    defaultValidityMonths: DEFAULT_VALIDITY_MONTHS,
    topics: [
      "The extra stability and tying demands above 5 metres",
      "Erecting, altering and dismantling in sequence",
      "Edge protection and safe loading of the platform",
      "Inspection and handover before anyone else uses it",
      "What this course does not cover: scaffold above 9 metres",
    ],
  },
  {
    key: "work-equipment",
    title: "Work equipment safety",
    audience: "New starters and anyone who uses work equipment. Often taken before a machine-specific course.",
    law: "HSWA 1974 s.2(2)(c); MHSWR 1999 reg. 13; PUWER 1998",
    defaultValidityMonths: DEFAULT_VALIDITY_MONTHS,
    topics: [
      "What the employer must provide: information, instruction, training and supervision",
      "Accidents, responsibility and what follows an injury",
      "The environment around the job",
      "Rules for using work equipment safely",
      "Recognising hazardous-goods marks. This is awareness only, not ADR driver training",
    ],
  },
  {
    key: "managers",
    title: "Health and safety for managers",
    audience: "Line managers and supervisors who organise the work and the people who do it.",
    law: "HSWA 1974 s.2; MHSWR 1999",
    defaultValidityMonths: DEFAULT_VALIDITY_MONTHS,
    topics: [
      "The employer’s duties and what a manager is expected to do day to day",
      "Risk assessment and the arrangements that sit under the policy",
      "Competence: who needs training, and how you know it is still current",
      "Investigating incidents and acting on what they show",
      "Consulting the people who do the work",
    ],
  },
] as const;

export type TrainingCourseKey = (typeof TRAINING_COURSES)[number]["key"];

export type TrainingCourse = (typeof TRAINING_COURSES)[number];

export function trainingCourseByKey(key: string | null | undefined): TrainingCourse | null {
  if (!key) return null;
  return TRAINING_COURSES.find((course) => course.key === key) ?? null;
}
