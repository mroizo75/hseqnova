import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SeoSetupGuideProps = {
  property: string;
  sitemapUrl: string;
};

export function SeoSetupGuide({ property, sitemapUrl }: SeoSetupGuideProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Google Search Console</CardTitle>
        <CardDescription>
          Search data appears here once a Google service account has access to the {property} property.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal space-y-3 pl-5 text-sm">
          <li>
            Verify the domain in Search Console as a <strong>Domain property</strong> using the DNS TXT record Google
            gives you. The property is addressed as <code className="rounded bg-muted px-1">{property}</code>.
          </li>
          <li>
            In Google Cloud Console, enable the <strong>Google Search Console API</strong>, create a service account and
            download a JSON key.
          </li>
          <li>
            In Search Console → Settings → Users and permissions, add the service account email as an{" "}
            <strong>Owner</strong> (required for sitemap submission).
          </li>
          <li>
            Set <code className="rounded bg-muted px-1">GOOGLE_SERVICE_ACCOUNT_EMAIL</code> and{" "}
            <code className="rounded bg-muted px-1">GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code> (the{" "}
            <code className="rounded bg-muted px-1">client_email</code> and{" "}
            <code className="rounded bg-muted px-1">private_key</code> from the JSON key) and redeploy.
          </li>
          <li>
            Use <strong>Submit sitemap</strong> once. After that, the sitemap ({sitemapUrl}) is resubmitted every time
            an article is published, updated, archived or deleted.
          </li>
        </ol>
      </CardContent>
    </Card>
  );
}
