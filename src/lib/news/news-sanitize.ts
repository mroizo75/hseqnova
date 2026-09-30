import DOMPurify from "isomorphic-dompurify";

const ARTICLE_ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "del", "mark", "sup", "sub",
  "a", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "code", "pre", "hr",
  "img", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td",
  "caption", "span",
];

const ARTICLE_ALLOWED_ATTR = [
  "href", "src", "alt", "title", "width", "height", "target", "rel",
  "colspan", "rowspan", "scope", "style",
];

// https links, site-relative paths (/api/files/...), mailto/tel and in-page anchors only.
const ARTICLE_URI_REGEXP = /^(?:https:|mailto:|tel:|\/(?!\/)|#)/i;

export function sanitizeArticleHtml(html: string): string {
  // The page already renders the article title as the only <h1>.
  const demoted = html.replace(/<(\/?)h1(\s|>)/gi, "<$1h2$2");
  return DOMPurify.sanitize(demoted, {
    ALLOWED_TAGS: ARTICLE_ALLOWED_TAGS,
    ALLOWED_ATTR: ARTICLE_ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: ARTICLE_URI_REGEXP,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    KEEP_CONTENT: true,
  });
}
