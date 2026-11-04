---
title: 'Do you need Entra ID Governance licences to automate joiners, movers and leavers?'
description: 'What Entra ID P1, P2 and Entra ID Governance each cover when you automate onboarding and offboarding from HR or payroll, who needs a licence, and how to decide what to buy.'
pubDate: 2026-11-04
stage: lifecycle
tags: ['Licensing', 'Entra ID Governance', 'Lifecycle Workflows', 'Joiners, movers and leavers']
draft: false
---

Licensing comes up in almost every first conversation I have about automating onboarding and offboarding, usually as "do we really need another licence for this?" The honest answer is that it depends on how far you want the automation to go, and some of it can be done with what you probably already own.

Microsoft's [licensing fundamentals page](https://learn.microsoft.com/en-us/entra/id-governance/licensing-fundamentals) is the source of truth here, and it changes often enough that I'd check it rather than rely on this post or any other. What follows is how I read it for this particular job.

## What Entra ID P1 already gives you

Entra ID P1 comes with Microsoft 365 Business Premium and E3, so most businesses with more than a few hundred staff have it already. For the joiner and leaver basics it covers more than people expect.

[API-driven inbound provisioning](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-concepts), which is how most HR and payroll systems get their data into Entra, is available with P1. So payroll can create accounts, keep their details up to date and disable them when someone leaves. Dynamic groups are P1 as well, which means people can be put into groups by department, site or role straight from the payroll data, and those groups can carry access to apps and licences. Provisioning out to other apps, including some on-premises ones through Microsoft's [web services connector](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/on-premises-web-services-connector), is also listed under P1.

For some businesses that's enough to make a real difference, especially if the main pain is accounts being created late or left active after people go.

## What Entra ID Governance adds

The parts that make it feel properly automated sit in Entra ID Governance (or the Entra Suite, which includes it).

[Lifecycle Workflows](https://learn.microsoft.com/en-us/entra/id-governance/understanding-lifecycle-workflows) are Governance only. They're what runs the tasks around a person's dates: telling a manager who's starting, switching the account on before day one, sending a Temporary Access Pass to the manager, removing licences and group memberships when someone leaves, and calling out to things like ServiceNow through custom extensions.

[Automatic assignment of access packages](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-package-auto-assignment-policy) is Governance only too. It's how access follows a person's attributes, so that changing their department in payroll changes what they can get into, with a grace period if you want one.

Access reviews sit here as well. The licensing page says reviews need an Entra ID Governance subscription for your member users, including everyone who reviews access or has their access reviewed, though the review capabilities that were already in P2 before Governance existed are still available to P2 customers.

## Where P2 fits

If you're on Microsoft 365 E5, you have Entra ID P2 rather than Governance. P2 covers Privileged Identity Management and the entitlement management features it already had, such as requestable access packages with approvals and [separation of duties checks](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-package-incompatible) between packages. It doesn't include Lifecycle Workflows or automatic assignment, and Microsoft has said no new identity governance features will be added to P2. Microsoft also sells a Governance Step Up aimed at customers who already have P2.

## Who needs a licence

This is where budgets tend to go wrong. A Governance licence isn't only for the IT team that configures it. As I read Microsoft's licensing page, it's the member users a feature acts on that need covering, so if a Lifecycle Workflow covers all your staff, all your staff need the licence, and for access reviews the reviewers need one too. If only some of your workforce is in scope, only those people need it, which is worth thinking about early.

## Putting it together

| If you want | Licence Microsoft lists |
| --- | --- |
| Accounts created, updated and disabled from HR or payroll | Entra ID P1 |
| Access by department or site through dynamic groups | Entra ID P1 |
| Tasks around start and leave dates, such as manager emails, a first-day pass, licence removal or service desk tickets | Entra ID Governance or Entra Suite |
| Access packages assigned automatically from payroll attributes | Entra ID Governance or Entra Suite |
| Requested access with approval and an expiry date | Entra ID P2 or Entra ID Governance |
| Separation of duties checks between access packages | Entra ID P2 or Entra ID Governance |
| Privileged Identity Management | Entra ID P2 or Entra ID Governance |

For a business of 500 or more that wants joiners, movers and leavers handled end to end, I'd usually expect Entra ID Governance for the staff in scope. Some start with P1 provisioning on its own and add Governance once the data is flowing cleanly, which is a perfectly sensible way to spread the cost. Either way, get current prices from your Microsoft licensing partner, because they vary by agreement and change more often than the features do.

If you'd like help working out which of these you need, it's one of the first things we look at in a [Frost Eagle](/consulting/) engagement.
