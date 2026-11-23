// Static "service areas" page (Phase 1) — single page listing all towns.
// Dynamic per-town pages arrive in Phase 2 (src/app/service-areas/[slug]/page.tsx).

export const metadata = {
  title: 'Service Areas | Junk Removal',
  description: 'Towns we serve across Greater Boston, Massachusetts.',
};

export default async function ServiceAreasPage() {
  // TODO: const areas = await prisma.serviceArea.findMany({ where: { isActive: true } });
  const areas: { id: string; name: string; slug: string }[] = [];

  return (
    <section>
      <h1>Areas We Serve</h1>
      {/* TODO: render list/grid of town names (no individual links yet — Phase 2) */}
      <ul>
        {areas.map((a) => (
          <li key={a.id}>{a.name}</li>
        ))}
      </ul>
    </section>
  );
}
