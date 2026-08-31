"use client";

import {
  GROUPS_NONE_IDENTIFIED,
  RISK_ESPECIALLY_AT_RISK_KEYS,
  RISK_WHO_KEYS,
  RISK_WHO_META,
  type RiskWhoKey,
} from "@/lib/risk-mhswr";

type Variant = "who" | "especially";

interface GroupsAtRiskFieldsProps {
  value: string[];
  onChange: (keys: string[]) => void;
  variant?: Variant;
  disabled?: boolean;
  idPrefix?: string;
}

export function GroupsAtRiskFields({
  value,
  onChange,
  variant = "who",
  disabled,
  idPrefix = "groups",
}: GroupsAtRiskFieldsProps) {
  const keys: readonly string[] =
    variant === "especially" ? RISK_ESPECIALLY_AT_RISK_KEYS : RISK_WHO_KEYS;
  const noneSelected = value.includes(GROUPS_NONE_IDENTIFIED);

  function toggle(key: string) {
    if (disabled) return;
    if (key === GROUPS_NONE_IDENTIFIED) {
      onChange(noneSelected ? [] : [GROUPS_NONE_IDENTIFIED]);
      return;
    }
    const withoutNone = value.filter((item) => item !== GROUPS_NONE_IDENTIFIED);
    if (withoutNone.includes(key)) {
      onChange(withoutNone.filter((item) => item !== key));
    } else {
      onChange([...withoutNone, key]);
    }
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">
        {variant === "especially"
          ? "Groups especially at risk"
          : "Who might be harmed"}
      </legend>
      <p className="text-xs text-muted-foreground">
        {variant === "especially"
          ? "MHSWR 1999 reg.3(6)(b): record any group of employees identified as especially at risk. Tick none identified if that is the finding."
          : "HSE: employees, contractors, visitors or the public — and workers with particular requirements."}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {keys.map((key) => {
          const meta = RISK_WHO_META[key as RiskWhoKey];
          const id = `${idPrefix}-${key}`;
          return (
            <label key={key} htmlFor={id} className="flex items-start gap-2 text-sm">
              <input
                id={id}
                type="checkbox"
                className="mt-1"
                checked={!noneSelected && value.includes(key)}
                disabled={disabled}
                onChange={() => toggle(key)}
              />
              <span>
                {meta.label}
                <span className="block text-xs text-muted-foreground">{meta.legalRef}</span>
              </span>
            </label>
          );
        })}
        {variant === "especially" ? (
          <label htmlFor={`${idPrefix}-none`} className="flex items-start gap-2 text-sm">
            <input
              id={`${idPrefix}-none`}
              type="checkbox"
              className="mt-1"
              checked={noneSelected}
              disabled={disabled}
              onChange={() => toggle(GROUPS_NONE_IDENTIFIED)}
            />
            <span>
              None identified
              <span className="block text-xs text-muted-foreground">MHSWR 1999 reg.3(6)(b)</span>
            </span>
          </label>
        ) : null}
      </div>
    </fieldset>
  );
}
