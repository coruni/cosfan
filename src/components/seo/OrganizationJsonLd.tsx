type OrganizationJsonLdProps = {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
};

export function OrganizationJsonLd({
  name,
  url,
  logo,
  description,
  sameAs = [],
}: OrganizationJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    ...(logo && { logo }),
    ...(description && { description }),
    ...(sameAs.length > 0 && { sameAs }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
