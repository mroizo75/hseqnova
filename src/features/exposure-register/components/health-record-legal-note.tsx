export function HealthRecordLegalNote() {
  return (
    <aside className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
      <p className="font-medium">COSHH 2002 reg.11 — health records</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        <li>
          Keep a health record for each employee under health surveillance:
          name, home address, National Insurance number, the substance or
          process, how often, protective measures, and a fitness-for-work
          statement.
        </li>
        <li>
          Do not store clinical test results here. Those stay with occupational
          health as a medical record.
        </li>
        <li>
          Keep the record for at least 40 years from the last entry. Employees
          can read their own record. If the organisation ceases to trade,
          notify the HSE and make the records available. Do not send them to
          the HSE in the ordinary course.
        </li>
      </ul>
    </aside>
  );
}
