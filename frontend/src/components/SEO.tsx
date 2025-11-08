import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { SITE_URL, IS_PRODUCTION } from '@/lib/config';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

const SEO = ({
  title = 'NEXORA - AI-Powered Startup Assistant',
  description = 'Transform your startup ideas into reality with AI-powered validation, market research, business planning, and MVP development.',
  keywords = 'AI startup builder, MVP development, business plan generator, market research AI, startup validation',
  image = '/og-image-update.png',
  url,
  type = 'website',
  author = 'NEXORA Team',
  publishedTime,
  modifiedTime,
}: SEOProps) => {
  const location = useLocation();
  
  // Use provided URL or construct from current location
  const baseUrl = IS_PRODUCTION ? 'https://nexora.ai' : SITE_URL;
  const currentPath = url || location.pathname;
  
  const fullTitle = title.includes('NEXORA') ? title : `${title} | NEXORA`;
  const fullUrl = currentPath.startsWith('http') ? currentPath : `${baseUrl}${currentPath}`;
  const fullImage = image.startsWith('http') ? image : `${baseUrl}${image}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="NEXORA" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:creator" content="@nexora" />
    </Helmet>
  );
};

export default SEO;
