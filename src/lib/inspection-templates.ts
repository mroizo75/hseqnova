export interface InspectionTemplateSeed {
  name: string;
  industry: string;
  items: string[];
}

export const DEFAULT_INSPECTION_TEMPLATES: InspectionTemplateSeed[] = [
  {
    name: "Workplace inspection — office",
    industry: "office",
    items: [
      "Walkways clear of trip hazards",
      "DSE workstations set up correctly",
      "Fire exits unobstructed",
      "First-aid kit stocked and signed",
      "Electrical equipment PAT in date",
    ],
  },
  {
    name: "Workplace inspection — warehouse",
    industry: "warehouse",
    items: [
      "Racking in good condition",
      "Pedestrian and vehicle segregation",
      "Manual handling aids available",
      "Lighting adequate",
      "Spill kit in place",
    ],
  },
  {
    name: "Workplace inspection — construction",
    industry: "construction",
    items: [
      "Site induction in place",
      "RAMS current for the task",
      "Edge protection / work at height controls",
      "Welfare facilities adequate",
      "F10 / CPP available on the board",
    ],
  },
  {
    name: "Workplace inspection — hospitality",
    industry: "hospitality",
    items: [
      "Kitchen floors dry and unobstructed",
      "Fire blanket and extinguishers in date",
      "Allergen information available",
      "Hot water and sanitiser working",
      "Knife and equipment storage safe",
    ],
  },
  {
    name: "Safety tour",
    industry: "all",
    items: [
      "Housekeeping acceptable",
      "PPE worn where required",
      "Emergency equipment accessible",
      "People can describe the nearest fire exit",
      "Open actions from the last tour closed",
    ],
  },
];
