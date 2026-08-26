import { HelpContent } from "@/components/dashboard/page-help-dialog";

export const helpContent: Record<string, HelpContent> = {
  documents: {
    title: "Document control",
    description: "How to use the documents module to build your quality and HSEQ management system",
    sections: [
      {
        heading: "What is document control?",
        emoji: "📚",
        content:
          "Documents are the foundation of your health and safety and quality system. Store the controlling documents that set how work is done: policies, procedures, work instructions, checklists and templates. This is your documented management system.",
      },
      {
        heading: "Why do you need this?",
        emoji: "🎯",
        items: [
          {
            title: "Consistent working methods",
            description:
              "Ensures everyone in the organisation works in the same way and follows the same standards.",
          },
          {
            title: "Traceability and audit",
            description:
              "Records what was done, when and by whom. Essential for internal control and external audits.",
          },
          {
            title: "Competence transfer",
            description:
              "New employees can quickly learn the correct method by reading the documents.",
          },
          {
            title: "ISO requirements met",
            description:
              "All ISO standards require a documented management system with controlled processes.",
          },
        ],
      },
      {
        heading: "How to use the module",
        emoji: "🔧",
        items: [
          {
            title: "1. Start with templates",
            description:
              "Use ready-made templates to get started quickly with procedures, instructions and policies.",
          },
          {
            title: "2. Version control",
            description:
              "The system tracks all versions automatically. You can always return to earlier versions.",
          },
          {
            title: "3. Approval workflow",
            description:
              "Send documents for approval before they go live. This protects quality and compliance.",
          },
          {
            title: "4. Regular review",
            description:
              "Set reminders for reviews. Documents should be reviewed at least annually.",
          },
        ],
      },
    ],
    isoStandards: [
      "ISO 9001 (quality): clause 7.5 — documented information",
      "ISO 14001 (environment): clause 7.5 — documented environmental procedures",
      "ISO 45001 (OH&S): clause 7.5 — documented OH&S procedures",
      "ISO 27001 (information security): clause 7.5 — ISMS documentation",
    ],
    tips: [
      "Start with a document hierarchy: policy → procedure → instruction",
      "Use clear, plain language that everyone in the organisation understands",
      "Link documents to risks, objectives and actions for a joined-up picture",
      "Assign an owner and review interval to every document",
      "Train employees on new and updated procedures",
    ],
  },

  legalRegister: {
    title: "Legal register",
    description: "Overview of laws and regulations that apply to your organisation based on industry",
    sections: [
      {
        heading: "What is shown here?",
        emoji: "📋",
        content:
          "The list shows laws and regulations relevant to your industry. Links open legislation.gov.uk or HSE.gov.uk so you can read the full text.",
      },
      {
        heading: "Important: legal responsibility",
        emoji: "⚠️",
        content:
          "This is an overview and guidance only. The system is not legal advice. For specific questions about law and regulations, consult a solicitor or check legislation.gov.uk and HSE.gov.uk.",
      },
    ],
  },

  risks: {
    title: "Risk management",
    description: "Identify, assess and control risks in your organisation",
    sections: [
      {
        heading: "What is risk management?",
        emoji: "⚠️",
        content:
          "Risk management is identifying what can go wrong, judging how serious it could be, and putting actions in place to prevent or reduce the consequences. That covers everything from workplace accidents to environmental harm and business risk. Employers must make suitable and sufficient risk assessments (MHSWR 1999).",
      },
      {
        heading: "Should actions from a risk assessment be closed?",
        emoji: "1️⃣",
        content:
          "Yes. Actions created from a risk assessment must be followed up and closed when they have been completed and verified (ISO 45001 clauses 6.1 and 8.1, ISO 9001 clause 6.1). The sequence is: identify risk → assess risk → plan actions → carry out actions → evaluate effectiveness. If actions are not closed, you cannot show that the risk has been reduced.",
        items: [
          {
            title: "Good practice in HSEQ Nova",
            description:
              "1) The risk is recorded. 2) An action is created with an owner and due date. 3) The action is carried out. 4) The risk is reassessed. 5) The action is marked closed. 6) The effect is recorded. Close the action — do not close the risk assessment itself; it is reviewed and kept live.",
          },
        ],
      },
      {
        heading: "Why does it matter?",
        emoji: "🛡️",
        items: [
          {
            title: "Prevent harm and loss",
            description:
              "Reduces the likelihood of accidents, environmental incidents and financial loss.",
          },
          {
            title: "Legal duty",
            description:
              "HSWA 1974 s.2 and MHSWR 1999 require employers to assess risks and put in place arrangements to control them. A competent person must assist (MHSWR reg.7).",
          },
          {
            title: "ISO requirements",
            description:
              "All relevant ISO standards require structured risk management.",
          },
          {
            title: "Better decisions",
            description:
              "Helps management make informed decisions on resources and priorities.",
          },
        ],
      },
      {
        heading: "How to work with risks",
        emoji: "📊",
        items: [
          {
            title: "1. Identify risks",
            description:
              "Map potential hazards: physical, chemical, ergonomic, psychosocial, environmental and business risks.",
          },
          {
            title: "2. Assess likelihood and consequence",
            description:
              "Use a risk matrix (5×5 or equivalent) to rank the risks.",
          },
          {
            title: "3. Decide on actions",
            description:
              "Prioritise high risks. Use the hierarchy of control: eliminate or reduce before relying on PPE.",
          },
          {
            title: "4. Follow-up",
            description:
              "Check that actions work and that residual risk is acceptable. Reassess at least annually or when things change. Close actions when they are complete.",
          },
        ],
      },
      {
        heading: "What should be closed — and what should not?",
        emoji: "3️⃣",
        items: [
          {
            title: "Actions in a risk assessment",
            description: "✅ Yes — when completed and checked.",
          },
          {
            title: "Incidents",
            description: "✅ Yes — after corrective action and verification.",
          },
          {
            title: "Risk assessment",
            description: "❌ No — it is reviewed, not closed.",
          },
          {
            title: "System documents",
            description: "❌ No — they are version-controlled.",
          },
        ],
      },
    ],
    isoStandards: [
      "ISO 31000: risk management — principles and guidelines",
      "ISO 9001 (quality): clause 6.1 — risk-based thinking",
      "ISO 14001 (environment): clause 6.1.2 — environmental aspects and risk",
      "ISO 45001 (OH&S): clause 6.1.2 — hazard identification and risk assessment",
      "ISO 27001 (information security): clause 6.1.2 — information security risk assessment",
    ],
    tips: [
      "Involve employees — they know the hazards in their work best",
      "Use workplace inspections, HSEQ meetings and audits to identify risks",
      "Record both the risks and the actions thoroughly",
      "Close actions when they are complete — otherwise you cannot show reduced risk",
      "Reassess after actions — record residual risk (likelihood × consequence after control)",
      "ISO PDCA: risk = Plan, action = Do, check = Check, improvement = Act",
    ],
  },

  inspections: {
    title: "Workplace inspections",
    description: "Monitoring records. They stay with the company — they are not sent to the HSE.",
    sections: [
      {
        heading: "What the law actually requires",
        content:
          "There is no general UK duty to run a Norwegian-style safety round. MHSWR 1999 reg.5 requires arrangements to monitor preventive and protective measures, and to write those arrangements down if you employ five or more people. Safety representatives appointed by a recognised trade union may inspect the workplace every three months, or sooner after a substantial change or a notifiable event (SRSCWR 1977 regs.5 and 6). Construction sites are monitored under CDM 2015.",
      },
      {
        heading: "What to record",
        items: [
          {
            title: "HSE F2534 — inspection took place",
            description:
              "Date, time, area of the workplace, names of safety representatives and of the employer’s representative if they took part. Keep a copy. Give a copy to the employer. The record does not imply that conditions are safe.",
          },
          {
            title: "HSE F2533 — unsafe conditions",
            description:
              "Record each unsafe or unhealthy condition or unsatisfactory welfare arrangement, who will act, and by when. The employer should decide the follow-up and explain it.",
          },
          {
            title: "Not sent to the HSE",
            description:
              "Ordinary inspection records are internal evidence of monitoring. Only RIDDOR events are reported to the HSE. Scaffold, excavation and work-at-height inspections have separate statutory reports that must be retained and shown to an inspector.",
          },
        ],
      },
      {
        heading: "How to use this module",
        items: [
          {
            title: "1. Create the record",
            description:
              "Date, workplace and who inspected are required. A checklist is optional.",
          },
          {
            title: "2. Involve the right people",
            description:
              "Safety representative inspections need reasonable written notice. The employer may be present.",
          },
          {
            title: "3. Record findings",
            description:
              "Photograph where it helps. Assign an owner and a due date for every finding.",
          },
          {
            title: "4. Close the loop",
            description:
              "Let the representative inspect again to check the action. Share the outcome with the safety committee where there is one.",
          },
        ],
      },
    ],
    isoStandards: [
      "ISO 45001 clause 9.1 — monitoring, measurement, analysis and evaluation",
    ],
    tips: [
      "Frequency follows risk, not a fixed calendar — except the three-month entitlement for union safety representatives",
      "Link the inspection back to the risk assessment you are checking",
      "Use the mobile view on site",
      "Do not treat a completed record as proof that the workplace is safe",
    ],
  },

  incidents: {
    title: "Accident book",
    description: "Record injuries, near misses and RIDDOR-reportable events",
    sections: [
      {
        heading: "What is an incident?",
        emoji: "🚨",
        content:
          "An incident is an unwanted or unexpected event that has caused, or could have caused, harm to people, the environment, property or reputation. This includes accidents, near misses, environmental events and departures from procedures. Keep entries in the accident book (Social Security (Claims and Payments) Regulations 1979; keep for 3 years). Reportable events go to the HSE under RIDDOR 2013.",
      },
      {
        heading: "Should incidents be closed?",
        emoji: "2️⃣",
        content:
          "Yes — close the record when the investigation and any actions are complete. HSE HSG245 expects a proportionate investigation, control measures, and follow-up. Accident book entries must be kept for 3 years (SSCPR 1979).",
        items: [
          {
            title: "Audit-ready practice in HSEQ Nova",
            description:
              "Status: Open → Under investigation → Action taken → Closed. Depth of investigation should match the harm or potential harm (HSG245). Remember RIDDOR timescales: death without delay; specified injury 10 days; over-seven-day injury 15 days.",
          },
        ],
      },
      {
        heading: "Why record incidents?",
        emoji: "📋",
        items: [
          {
            title: "Legal duty",
            description:
              "HSWA 1974 s.2 requires a safe system of work. Record accidents in the accident book. Report deaths, specified injuries, over-seven-day injuries, occupational diseases and listed dangerous occurrences to the HSE under RIDDOR 2013. Near misses are not RIDDOR but should still be recorded.",
          },
          {
            title: "Learn from failure",
            description:
              "Identify root causes and put in actions to prevent recurrence.",
          },
          {
            title: "Trend analysis",
            description:
              "See patterns and focus effort on high-risk areas.",
          },
          {
            title: "Improvement",
            description:
              "Incident reporting is the basis for continual improvement.",
          },
        ],
      },
      {
        heading: "How to handle incidents (HSE HSG245)",
        emoji: "🔧",
        items: [
          {
            title: "1. Record promptly",
            description:
              "Report the event as soon as possible. The sooner you record it, the better the information quality.",
          },
          {
            title: "2. Investigate",
            description:
              "Gather facts, analyse immediate and underlying causes, and identify control measures. Keep it proportionate — a near miss does not need a full 5 Whys unless the potential was serious.",
          },
          {
            title: "3. Put actions in place",
            description:
              "Record concrete actions with an owner and due date. Follow up until all actions are complete.",
          },
          {
            title: "4. Close the incident",
            description:
              "When actions are complete and effectiveness is verified: close the incident. Record the effectiveness review and who approved closure.",
          },
        ],
      },
      {
        heading: "What should be closed — and what should not?",
        emoji: "3️⃣",
        items: [
          {
            title: "Actions in a risk assessment",
            description: "✅ Yes — when completed and checked.",
          },
          {
            title: "Incidents",
            description: "✅ Yes — after corrective action and verification.",
          },
          {
            title: "Risk assessment",
            description: "❌ No — it is reviewed, not closed.",
          },
          {
            title: "System documents",
            description: "❌ No — they are version-controlled.",
          },
        ],
      },
    ],
    isoStandards: [
      "Social Security (Claims and Payments) Regulations 1979 — accident book, keep 3 years",
      "RIDDOR 2013 — reportable deaths, specified injuries, over-seven-day, disease, listed occurrences",
      "HSWA 1974 s.2 — safe system of work; MHSWR 1999 — manage risk",
      "HSE HSG245 — investigating accidents and incidents",
    ],
    tips: [
      "Make it easy and safe to report",
      "Focus on system failings, not personal blame",
      "Match investigation depth to the harm or potential harm (HSG245)",
      "Follow up actions until they are done",
      "Keep accident book entries for 3 years",
    ],
  },

  actions: {
    title: "Actions and tasks",
    description: "Manage corrective and preventive actions",
    sections: [
      {
        heading: "What are actions?",
        emoji: "✅",
        content:
          "Actions are concrete steps to resolve incidents, reduce risks or improve processes. They may be corrective (put right what went wrong) or preventive (stop something happening).",
      },
      {
        heading: "Should actions be closed?",
        emoji: "1️⃣",
        content:
          "Yes. Actions should be closed when they have been completed and verified. ISO 45001 clauses 6.1 and 8.1, ISO 9001 clause 6.1. If actions are not closed, you cannot show that risk has been reduced or that the incident is resolved. In HSEQ Nova: mark the action complete, record the effect, and close it — that supports the PDCA cycle (Plan–Do–Check–Act) that ISO is built on.",
        items: [
          {
            title: "What should be closed — and what should not?",
            description:
              "Actions: ✅ Yes. Incidents: ✅ Yes. Risk assessment: ❌ No (it is reviewed). System documents: ❌ No (version-controlled).",
          },
        ],
      },
      {
        heading: "Why manage actions systematically?",
        emoji: "🎯",
        items: [
          {
            title: "Make sure they get done",
            description:
              "A clear owner and due date make it more likely that the action will be completed.",
          },
          {
            title: "Traceability",
            description:
              "You can show that actions were taken, evaluated and closed.",
          },
          {
            title: "ISO requirements",
            description:
              "All ISO standards require systematic handling of corrective action.",
          },
          {
            title: "Continual improvement",
            description:
              "Structured action management moves the organisation forward.",
          },
        ],
      },
      {
        heading: "How to work with actions",
        emoji: "📊",
        items: [
          {
            title: "1. Define them clearly",
            description:
              "Describe what will be done, why, and what result you expect.",
          },
          {
            title: "2. Set an owner and due date",
            description:
              "One person should be accountable. Set a realistic deadline.",
          },
          {
            title: "3. Prioritise",
            description:
              "Mark high-priority actions and deal with them first.",
          },
          {
            title: "4. Close when complete",
            description:
              "When the action is done: did it work? Is the problem resolved? Mark it complete and record the effect. Close the action.",
          },
        ],
      },
    ],
    isoStandards: [
      "ISO 9001 (quality): clause 10.2 — nonconformity and corrective action",
      "ISO 14001 (environment): clause 10.2 — environmental nonconformity and corrective action",
      "ISO 45001 (OH&S): clause 10.2 — incidents and corrective action",
      "ISO 27001 (information security): clause A.16.1.6 — learning from security incidents",
    ],
    tips: [
      "Link actions to risks, incidents or accident book entries for full traceability",
      "Use SMART objectives: Specific, Measurable, Achievable, Realistic, Time-bound",
      "Set reminders so owners do not miss the due date",
      "Review open actions in management meetings and HSEQ meetings",
      "Close actions when they are complete and record the outcome",
    ],
  },

  training: {
    title: "Training",
    description: "Ensure competence and qualifications across the organisation",
    sections: [
      {
        heading: "What is training?",
        emoji: "🎓",
        content:
          "Training covers all competence-building that ensures employees have the knowledge, skills and attitudes to do the work safely, effectively and in line with requirements. Employers must provide information, instruction, training and supervision (HSWA 1974 s.2(2)(c)).",
      },
      {
        heading: "Why is training important?",
        emoji: "📚",
        items: [
          {
            title: "Legal duty",
            description:
              "HSWA 1974 s.2(2)(c) requires the employer to provide such information, instruction, training and supervision as is necessary to ensure health and safety at work.",
          },
          {
            title: "Prevent accidents",
            description:
              "Lack of competence is a common cause of workplace accidents.",
          },
          {
            title: "ISO requirements",
            description:
              "ISO 9001, 14001, 45001 and 27001 require documented competence and training.",
          },
          {
            title: "Better results",
            description:
              "Competent employees deliver higher quality and are more effective.",
          },
        ],
      },
      {
        heading: "How to use the training module",
        emoji: "🔧",
        items: [
          {
            title: "1. Build a training matrix",
            description:
              "Map which courses and competences each role or person needs.",
          },
          {
            title: "2. Record courses",
            description:
              "Enter completed courses with date, duration and any certificate.",
          },
          {
            title: "3. Set reminders",
            description:
              "Many courses expire (first aid, hot works, forklift). Set automatic reminders.",
          },
          {
            title: "4. Review competence",
            description:
              "See who is missing which courses and plan training.",
          },
        ],
      },
    ],
    isoStandards: [
      "ISO 9001 (quality): clause 7.2 — competence",
      "ISO 14001 (environment): clause 7.2 — environmental competence",
      "ISO 45001 (OH&S): clause 7.2 — OH&S competence",
      "ISO 27001 (information security): clause 7.2 — security competence and awareness",
    ],
    tips: [
      "Start by identifying critical competence for safety and quality",
      "Use both external courses and internal (on-the-job) training",
      "Record all training: who, what, when, duration",
      "Check whether training works — test understanding and look at results",
      "Run an induction programme for new employees",
    ],
  },

  audits: {
    title: "Audits",
    description: "Carry out internal audits of the management system",
    sections: [
      {
        heading: "What is an audit?",
        emoji: "🔍",
        content:
          "An audit is a systematic, independent examination of whether activities, processes and results meet requirements and standards. Internal audits are carried out by the organisation itself.",
      },
      {
        heading: "Why carry out audits?",
        emoji: "✅",
        items: [
          {
            title: "ISO requirements",
            description:
              "All ISO standards require annual internal audits of the whole management system.",
          },
          {
            title: "Verify compliance",
            description:
              "Confirms that you actually follow your own procedures and meet legal duties.",
          },
          {
            title: "Identify improvement areas",
            description:
              "Finds weaknesses, inefficiency and opportunities for improvement.",
          },
          {
            title: "Prepare for external audit",
            description:
              "Internal audits find issues before certification audits.",
          },
        ],
      },
      {
        heading: "How to carry out audits",
        emoji: "📋",
        items: [
          {
            title: "1. Plan the audit",
            description:
              "Create an annual audit programme. Cover the whole management system over a period.",
          },
          {
            title: "2. Prepare the auditor",
            description:
              "Review relevant documents, previous findings and changes since last time.",
          },
          {
            title: "3. Carry out the audit",
            description:
              "Interview people, review documents, observe practice. Record findings.",
          },
          {
            title: "4. Report and follow up",
            description:
              "Write the audit report, record incidents and actions. Follow through until closed.",
          },
        ],
      },
    ],
    isoStandards: [
      "ISO 9001 (quality): clause 9.2 — internal audit",
      "ISO 14001 (environment): clause 9.2 — internal audit of the environmental management system",
      "ISO 45001 (OH&S): clause 9.2 — internal audit of the OH&S system",
      "ISO 27001 (information security): clause 9.2 — internal audit of the ISMS",
      "ISO 19011: guidelines for auditing management systems",
    ],
    tips: [
      "Use auditors who are not responsible for the area being audited",
      "Train your internal auditors in audit technique",
      "Focus on both compliance and the effectiveness of processes",
      "Involve employees — this is a learning opportunity, not a punishment",
      "Review audit findings in the management review",
    ],
  },

  goals: {
    title: "Objectives and performance",
    description: "Set and follow up the organisation’s health and safety, quality and environmental objectives",
    sections: [
      {
        heading: "What are objectives?",
        emoji: "🎯",
        content:
          "Objectives are concrete, measurable results the organisation wants to achieve in health and safety, quality, environment or the business. Good objectives give direction and make it possible to measure progress.",
      },
      {
        heading: "Why set objectives?",
        emoji: "📈",
        items: [
          {
            title: "ISO requirements",
            description:
              "ISO 9001, 14001, 45001 and 27001 require the organisation to set measurable objectives.",
          },
          {
            title: "Give direction",
            description:
              "Clear objectives give the whole organisation a shared direction and priorities.",
          },
          {
            title: "Measure progress",
            description:
              "Without objectives you cannot tell whether you are succeeding or whether actions are working.",
          },
          {
            title: "Engage employees",
            description:
              "Involvement in setting objectives increases motivation and ownership.",
          },
        ],
      },
      {
        heading: "How to work with objectives",
        emoji: "🔧",
        items: [
          {
            title: "1. Use SMART criteria",
            description:
              "Specific, Measurable, Achievable, Realistic, Time-bound. Example: ‘Reduce the accident frequency rate to below 3.0 by 31 December 2026’.",
          },
          {
            title: "2. Link to risks and actions",
            description:
              "Objectives should address identified risks and be supported by concrete actions.",
          },
          {
            title: "3. Follow up regularly",
            description:
              "Objectives must be measured and reported quarterly or more often. Adjust course if needed.",
          },
          {
            title: "4. Review in management",
            description:
              "Achievement of objectives should be a standing item in the management review.",
          },
        ],
      },
    ],
    isoStandards: [
      "ISO 9001 (quality): clause 6.2 — quality objectives",
      "ISO 14001 (environment): clause 6.2 — environmental objectives",
      "ISO 45001 (OH&S): clause 6.2 — OH&S objectives",
      "ISO 27001 (information security): clause 6.2 — information security objectives",
    ],
    tips: [
      "Set few, important objectives — five good ones beat twenty unclear ones",
      "Involve both management and employees in setting objectives",
      "Link objectives to the organisation’s strategy and values",
      "Use key performance indicators (KPIs) to measure progress",
      "Celebrate when objectives are met — that motivates further effort",
    ],
  },

  meetings: {
    title: "Meetings",
    description: "Record HSEQ meetings, safety representative meetings and management review",
    sections: [
      {
        heading: "What is meeting follow-up?",
        emoji: "🗓️",
        content:
          "Meetings are important forums for dialogue on health and safety, quality and environment. Structured meeting records ensure that decisions are documented and followed up. Employers must consult employees on health and safety (SRSCWR 1977; HSCER 1996).",
      },
      {
        heading: "Why record meetings?",
        emoji: "📝",
        items: [
          {
            title: "Legal duty",
            description:
              "Where safety representatives or a safety committee are in place, consultation must be genuine (SRSCWR 1977; Health and Safety (Consultation with Employees) Regulations 1996). Keep minutes so you can show what was agreed.",
          },
          {
            title: "Decision traceability",
            description:
              "Records which decisions were taken, by whom and why.",
          },
          {
            title: "Follow-up",
            description:
              "Minutes ensure that actions and tasks are followed up before the next meeting.",
          },
          {
            title: "ISO requirements",
            description:
              "Management review must be documented thoroughly.",
          },
        ],
      },
      {
        heading: "How to use the meetings module",
        emoji: "✅",
        items: [
          {
            title: "1. Create a meeting",
            description:
              "Record meeting type, attendees, date and agenda in advance.",
          },
          {
            title: "2. Record as you go",
            description:
              "Enter items, decisions and actions directly in the system during the meeting.",
          },
          {
            title: "3. Generate minutes",
            description:
              "The system produces structured minutes that can be shared.",
          },
          {
            title: "4. Follow up actions",
            description:
              "Actions from meetings are linked to the actions module and followed up there.",
          },
        ],
      },
    ],
    isoStandards: [
      "ISO 9001 (quality): clause 9.3 — management review",
      "ISO 14001 (environment): clause 9.3 — management review of the environmental system",
      "ISO 45001 (OH&S): clause 9.3 — management review of the OH&S system",
      "ISO 27001 (information security): clause 9.3 — management review of the ISMS",
    ],
    tips: [
      "Hold regular HSEQ meetings (monthly or quarterly)",
      "Management review should be held at least annually",
      "Involve the safety representative in all health and safety related meetings",
      "Review status on objectives, risks, incidents and actions in every meeting",
      "Issue minutes promptly to all attendees",
    ],
  },

  "management-reviews": {
    title: "Management review",
    description: "Carry out a systematic evaluation of the management system",
    sections: [
      {
        heading: "What is management review?",
        emoji: "👔",
        content:
          "Management review is a formal meeting in which top management reviews the management system’s performance, effectiveness and results. It is management’s main tool for ensuring the system works and improves.",
      },
      {
        heading: "Why does it matter?",
        emoji: "🎯",
        items: [
          {
            title: "ISO requirements",
            description:
              "All ISO standards require top management to review the system at least annually.",
          },
          {
            title: "Leadership accountability",
            description:
              "Shows that management takes responsibility for health and safety, quality and environment (HSWA 1974 s.2).",
          },
          {
            title: "Strategic steering tool",
            description:
              "Gives management an overview and a basis for strategic decisions.",
          },
          {
            title: "Continual improvement",
            description:
              "Identifies improvement areas and sets direction for the future.",
          },
        ],
      },
      {
        heading: "What should be reviewed?",
        emoji: "📊",
        items: [
          {
            title: "1. Input from the previous review",
            description:
              "Follow-up of actions and decisions from the last management review.",
          },
          {
            title: "2. Objectives and KPIs",
            description:
              "Status of health and safety, quality and environmental objectives. Key figures and trends.",
          },
          {
            title: "3. Audits and incidents",
            description:
              "Results from internal and external audits, and status of corrective actions.",
          },
          {
            title: "4. Change and risk",
            description:
              "Relevant changes in the organisation, law and the market. Updated risk assessment.",
          },
          {
            title: "5. Resources and competence",
            description:
              "Whether the system has enough resources to function.",
          },
          {
            title: "6. Opportunities for improvement",
            description:
              "Identify areas for improvement and decide new actions.",
          },
        ],
      },
    ],
    isoStandards: [
      "ISO 9001 (quality): clause 9.3 — management review",
      "ISO 14001 (environment): clause 9.3 — management review",
      "ISO 45001 (OH&S): clause 9.3 — management review",
      "ISO 27001 (information security): clause 9.3 — management review",
    ],
    tips: [
      "Hold at least once a year, preferably twice",
      "Prepare thoroughly — the system can auto-fill much of the data",
      "Involve top management — this should not be delegated",
      "Focus on both results and the suitability of the system",
      "Record decisions and actions clearly",
      "Follow up actions from the meeting systematically",
    ],
  },

  chemicals: {
    title: "COSHH management",
    description: "Manage hazardous substances and safety data sheets",
    sections: [
      {
        heading: "What is COSHH management?",
        emoji: "⚗️",
        content:
          "COSHH management means knowing every hazardous substance in the organisation, assessing the risk of use, and ensuring safe handling through procedures, PPE and training. COSHH 2002 requires suitable and sufficient assessments; health records for certain exposures must be kept for 40 years.",
      },
      {
        heading: "Why does it matter?",
        emoji: "⚠️",
        items: [
          {
            title: "Legal duty",
            description:
              "COSHH 2002 requires assessment of hazardous substances, control measures, information and training, and access to safety data sheets.",
          },
          {
            title: "Health hazards",
            description:
              "Many substances can cause acute or chronic ill health.",
          },
          {
            title: "Environmental consequences",
            description:
              "Releases of hazardous substances can cause significant environmental harm.",
          },
          {
            title: "ISO requirements",
            description:
              "ISO 14001 (environment) and ISO 45001 (OH&S) require control of hazardous substances.",
          },
        ],
      },
      {
        heading: "How to use the chemicals module",
        emoji: "📋",
        items: [
          {
            title: "1. Register all substances",
            description:
              "Enter product name, supplier and upload the safety data sheet (SDS).",
          },
          {
            title: "2. Assess the use",
            description:
              "Assess exposure, hazard and controls. HSEQ Nova gives you the structure for a COSHH assessment.",
          },
          {
            title: "3. Define PPE and procedures",
            description:
              "Record which PPE and safety controls are required (PPE is last in the hierarchy of control).",
          },
          {
            title: "4. Train people",
            description:
              "Everyone who uses hazardous substances must be trained. Link to the training module.",
          },
          {
            title: "5. Keep it current",
            description:
              "Update safety data sheets when the supplier issues a new version.",
          },
        ],
      },
    ],
    isoStandards: [
      "ISO 45001 (OH&S): clause 8.1.3 — management of change / hazardous substances",
      "ISO 14001 (environment): clause 8.1 — environmental aspects linked to chemicals",
    ],
    tips: [
      "Store safety data sheets digitally and make them available to employees",
      "Label substances clearly with hazard pictograms",
      "Substitute hazardous substances with less hazardous alternatives where reasonably practicable",
      "Review the COSHH register annually",
      "Link substances to risk assessments and inspections",
    ],
  },

  environment: {
    title: "Environmental management",
    description: "Identify and manage environmental aspects and impacts",
    sections: [
      {
        heading: "What is environmental management?",
        emoji: "🌍",
        content:
          "Environmental management is identifying and controlling the organisation’s impact on the environment. That includes energy use, emissions, waste, chemical use and other environmental aspects.",
      },
      {
        heading: "Why work on environmental management?",
        emoji: "♻️",
        items: [
          {
            title: "Legal duty",
            description:
              "Environmental Permitting, the Environmental Protection Act 1990 and related regulations set duties on pollution, waste and emissions. Check what applies to your sites.",
          },
          {
            title: "ISO 14001",
            description:
              "Environmental certification requires systematic identification and improvement of environmental performance.",
          },
          {
            title: "Social responsibility",
            description:
              "Contribute to sustainable development and reduced environmental impact.",
          },
          {
            title: "Cost",
            description:
              "Lower energy use and less waste often reduce costs.",
          },
        ],
      },
      {
        heading: "How to use the environment module",
        emoji: "📊",
        items: [
          {
            title: "1. Identify environmental aspects",
            description:
              "Map all activities that affect the environment: energy, waste, emissions, transport, chemicals.",
          },
          {
            title: "2. Assess significance",
            description:
              "Prioritise the aspects with the greatest impact or that are regulated by law.",
          },
          {
            title: "3. Set environmental objectives",
            description:
              "Define concrete objectives to reduce impact, for example ‘Reduce energy use by 15% by 2027’.",
          },
          {
            title: "4. Monitor and report",
            description:
              "Measure consumption and emissions regularly. Report progress against objectives.",
          },
        ],
      },
    ],
    isoStandards: [
      "ISO 14001: environmental management systems — requirements with guidance",
      "ISO 14004: guidelines for implementing an environmental management system",
      "ISO 50001: energy management systems (optional)",
    ],
    tips: [
      "Start by mapping the most obvious environmental aspects: waste, energy, transport",
      "Involve employees — they often have good ideas for environmental improvements",
      "Combine environmental and health and safety assessments for chemicals (COSHH)",
      "Set up meters to track consumption and emissions over time",
      "Review environmental aspects annually or when things change",
    ],
  },

  wellbeing: {
    title: "Psychosocial working environment",
    description: "Assess and improve the psychosocial working environment",
    sections: [
      {
        heading: "What is the psychosocial working environment?",
        emoji: "💚",
        content:
          "The psychosocial working environment covers factors such as workload, control, support, role clarity, conflict and wellbeing. It is about how organisation and management affect employees’ mental health and wellbeing. Employers must protect employees from work-related stress so far as is reasonably practicable (HSWA 1974 s.2; MHSWR 1999).",
      },
      {
        heading: "Why does it matter?",
        emoji: "🧠",
        items: [
          {
            title: "Legal duty",
            description:
              "HSWA 1974 s.2 and MHSWR 1999 require employers to assess and control risks to mental as well as physical health. Follow the HSE Management Standards for work-related stress.",
          },
          {
            title: "Sickness absence",
            description:
              "Work-related stress and mental ill health are among the most common causes of long-term absence.",
          },
          {
            title: "ISO 45003",
            description:
              "Guidance on managing psychosocial risk in the occupational health and safety management system.",
          },
          {
            title: "Better results",
            description:
              "A healthy psychosocial working environment increases engagement, productivity and wellbeing.",
          },
        ],
      },
      {
        heading: "How to work on the psychosocial working environment",
        emoji: "🔧",
        items: [
          {
            title: "1. Survey with questionnaires",
            description:
              "Run structured surveys on demands, control, support, bullying and harassment. The HSE Management Standards Indicator Tool is a recognised option.",
          },
          {
            title: "2. Identify risk factors",
            description:
              "Analyse the answers and identify areas of high demand or risk.",
          },
          {
            title: "3. Involve employees in actions",
            description:
              "Discuss results openly and let employees help find solutions (consultation: SRSCWR 1977 / HSCER 1996).",
          },
          {
            title: "4. Follow up systematically",
            description:
              "Put actions in place, evaluate effect and repeat the survey regularly (annually or every other year).",
          },
        ],
      },
    ],
    isoStandards: [
      "ISO 45003: occupational health and safety management — psychological health and safety at work",
      "ISO 45001 (OH&S): also covers psychosocial factors",
      "ISO 10002: complaints handling (including from employees)",
    ],
    tips: [
      "Use a validated survey such as the HSE Management Standards Indicator Tool",
      "Run the survey anonymously so people can answer honestly",
      "Communicate the results openly to all employees",
      "Combine quantitative data (surveys) with qualitative (conversations, workplace inspections)",
      "Run the survey annually so you can follow trends",
    ],
  },

  bcm: {
    title: "Emergency preparedness and continuity (BCM)",
    description: "Protect the organisation’s ability to handle crises and keep operating",
    sections: [
      {
        heading: "What is BCM?",
        emoji: "🛡️",
        content:
          "Business Continuity Management (BCM) is about ensuring the organisation can keep delivering critical services even in serious events such as fire, IT outage, pandemic or other crises. Fire precautions sit under the Regulatory Reform (Fire Safety) Order 2005 (responsible person, fire risk assessment, drills).",
      },
      {
        heading: "Why does it matter?",
        emoji: "🚨",
        items: [
          {
            title: "Reduce consequences",
            description:
              "Minimises loss of time, money and reputation in a crisis.",
          },
          {
            title: "Greater resilience",
            description:
              "Makes the organisation robust and able to handle the unexpected.",
          },
          {
            title: "ISO 22301",
            description:
              "The international standard for business continuity management provides a structured framework.",
          },
          {
            title: "Customer confidence",
            description:
              "Shows that you take responsibility and have control.",
          },
        ],
      },
      {
        heading: "How to use the BCM module",
        emoji: "📋",
        items: [
          {
            title: "1. Identify critical processes",
            description:
              "Which processes are essential to delivering services? What happens if they stop?",
          },
          {
            title: "2. Carry out a BIA",
            description:
              "Business Impact Analysis: assess the consequences of disruption and define acceptable downtime (RTO).",
          },
          {
            title: "3. Write emergency and continuity plans",
            description:
              "Document how you restore operations: backup, alternative equipment, communications. Include fire drills under the Fire Safety Order 2005.",
          },
          {
            title: "4. Practise and test",
            description:
              "Run regular exercises to make sure the plans work.",
          },
        ],
      },
    ],
    isoStandards: [
      "ISO 22301: Business Continuity Management Systems (BCMS)",
      "ISO 27001 (information security): clause A.17 — information security in BCM",
    ],
    tips: [
      "Start by identifying 3–5 critical processes",
      "Keep contact lists for the crisis team and key personnel",
      "Document backup arrangements for IT, premises and equipment",
      "Run at least one BCM exercise a year",
      "Update emergency plans when the organisation changes",
    ],
  },

  "annual-hms-plan": {
    title: "Annual H&S plan",
    description: "A step-by-step checklist that gathers legal and standards duties — tick each step when it is complete",
    sections: [
      {
        heading: "What is the annual H&S plan?",
        emoji: "📆",
        content:
          "The annual H&S plan is a checklist of the important health and safety duties for the year. You work through the list and tick each item when it is complete. When the whole list is ticked, you have evidence that this year’s duties are met — without having to interpret every statute and standard yourself.",
      },
      {
        heading: "Which duties does the plan cover?",
        emoji: "⚖️",
        items: [
          {
            title: "UK law and HSE guidance",
            description:
              "HSWA 1974 (including a written policy where there are five or more employees — statement, organisation and arrangements), MHSWR 1999, RIDDOR 2013, COSHH 2002, CDM 2015 where construction applies, and the Fire Safety Order 2005 require planned, systematic health and safety work with records.",
          },
          {
            title: "Management review",
            description:
              "At least annually, with a documented review of objectives, results, incidents, risk, resources and improvement actions.",
          },
          {
            title: "Annual risk assessment",
            description:
              "A systematic review of workplace risk, including physical, chemical, ergonomic and psychosocial factors (MHSWR 1999 — suitable and sufficient).",
          },
          {
            title: "Monitoring and audit",
            description:
              "Workplace inspections, internal audits, follow-up of findings and actions, and regular review of documents and the COSHH register.",
          },
        ],
      },
      {
        heading: "How to use the checklist",
        emoji: "🔧",
        items: [
          {
            title: "1. Work through the steps in order",
            description:
              "Read the description and duty for each step. Complete the work (for example run management review, update the risk assessment) in the linked module.",
          },
          {
            title: "2. Tick when the step is complete",
            description:
              "Tick the checklist when you have completed and recorded the step. Date and user are stored automatically.",
          },
          {
            title: "3. Use the ‘Go to module’ links",
            description:
              "Each step links to the relevant part of HSEQ Nova (documents, workplace inspections, audits, and so on) so you get to the right place quickly.",
          },
          {
            title: "4. When every step is ticked",
            description:
              "You then have evidence that this year’s health and safety duties are met. Useful for internal assurance and for certification.",
          },
        ],
      },
    ],
    isoStandards: [
      "ISO 45001 (OH&S): 6.1, 6.2, 9.1, 9.2, 9.3 and 10.2 — planned, systematic OH&S work through the year",
      "ISO 9001 (quality): 6.2, 9.1, 9.2 and 9.3 — objectives, monitoring, internal audit and management review",
      "ISO 14001 (environment): 6.1, 6.2, 9.1, 9.2 and 9.3 — aspects, objectives, monitoring and management review",
      "ISO 27001 (information security): 9.1, 9.2 and 9.3 — monitoring, internal audit and management review",
    ],
    tips: [
      "Use the annual cycle as a standing item in management meetings and the safety committee.",
      "Make sure every legally required activity has a date and an owner.",
      "Match the frequency of activities to the organisation’s risk — high risk more often.",
      "Use the year’s reports (incidents, actions, measurements) as input to management review.",
      "Evaluate the annual plan each winter and adjust the cycle for the next year.",
    ],
  },

  whistleblowing: {
    title: "Whistleblowing",
    description: "Handle whistleblowing cases in line with PIDA 1998",
    sections: [
      {
        heading: "What is whistleblowing?",
        emoji: "📢",
        content:
          "Whistleblowing is when a worker raises a concern about wrongdoing in the organisation, such as a breach of the law, danger to life or health, or environmental harm. Qualifying disclosures are protected under the Public Interest Disclosure Act 1998 (PIDA).",
      },
      {
        heading: "Why does it matter?",
        emoji: "⚖️",
        items: [
          {
            title: "Legal protection",
            description:
              "PIDA 1998 protects workers who make a qualifying disclosure in the public interest. Detriment or dismissal for whistleblowing is unlawful. A clear internal channel is good practice.",
          },
          {
            title: "Uncover serious issues",
            description:
              "Whistleblowing can reveal corruption, fraud, health and safety breaches or discrimination.",
          },
          {
            title: "Protect the whistleblower",
            description:
              "The system helps people raise concerns safely without fear of reprisal.",
          },
          {
            title: "Build trust",
            description:
              "Shows that the organisation takes responsibility and will put things right.",
          },
        ],
      },
      {
        heading: "How to handle whistleblowing cases",
        emoji: "🔧",
        items: [
          {
            title: "1. Protect confidentiality",
            description:
              "Protect the whistleblower’s identity. Restrict access to the case.",
          },
          {
            title: "2. Receive and record",
            description:
              "Log the case securely. Acknowledge receipt to the whistleblower within a reasonable time.",
          },
          {
            title: "3. Investigate thoroughly",
            description:
              "Carry out an objective investigation. Hear all parties affected.",
          },
          {
            title: "4. Put actions in place",
            description:
              "Based on findings: corrective action, disciplinary action, or confirmation that nothing was wrong.",
          },
          {
            title: "5. Feedback",
            description:
              "Tell the whistleblower the outcome of the case, as far as the law allows.",
          },
        ],
      },
    ],
    isoStandards: [
      "ISO 37002: whistleblowing management systems",
      "ISO 37001: anti-bribery management systems",
    ],
    tips: [
      "Write a clear whistleblowing procedure and communicate it to all employees",
      "Offer both an internal channel and an external third party where appropriate",
      "Train managers and HR in handling whistleblowing",
      "Protect whistleblowers from detriment — this is required under PIDA 1998",
      "Record the whole process thoroughly",
    ],
  },

  complaints: {
    title: "Complaints handling",
    description: "Handle complaints from customers and other interested parties systematically",
    sections: [
      {
        heading: "What is complaints handling?",
        emoji: "📞",
        content:
          "Complaints handling is receiving, recording and following up feedback and complaints from customers, users or other interested parties in a structured and fair way.",
      },
      {
        heading: "Why does it matter?",
        emoji: "💬",
        items: [
          {
            title: "Customer satisfaction",
            description:
              "Good complaints handling can turn an unhappy customer into a loyal advocate.",
          },
          {
            title: "ISO 10002",
            description:
              "Provides guidelines for effective and transparent complaints handling.",
          },
          {
            title: "Continual improvement",
            description:
              "Complaints reveal weaknesses in products, services or processes.",
          },
          {
            title: "Reputation",
            description:
              "How you handle complaints has a significant effect on reputation.",
          },
        ],
      },
      {
        heading: "How to handle complaints",
        emoji: "✅",
        items: [
          {
            title: "1. Make it easy to complain",
            description:
              "Clear information on how customers can complain: email, telephone, form.",
          },
          {
            title: "2. Receive and acknowledge",
            description:
              "Acknowledge the complaint promptly and explain the next steps.",
          },
          {
            title: "3. Investigate the case",
            description:
              "Review the complaint objectively. Gather facts and hear the parties affected.",
          },
          {
            title: "4. Give a response and a solution",
            description:
              "Offer a fair solution. Explain the decision clearly.",
          },
          {
            title: "5. Learn and improve",
            description:
              "Analyse complaints to identify system failings and improvement areas.",
          },
        ],
      },
    ],
    isoStandards: [
      "ISO 10002: quality management — customer satisfaction — guidelines for complaints handling",
      "ISO 9001 (quality): clause 9.1.2 — customer satisfaction",
    ],
    tips: [
      "Set targets for response times on complaints (for example 24 hours for acknowledgement)",
      "Train employees in good complaints handling and customer service",
      "Analyse complaints data to see trends and repeating problems",
      "Use complaints as input to improvement work and product development",
      "Follow up with the customer after the case is resolved",
    ],
  },

  feedback: {
    title: "Feedback",
    description: "Receive and follow up feedback, suggestions and comments",
    sections: [
      {
        heading: "What is feedback?",
        emoji: "💭",
        content:
          "Feedback covers all types of input from employees, customers or other interested parties: improvement suggestions, praise, observations or requests.",
      },
      {
        heading: "Why collect feedback?",
        emoji: "🎯",
        items: [
          {
            title: "Engage employees",
            description:
              "Gives people a way to influence and contribute to improvements.",
          },
          {
            title: "Identify opportunities",
            description:
              "Good ideas can come from every level of the organisation.",
          },
          {
            title: "Continual improvement",
            description:
              "Structured collection of feedback drives improvement work.",
          },
          {
            title: "ISO spirit",
            description:
              "All ISO standards emphasise improvement based on data and feedback.",
          },
        ],
      },
      {
        heading: "How to use the feedback module",
        emoji: "📝",
        items: [
          {
            title: "1. Make it easy to give feedback",
            description:
              "A clear, accessible form. Low barriers to submitting.",
          },
          {
            title: "2. Receive and assess",
            description:
              "Review all feedback. Prioritise those with the greatest potential.",
          },
          {
            title: "3. Follow up",
            description:
              "Tell the person who submitted it what is happening with the suggestion.",
          },
          {
            title: "4. Implement good ideas",
            description:
              "Put actions in place based on valuable suggestions and recognise contributors.",
          },
        ],
      },
    ],
    isoStandards: [
      "ISO 9001 (quality): clause 10.3 — continual improvement",
      "ISO 45001 (OH&S): clause 5.4 — consultation and participation of workers",
    ],
    tips: [
      "Acknowledge and thank people for all feedback",
      "Share good examples of suggestions that were implemented",
      "Review feedback in management meetings",
      "Celebrate improvements based on employees’ suggestions",
      "Combine digital forms with physical suggestion boxes",
    ],
  },

  settings: {
    title: "Settings",
    description: "Company identity, notifications, Microsoft 365, billing and module access.",
    sections: [
      {
        heading: "What is this page?",
        emoji: "⚙️",
        content:
          "Settings is the control panel for this company. People live under Users. Here you set company details, Simple menu, who can see records, notifications, Microsoft sign-in, Stripe billing and benchmarking.",
      },
      {
        heading: "Tabs",
        emoji: "🔧",
        items: [
          {
            title: "Company",
            description:
              "Companies House number, VAT, logo, competent person (MHSWR 1999 reg.7) and dashboard lock.",
          },
          {
            title: "Notifications",
            description:
              "Email, text and digest for the accident book, inspections, training, actions, COSHH, documents, meetings and audits.",
          },
          {
            title: "Microsoft 365",
            description:
              "Optional work-account sign-in. A global administrator grants consent once.",
          },
          {
            title: "Subscription",
            description:
              "HSEQ Nova Core is per company, unlimited users, GBP excluding VAT. Manage payment in Stripe.",
          },
        ],
      },
      {
        heading: "Users",
        emoji: "👥",
        items: [
          {
            title: "Users is a separate page",
            description:
              "Invite, import and assign roles under Users in the menu, not here.",
          },
          {
            title: "Roles",
            description:
              "Administrator, HSE manager, line manager, safety representative, employee, occupational health, auditor.",
          },
        ],
      },
      {
        heading: "Good practice",
        emoji: "💡",
        items: [
          {
            title: "Least privilege",
            description: "Use Access so people only see other people’s records when their role needs it.",
          },
          {
            title: "Keep the competent person current",
            description: "Employees see that name as the HSE contact.",
          },
          {
            title: "Turn on accident-book notifications",
            description: "RIDDOR clocks start when someone is injured. The right people must be told the same day.",
          },
        ],
      },
    ],
    isoStandards: [
      "UK GDPR / DPA 2018: access control and logging",
      "ISO 27001: access control and review of user access",
    ],
    tips: [
      "Keep the competent person name current",
      "Test a notification after you change channels",
      "Review Access when someone changes role",
    ],
  },

  users: {
    title: "Users",
    description: "Invite employees, set roles and line managers for this company",
    sections: [
      {
        heading: "What is user management?",
        emoji: "👥",
        content:
          "This is where you add people to the company, set their role and record who their line manager is. HSWA s.2(3) requires the organisation of health and safety to be clear. Unlimited users per company.",
      },
      {
        heading: "Roles",
        emoji: "🔧",
        items: [
          {
            title: "Administrator",
            description:
              "Full access for this company: users, billing, access matrix and Microsoft 365.",
          },
          {
            title: "HSE manager / competent person",
            description:
              "MHSWR 1999 reg.7: the person appointed to assist with health and safety. Maps to the HMS role.",
          },
          {
            title: "Line manager",
            description:
              "Day-to-day supervision and accident-book routing. Maps to the LEDER role.",
          },
          {
            title: "Safety representative",
            description:
              "SRSCWR 1977 / HSCER 1996. Maps to the VERNEOMBUD role.",
          },
          {
            title: "Employee",
            description:
              "Accident book, procedures and training that apply to their work.",
          },
          {
            title: "Occupational health",
            description:
              "Read access plus incident and risk reporting. Maps to the BHT role.",
          },
          {
            title: "Auditor",
            description:
              "Read-only access for audit and SSIP evidence. Maps to the REVISOR role.",
          },
        ],
      },
      {
        heading: "Importing users",
        emoji: "📥",
        items: [
          {
            title: "1. Download the Excel example",
            description:
              "Use the template with columns for email, name, role, job title and line manager.",
          },
          {
            title: "2. Complete and import",
            description:
              "Excel (.xlsx) or CSV. Users are added without sending an invitation until you activate them.",
          },
          {
            title: "3. Activate",
            description:
              "Activate all, or one by one, to send an invitation with a temporary password.",
          },
        ],
      },
    ],
    isoStandards: [
      "HSWA 1974 s.2(3) — organisation of health and safety",
      "ISO 27001: access control and review of user access",
      "UK GDPR / DPA 2018: access control and logging",
    ],
    tips: [
      "Give people only the access they need",
      "Remove leavers promptly",
      "Review access at least once a year",
    ],
  },

  electrical: {
    title: "Certificates of conformity",
    description: "How to keep certificates of conformity from every trade in one place.",
    sections: [
      {
        heading: "What is a certificate of conformity?",
        emoji: "📋",
        content:
          "A certificate of conformity records that specialist work has been carried out in line with the applicable regulations. Competent persons (electrician, plumber, ventilation engineer and others) issue this after installation, alteration or inspection.",
      },
      {
        heading: "Categories",
        emoji: "🏷️",
        items: [
          {
            title: "Electrical",
            description:
              "Electrical Installation Certificates and reports under BS 7671 (IET Wiring Regulations) and the Electricity at Work Regulations 1989 — installations, inspections and verification.",
          },
          {
            title: "Plumbing",
            description:
              "Certificates for sanitary and mechanical services — pipework, drainage, heating.",
          },
          {
            title: "Ventilation",
            description:
              "Inspections and certificates for ventilation plant and indoor air quality.",
          },
          {
            title: "Fire",
            description:
              "Certificates for fire alarm systems, extinguishing systems and fire protection (Fire Safety Order 2005).",
          },
          {
            title: "Other",
            description:
              "Other trades that require documented conformity.",
          },
        ],
      },
      {
        heading: "How to use the module",
        emoji: "🔧",
        items: [
          {
            title: "Upload a certificate",
            description:
              "Click ‘Add’, choose a category, enter title, company and date, and upload the file.",
          },
          {
            title: "Filter by trade",
            description:
              "Use the category buttons to filter the list by electrical, plumbing, ventilation and so on.",
          },
          {
            title: "All employees can see the documents",
            description:
              "Certificates are visible to everyone with read access, including employees.",
          },
        ],
      },
    ],
    isoStandards: [
      "Electricity at Work Regulations 1989 — duty to maintain electrical systems",
      "BS 7671 — Requirements for Electrical Installations (IET Wiring Regulations)",
      "Building Regulations — technical requirements for buildings (sanitary, ventilation, fire)",
      "Regulatory Reform (Fire Safety) Order 2005 — fire safety records",
    ],
    tips: [
      "Upload the certificate immediately after the work is done",
      "Choose the right category so certificates are easy to find again",
      "Include company and date for simple tracing at inspection",
      "Keep all certificates digitally — the HSE, building control or the fire authority may ask to see them",
    ],
  },

  routines: {
    title: "Procedures and arrangements",
    description: "How to create, maintain and review procedures in the HSEQ system.",
    sections: [
      {
        heading: "What are procedures?",
        emoji: "📋",
        content:
          "Procedures describe how the organisation carries out specific tasks to protect health, safety and the environment. HSWA 1974 s.2 requires employers to have a written health and safety policy (where there are five or more employees) covering the statement of intent, organisation and arrangements. Procedures are those arrangements, and they must be known to the people who use them.",
      },
      {
        heading: "How to get started",
        emoji: "🚀",
        items: [
          {
            title: "Create from a template",
            description:
              "Click ‘Create from template’ to choose a ready-made procedure template for your industry. You can adapt the content afterwards.",
          },
          {
            title: "Complete the content",
            description:
              "Each procedure has fixed sections: purpose, scope, responsibility, method, records, incidents and follow-up. Complete what is relevant.",
          },
          {
            title: "Assign an owner",
            description:
              "Choose who in the organisation is responsible for the procedure being followed and kept up to date.",
          },
        ],
      },
      {
        heading: "Review — keep procedures current",
        emoji: "🔄",
        items: [
          {
            title: "Review interval",
            description:
              "Set how often the procedure should be reviewed (for example 12 months). The system notifies you automatically when the date approaches.",
          },
          {
            title: "Carry out a review",
            description:
              "Open the procedure, click ‘Edit’, tick ‘Record completed review’ and choose the date. Status is set to current and the next due date is calculated automatically.",
          },
          {
            title: "Status explained",
            description:
              "Active = the procedure is current. Requires review = the due date has passed and the procedure must be reviewed. Draft = not published yet. Archived = no longer in use.",
          },
        ],
      },
      {
        heading: "Category and organisation",
        emoji: "🏷️",
        content:
          "Choose a category from the list (for example HSEQ management, electrical safety, construction) so procedures are easy to find. If none fits, choose ‘Other’ and write your own.",
      },
      {
        heading: "Uploaded procedures",
        emoji: "📎",
        content:
          "Do you have procedures as PDF or Word files? Upload them under ‘Own procedures and instructions’ so everyone with access can open them directly from the system.",
      },
    ],
    isoStandards: [
      "HSWA 1974 s.2 — written policy: statement, organisation and arrangements",
      "ISO 45001:2018 — clause 8.1: operational planning and control",
      "ISO 9001:2015 — clause 8.1: operational planning and control",
      "MHSWR 1999 — arrangements for effective planning, organisation, control, monitoring and review",
    ],
    tips: [
      "Start with the most important procedures for your industry — the template library suggests relevant templates",
      "Set the review interval to 12 months as standard — adjust if needed",
      "Involve the safety representative and employees when procedures are updated",
      "Use ‘Record completed review’ to show that the procedure has been reviewed",
      "Make sure all employees have read and understood the procedures that apply to them",
    ],
  },
};
