import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/server-authorization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { previewRecordShare } from "@/server/actions/record-share.actions";
import { ImportSharedRecordButton } from "@/features/sharing/components/import-shared-record-button";

export default async function SharedRecordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const auth = await getAuthContext();
  if (!auth) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/dashboard/share/${token}`)}`);
  }

  const preview = await previewRecordShare(token);
  if (!preview.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Share link</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{"error" in preview ? preview.error : "This share link could not be read."}</p>
        </CardContent>
      </Card>
    );
  }

  const { data } = preview;
  const expires = new Date(data.expiresAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Import {data.kindLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-lg font-medium">{data.title}</p>
          <p className="text-sm text-muted-foreground">
            Shared by {data.sourceOrganisation}. The link expires on {expires}.
          </p>
        </div>
        {data.kind === "RISK_ASSESSMENT" ? (
          <p className="text-sm">
            {data.itemCount} risk {data.itemCount === 1 ? "item" : "items"} will be copied into this
            organisation. You become the owner of the imported items. Review them under MHSWR 1999
            before you rely on them.
          </p>
        ) : null}
        {data.kind === "DOCUMENT" ? (
          <p className="text-sm">
            The file is copied as a draft. Approve it before employees use it as the working copy.
          </p>
        ) : null}
        {data.personalData ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            This incident may include personal data. Import it only into the employer&apos;s
            organisation. Accident book entries are kept for at least three years.
          </p>
        ) : null}
        {data.blockedReason ? <p className="text-sm text-destructive">{data.blockedReason}</p> : null}
        <ImportSharedRecordButton token={token} disabled={!data.canImport} />
      </CardContent>
    </Card>
  );
}
