---
title: 'Following a new starter from payroll to Entra ID, one hop at a time'
description: 'A walk through a hybrid HR-driven provisioning pipeline: what each hop does to a person''s record, and where each one tends to break.'
pubDate: 2026-10-30
stage: hr-source
tags: ['HR-driven provisioning', 'Inbound provisioning', 'Hybrid identity', 'Lifecycle Workflows']
draft: true
---

Most of what I write here is about one stage of a pipeline that takes a person from a payroll system to the access they need on their first day. This post is the map for the rest. It follows one new starter through a hybrid design, the kind where accounts still live in on-premises Active Directory, and stops at each hop to look at what changes and what tends to go wrong.

The design is the one I've built most recently, with the names taken off. Yours will differ in the details, but I'd be surprised if the shape is very different.

## The hops

In order, the record passes through:

1. The payroll or HR system, which is the source of truth for who works here.
2. A normalisation layer that reads the payroll data and turns it into something clean enough to provision from.
3. Microsoft Entra's API-driven inbound provisioning, which accepts the record and decides whether to create or update.
4. The provisioning agent, which writes the account into Active Directory.
5. Connect Sync or Cloud Sync, which carries the account from AD up to Entra ID.
6. Entra ID Governance, where dynamic groups, access packages and Lifecycle Workflows act on the account.
7. The downstream apps, which receive the user through their own provisioning.

It's a long way for one record to travel. Each hop has its own owner and its own logs, so a failure in one place often only shows up somewhere further along.

## 1. The payroll system

Everything downstream trusts this record, so it's where I spend the most time in discovery. The payroll extracts I've worked with have never been ready to provision from as they come.

A few examples from the last one: close to two hundred payroll job titles that needed grouping into a few dozen roles before they could drive access; location codes that were historical and only made sense to payroll; an end date filled in for every employee, using a far-future sentinel to mean "no end date"; first and middle names packed into one field; and surnames with spaces that would break a username formula. None of that is unusual. Payroll systems are built to pay people, and identity is a side effect.

The one I'd check first is the employee ID. The whole pipeline matches on it, so if it isn't unique and stable, nothing after this point can be trusted.

## 2. The normalisation layer

Something has to sit between payroll and Entra to clean the data up. It might be a product, a Logic App, or a PowerShell script on a schedule. Its job is to read the raw records, apply the rules (titles to roles, location codes to sites and countries, sentinel dates to empty values) and send Entra a record that says exactly what the identity should look like.

The design choice that matters most here is what happens when a person is missing from the feed. I'm firmly of the view that a missing record should mean "do nothing", not "this person has left". Feeds drop records for all sorts of reasons: a failed export, a filter change, a payroll system having a bad day. If absence triggers deprovisioning, one bad night can disable half the company. A leaver should be a positive signal in the data, like an end date, never just a gap.

## 3. API-driven inbound provisioning

This is Microsoft's [generic front door for HR data](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-concepts). You create a provisioning app in Entra, and your normalisation layer posts records to its `/bulkUpload` endpoint as SCIM operations. The API client needs the `SynchronizationData-User.Upload` permission. There are two flavours of app: one provisions [straight into Entra ID](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-configure-app) for cloud-only users, and the other provisions into on-premises AD for hybrid users. This walk-through uses the AD one.

Two things here catch people out.

The first is that a `202 Accepted` from `/bulkUpload` only means the request was received. The records are [processed asynchronously](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-faqs) on the next cycle, and the only place you find out what really happened is the provisioning logs. In my experience the API still says 202 even when the job is paused or in quarantine, so don't take it as a health check.

The second is matching. By default the SCIM `externalId` is matched against the user's employee ID to decide whether a record is new or an update. If two people share an employee ID in the source, they collapse onto one account, and that account flips between them every cycle. I hit exactly that in my lab, and [wrote it up here](/articles/628-in-ad-180-in-entra/).

The API also has limits worth designing around: Microsoft suggests up to 50 operations per call, and allows 40 calls in any five-second window, plus a daily cap per tenant. Sending only changed records keeps you well under them.

## 4. The provisioning agent and Active Directory

For the AD flavour, a lightweight [provisioning agent](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/inbound-provisioning-api-configure-app) on a Windows server connects to a domain controller and makes the changes. On a create, it needs a target OU, a username and UPN built from the attribute mappings, and an initial account state.

My lab gave me a good example of how this hop goes wrong. A UPN expression that didn't strip spaces from names, combined with a placeholder domain that was never changed, produced a few hundred users with invalid UPNs. AD accepted them without complaint, and they only went missing later, at the sync hop ([the full story](/articles/628-in-ad-180-in-entra/)). Something like this has served me well since:

```text
ToLower(Join("@", NormalizeDiacritics(StripSpaces(Join(".", [givenName], [surname]))), DefaultDomain()))
```

Two other AD details are worth knowing. AD has no native attributes for a hire date or a leave date, so if you want Lifecycle Workflows to schedule from AD-sourced accounts, you'll be [picking or creating string attributes](https://learn.microsoft.com/en-us/entra/id-governance/how-to-lifecycle-workflow-sync-attributes) to carry them. I've done this with a schema extension. And the agent itself depends on reaching the domain controller, so if that DC's address changes, provisioning stops. In my lab, giving the DC a static IP was the end of a recurring headache.

## 5. Sync back up to Entra ID

Because the account was created in AD, it reaches Entra ID the usual way, through Connect Sync or Cloud Sync. That means two separate sets of attribute mappings meet at AD: the provisioning app's mappings decide what lands in AD, and the sync engine's mappings decide what leaves it. Neither knows about the other. The only thing they share is the AD attribute name.

The date attributes need the most care. Lifecycle Workflows schedule from `employeeHireDate` and `employeeLeaveDateTime` in Entra ID, which the [Microsoft guidance](https://learn.microsoft.com/en-us/entra/id-governance/how-to-lifecycle-workflow-sync-attributes) shows you how to populate from AD with either engine. Two things I'd add from experience. Let empty values flow through rather than filtering them out, because when someone's end date is removed in payroll, you want the Entra value cleared too. And make sure the trailing `Z` on the timestamp really means UTC, or your workflows will fire hours early or late.

If you're running both engines, which is common during a migration, be aware that the custom attributes each one can use are registered in different ways. I've gone into that [in a separate post](/articles/connect-cloud-sync-extension-attributes/), because it held up one of my projects for a while.

## 6. Governance in Entra ID

Once the account is in Entra ID with the right attributes, governance can finally act on it.

Dynamic groups and [access package auto-assignment policies](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-package-auto-assignment-policy) give people access based on their attributes: department, job title, location, whatever the normalisation layer stamped. If you can get most birthright access driven this way, you get a lot of the mover and leaver behaviour for free, which I'll come back to.

[Lifecycle Workflows](https://learn.microsoft.com/en-us/entra/id-governance/understanding-lifecycle-workflows) handle the tasks that happen at a point in time. For a joiner that might mean enabling the account a couple of days before the start date, generating a Temporary Access Pass for the manager, or raising an onboarding ticket through a custom extension. Workflows are evaluated on a schedule, every three hours by default, and they won't run before the time in the date attribute, so think about what time of day those dates carry.

The first credential is a trap of its own in a hybrid tenant. I wrote up [why a Logic App can't set a hybrid user's first password](/articles/hybrid-first-password-graph/), and it's worth reading before you design this part.

## 7. Downstream apps

Finally, the user reaches the applications. Some use SSO and group claims and need nothing more, while others have their own provisioning from Entra ID, which runs on its own cycle.

The gap between those cycles is where onboarding automation often trips. If a workflow raises a ticket that refers to the user in ServiceNow before ServiceNow's provisioning has run, the ticket arrives with nobody attached to it. One fix is to call `provisionOnDemand` from the workflow before raising the ticket, and that led me into [a resume-callback problem I wrote up separately](/articles/lcw-callback-204-does-nothing/). It's also worth knowing that, in the setups I've tested, a disabled account isn't provisioned into ServiceNow at all, which matters if you create accounts disabled and enable them shortly before the start date.

## Movers and leavers

A mover travels the same path. Payroll changes the person's department or title, the normalisation layer restamps the attributes, the provisioning agent updates AD, and sync carries the change up. Then any dynamic group or auto-assignment rule that no longer matches removes the old access, and the ones that now match add the new access. You can also give people a short grace period on the old access, which [auto-assignment policies support](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-package-auto-assignment-policy), so they can hand things over. All of this only works if the access was granted by rules in the first place. Anything assigned by hand stays behind when the person moves, so I push hard for rule-based assignment wherever it's reasonable. If you also want tasks to happen on a move, like telling the old and new managers or raising a ticket, Lifecycle Workflows can trigger on attribute changes too.

A leaver starts with an end date in payroll. It flows through to `employeeLeaveDateTime`, and the leaver workflows do the rest on schedule: disable the account, remove group memberships and access packages, and anything else you've added, such as converting the mailbox. In the designs I've built, the provisioning side only stamps the date, and the workflows own the account's state. That way there's only one component deciding when someone gets switched off.

One caution on leavers. If an end date is the only signal and it never arrives, because payroll entered it late or the record was dropped, nothing happens and the account stays active. That's the safe failure from the provisioning side's point of view, but it's still an orphaned account. I'd always pair this design with a report of accounts that look active but haven't signed in for a while.

## Where I'd start

If I were walking into a new project of this kind, I'd look at the employee ID and the end-date data in payroll before anything else, and I'd agree early on what a missing record means. Most of the trouble I've seen further down the pipeline started with one of those three.
