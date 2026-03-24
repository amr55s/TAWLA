import { allPosts } from "./blog/posts";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string; // HTML string
  publishedAt: string; // ISO date string
  author: string;
  coverImage: string;
  category?: string;
  readingTimeMinutes?: number;
}

export const blogPosts: BlogPost[] = allPosts;


/**
 * Get all blog posts, sorted by publishedAt descending.
 */
export function getAllPosts(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

/**
 * Get a single post by slug. Returns undefined if not found.
 */
export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

