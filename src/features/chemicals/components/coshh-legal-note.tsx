export function CoshhLegalNote() {
  return (
    <aside className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
      <p className="font-medium">COSHH 2002 — Control of Substances Hazardous to Health</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        <li>
          Assess the work that may expose people to a hazardous substance, then
          prevent or adequately control that exposure (regs 6 and 7). A safety
          data sheet is not a COSHH assessment.
        </li>
        <li>
          Record the significant findings and the controls. Employees must be
          able to read them, and to get the safety data sheet (reg.12).
        </li>
        <li>
          Review when the assessment is no longer valid or the work changes.
          Health surveillance records (40 years) sit in the exposure register —
          not on this page.
        </li>
        <li>Keep the record with the employer. Do not send it to the HSE.</li>
      </ul>
    </aside>
  );
}
