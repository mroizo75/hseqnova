export function CdmLegalNote() {
  return (
    <aside className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
      <p className="font-medium">CDM 2015 — Construction (Design and Management)</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        <li>
          Name the client. Where more than one contractor will work on the
          project, appoint a principal designer and a principal contractor
          (reg.5).
        </li>
        <li>
          Prepare a construction phase plan before work starts (reg.12). Notify
          the HSE (F10) only if the project is notifiable (reg.6) — more than 30
          working days and more than 20 workers, or more than 500 person days.
          Display the notice in the site office.
        </li>
        <li>
          The principal designer prepares the health and safety file and passes
          it to the client at the end of the project. Submit F10 on the HSE
          website; this record is not sent automatically.
        </li>
      </ul>
    </aside>
  );
}
