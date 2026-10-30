import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://frosteagle.com',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  redirects: { '/work-with-me': '/consulting', '/about/david-gbuzue': '/about/dubem-gbuzue' },
  markdown: {
    shikiConfig: { theme: 'github-light', wrap: false },
  },
});
