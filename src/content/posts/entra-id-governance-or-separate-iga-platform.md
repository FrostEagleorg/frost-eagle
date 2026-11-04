---
title: 'One identity platform or two? Entra ID Governance, Okta and dedicated governance tools for a 500-person business'
description: 'Why most mid-sized businesses are better served by one identity platform than two, what Entra ID Governance covers beyond Microsoft 365, how a move from Okta to Entra ID works, and when a dedicated governance platform still earns its cost.'
pubDate: 2026-11-04
stage: access
tags: ['Entra ID Governance', 'Okta migration', 'Identity governance', 'Decision guide']
draft: true
---

A lot of mid-sized businesses end up running two identity platforms without ever deciding to. Entra ID is there because Microsoft 365 needs it. Okta, or something like it, came in later for single sign-on or provisioning, and now both hold a copy of every user. When the conversation turns to automating joiners, movers and leavers, the next suggestion is often a third product: a dedicated governance platform such as SailPoint or Saviynt.

For a business of around 500 to a few thousand people, the stronger position is almost always one platform. In most cases that platform is Entra ID with Entra ID Governance on top, because you are already paying for most of it.

## Why one platform beats two

Every identity platform you run is another directory to keep in step, another set of sign-in policies, another admin console, another renewal, and another place an auditor will ask you to pull evidence from. Two platforms also mean two lifecycles. A new starter has to be created, and a leaver removed, in both, and the gap between the two is exactly where former employees keep access.

With one platform, HR or payroll drives a single directory. Sign-in policy lives in one place, through Conditional Access. Access to apps is granted and removed from the same record that payroll updates, and the history of who had what, and who approved it, sits in one set of logs.

There's a licensing argument too. Microsoft 365 Business Premium and E3 include Entra ID P1, which covers Conditional Access and HR-driven provisioning. A separate identity provider on top of that is often paying twice for sign-in and lifecycle features the business already owns.

## What Entra ID Governance covers beyond Microsoft 365

A common objection is that Entra only manages Microsoft apps. Its reach is considerably wider.

Entra provisions accounts into SaaS apps through its gallery connectors and the SCIM standard. For on-premises systems, Microsoft's [on-premises provisioning](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/on-premises-application-provisioning-architecture) writes to SQL databases and LDAP directories, and its [web services connector](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/on-premises-web-services-connector) covers SAP ECC, Oracle E-Business Suite and line-of-business apps with REST or SOAP APIs.

On the governance side, entitlement management bundles groups, apps and SharePoint sites into access packages that are assigned automatically from HR attributes or requested with approval and an expiry date. Packages can be marked incompatible with each other for [separation of duties checks](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-package-incompatible). Lifecycle Workflows run the tasks around start and leave dates, and access reviews keep access honest over time. [A separate post covers which licence each of these needs](/articles/do-you-need-entra-id-governance-licences/).

## Moving from Okta to Entra ID

If Okta is your second platform, Microsoft publishes a migration path in four parts, and it can be done in stages without a big-bang cutover.

The [applications](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/migrate-applications-from-okta) come first in planning. You inventory what Okta currently signs people into, using the Okta API, and recreate each SAML or OpenID Connect app in Entra, testing with a small group before switching it over.

[Authentication](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/migrate-okta-federation) moves with a staged rollout. If your Microsoft 365 domain is federated to Okta, you enable password hash synchronisation, move pilot groups to Entra sign-in first, and keep the remaining Okta apps reachable from Entra while the rest follow.

[Provisioning](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/migrate-okta-sync-provisioning) moves from Okta's directory sync to Entra Connect or Cloud Sync. This is also the point to connect HR or payroll directly to Entra, so the directory is driven from the source of truth rather than from a second identity platform.

[Sign-on policies](https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/migrate-okta-sign-on-policies-conditional-access) are rebuilt as Conditional Access, with Okta's network locations becoming named locations and its device trust replaced by device-based policies. Microsoft notes this step needs Entra ID P1.

The order we recommend is to put HR-driven provisioning into Entra first, then move authentication group by group, then migrate apps in waves, and retire Okta once nothing depends on it. Done that way, each step can be rolled back on its own, and most users notice little more than a new sign-in page.

## When a dedicated governance platform is the right call

There are businesses where a dedicated governance platform earns its cost. They tend to share a few traits:

- Many of the systems that matter don't use Entra for sign-in, and have detailed permissions inside them that must be governed role by role.
- Separation of duties requirements run deep into ERP and finance roles, at a level auditors test transaction by transaction, beyond what package-level checks provide.
- There's a dedicated identity team, or the budget for one, to run the platform day to day.

If those don't describe you, a dedicated platform adds cost and another system to maintain without solving a problem you have.

## Questions that settle it

1. How many identity platforms do you run today, and does each one hold its own copy of your users?
2. How many of your important apps sign in through Entra, and how many could with a reasonable amount of work?
3. Which apps have permissions inside them that auditors or the business care about, beyond whether someone has an account?
4. How detailed do your separation of duties requirements really need to be?
5. Who will run the platform once it's live, and how much time do they have?
6. Which Microsoft licences do you already hold?

For most mid-sized businesses, the answers point to one platform: Entra ID, driven from HR or payroll, with Entra ID Governance handling access and the awkward systems dealt with individually. If you're running Okta alongside Entra today, or weighing up a dedicated governance tool, [Frost Eagle](/consulting/) can help you decide and plan the move.
