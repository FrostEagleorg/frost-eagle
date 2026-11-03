---
title: 'Entra ID Governance or a separate identity governance platform for a 500-person business?'
description: 'When Microsoft Entra ID Governance is enough to run joiners, movers and leavers, what it can reach beyond Microsoft 365, and the situations where a dedicated identity governance platform is worth the extra cost.'
pubDate: 2026-11-04
stage: access
tags: ['Entra ID Governance', 'Identity governance', 'Entitlement management', 'Decision guide']
draft: true
---

Once a business decides it wants HR or payroll to drive access, the next question is usually what to build it on. The two broad options are Microsoft Entra ID Governance, which sits inside the Microsoft tenant you already have, and a dedicated identity governance platform such as SailPoint, Saviynt or Okta Identity Governance.

I should say up front that most of my work is on Entra ID Governance, so read this with that in mind. I've tried to keep to what each option is good at rather than make a case for one, and where something is my own view rather than Microsoft's documentation, I've said so.

## When Entra ID Governance tends to fit

For a business of around 500 to a few thousand people, I find Entra ID Governance is usually the natural place to start when most of these are true:

- Microsoft 365 and Entra ID are already where your people sign in.
- Most of the apps that matter either sign in through Entra or can be provisioned from it.
- The main goal is joiners, movers and leavers driven from HR or payroll, with access following a person's role and site.
- Your IT team is small, and running another platform with its own infrastructure, upgrades and specialist skills would stretch it.

The appeal is mostly practical. There's one directory, one place to look when something goes wrong, and the licence adds to what you're already paying Microsoft rather than starting a new contract.

## What it can reach beyond Microsoft 365

A common assumption is that Entra ID Governance only manages Microsoft apps. In practice its reach is wider than that.

Entra can provision accounts into SaaS apps through its gallery connectors and the SCIM standard. For on-premises apps, Microsoft's [on-premises provisioning](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/on-premises-application-provisioning-architecture) uses a connector host that can write to SQL databases and LDAP directories, and its [web services connector](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/on-premises-web-services-connector) covers apps such as SAP ECC, Oracle E-Business Suite and line-of-business apps with REST or SOAP APIs.

On the governance side, entitlement management bundles groups, apps and SharePoint sites into access packages, and you can mark packages as incompatible with each other for [separation of duties checks](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-package-incompatible). Access reviews and Lifecycle Workflows round it out. Which of these needs which licence is covered in [a separate post on licensing](/articles/do-you-need-entra-id-governance-licences/).

## When a separate platform may be worth it

This part is my view rather than anything Microsoft or the vendors say. I'd look seriously at a dedicated platform when:

- A large share of your important systems don't use Entra for sign-in and have detailed permissions inside them that need governing role by role.
- You have strict separation of duties requirements across ERP and finance roles, the kind auditors test in detail, and package-level checks wouldn't satisfy them.
- You run more than one identity provider and expect that to continue.
- You have, or plan to have, a dedicated identity team to run the platform day to day.

None of these rules Entra out on its own, and as far as I know most dedicated platforms work alongside Entra rather than replacing it. They do tend to point towards needs that justify the extra cost and effort of a second platform.

## Questions that usually settle it

1. How many of your important apps sign in through Entra today, and how many could?
2. Which apps have permissions inside them that auditors or the business care about, beyond whether someone has an account?
3. How detailed do your separation of duties requirements really need to be?
4. Who will run the platform once it's live, and how much time do they have?
5. What Microsoft licences do you already hold?

For most mid-sized businesses I talk to, those answers point to starting with Entra ID Governance and handling the awkward systems individually. For some they don't, and it's much better to find that out before a project starts than halfway through one.

If you'd like to talk it through for your own business, that's the kind of conversation we have at the start of every [Frost Eagle](/consulting/) engagement.
