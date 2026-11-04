// Tells Bing and other IndexNow search engines about every page in the live sitemap.
// Runs after each deploy (see .github/workflows/deploy.yml). The key file lives in public/.
const HOST = 'frosteagle.com';
const KEY = 'bbe956c172d24b34e16609cb1a256ff5';
const SITE = `https://${HOST}`;

const index = await (await fetch(`${SITE}/sitemap-index.xml`)).text();
const sitemaps = [...index.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
const urls = [];
for (const s of sitemaps) {
  const xml = await (await fetch(s)).text();
  urls.push(...[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]));
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow: submitted ${urls.length} URLs, response ${res.status}`);
if (res.status >= 400) process.exit(1);
