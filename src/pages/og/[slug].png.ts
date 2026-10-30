import type { APIRoute } from 'astro';
import { getPosts } from '../../lib/posts';
import { renderCard } from '../../lib/og';
import { stageBySlug, SITE } from '../../config';

export async function getStaticPaths() {
  const posts = await getPosts();
  return [
    ...posts.map((post) => ({
      params: { slug: post.id },
      props: { title: post.data.title, kicker: stageBySlug(post.data.stage)?.name ?? 'Article', stage: post.data.stage },
    })),
    { params: { slug: 'site' }, props: { title: 'From the HR record to the right access.', kicker: 'Microsoft Entra ID Governance and HR-driven provisioning' } },
    { params: { slug: 'consulting' }, props: { title: 'Automated onboarding, role changes and offboarding, driven by your HR or payroll data.', kicker: 'Consulting for small and medium businesses' } },
  ];
}

export const GET: APIRoute = async ({ props }) => {
  const { title, kicker, stage } = props as { title: string; kicker: string; stage?: string };
  const png = await renderCard(title, kicker, stage);
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
