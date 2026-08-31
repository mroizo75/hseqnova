export function SafetyBoardLegalNote() {
  return (
    <aside className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
      <p className="font-medium">Digital safety board — CDM 2015 site information</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        <li>
          There is no statutory digital board. The principal contractor must
          bring site rules to everyone&apos;s attention, give a suitable site
          induction, and — if the project is notifiable — display the F10
          notice in the site office (regs 12, 13 and 6).
        </li>
        <li>
          This board can show the construction phase plan, site rules, named
          roles and the F10 status. It does not submit F10 to the HSE and it
          does not replace the written plan.
        </li>
        <li>
          A daily site register is an operational control, not a CDM duty.
          Construction appointments stay in the CDM module.
        </li>
      </ul>
    </aside>
  );
}
