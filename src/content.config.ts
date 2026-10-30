import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { ALL_STAGES } from './config';

const stageSlugs = ALL_STAGES.map((s) => s.slug) as [string, ...string[]];

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    stage: z.enum(stageSlugs),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // URL of the LinkedIn post for this article, once it exists
    discussion: z.string().url().optional(),
  }),
});

export const collections = { posts };
