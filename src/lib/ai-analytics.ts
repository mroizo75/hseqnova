// AI Referral Detection and Tracking

export type AISource =
  | 'chatgpt'
  | 'perplexity'
  | 'claude'
  | 'gemini'
  | 'copilot'
  | 'you'
  | 'phind'
  | 'other';

export interface AIReferral {
  source: AISource;
  timestamp: number;
  page: string;
  query?: string;
}

// Detect if visitor came from an AI tool
export function detectAIReferral(): AISource | null {
  if (typeof window === 'undefined') return null;

  const referrer = document.referrer.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);

  // Check URL parameter first (for tracking links)
  const aiSource = searchParams.get('ai_source');
  if (aiSource) {
    return aiSource as AISource;
  }

  // Check referrer domain
  if (referrer.includes('chat.openai.com')) return 'chatgpt';
  if (referrer.includes('chatgpt.com')) return 'chatgpt';
  if (referrer.includes('perplexity.ai')) return 'perplexity';
  if (referrer.includes('claude.ai')) return 'claude';
  if (referrer.includes('gemini.google.com')) return 'gemini';
  if (referrer.includes('bard.google.com')) return 'gemini';
  if (referrer.includes('copilot.microsoft.com')) return 'copilot';
  if (referrer.includes('bing.com/chat')) return 'copilot';
  if (referrer.includes('you.com')) return 'you';
  if (referrer.includes('phind.com')) return 'phind';

  // Check for AI-like query patterns in referrer
  if (referrer && isLikelyAIReferrer(referrer)) {
    return 'other';
  }

  return null;
}

// Check if referrer looks like an AI tool
function isLikelyAIReferrer(referrer: string): boolean {
  const aiKeywords = [
    'ai',
    'assistant',
    'chat',
    'bot',
    'gpt',
    'llm',
    'search-ai',
  ];

  return aiKeywords.some((keyword) => referrer.includes(keyword));
}

// Track AI referral in Google Analytics
export function trackAIReferral(source: AISource, page?: string) {
  if (typeof window === 'undefined') return;

  // Google Analytics 4
  if (window.gtag) {
    window.gtag('event', 'ai_referral', {
      source,
      page: page || window.location.pathname,
      timestamp: Date.now(),
    });
  }

  // Store in localStorage for session tracking
  try {
    const referrals = getStoredAIReferrals();
    referrals.push({
      source,
      timestamp: Date.now(),
      page: page || window.location.pathname,
    });

    // Keep only last 10 referrals
    if (referrals.length > 10) {
      referrals.shift();
    }

    localStorage.setItem('ai_referrals', JSON.stringify(referrals));
  } catch (error) {
    console.error('Failed to store AI referral:', error);
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`🤖 AI Referral detected: ${source}`);
  }
}

// Get stored AI referrals from localStorage
export function getStoredAIReferrals(): AIReferral[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem('ai_referrals');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Check if user came from AI in current session
export function isAISession(): boolean {
  const referrals = getStoredAIReferrals();
  if (referrals.length === 0) return false;

  // Check if any referral in last 30 minutes
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
  return referrals.some((ref) => ref.timestamp > thirtyMinutesAgo);
}

// Get AI source for current session
export function getSessionAISource(): AISource | null {
  const referrals = getStoredAIReferrals();
  if (referrals.length === 0) return null;

  // Return most recent referral
  const sorted = referrals.sort((a, b) => b.timestamp - a.timestamp);
  return sorted[0].source;
}

// Track page view from AI
export function trackAIPageView(page?: string) {
  const aiSource = getSessionAISource();
  if (!aiSource) return;

  if (window.gtag) {
    window.gtag('event', 'ai_page_view', {
      source: aiSource,
      page: page || window.location.pathname,
    });
  }
}

// Track conversion from AI
export function trackAIConversion(
  conversionType: string,
  value?: number,
  metadata?: Record<string, any>
) {
  const aiSource = getSessionAISource();
  if (!aiSource) return;

  if (window.gtag) {
    window.gtag('event', 'ai_conversion', {
      source: aiSource,
      conversion_type: conversionType,
      value,
      ...metadata,
    });
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎯 AI Conversion: ${conversionType} from ${aiSource}`);
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      eventParams?: Record<string, any>
    ) => void;
  }
}

