import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { allPosts } from "@/lib/blog/posts";
import { Calendar, Clock, ArrowRight, Zap } from "lucide-react";

/**
 * Get a single post by slug. Returns undefined if not found.
 */
function getPostBySlug(slug: string) {
  return allPosts.find((p) => p.slug === slug);
}

// ─── Static params for SSG ────────────────────────────────────────────────────
export function generateStaticParams() {
  return allPosts.map((post) => ({ slug: post.slug }));
}

// ─── Dynamic SEO Metadata ─────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: "مقال غير موجود | طاولة", description: "هذا المقال غير متاح." };
  }

  return {
    title: `${post.title} | مدونة طاولة`,
    description: post.description,
    authors: [{ name: post.author }],
    alternates: { canonical: `https://tawla.link/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://tawla.link/blog/${post.slug}`,
      siteName: "طاولة",
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
      images: post.coverImage
        ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

function formatArabicDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main
      className="min-h-screen bg-white"
      dir="rtl"
      style={{ fontFamily: "var(--font-din-next), sans-serif" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": post.description,
            "image": post.coverImage ? [post.coverImage] : [],
            "datePublished": post.publishedAt,
            "author": {
              "@type": "Person",
              "name": post.author
            },
            "publisher": {
              "@type": "Organization",
              "name": "Tawla",
              "logo": {
                "@type": "ImageObject",
                "url": "https://tawla.link/logo.svg"
              }
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://tawla.link/blog/${post.slug}`
            }
          })
        }}
      />
      {/* ── Breadcrumb bar ─────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E8ECF1]">
        <div className="mx-auto max-w-3xl px-6 h-11 flex items-center gap-2 text-sm text-[#7B8BA3]">
          <Link href="/" className="hover:text-[#0F4C75] transition-colors">طاولة</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[#0F4C75] transition-colors">المدونة</Link>
          <span>/</span>
          <span className="text-[#3D4F6F] line-clamp-1 max-w-[200px]">{post.title}</span>
        </div>
      </div>

      {/* ── Article ───────────────────────────────────────── */}
      <article className="mx-auto max-w-3xl px-6 py-12">
        {/* Category */}
        {post.category && (
          <span className="mb-5 inline-block rounded-full bg-[#E8F4FD] border border-[#BBE1FA]
            px-3 py-1 text-xs font-semibold text-[#0F4C75]">
            {post.category}
          </span>
        )}

        {/* Title */}
        <h1 className="text-3xl font-bold leading-snug text-[#0A1628] md:text-4xl tracking-tight">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-[#7B8BA3]">
          <span className="font-medium text-[#3D4F6F]">{post.author}</span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {formatArabicDate(post.publishedAt)}
          </span>
          {post.readingTimeMinutes && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {post.readingTimeMinutes} دقائق قراءة
            </span>
          )}
        </div>

        {/* Cover */}
        {post.coverImage && (
          <div className="mt-8 relative aspect-[16/9] w-full overflow-hidden rounded-2xl
            border border-[#D6E4F0] shadow-[0_4px_24px_rgba(15,76,117,0.08)] bg-[#E8F4FD]">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              unoptimized
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        )}

        {/* Description lead */}
        <p className="mt-8 text-base font-medium text-[#3D4F6F] leading-loose
          border-r-4 border-[#3282B8] pr-4 bg-[#E8F4FD] rounded-e-xl py-3 pe-4 ps-3">
          {post.description}
        </p>

        {/* Content */}
        <div 
          className="mt-8 prose prose-slate prose-lg max-w-none 
            prose-headings:text-[#0A1628] prose-p:text-[#3D4F6F] 
            prose-a:text-[#0F4C75] prose-strong:text-[#0A1628]
            prose-img:rounded-2xl prose-blockquote:border-[#3282B8]
            bg-transparent" 
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />

        {/* ── CTA Box ───────────────────────────────────────── */}
        <div className="mt-16 rounded-2xl bg-[#0F4C75] p-8 text-center
          shadow-[0_8px_40px_rgba(15,76,117,0.25)] md:p-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full
            bg-white/10 border border-white/20 mb-5">
            <Zap className="w-6 h-6 text-[#BBE1FA]" />
          </div>
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            جاهز تحوّل مطعمك للرقمي؟
          </h2>
          <p className="mt-3 text-white/70 text-base leading-relaxed max-w-lg mx-auto">
            ابدأ تجربتك المجانية مع طاولة اليوم — لا بطاقة ائتمانية، لا تعقيدات.
            منيو إلكتروني + إدارة طلبات + تقارير فورية في مكان واحد.
          </p>

          <Link
            href="/register"
            className="mt-7 inline-flex items-center gap-2 rounded-full
              bg-white text-[#0F4C75] px-8 py-3.5 text-base font-bold
              hover:bg-[#E8F4FD] hover:gap-3 hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)]
              transition-all duration-300"
          >
            ابدأ مجاناً الآن
            <ArrowRight className="w-5 h-5 rtl:-scale-x-100" />
          </Link>
          <p className="mt-4 text-xs text-white/40">
            انضم لأكثر من ٥٠٠ مطعم وكافيه يستخدمون طاولة
          </p>
        </div>

        {/* ── Back ─────────────────────────────────────────── */}
        <div className="mt-12 border-t border-[#E8ECF1] pt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium
              text-[#7B8BA3] hover:text-[#0F4C75] transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180 rtl:rotate-0" />
            العودة للمدونة
          </Link>
        </div>
      </article>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-[#D6E4F0] bg-white mt-8 py-10 px-6">
        <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#7B8BA3]">
          <Link href="/" className="font-bold text-[#0F4C75]">طاولة</Link>
          <p className="text-xs">© 2026 طاولة. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </main>

  );
}
