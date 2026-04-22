import { SiteShell } from "@/components/site-shell";
import { BlogSidebar } from "@/components/blog-sidebar";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <SiteShell>
      <div className="mx-auto flex w-full max-w-[1100px] gap-8 px-6 py-10 sm:px-8">
        <BlogSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </SiteShell>
  );
}
