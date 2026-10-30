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
  name: 'Dubem Gbuzue',
  jobTitle: 'Principal Identity Architect',
  profile: '/about/dubem-gbuzue/',
  location: 'Sydney, Australia',
  email: 'hello@frosteagle.com',
  abn: '99 675 106 493',
  photo: '/images/dubem-gbuzue.jpg',
  shortBio:
    'Principal Identity Architect at Frost Eagle, based in Sydney. I help organisations bring order to who has access to what, using Microsoft Entra ID Governance, HR-driven provisioning and privileged access.',
  // Add your profile URLs here. They become visible links and tell search
  // engines these profiles belong to the same person as this site.
  // e.g. 'https://www.linkedin.com/in/your-handle', 'https://github.com/your-handle'
  sameAs: ['https://www.linkedin.com/in/dubemg/'] as string[],
};

// The people behind Frost Eagle, shown on the Consulting page.
export const TEAM = [
  {
    name: 'Lauren Battaglia',
    slug: 'lauren-battaglia',
    role: 'COO',
    photo: '/images/lauren-battaglia.jpg',
    body: "Lauren leads Frost Eagle's operations and delivery, navigating the complexities of client environments so projects run smoothly from the first conversation to handover. She keeps scope, people and timelines aligned, making sure the technical work fits how each business actually operates.",
  },
  {
    name: 'Dubem Gbuzue',
    slug: 'dubem-gbuzue',
    profile: '/about/dubem-gbuzue/',
    role: 'Principal Identity Architect',
    photo: '/images/dubem-gbuzue.jpg',
    body: "Dubem is a principal identity architect who helps organisations bring order to who has access to what, and why. He has led the technical delivery of identity governance and privileged access work across manufacturing, financial services, higher education and healthcare in Australia and New Zealand, working with IT and business leaders to turn HR and payroll data into access that is automatic, auditable and easy to defend. He specialises in Microsoft Entra ID Governance, HR-driven provisioning, hybrid Active Directory and privileged access.",
  },
];

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
