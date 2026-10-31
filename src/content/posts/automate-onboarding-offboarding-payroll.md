---
title: 'How to automate onboarding and offboarding from your payroll system with Microsoft Entra'
description: 'What it takes to let your HR or payroll system create, change and remove Microsoft 365 accounts on its own: the Entra pieces involved, the licences each one needs, and where most of the effort really goes.'
pubDate: 2026-10-31
stage: lifecycle
tags: ['HR-driven provisioning', 'Joiners, movers and leavers', 'Lifecycle Workflows', 'Licensing']
draft: false
---

Most of what I write here is for the engineer building the thing. This one is for the person deciding whether to build it at all: an IT manager, or an operations lead who has noticed that every new starter depends on someone in IT reading an email from HR and doing the setup by hand.

If that's your business, the usual first question is whether Microsoft can just do this for you. For the most part it can, though the pieces are spread across a few features and more than one licence, and most of the effort ends up in your own data rather than in Microsoft's settings.

## What automated means here

The idea is that your HR or payroll system becomes the only place anyone records a change about a person. When someone is hired, their account is created from that record before their first day. When their title, team or site changes, their access follows. When a leave date goes in, the account is switched off on that date without anyone having to remember. IT still has a job, which is looking after the rules that make all this happen, but nobody has to turn an email into an account any more.

## The pieces Microsoft gives you

There are three, and they do different jobs.

The first gets people from payroll into your directory. Microsoft has built-in connectors for Workday and SAP SuccessFactors, described in its [cloud HR provisioning plan](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/plan-cloud-hr-provision). If your HR or payroll system is anything else, the route is [API-driven inbound provisioning](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-concepts). Microsoft's own description is that it works with any system of record, including a payroll app, a spreadsheet or a database table, as long as something reads the data and sends it to Entra. It can create the account in on-premises Active Directory if you still have one, or straight into Entra ID if you're cloud-only.

The second is [Lifecycle Workflows](https://learn.microsoft.com/en-us/entra/id-governance/understanding-lifecycle-workflows), which acts on the account once it exists. Workflows are grouped into joiner, mover and leaver, and the [built-in tasks](https://learn.microsoft.com/en-us/entra/id-governance/lifecycle-workflow-tasks) cover most of the routine work: enabling the account, generating a Temporary Access Pass and emailing it to the manager, adding the person to groups and Teams, assigning or removing licences, disabling the account and revoking their sign-in sessions. When the built-in tasks aren't enough, a workflow can call out to a Logic App for the rest, such as raising a ticket for a laptop.

The third decides what people can get into. In entitlement management, an access package bundles groups, apps and SharePoint sites together, and an [automatic assignment policy](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-package-auto-assignment-policy) hands that package to everyone whose attributes match a rule, such as everyone in Finance at a given site. Change the person's department in payroll and the assignment follows.

## What you'll need to license

This is where people get caught, because the three pieces don't sit in the same licence.

| Capability | Licence Microsoft lists |
| --- | --- |
| API-driven inbound provisioning | Entra ID P1, P2 or Entra ID Governance |
| Workday or SuccessFactors inbound connectors | Entra ID P1 or P2 |
| Lifecycle Workflows | Entra ID Governance or Entra Suite |
| Automatic assignment of access packages | Entra ID Governance or Entra Suite |

Plenty of businesses already have P1 through Microsoft 365 Business Premium or E3, so getting accounts created from payroll may cost nothing extra in licensing. The joiner, mover and leaver automation on top is what needs Entra ID Governance. Microsoft's [licensing fundamentals page](https://learn.microsoft.com/en-us/entra/id-governance/licensing-fundamentals) is the one to check against, because the details do move, and I'd rather you read the current version than trust a table in a blog post.

## Where the effort actually goes

The Entra configuration is the smaller part. Most of the time goes on your people data, and on decisions that were never written down because someone in IT used to make the call each time a new starter came through.

These are the things I'd look at first:

- Whether the payroll record holds what an account needs, which is not always the same as what paying someone needs. Preferred names, the person's manager and the start date are worth checking, and so is when each of them gets entered.
- How job titles map to roles. Access is much easier to automate from a short list of roles than from every title payroll has ever recorded.
- What the location or cost centre codes actually mean, and whether they line up with real sites and teams.
- The people who don't follow the usual path: rehires, contractors who aren't in payroll, and anyone who might share an employee ID with someone else. I wrote up [what a shared ID did in my lab](/articles/628-in-ad-180-in-entra/), and it's not something you want to find in production.

If you still run Active Directory, there's a second layer of work in how the account travels from AD up to Entra ID, and a few behaviours that only show up in hybrid setups. [This walk-through of a hybrid pipeline](/articles/payroll-to-entra-hop-by-hop/) covers each hop and where it tends to break.

## An order that tends to work

1. Look at your HR or payroll data first, before any design. How clean it is decides more about the size of the job than anything on the Microsoft side.
2. Agree what drives access: which fields, which rules, and what people still have to ask for.
3. Get accounts created and updated from payroll, running alongside your current process so nothing changes for staff yet.
4. Switch on leavers early. Accounts that stay active after someone has gone are usually the biggest risk in a manual process, and the rules are simpler than for joiners.
5. Then joiners, including how a new starter signs in on their first morning.
6. Movers last. A role change both adds and removes access, so it depends on everything before it being right.

## Before you talk to anyone about it

It's worth having rough answers to these, whether you build it yourself or bring someone in:

- Which system holds the truth about who works for you, and can it export data or be read through an API?
- Do you still have on-premises Active Directory, and do you plan to keep it?
- Which Microsoft licences do you have today, and for how many people?
- Who in HR or payroll owns the data, and would they change how something is entered if it made the automation simpler?
- What happens today when someone leaves suddenly, and how long until their access is actually removed?

None of them needs a technical answer, and between them they settle most of how big the job is.

This is the work [Frost Eagle](/consulting/) does for businesses in Australia and New Zealand, usually starting with a short review of exactly these questions. If you'd rather do it yourselves, the rest of this site is written for the engineer who'll be building it.
