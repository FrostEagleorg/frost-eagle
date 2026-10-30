---
title: 'Moving custom attributes from Connect Sync to Cloud Sync? Check which app they belong to'
description: 'A custom AD attribute synced into Entra ID gets a name that includes the ID of an app. Change sync engines and you can end up with a new app, a new name, and every rule that used the old one quietly pointing at nothing.'
pubDate: 2026-10-30
stage: directory-sync
tags: ['Cloud Sync', 'Connect Sync', 'Directory extensions', 'Hybrid identity']
draft: true
---

On a recent hybrid project we extended the on-premises AD schema with a few attributes the payroll data needed somewhere to live: a hire date, a termination date, a flag for people leaders, and some org-structure values. The two dates could land on Entra ID's built-in `employeeHireDate` and `employeeLeaveDateTime`, which is where Lifecycle Workflows expect them. The rest had no built-in home, and access package rules depended on them, so they had to reach Entra ID some other way. Halfway through the project, the client decided to move user sync from Connect Sync to Cloud Sync. That turned a simple attribute flow into something we had to plan, and I think the reason is easy to miss until it bites you.

## Where a custom attribute ends up

A custom AD attribute with no built-in equivalent doesn't arrive in Entra ID under its own name. It arrives as a directory extension, and every directory extension belongs to an application, whose ID becomes part of the attribute's name. The people-leader flag looked something like this:

```text
extension_<appId>_peopleLeader
```

So the attribute's full name depends on which app it was registered on, and that's decided by how it got there.

With Connect Sync, you tick the attribute on the directory extensions page of the wizard, and Connect registers it on an app it creates called the [Tenant Schema Extension App](https://learn.microsoft.com/en-us/entra/identity/hybrid/connect/how-to-connect-sync-feature-directory-extensions). That's where our extension attributes started, and the access package rules we designed referred to them by those names.

Cloud Sync's [custom attribute documentation](https://learn.microsoft.com/en-us/entra/identity/hybrid/cloud-sync/custom-attribute-mapping) walks you through a different route. You create an app with the identifier URI `API://<tenantId>/CloudSyncCustomExtensionsApp`, register your extensions on it with Graph or PowerShell, and map them in the Cloud Sync configuration. Follow that guide during a migration and you get a second copy of each attribute, under a second app ID, with a second name.

## What that means for everything downstream

Entra ID treats those as two unrelated attributes. Nothing links `extension_<connectAppId>_peopleLeader` to `extension_<cloudSyncAppId>_peopleLeader`, even though they come from the same AD attribute.

Any rule written against the old name would keep evaluating the old one, and once Connect Sync stops updating it, its values freeze where they were. Someone promoted to a people leader role after the cutover wouldn't get the leader access package, and a new starter would have no value there at all. Nothing would error, because every rule is still valid. It would just be reading an attribute nobody writes to anymore.

So the migration is really two jobs. One is getting the values onto the new attributes and confirming they match the old ones. The other is finding every reference to the old names and changing it, ideally in the same change window, so there's no period where the rules point at an attribute that's gone stale.

## Finding the references

These are the places I'd look, because they're where these attributes usually end up:

- Lifecycle Workflow scope rules, if any of them filter on an extension attribute
- Dynamic group membership rules
- Access package auto-assignment policies
- Logic Apps, scripts or reports that read the attributes through Graph

Dynamic groups are the easiest to sweep, since the rule is a property you can read:

```powershell
Get-MgGroup -Filter "groupTypes/any(c:c eq 'DynamicMembership')" -All -Property DisplayName, MembershipRule |
  Where-Object { $_.MembershipRule -match 'extension_' } |
  Select-Object DisplayName, MembershipRule
```

Workflows and auto-assignment policies are easier to check in the portal unless you have a lot of them. One thing worth knowing for the auto-assignment rules: in our tenant the extension attributes didn't appear in the rule builder's property list, so those rules had to be typed into the rule text directly.

## The option I'd test first next time

Looking at the Cloud Sync documentation again while writing this, it says directory extensions are supported on two apps: the CloudSyncCustomExtensionsApp, and the Tenant Schema Extension App that Connect creates. If that works the way it reads, Cloud Sync could carry the attributes on the same app, under the same names, and none of the references above would need to change.

I was told during a design review that Cloud Sync can't use the attributes Connect's wizard creates, and we planned around that. The current documentation disagrees, and I haven't tested it yet, so I wouldn't put my weight on either answer without a quick lab test. Sync a test attribute through the Connect wizard, configure Cloud Sync for a test OU, and check whether the existing `extension_<connectAppId>_` attribute shows up as a mapping target and gets populated. (The same page notes that the Cloud Sync agent needs a restart before it discovers new AD extension attributes, so restart it before you conclude anything.)

If it works, keeping the existing app is the simpler migration by a long way. If it doesn't, at least you'll know the rename work is coming before you're halfway through the cutover.

For the wider picture of where sync sits between payroll and access, [this overview](/articles/payroll-to-entra-hop-by-hop/) follows a new starter through every hop.
