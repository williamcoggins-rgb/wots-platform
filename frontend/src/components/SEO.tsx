import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'War of the Sphinx';
const DOMAIN = 'https://warofthesphinx.com';
const DEFAULT_OG_IMAGE =
  'https://res.cloudinary.com/dcpeomifz/image/upload/c_fill,w_1200,h_630,q_auto,f_jpg/v1775489586/image2_gpapbe.jpg';

interface SEOProps {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage?: string;
  noindex?: boolean;
}

export function SEO({ title, description, canonicalPath, ogImage, noindex }: SEOProps) {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const canonicalUrl = `${DOMAIN}${canonicalPath}`;
  const image = ogImage || DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}
