interface StructuredDataProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
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
            __html: JSON.stringify(data),
          }}
        />
      ))}
    </>
  );
}
