/**
 * SEO utility functions
 */

/**
 * Truncate text to a maximum length for meta descriptions
 * Recommended length: 150-160 characters for optimal SEO
 */
export function truncateDescription(text: string, maxLength = 155): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  // Find the last space before maxLength to avoid cutting words
  const truncated = text.slice(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Generate optimized alt text for images
 */
export function generateImageAlt(
  title: string,
  context?: string,
  suffix = '高清图集'
): string {
  const parts = [title];
  if (context) parts.push(context);
  parts.push(suffix);
  return parts.join(' - ');
}

/**
 * Validate and format canonical URL
 */
export function formatCanonicalUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
