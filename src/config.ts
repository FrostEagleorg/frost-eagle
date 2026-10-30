// Site-wide settings. Edit this file to change names, links and the bio line.

export const SITE = {
  url: 'https://frosteagle.com',
  name: 'Frost Eagle',
  tagline: 'Identity governance consulting and field notes, Sydney',
  description:
    'Field notes on Microsoft Entra ID Governance and HR-driven provisioning: how a person gets from the HR record to the right access, and what breaks along the way.',
  locale: 'en-AU',
};

export const AUTHOR = {
  name: 'David Gbuzue',
  jobTitle: 'Identity and security architect',
  location: 'Sydney, Australia',
  email: 'hello@frosteagle.com',
  photo: '/images/david-gbuzue.jpg',
  shortBio:
    'Identity and security architect in Sydney. I design and build Microsoft Entra ID Governance, HR-driven provisioning and privileged access for Australian and New Zealand organisations.',
  // Add your profile URLs here. They become visible links and tell search
  // engines these profiles belong to the same person as this site.
  // e.g. 'https://www.linkedin.com/in/your-handle', 'https://github.com/your-handle'
  sameAs: ['https://www.linkedin.com/in/davidgbuzue/'] as string[],
};

// The pipeline. Every article is filed under one stage.
// Order matters: it is the order a person's record travels in.
export const STAGES = [
  {
    slug: 'hr-source',
    name: 'HR source',
    summary: 'Getting clean, trustworthy people data out of payroll and into the provisioning pipeline.',
  },
  {
    slug: 'directory-sync',
    name: 'Directory sync',
    summary: 'Inbound provisioning, Active Directory, schema extensions, Connect Sync and Cloud Sync.',
  },
  {
    slug: 'lifecycle',
    name: 'Lifecycle workflows',
    summary: 'Joiner, mover and leaver automation in Entra Lifecycle Workflows, including custom extensions.',
  },
  {
    slug: 'first-sign-in',
    name: 'First sign-in',
    summary: 'Getting a new starter signed in on day one: passwords, Temporary Access Pass and pre-start accounts.',
  },
  {
    slug: 'access',
    name: 'Access',
    summary: 'Turning HR attributes into access with entitlement management, access packages and reviews.',
  },
  {
    slug: 'downstream',
    name: 'Downstream apps',
    summary: 'Provisioning and ticketing into the apps that sit after Entra, ServiceNow first.',
  },
] as const;

// Not a pipeline stage: how to run identity projects well.
export const SIDE_STAGES = [
  {
    slug: 'delivery',
    name: 'Delivery craft',
    summary: 'Discovery, design and delivery habits for identity projects, especially fixed-price ones.',
  },
] as const;

export const ALL_STAGES = [...STAGES, ...SIDE_STAGES];
export type StageSlug = (typeof ALL_STAGES)[number]['slug'];

export function stageBySlug(slug: string) {
  return ALL_STAGES.find((s) => s.slug === slug);
}
