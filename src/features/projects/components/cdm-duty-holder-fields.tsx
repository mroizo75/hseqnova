"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CDM_DUTY_HOLDER_LABELS,
  type CdmDutyHolderInput,
  type CdmDutyHolderRoleKey,
  emptyDutyHolder,
  hasMoreThanOneContractor,
} from "@/features/projects/lib/cdm-duty-holders";

type CdmDutyHolderFieldsProps = {
  holders: CdmDutyHolderInput[];
  disabled?: boolean;
  onChange: (holders: CdmDutyHolderInput[]) => void;
};

function DutyHolderBlock({
  holder,
  index,
  required,
  disabled,
  onChange,
  onRemove,
}: {
  holder: CdmDutyHolderInput;
  index: number;
  required?: boolean;
  disabled?: boolean;
  onChange: (index: number, patch: Partial<CdmDutyHolderInput>) => void;
  onRemove?: () => void;
}) {
  const prefix = `${holder.role}-${index}`;
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {CDM_DUTY_HOLDER_LABELS[holder.role]}
          {required ? " *" : ""}
        </p>
        {onRemove ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={disabled}>
            Remove
          </Button>
        ) : null}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-org`}>Organisation</Label>
          <Input
            id={`${prefix}-org`}
            value={holder.organisationName}
            onChange={(event) => onChange(index, { organisationName: event.target.value })}
            placeholder="e.g. North West Developments Ltd"
            disabled={disabled}
            required={required}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-company`}>Companies House number</Label>
          <Input
            id={`${prefix}-company`}
            value={holder.companyNumber ?? ""}
            onChange={(event) => onChange(index, { companyNumber: event.target.value })}
            placeholder="e.g. 12345678"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-contact`}>Contact name</Label>
          <Input
            id={`${prefix}-contact`}
            value={holder.contactName ?? ""}
            onChange={(event) => onChange(index, { contactName: event.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-email`}>Contact email</Label>
          <Input
            id={`${prefix}-email`}
            type="email"
            value={holder.contactEmail ?? ""}
            onChange={(event) => onChange(index, { contactEmail: event.target.value })}
            disabled={disabled}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={`${prefix}-phone`}>Contact telephone</Label>
          <Input
            id={`${prefix}-phone`}
            value={holder.contactPhone ?? ""}
            onChange={(event) => onChange(index, { contactPhone: event.target.value })}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

export function CdmDutyHolderFields({ holders, disabled, onChange }: CdmDutyHolderFieldsProps) {
  function patch(index: number, next: Partial<CdmDutyHolderInput>) {
    onChange(holders.map((holder, i) => (i === index ? { ...holder, ...next } : holder)));
  }

  function add(role: CdmDutyHolderRoleKey) {
    onChange([...holders, emptyDutyHolder(role)]);
  }

  const extrasStart = 3;
  const pdPcRequired = hasMoreThanOneContractor(holders);

  return (
    <Card>
      <CardHeader>
        <CardTitle>CDM 2015 duty holders</CardTitle>
        <CardDescription>
          Appoint the Client, Principal Designer and Principal Contractor on the project. Principal Designer and Principal Contractor are required where more than one contractor will be working on the site (CDM 2015 reg. 5).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {holders.slice(0, extrasStart).map((holder, index) => (
          <DutyHolderBlock
            key={`${holder.role}-${holder.id ?? index}`}
            holder={holder}
            index={index}
            required={
              holder.role === "CLIENT" ||
              (pdPcRequired &&
                (holder.role === "PRINCIPAL_DESIGNER" || holder.role === "PRINCIPAL_CONTRACTOR"))
            }
            disabled={disabled}
            onChange={patch}
          />
        ))}

        {holders.slice(extrasStart).map((holder, offset) => {
          const index = extrasStart + offset;
          return (
            <DutyHolderBlock
              key={`${holder.role}-${holder.id ?? index}`}
              holder={holder}
              index={index}
              disabled={disabled}
              onChange={patch}
              onRemove={() => onChange(holders.filter((_, i) => i !== index))}
            />
          );
        })}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => add("DESIGNER")} disabled={disabled}>
            Add designer
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => add("CONTRACTOR")} disabled={disabled}>
            Add contractor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
