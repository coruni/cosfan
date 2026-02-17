type WebSiteJsonLdProps = {
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    target: string | string[];
    queryInput?: string;
  };
};

export function WebSiteJsonLd({
  name,
  url,
  description,
  potentialAction,
}: WebSiteJsonLdProps) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    ...(description && { description }),
  };

  if (potentialAction) {
    jsonLd.potentialAction = {
      '@type': 'SearchAction',
      target: potentialAction.target,
      ...(potentialAction.queryInput && {
        'query-input': potentialAction.queryInput,
      }),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
