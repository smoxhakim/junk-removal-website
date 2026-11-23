import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface Props {
  // Next.js 15+: route params are async.
  params: Promise<{ slug: string }>;
}

// TODO: generateStaticParams() from prisma.service.findMany({ where: { isActive: true } })
// TODO: generateMetadata() for per-page title/description from Service.metaTitle/metaDescription

export default async function ServicePage({ params }: Props) {
  // TODO: const { slug } = await params;
  // TODO: const service = await prisma.service.findUnique({ where: { slug } });
  void params;
  const service = null as Awaited<ReturnType<typeof prisma.service.findUnique>> | null;

  if (!service) {
    notFound();
  }

  return (
    <article>
      {/* TODO: hero image, name, shortDescription */}
      {/* TODO: render longDescription (markdown) */}
      {/* TODO: render processSteps */}
      {/* TODO: render pricingGuidance */}
      {/* TODO: CTA -> quote form with serviceId preselected */}
      {/* TODO (Phase 3): FAQ section + FAQPage schema */}
    </article>
  );
}
