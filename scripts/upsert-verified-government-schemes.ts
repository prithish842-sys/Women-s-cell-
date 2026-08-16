import { prisma } from '../server/config/prisma.js';
import { verifiedGovernmentSchemes } from '../server/data/verifiedGovernmentSchemes.js';

const admin = await prisma.user.findFirst({
  where: { role: { in: ['ADMIN', 'ICC_ADMIN'] }, isActive: true },
  orderBy: { createdAt: 'asc' },
});

if (!admin) {
  throw new Error('No active admin user found to own verified scheme records.');
}

const verifiedSlugs = verifiedGovernmentSchemes.map(scheme => scheme.slug);

await prisma.governmentScheme.updateMany({
  where: { slug: { notIn: verifiedSlugs } },
  data: { status: 'EXPIRED', isFeatured: false },
});

const report = [];

for (const scheme of verifiedGovernmentSchemes) {
  const payload = {
    ...scheme,
    requiredDocuments: JSON.stringify(scheme.requiredDocuments),
    startDate: new Date('2026-08-09T00:00:00.000Z'),
    endDate: null,
  };

  const row = await prisma.governmentScheme.upsert({
    where: { slug: scheme.slug },
    update: {
      ...payload,
      createdBy: { connect: { id: admin.id } },
    },
    create: {
      ...payload,
      createdBy: { connect: { id: admin.id } },
    },
  });

  report.push({ title: row.title, slug: row.slug, status: row.status, source: row.officialUrl });
}

console.log(JSON.stringify({ verifiedCount: report.length, report }, null, 2));

await prisma.$disconnect();
