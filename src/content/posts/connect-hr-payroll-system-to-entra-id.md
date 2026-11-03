---
title: 'Connecting your HR or payroll system to Microsoft Entra ID, whichever one you use'
description: 'Affinity, MicroPay, Connx, ADP or something else: what actually decides whether your HR or payroll system can drive accounts and access in Entra ID, and the questions to ask your vendor before you start.'
pubDate: 2026-11-04
stage: hr-source
tags: ['HR-driven provisioning', 'API-driven inbound provisioning', 'Payroll integration', 'Joiners, movers and leavers']
draft: true
---

One of the first questions I get from a business looking at this is whether we support their HR or payroll system. It's a fair thing to ask, though the brand turns out to matter less than most people expect. What matters is how the data gets out of the system, what's in it, and how reliably it's kept up to date.

I've connected Affinity, MicroPay and Connx to Entra ID, and the differences between them were smaller than the similarities. The same approach carries over to ADP and to most other systems that can hand their data over in some form.

## What Microsoft supports out of the box

Microsoft has built-in connectors for two HR systems, Workday and SAP SuccessFactors, described in its [cloud HR provisioning plan](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/plan-cloud-hr-provision).

Everything else goes through [API-driven inbound provisioning](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-concepts). Microsoft describes it as working with any system of record, whether that's an HR app, a payroll app, a spreadsheet or tables in a database. Something reads the data and sends it to Entra, and Entra decides whether to create, update or disable each account. Depending on how it's set up, the account lands in on-premises Active Directory or straight in Entra ID. It needs Entra ID P1, which many businesses already have through Microsoft 365 Business Premium or E3.

Entra will accept your HR data in almost any form, then, and the work is in getting it out of your system in a usable shape.

## Getting the data out

In my experience it comes out in one of three ways:

- Through an API the HR or payroll system provides, which is usually the freshest option.
- Through a scheduled export, such as a file the system produces every night.
- Through a report or a database view that something can read on a schedule.

Any of the three can work. An API means changes arrive sooner, but a nightly file is perfectly adequate for most businesses as long as urgent exits have their own on-demand path. Microsoft even publishes a [PowerShell quick start](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-powershell) that reads a CSV file and sends it to the provisioning API, which is a reasonable way to prove the idea with your own data before building anything more permanent.

## What each record needs to carry

Whatever the system, the record for each person needs roughly the same things:

- An employee ID that is unique and never reused for someone else.
- Legal name, and preferred name if your people use one.
- Start date and, when it's known, end date.
- Job title or position.
- Department or cost centre.
- Location or site.
- Their manager, ideally as the manager's employee ID rather than a name.
- Employment type, if contractors or casuals are treated differently.

Most HR and payroll systems hold all of this somewhere. The work is usually in finding where, and in checking how consistently it's filled in.

## Where systems actually differ

The differences I've run into are mostly about how a system represents things, rather than whether it has them at all.

Locations are a good example. On one recent project, payroll stored each person's location as a short code that meant nothing outside payroll, and at first its API couldn't return the location names at all. We kept a single lookup table keyed on payroll's own codes, mapping each one to a real site and its address, and the access rules read from that.

Dates are another. It's worth checking how a system records "no end date": some leave the field empty, and others use a placeholder date far in the future. The leaver rules need to know which, or they'll either never fire or fire for the wrong people. Time zones matter too if you operate in more than one country.

Then there are rehires. Some systems give a returning employee their old ID back, and others issue a new one. Either can be handled, but the design has to know which to expect so a rehire gets their old account back rather than a duplicate.

And managers. Some systems return the manager's employee ID directly, some only a name, and some need a second lookup. Without a reliable manager link, anything that emails a manager about a new starter has nothing to work with.

## When the data needs more work

Sometimes the data can go to Entra more or less as it is. Other times it needs shaping first: codes translated, job titles grouped into roles, two sources merged into one record, or a history kept of every change for audit. That's where an integration layer between the HR system and Entra earns its place, and it's the main thing that changes from one project to the next.

## Questions to ask your HR or payroll vendor

If you're weighing this up, these are the questions I'd put to your vendor or your payroll team first:

1. Is there an API, and which of the fields above can it return?
2. If there's no API, can the system produce a scheduled export?
3. How are future-dated starts, terminations and changes recorded?
4. Is an employee ID ever reused, and what happens when someone is rehired?
5. Does the manager come through as an ID?
6. Are locations and departments returned as names, or only as codes?

The answers tell you most of what you need to know about how much work the integration will be. If you'd like a second opinion on them, that's the kind of conversation we have at the start of every [Frost Eagle](/consulting/) engagement.
