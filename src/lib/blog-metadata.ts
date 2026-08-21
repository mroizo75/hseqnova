import { Metadata } from 'next';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  publishedAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export function generateBlogPostMetadata(post: BlogPost): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hmsnova.no';
  const url = `${baseUrl}/blogg/${post.slug}`;
  
  // Calculate reading time
  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);
  
  // Calculate content freshness
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(post.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  let freshness = 'older';
  if (daysSinceUpdate < 7) freshness = 'very-fresh';
  else if (daysSinceUpdate < 30) freshness = 'fresh';
  else if (daysSinceUpdate < 90) freshness = 'recent';
  
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt;
  
  return {
    title,
    description,
    keywords: post.keywords || undefined,
    
    authors: post.author.name ? [{ name: post.author.name }] : undefined,
    
    openGraph: {
      title,
      description,
      type: 'article',
      url,
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: post.author.name ? [post.author.name] : undefined,
      images: post.coverImage
        ? [
            {
              url: post.coverImage,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : undefined,
      siteName: 'HMS Nova',
      locale: 'nb_NO',
    },
    
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.coverImage ? [post.coverImage] : undefined,
      creator: '@hmsnova',
    },
    
    // AI-spesifikke metadata
    other: {
      // Article metadata for AI
      'article:published_time': post.publishedAt.toISOString(),
      'article:modified_time': post.updatedAt.toISOString(),
      'article:author': post.author.name || 'HMS Nova',
      'article:section': post.category?.name || 'HMS',
      'article:tag': post.keywords || '',
      
      // Citation metadata (for academic/professional AI)
      'citation_title': post.title,
      'citation_author': post.author.name || 'HMS Nova Team',
      'citation_publication_date': post.publishedAt.toISOString().split('T')[0],
      'citation_journal_title': 'HMS Nova Blogg',
      'citation_online_date': post.publishedAt.toISOString().split('T')[0],
      
      // Content freshness signals for AI
      'last-modified': post.updatedAt.toISOString(),
      'content-freshness': freshness,
      'content-type': 'article',
      'word-count': wordCount.toString(),
      'reading-time': `${readingTime} minutes`,
      
      // Structured data hints
      'schema-type': 'Article',
      'content-language': 'nb',
    },
    
    alternates: {
      canonical: url,
    },
    
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  };
}

export function generateArticleSchema(post: BlogPost) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hmsnova.no';
  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage || `${baseUrl}/opengraph-image`,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Person',
      name: post.author.name || 'HMS Nova Team',
      url: `${baseUrl}/forfatter/${post.author.id}`,
      jobTitle: 'HMS-ekspert',
      worksFor: {
        '@type': 'Organization',
        name: 'HMS Nova',
        url: baseUrl,
      },
    },
    publisher: {
      '@type': 'Organization',
      name: 'HMS Nova',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blogg/${post.slug}`,
    },
    
    // AI-optimalisering
    keywords: post.keywords || undefined,
    articleSection: post.category?.name || 'HMS',
    wordCount,
    timeRequired: `PT${readingTime}M`,
    inLanguage: 'nb',
    
    // Sitérbarhet
    isAccessibleForFree: true,
    isPartOf: {
      '@type': 'Blog',
      name: 'HMS Nova Blogg',
      url: `${baseUrl}/blogg`,
    },
    
    // Kvalitetssignaler for AI
    reviewedBy: {
      '@type': 'Organization',
      name: 'HMS Nova Redaksjon',
    },
  };
}

export function generateBreadcrumbSchema(post: BlogPost) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hmsnova.no';
  
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Hjem',
      item: baseUrl,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blogg',
      item: `${baseUrl}/blogg`,
    },
  ];
  
  if (post.category) {
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: post.category.name,
      item: `${baseUrl}/blogg?category=${post.category.slug}`,
    });
    items.push({
      '@type': 'ListItem',
      position: 4,
      name: post.title,
      item: `${baseUrl}/blogg/${post.slug}`,
    });
  } else {
    items.push({
      '@type': 'ListItem',
      position: 3,
      name: post.title,
      item: `${baseUrl}/blogg/${post.slug}`,
    });
  }
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items,
  };
}

