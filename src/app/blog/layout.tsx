import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      dir="rtl"
      style={{ fontFamily: "var(--font-din-next), sans-serif" }}
    >
      {/* Shared landing page navbar */}
      <MarketingHeader />

      {/* Blog content — top padding to clear the fixed navbar */}
      <div className="pt-[72px]">
        {children}
      </div>

      {/* Blog shared footer */}
      <footer className="bg-[#071A2E] py-12 mt-8">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <a href="/" className="font-bold text-white text-xl tracking-tight">
            طاولة
          </a>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-white/50">
            <a href="/#journey" className="hover:text-white/80 transition-colors">كيف يعمل</a>
            <a href="/#features" className="hover:text-white/80 transition-colors">المميزات</a>
            <a href="/#pricing" className="hover:text-white/80 transition-colors">الباقات</a>
            <a href="/blog" className="hover:text-white/80 transition-colors">المدونة</a>
          </nav>
          <p className="text-sm text-white/30">© 2026 طاولة. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
