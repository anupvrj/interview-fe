import type {
  PublicBlogDetail,
  PublicBlogListResponse,
} from "@/lib/api";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";

const BLOG_CACHE_SECONDS =
  process.env.NODE_ENV === "development" ? 0 : 3600;

async function fetchJson<T>(
  path: string,
  revalidate = BLOG_CACHE_SECONDS,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { tags: ["blogs"], revalidate },
  });
  if (!res.ok) {
    throw new Error(`Blog API error: ${res.status}`);
  }
  const json = (await res.json()) as { success: boolean; data: T };
  return json.data;
}

export async function fetchPublishedBlogs(params?: {
  page?: number;
  limit?: number;
  category?: string;
}): Promise<PublicBlogListResponse> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.category) search.set("category", params.category);
  const qs = search.toString();
  try {
    return await fetchJson<PublicBlogListResponse>(`/blogs${qs ? `?${qs}` : ""}`);
  } catch {
    // a slow or restarting API shows the empty state instead of a 500 page
    return { items: [], total: 0, page: params?.page ?? 1, limit: params?.limit ?? 0 };
  }
}

export async function fetchBlogBySlug(
  slug: string,
): Promise<PublicBlogDetail | null> {
  try {
    return await fetchJson<PublicBlogDetail>(`/blogs/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

export async function fetchBlogCategories(): Promise<string[]> {
  try {
    const data = await fetchJson<{ categories: string[] }>("/blogs/categories");
    return data.categories ?? [];
  } catch {
    return [];
  }
}

export async function fetchBlogSitemapEntries(): Promise<
  Array<{ slug: string; updatedAt: string }>
> {
  const data = await fetchJson<{
    items: Array<{ slug: string; updatedAt: string; publishedAt: string }>;
  }>("/blogs/sitemap", 600);
  return data.items ?? [];
}
