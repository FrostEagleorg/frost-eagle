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
