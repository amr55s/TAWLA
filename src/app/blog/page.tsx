import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { allPosts } from "@/lib/blog/posts";
import { Clock, Calendar, ArrowRight } from "lucide-react";

/**
 * Get all blog posts, sorted by publishedAt descending.
 */
function getAllPosts() {
  return [...allPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export const metadata: Metadata = {
  title: "مدونة طاولة | نصائح إدارة المطاعم والكافيهات",
  description:
    "أحدث المقالات والأدلة العملية لأصحاب المطاعم والكافيهات حول الرقمنة، المنيو الإلكتروني، وزيادة الأرباح.",
  openGraph: {
    title: "مدونة طاولة | نصائح إدارة المطاعم والكافيهات",
    description:
      "أحدث المقالات والأدلة العملية لأصحاب المطاعم والكافيهات حول الرقمنة، المنيو الإلكتروني، وزيادة الأرباح.",
    url: "https://tawla.link/blog",
    siteName: "طاولة",
    type: "website",
  },
  alternates: { canonical: "https://tawla.link/blog" },
};

function formatArabicDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
  const posts = getAllPosts();
  const [featuredPost, ...restPosts] = posts;

  return (
    <main className="min-h-screen bg-[#f1f7fc]">
      {/* ── Hero Header ──────────────────────────────────────── */}
      <section className="py-16 px-6 text-center border-b border-[#D6E4F0] bg-white">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#3282B8] block mb-4">
          المدونة
        </span>
        <h1 className="text-4xl font-bold text-[#0A1628] md:text-5xl tracking-tight">
          نصائح لأصحاب المطاعم
        </h1>
        <p className="mt-4 text-base text-[#3D4F6F] max-w-lg mx-auto leading-relaxed">
          أدلة عملية ومقالات متخصصة لمساعدتك على رقمنة مطعمك وزيادة أرباحك.
        </p>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-14">
        {/* ── Featured Post ─────────────────────────────────── */}
        {featuredPost && (
          <Link href={`/blog/${featuredPost.slug}`} className="group block mb-14">
            <article className="grid grid-cols-1 md:grid-cols-2 rounded-2xl overflow-hidden
              border border-[#D6E4F0] bg-white shadow-[0_2px_16px_rgba(15,76,117,0.06)]
              transition-all hover:shadow-[0_12px_40px_rgba(15,76,117,0.10)] hover:-translate-y-0.5 duration-300">
              <div className="relative aspect-[16/9] md:aspect-auto w-full overflow-hidden bg-[#E8F4FD]">
                <Image
                  src={featuredPost.coverImage}
                  alt={featuredPost.title}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
              <div className="flex flex-col justify-center p-8 md:p-10">
                {featuredPost.category && (
                  <span className="mb-4 inline-block rounded-full bg-[#E8F4FD] border border-[#BBE1FA]
                    px-3 py-1 text-xs font-semibold text-[#0F4C75] w-fit">
                    {featuredPost.category}
                  </span>
                )}
                <h2 className="text-2xl font-bold text-[#0A1628] leading-snug
                  group-hover:text-[#0F4C75] transition-colors md:text-3xl">
                  {featuredPost.title}
                </h2>
                <p className="mt-3 text-[#3D4F6F] text-base leading-relaxed line-clamp-3">
                  {featuredPost.description}
                </p>
                <div className="mt-6 flex items-center gap-4 text-sm text-[#7B8BA3]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {formatArabicDate(featuredPost.publishedAt)}
                  </span>
                  {featuredPost.readingTimeMinutes && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {featuredPost.readingTimeMinutes} دقائق قراءة
                    </span>
                  )}
                </div>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold
                  text-[#0F4C75] group-hover:gap-3 transition-all">
                  <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
                  اقرأ المقال
                </span>
              </div>
            </article>
          </Link>
        )}

        {/* ── Rest of Posts Grid ────────────────────────────── */}
        {restPosts.length > 0 && (
          <>
            <h2 className="mb-8 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#7B8BA3]">
              مقالات أخرى
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {restPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                  <article className="h-full rounded-2xl overflow-hidden border border-[#D6E4F0] bg-white
                    shadow-[0_2px_8px_rgba(15,76,117,0.04)]
                    transition-all hover:shadow-[0_12px_32px_rgba(15,76,117,0.10)]
                    hover:-translate-y-1 duration-300">
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#E8F4FD]">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <div className="p-6">
                      {post.category && (
                        <span className="mb-3 inline-block rounded-full bg-[#E8F4FD] border border-[#BBE1FA]
                          px-3 py-1 text-xs font-semibold text-[#0F4C75]">
                          {post.category}
                        </span>
                      )}
                      <h3 className="text-base font-bold text-[#0A1628] leading-snug
                        group-hover:text-[#0F4C75] transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="mt-2 text-sm text-[#3D4F6F] leading-relaxed line-clamp-2">
                        {post.description}
                      </p>
                      <div className="mt-4 flex items-center gap-3 text-xs text-[#7B8BA3]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatArabicDate(post.publishedAt)}
                        </span>
                        {post.readingTimeMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {post.readingTimeMinutes} دقائق
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
