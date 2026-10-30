---
title: "Why your Logic App can't set a hybrid user's first password"
description: 'Graph will happily change a synced user''s password from automation. The change just never reaches Active Directory, and the new starter is locked out of the password you sent them.'
pubDate: 2026-11-13
stage: first-sign-in
tags: ['Password writeback', 'Microsoft Graph', 'Lifecycle Workflows', 'Hybrid identity']
draft: true
---

The design looked simple. Three days before a new starter's first day, a Lifecycle Workflow calls a Logic App. The Logic App generates a temporary password, sets it on the user through Microsoft Graph, and emails it to their manager. On day one the starter signs in and is forced to choose their own password.

The client signed off on it. In a cloud-only tenant it would have worked. In a hybrid tenant, it can't.

## What happened

Every account in this environment was hybrid: created in on-premises Active Directory, synced to Entra ID, with password hash sync on and password writeback enabled.

The Logic App ran under its system-assigned managed identity. It called Graph, Graph returned success, and the manager got the email. The temporary password then failed at sign-in. The user's original AD password still worked.

We tried both of Graph's ways to set a password:

- `PATCH /users/{id}` with a new `passwordProfile`
- `POST .../authentication/methods/{id}/resetPassword`

Both changed the password in Entra ID. Neither changed it in AD. AD owns a synced user's password, so the cloud-side change didn't hold: the old AD password kept working. Turning on writeback in Cloud Sync as well didn't change anything.

## The test that pointed at the cause

Two results didn't fit a broken writeback setup:

1. **A reset from the Entra admin center worked** on the same user, through the same writeback path. So writeback was fine.
2. **In my lab**, signed in as an admin in Graph Explorer, `resetPassword` on a synced user did write back. I signed in with the new password and changed it.

Same API, same kind of user, different result. The difference was who was calling. In the lab a signed-in administrator made the call. In production, an app made it, with nobody signed in.

## What writeback actually supports

Microsoft's [password writeback documentation](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-sspr-writeback) lists the supported cases. The two that matter here are an *administrator-initiated* reset from the Entra admin center, and one from the Graph `resetPassword` API.

The key word is administrator. Here's how the cases line up:

| Who changes the password | Written back to AD? | Basis |
| --- | --- | --- |
| Admin, Entra admin center | Yes | Microsoft docs |
| Admin, signed in, Graph `resetPassword` | Yes | Microsoft docs, and my lab |
| User resetting their own password through Graph | No | Microsoft docs |
| App or managed identity, Graph `resetPassword` | No | Production result above, and Microsoft Q&A answers |
| App or managed identity, `PATCH passwordProfile` | No | Production result above, and Microsoft Q&A answers |

The documentation never says outright that app-only calls are excluded. It just lists the admin cases. Microsoft staff on Q&A have said app-only resets don't trigger writeback by design, and that matches what I saw.

The practical rule: **writeback needs a signed-in admin behind the reset.** A Logic App, a runbook calling Graph, or any other unattended automation doesn't qualify, whatever permissions or roles you give it.

## It's worse than a password that doesn't work

If the temporary password simply failed, the starter would ring the service desk and get a reset. The forced-change flag makes it messier.

A colleague who'd hit this before described the sequence. The starter signs in to Entra with the cloud-only password, is prompted to change it, and the change fails, because it has to be written back to an AD account whose current password is different. It looks like a broken account on day one, for every new starter.

## What to do instead

If accounts are hybrid, the first credential has to come from somewhere AD trusts, or not be a password at all.

**Temporary Access Pass.** Lifecycle Workflows has a built-in task that generates one and sends it to the manager. There are no passwords to write back. One catch from my lab: using a TAP during Windows first-run setup forced Windows Hello for Business enrolment, even though the tenant wasn't configured for it. Test that against your device build before you commit.

**Set the password where the account is created.** If your provisioning creates the AD account, it can set the initial password there. AD stays the source of truth, and hash sync carries it to the cloud.

**Run the reset on-premises.** An Azure Automation runbook on a Hybrid Runbook Worker can call `Set-ADAccountPassword` directly. It works, but it's new infrastructure and a privileged on-premises account to manage.

I recommended TAP. It removes the password from the joiner process instead of finding another way to move one around.

## One more trap

If the AD account has *password never expires* set, the force-change flag isn't written to AD, even on a reset that is supported. The [same writeback page](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-sspr-writeback) says so. Clear it on your test users, or you'll get a false failure while proving any of the above.

## Before you sign off a first-password design

Ask one question: **is the account's password owned by AD?** If it is, any design where automation sets that password through Graph won't work. Pick TAP, set the password at creation, or run the reset on-premises, and decide that before it reaches a signed-off design.
