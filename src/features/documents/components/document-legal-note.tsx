export function DocumentLegalNote() {
  return (
    <aside className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
      <p className="font-medium">Documents — HSWA 1974 s.2(2)(c) and MHSWR 1999 reg.10</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
        <li>
          Give employees comprehensible information on the risks that affect them
          and the measures that protect them.
        </li>
        <li>
          The working copy is the approved version. A draft revision must not
          replace it until it is approved (HSE HSG65 — keep documents current).
        </li>
        <li>
          Withdraw a procedure when it is no longer used, so nobody follows an
          obsolete copy.
        </li>
        <li>
          Keep the record with the employer. Do not send it to the HSE. There is
          no statutory document-control form.
        </li>
      </ul>
    </aside>
  );
}
