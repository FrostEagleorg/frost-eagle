---
title: 'Connect Sync, Cloud Sync, and the two homes for your extension attributes'
description: 'Custom AD attributes reach Entra ID as directory extensions, and which sync engine you use decides which app those extensions live on. That choice follows you into every rule that reads them.'
pubDate: 2026-10-30
stage: directory-sync
tags: ['Cloud Sync', 'Connect Sync', 'Directory extensions', 'Hybrid identity']
draft: true
---

On a recent hybrid project we extended the on-premises AD schema with a handful of attributes: a hire date, a termination date, and a flag for people leaders. They drive Lifecycle Workflows and access package rules, so they had to reach Entra ID. Getting them there taught me more about directory extensions than I expected to learn, mostly because the tenant was running Connect Sync and Cloud Sync side by side, and the two don't treat extensions the same way.

This is what I'd want to know before choosing where those attributes live. (If you want the bigger picture of where sync sits in the pipeline, [this overview](/articles/payroll-to-entra-hop-by-hop/) walks through every hop.)

## Two apps, two sets of attribute names

A custom AD attribute arrives in Entra ID as a directory extension, and every directory extension belongs to an application. The attribute's name includes that application's ID, so it ends up looking like `extension_<appId>_employeeHireDate`.

Connect Sync creates its extensions on an app called the **Tenant Schema Extension App** when you tick attributes in the wizard's directory extensions page. The [Connect Sync documentation](https://learn.microsoft.com/en-us/entra/identity/hybrid/connect/how-to-connect-sync-feature-directory-extensions) describes that app as system-only, and it can't be deleted.

Cloud Sync has its own home: an app you create with the identifier URI `API://<tenantId>/CloudSyncCustomExtensionsApp`. You register extensions on it yourself, through Graph or PowerShell, and the [Cloud Sync documentation](https://learn.microsoft.com/en-us/entra/identity/hybrid/cloud-sync/custom-attribute-mapping) walks through creating the app, its service principal and the extension.

The practical consequence is that the same AD attribute, synced through each engine, becomes two different attributes in Entra ID with two different names. Whatever reads it (a workflow scope, a dynamic group, an access package rule) is written against one of those names, not the other.

## Connect Sync only writes to its own extensions

This one is in the documentation, and it caught us anyway. Connect Sync won't sync values into extension attributes that it didn't create. Microsoft says it isn't supported and warns about performance problems and unexpected results.

We ran into it on group writeback. Cloud Sync was writing groups back to AD, and to keep each group's name and location stable we'd registered a `groupDistinguishedName` extension on the CloudSyncCustomExtensionsApp, meant to hold the DN. Connect Sync was carrying the source data, and it simply never populated that extension. The writeback expressions fell back to their default naming.

The fix we settled on keeps the value inside Connect Sync's world: stamp the DN into `extensionAttribute1` in AD, select it in the Connect wizard so it lands on the Tenant Schema Extension App, and point Cloud Sync's expressions at that attribute instead. The scoping flag for writeback, which we set through Graph rather than through sync, stayed on the CloudSyncCustomExtensionsApp and was fine there.

## Can Cloud Sync read Connect's extensions?

I went into this project believing it couldn't. That's what I was told during a design review, and it was presented as a reason the attribute data would need migrating if the tenant ever moved fully to Cloud Sync.

The current Cloud Sync documentation says otherwise. It lists both the CloudSyncCustomExtensionsApp and the Tenant Schema Extension App created by Connect as supported for directory extensions. I haven't tested that path myself yet, so I'd trust the documentation and check it in a lab before planning around either answer.

Either way, the planning point still stands. If a migration to Cloud Sync means registering attributes on a different app, every name changes, and so does every rule that uses them. Workflows, dynamic groups and access package policies all need editing, and the values have to be populated on the new attributes before the old ones go. None of that is hard, but it's real work, and it's easy to leave off the migration plan because the attributes look identical in AD.

## When Cloud Sync doesn't see the attribute at all

The Cloud Sync documentation has a note that's easy to miss: after you create new AD extension attributes, the provisioning agent has to be restarted before it discovers them. Attributes that already exist in Entra ID don't need the restart.

I'd do that first. I should say, though, that in our case it wasn't enough. The attributes showed up in the mapping drop-down, and the values were there on the AD objects, but the per-user provisioning log showed them missing at the import step. A restart, a schema refresh and a rebuilt configuration didn't change that. It started working a little later, and I never pinned down which change fixed it. Connect Sync and Cloud Sync were both configured over the same users at the time, and I suspect that was involved, but I can't prove it.

If you're in the same spot, the provisioning log's import step is the place to look. If the attribute isn't there, nothing you do to the mappings will help.

## Two smaller things

The 100 limit is per object, not per app. The [extensionProperty reference](https://learn.microsoft.com/en-us/graph/api/resources/extensionproperty) says only 100 extension values, across all types and applications, can be written to any single resource. If both engines carry their own copies of the same attributes, every copy counts.

In entitlement management, the [automatic assignment policy](https://learn.microsoft.com/en-us/entra/id-governance/entitlement-management-access-package-auto-assignment-policy) can use extension attributes in its rule. In our tenant they didn't appear in the rule builder's property list, so we wrote those rules straight into the rule text box, for example `user.extension_<appId>_peopleLeader -eq "true"`.

## What I'd decide up front

Before the first attribute is registered, I'd pick which app owns your extension attributes and write it down, with the reason. If Connect Sync is staying for the foreseeable future, its wizard and the Tenant Schema Extension App are the supported route. If Cloud Sync is the destination, registering on the CloudSyncCustomExtensionsApp from the start avoids renaming everything later, as long as nothing in Connect Sync needs to write to those attributes in the meantime.
