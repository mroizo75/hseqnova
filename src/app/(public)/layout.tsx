import { displayFont, marketingFont } from "@/fonts";
import { PublicNav } from "@/components/public-nav";
import { PublicFooter } from "@/components/public-footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${displayFont.variable} ${marketingFont.variable} font-marketing`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-background focus:px-4 focus:py-2 focus:text-foreground"
      >
        Skip to content
      </a>
      <PublicNav />
      <main id="main-content" className="min-h-[calc(100dvh-4rem)]">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
