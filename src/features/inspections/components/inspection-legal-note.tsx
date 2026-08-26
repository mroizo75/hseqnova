export function InspectionLegalNote() {
  return (
    <aside className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
      <p className="font-medium">What to record — not what to send to the HSE</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        <li>
          Workplace inspections are monitoring records under MHSWR 1999 reg.5. Keep them
          here. Do not submit them to the HSE.
        </li>
        <li>
          Union safety representatives may inspect every three months (SRSCWR 1977
          reg.5). Record date, time, area and who took part — HSE form F2534. Give a
          copy to the employer.
        </li>
        <li>
          Unsafe or unhealthy conditions go on the finding (HSE F2533): what was found,
          who will act, and by when.
        </li>
        <li>
          Construction sites: CDM 2015 requires the principal contractor to monitor the
          construction phase. Scaffold, excavation and work-at-height checks have their
          own statutory reports — use Statutory / other and keep the report on file.
        </li>
      </ul>
    </aside>
  );
}
