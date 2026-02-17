type PersonJsonLdProps = {
  name: string;
  url: string;
  image?: string;
  description?: string;
  sameAs?: string[];
  jobTitle?: string;
};

export function PersonJsonLd({
  name,
  url,
  image,
  description,
  sameAs = [],
  jobTitle,
}: PersonJsonLdProps) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url,
    ...(image && { image }),
    ...(description && { description }),
    ...(sameAs.length > 0 && { sameAs }),
    ...(jobTitle && { jobTitle }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
