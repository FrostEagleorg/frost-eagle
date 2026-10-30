---
title: "Why your Logic App can't set a hybrid user's first password"
description: 'Graph will happily change a synced user''s password from automation. The change just never reaches Active Directory, and the new starter is left with a password that doesn''t work.'
pubDate: 2026-11-13
stage: first-sign-in
tags: ['Password writeback', 'Microsoft Graph', 'Lifecycle Workflows', 'Hybrid identity']
draft: true
---

On paper the design was simple, and I still think it was a reasonable one. Three days before someone started, a Lifecycle Workflow would call a Logic App. The Logic App would generate a temporary password, set it on the user through Microsoft Graph, and email it to their manager. On their first morning the new starter would sign in and be asked to pick a password of their own.

The client signed it off, and in a cloud-only tenant I'm fairly sure it would have worked. This tenant was hybrid, though, and that's where it came apart.

## What happened

Every account was created in on-premises Active Directory and synced up to Entra ID, with password hash sync running and password writeback switched on.

The Logic App ran as its own managed identity. It called Graph, Graph said the call succeeded, and the manager got their email. Then the temporary password didn't work at sign-in. The user's original AD password still did.

I tried both of the ways Graph lets you set a password: a `PATCH` on the user with a new `passwordProfile`, and the `resetPassword` action on their password authentication method. Each of them changed the password in Entra ID, and neither changed it in AD. Since AD owns a synced user's password, the cloud-side change simply didn't hold. Turning on writeback in Cloud Sync as well made no difference.

## The clue

Two things didn't fit the idea that writeback was broken.

A password reset from the Entra admin center, on the same user, worked fine. That goes through the same writeback path, so writeback itself was clearly doing its job.

Then I tried it in my lab. Signed in to Graph Explorer as an admin, I called `resetPassword` on a synced user, and the new password reached AD. I could sign in with it and change it afterwards without any trouble.

So the same API, used on the same kind of user, behaved differently in the two places. What had changed was who was calling it. In my lab it was me, signed in as an administrator. In production it was an app, and nobody was signed in at all.

## What writeback actually supports

Microsoft's [password writeback documentation](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-sspr-writeback) has a list of the operations it supports. Two of them are relevant here: a reset by an administrator from the Entra admin center, and a reset by an administrator through the Graph `resetPassword` API. Both assume an administrator is the one doing it.

Putting the documentation together with what I saw:

| Who changes the password | Reaches AD? | Basis |
| --- | --- | --- |
| An admin, in the Entra admin center | Yes | Microsoft docs |
| An admin, signed in, through Graph `resetPassword` | Yes | Microsoft docs, and my lab |
| A user resetting their own password through Graph | No | Microsoft docs |
| An app or managed identity, through Graph `resetPassword` | No | The production result above, and Microsoft Q&A answers |
| An app or managed identity, through `PATCH passwordProfile` | No | The production result above, and Microsoft Q&A answers |

The documentation doesn't say in so many words that app-only calls are left out. It only lists the cases where an admin is involved. Microsoft staff answering on Q&A have said that app-only resets don't trigger writeback by design, which lines up with what happened here.

The way I'd put it now is that writeback needs a signed-in admin behind the reset. A Logic App doesn't count, and neither does a runbook calling Graph or any other unattended automation, whatever permissions or roles you give it.

## Why it's worse than it sounds

A password that just doesn't work is annoying but fixable: the new starter rings the service desk and somebody resets it. The force-change flag makes this a bit nastier.

A colleague who had run into it before explained what the user goes through. They sign in to Entra with the cloud-only password, get prompted to change it, and the change fails, because it has to be written back to an AD account whose current password is something else. From the user's side it looks like their account is broken, and that happens to every new starter on their first day.

## What I'd use instead

When the accounts are hybrid, the first credential has to come from somewhere AD trusts, or it shouldn't be a password at all.

The option I recommended was a Temporary Access Pass. Lifecycle Workflows has a built-in task that generates one and sends it to the manager, and there's no password to write back anywhere. One thing to test first, though: in my lab, using a TAP during Windows first-run setup pushed the user into Windows Hello for Business enrolment, even though the tenant wasn't set up for it. You'll want to know how that plays with your device build before you commit.

If your provisioning creates the AD account, it can also set the starting password right there. AD stays in charge of the password, and hash sync carries it up to the cloud as usual.

The heavier option is to do the reset on-premises, with an Azure Automation runbook running on a Hybrid Runbook Worker and calling `Set-ADAccountPassword`. It works, but it means new infrastructure and a privileged on-premises account to look after, which is hard to justify for one task.

I leaned towards TAP mostly because it takes the password out of the joiner process altogether, rather than finding a cleverer way to move one around.

## A trap while you're testing

If the AD account has *password never expires* set, the force-change flag isn't written to AD, even on a reset that writeback does support. It's mentioned on the [same writeback page](https://learn.microsoft.com/en-us/entra/identity/authentication/concept-sspr-writeback), and one of my test users had it set. Clear it before you test, or you'll be chasing a failure that has nothing to do with any of the above.

## The question to ask early

If I were reviewing a first-password design now, the first thing I'd ask is whether AD owns the account's password. If it does, any plan that has automation setting that password through Graph is going to run into this. TAP, a password set at creation, or an on-premises reset will all work, and it's a lot easier to choose between them before anyone has signed anything.
