type ArticleJsonLdProps = {
  title: string;
  description: string;
  url: string;
  images?: string[];
  datePublished?: string;
  dateModified?: string;
  author?: {
    name: string;
    url?: string;
  };
  publisher?: {
    name: string;
    logo?: string;
  };
};

export function ArticleJsonLd({
  title,
  description,
  url,
  images = [],
  datePublished,
  dateModified,
  author,
  publisher,
}: ArticleJsonLdProps) {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    ...(images.length > 0 && {
      image: images.length === 1 ? images[0] : images,
    }),
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
  };

  if (author) {
    jsonLd.author = {
      '@type': 'Person',
      name: author.name,
      ...(author.url && { url: author.url }),
    };
  }

  if (publisher) {
    jsonLd.publisher = {
      '@type': 'Organization',
      name: publisher.name,
      ...(publisher.logo && {
        logo: {
          '@type': 'ImageObject',
          url: publisher.logo,
        },
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
