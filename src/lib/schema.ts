import { AUTHOR, SITE } from '../config';

export function personSchema() {
  return {
    '@type': 'Person',
    '@id': `${SITE.url}${AUTHOR.profile}#person`,
    name: AUTHOR.name,
    jobTitle: AUTHOR.jobTitle,
    url: `${SITE.url}${AUTHOR.profile}`,
    worksFor: { '@type': 'Organization', '@id': `${SITE.url}/#org`, name: SITE.name },
    image: `${SITE.url}${AUTHOR.photo}`,
    email: `mailto:${AUTHOR.email}`,
    homeLocation: { '@type': 'Place', name: AUTHOR.location },
    knowsAbout: [
      'Microsoft Entra ID Governance',
      'HR-driven provisioning',
      'Identity lifecycle management',
      'Privileged access management',
      'Hybrid identity',
    ],
    ...(AUTHOR.sameAs.length ? { sameAs: AUTHOR.sameAs } : {}),
  };
}

export function orgSchema() {
  return {
    '@type': 'Organization',
    '@id': `${SITE.url}/#org`,
    name: SITE.name,
    url: `${SITE.url}/`,
    logo: `${SITE.url}/favicon.svg`,
    description: SITE.description,
    email: `mailto:${AUTHOR.email}`,
    taxID: `ABN ${AUTHOR.abn}`,
    address: { '@type': 'PostalAddress', addressLocality: 'Sydney', addressRegion: 'NSW', addressCountry: 'AU' },
    areaServed: [
      { '@type': 'Country', name: 'Australia' },
      { '@type': 'Country', name: 'New Zealand' },
    ],
    knowsAbout: [
      'Microsoft Entra ID Governance',
      'HR-driven provisioning',
      'API-driven inbound provisioning',
      'Lifecycle Workflows',
      'Joiner, mover and leaver automation',
      'Identity governance and administration',
      'Hybrid Active Directory',
      'Privileged access management',
    ],
    employee: [{ '@id': `${SITE.url}${AUTHOR.profile}#person` }, { '@type': 'Person', name: 'Lauren Battaglia', jobTitle: 'COO' }],
    ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
  };
}
