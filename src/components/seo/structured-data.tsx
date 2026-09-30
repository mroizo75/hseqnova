interface StructuredDataProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

// Escaping "<" stops user-authored strings (e.g. article titles) from closing the script tag.
function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(data),
      }}
    />
  );
}

interface MultipleStructuredDataProps {
  dataArray: Array<Record<string, unknown>>;
}

export function MultipleStructuredData({
  dataArray,
}: MultipleStructuredDataProps) {
  return (
    <>
      {dataArray.map((data, index) => (
        <script
          key={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(data),
          }}
        />
      ))}
    </>
  );
}
