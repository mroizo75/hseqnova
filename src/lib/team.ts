/**
 * Shared team and author data for HSEQ Nova.
 * Used by /team and /author/[slug].
 */

export interface TeamMemberContact {
  email: string;
  phone: string;
  linkedin: string;
}

export interface TeamMember {
  slug: string;
  name: string;
  title: string;
  image: string;
  /** CSS object-position to show face (e.g. "top", "50% 25%") */
  imagePosition?: string;
  bio: string;
  longBio: string;
  credentials: string[];
  expertise: string[];
  contact: TeamMemberContact;
  teamLabel: string;
  articlesWritten?: number;
  companiesHelped?: number;
}

export const TEAM_MEMBERS: Record<string, TeamMember> = {
  "kenneth-kristiansen": {
    slug: "kenneth-kristiansen",
    name: "Kenneth Kristiansen",
    title: "HSEQ expert and founder",
    image: "/team/kenneth-kristiansen.png",
    imagePosition: "50% 20%",
    bio: "Kenneth is the founder of HSEQ Nova and is passionate about making health and safety management simple and accessible. With experience from both private and public sectors, he combines practical knowledge with modern technology to build safer workplaces.",
    longBio: `
Kenneth started HSEQ Nova with a vision: health and safety management should be simple, not bureaucratic.

Through experience with complex HSEQ systems and frustrated business owners, he saw the need for a modern, user-friendly solution. HSEQ Nova builds safety — not bureaucracy.

Today Kenneth works on developing HSEQ Nova further and helps organisations with digitisation of their health and safety management.
    `,
    credentials: [
      "Founder of HSEQ Nova",
      "Approved training provider (HSEQ Nova Ltd)",
      "Experience with HSEQ and quality management",
      "Specialist in digitisation of health and safety",
      "Developer of modern HSEQ solutions"
    ],
    expertise: [
      "HSEQ systems",
      "ISO 9001 certification",
      "Risk assessment",
      "Working environment",
      "Internal controls",
      "Digitisation",
      "Management systems"
    ],
    contact: {
      email: "kenneth@kksas.no",
      phone: "+47 99 11 29 16",
      linkedin: ""
    },
    teamLabel: "founder and developer",
    articlesWritten: 5,
    companiesHelped: 50,
  },
  "kai-arne-odegard": {
    slug: "kai-arne-odegard",
    name: "Kai Arne Ødegård",
    title: "Sales Director",
    image: "/team/kai-arne.png",
    imagePosition: "50% 10%",
    bio: "Kai Arne is Sales Director at HSEQ Nova with over 40 years of experience in sales and management. He has run several of his own companies and helps UK businesses find health and safety solutions that fit their needs.",
    longBio: `
Kai Arne brings over 40 years of experience from sales and business management into HSEQ Nova. Having run several of his own companies, he understands the challenges business owners face — and the value of solutions that actually work in practice.

As Sales Director at HSEQ Nova, he works closely with organisations that want more information, customisation or onboarding of HSEQ Nova. He is passionate about matching the right solution with the right customer, so that health and safety work becomes a strength — not a burden.

Today Kai Arne is a natural first point of contact for businesses considering HSEQ Nova and wanting an informal conversation about their needs and options.
    `,
    credentials: [
      "Sales Director at HSEQ Nova",
      "40+ years of experience in sales and management",
      "Experience starting and running multiple businesses",
      "Specialist in client relations and needs analysis",
      "First point of contact for sales and product information"
    ],
    expertise: [
      "Sales and client relations",
      "HSEQ Nova product information",
      "Needs analysis",
      "Business management",
      "B2B sales",
      "Start-up and business operations"
    ],
    contact: {
      email: "kai@kksas.no",
      phone: "+47 91 54 08 24",
      linkedin: ""
    },
    teamLabel: "sales director",
    articlesWritten: 0,
    companiesHelped: 0,
  },
  "tommy-kristiansen": {
    slug: "tommy-kristiansen",
    name: "Tommy Kristiansen",
    title: "HSE Manager",
    image: "/team/tommy-kristiansen.png",
    imagePosition: "50% 5%",
    bio: "Tommy is HSE Manager at HSEQ Nova with a background in health and safety courses and HSE management, fire safety and extensive experience as a vocational teacher, lecturer and workshop manager. He contributes pedagogy, leadership and practical HSEQ competence to the team.",
    longBio: `
Tommy has qualifications and training in HSEQ and HSE management (ABL), fire safety (Falken) and broad experience from education and industry. As a vocational teacher and lecturer he has worked with training and safety culture for many years.

Through positions as workshop manager and managing director he knows the requirements and practices of working life. The combination of pedagogy, leadership and HSEQ makes him a natural HSE Manager at HSEQ Nova — with a focus on ensuring that training and procedures work in reality.

Tommy is also active in voluntary work as a course instructor for motorsport and as a handball coach.
    `,
    credentials: [
      "HSE Manager at HSEQ Nova",
      "HSEQ and HSE Management qualification (ABL, 2007)",
      "Fire Safety (Falken, 2007)",
      "Lecturer and vocational teacher",
      "Experience as workshop manager and managing director",
      "Administration and Management (university level)",
      "Special Needs Education (university level)",
      "Motorsport course instructor"
    ],
    expertise: [
      "HSEQ and HSE management",
      "Fire safety",
      "Training and pedagogy",
      "Leadership and workshop management",
      "Working environment",
      "Safety culture"
    ],
    contact: {
      email: "tommy.h.kristiansen@gmail.com",
      phone: "+47 93 66 08 18",
      linkedin: ""
    },
    teamLabel: "HSE manager",
    articlesWritten: 0,
    companiesHelped: 0,
  },
} as const;

export type TeamMemberSlug = keyof typeof TEAM_MEMBERS;

export function getTeamMember(slug: string): TeamMember | undefined {
  return TEAM_MEMBERS[slug as TeamMemberSlug];
}

export function getAllTeamMembers(): TeamMember[] {
  return Object.values(TEAM_MEMBERS);
}
