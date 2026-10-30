# Frost Eagle

Identity engineering notes by David Gbuzue. A static Astro site, hosted free on GitHub Pages at frosteagle.com.

## Write an article

1. Add a Markdown file to `src/content/posts/`. The file name becomes the URL: `my-post.md` → `/articles/my-post/`.
2. Start it with this front matter:

   ```yaml
   ---
   title: 'Your title'
   description: 'One or two sentences. Shown under the title, in lists and in search results.'
   pubDate: 2026-11-14
   stage: lifecycle   # hr-source | directory-sync | lifecycle | first-sign-in | access | downstream | delivery
   tags: ['Lifecycle Workflows']
   draft: false       # true keeps it off the live site
   discussion: https://www.linkedin.com/feed/update/...   # optional: the LinkedIn post for this article
   ---
   ```

3. Push to `main`. The site rebuilds and deploys in about a minute.

After you share an article on LinkedIn, add that post's URL as `discussion` in the article's front matter, so the article links to the conversation. Until then, the article links to your LinkedIn profile.

To preview locally: `npm install`, then `npm run dev`, then open http://localhost:4321.

## One-time setup

### 1. Put the code on GitHub

Create an empty public repository (for example `frost-eagle`), then from this folder:

```bash
git remote add origin https://github.com/<your-username>/frost-eagle.git
git push -u origin main
```

### 2. Turn on GitHub Pages

In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**. The workflow in `.github/workflows/deploy.yml` builds and deploys on every push to `main`.

### 3. Point frosteagle.com at GitHub

At the DNS provider for **frosteagle.com**, add these records:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |
| CNAME | www | `<your-username>.github.io` |

Then in **Settings → Pages**, enter `frosteagle.com` as the custom domain. Tick **Enforce HTTPS** once the certificate is issued, which can take up to an hour. Check these values against GitHub's [custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) before you add them.

Also verify the domain under your GitHub account (**Settings → Pages → Verified domains**). That stops anyone else claiming it for their own Pages site.

### 4. Redirect frosteagle.com.au

A GitHub Pages site can only have one custom domain. Keep `.com` as the main address and set up a **301 permanent redirect** from `frosteagle.com.au` to `https://frosteagle.com`. Use your registrar's domain forwarding, or a Cloudflare redirect rule. Search engines then see a single site, with no duplicate content.

### 5. Connect your profiles

In `src/config.ts`, add your LinkedIn and GitHub URLs to `AUTHOR.sameAs`. They appear as links in the footer and on the About page. They also tell search engines that those profiles and this site are the same person. Then add the blog to your LinkedIn **Featured** section, so the link runs both ways.

### 6. Tell Google about it

Add `frosteagle.com` in [Google Search Console](https://search.google.com/search-console), verify it with a DNS TXT record, and submit `https://frosteagle.com/sitemap-index.xml`.

## What's where

- `src/config.ts`: site name, tagline, author details, and the pipeline stages articles are filed under
- `src/content/posts/`: the articles
- `src/pages/about.astro`: the About page, the page most likely to rank for your name
- `src/components/Trace.astro`: the pipeline map on the home page and articles
- `src/styles/global.css`: colours and type
