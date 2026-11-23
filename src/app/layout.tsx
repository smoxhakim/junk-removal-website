import type { Metadata } from 'next';
import './globals.css';

// TODO: swap in real header/footer/sticky-call-bar components (roadmap Phase 1 step 3)
// TODO: wrap with GA4 provider + experiment-assignment provider (Phase 6)

export const metadata: Metadata = {
  title: 'Junk Removal | Greater Boston',
  description: 'Fast, reliable residential & commercial junk removal across Greater Boston.',
  // TODO: add OpenGraph, canonical, and default JSON-LD
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* TODO: <SiteHeader /> */}
        <main>{children}</main>
        {/* TODO: <StickyCallBar /> */}
        {/* TODO: <SiteFooter /> */}
      </body>
    </html>
  );
}
