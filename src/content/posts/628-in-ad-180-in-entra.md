---
title: '628 users in AD, 180 in Entra, and one account that belonged to two people'
description: 'Two small mistakes in a lab provisioning pipeline: a UPN expression that left spaces in, and an employee ID shared by two people. One hid most of my users. The other quietly merged two identities.'
pubDate: 2026-10-30
stage: hr-source
tags: ['API-driven inbound provisioning', 'Cloud Sync', 'Matching attributes', 'Data quality']
draft: true
---

This one comes from my lab rather than a client, which means I can show the broken bits without blurring anything out. The data was synthetic: a flat file of worker records going through API-driven inbound provisioning into on-premises Active Directory, then up to Entra ID with Cloud Sync.

The first sign of trouble was simple enough. Active Directory had 628 users in the target OU, and Entra had 180.

## Ruling out the obvious

My first thought was account status. If disabled users were somehow being filtered out, that would explain a gap. So I counted: 311 enabled and 317 disabled.

That ruled it out quickly. Disabled accounts sync across too, as far as I know, but even setting that aside, 180 is lower than the 311 enabled users on their own. Users weren't being filtered. Most of them were failing to sync at all.

## Spaces in the UPN

Looking at a few of the missing users, the UPNs were the giveaway. They looked like `First Last@domain`, with a space in the middle.

The provisioning app was building the UPN from `displayName`, and the expression wasn't removing the space. It also still had a placeholder domain left over from an example, rather than one of my verified domains. A quick count of how many objects were affected:

```powershell
(Get-ADUser -Filter * -SearchBase $ou -Properties userPrincipalName |
  Where-Object { $_.userPrincipalName -like "* *" }).Count
```

It came back with 485. That isn't an exact match for the 448 missing users, but it's close enough that I was fairly confident the UPNs were most of the story. Microsoft's [UPN planning page](https://learn.microsoft.com/en-us/entra/identity/hybrid/connect/plan-connect-userprincipalname) is clear that whitespace makes an on-premises UPN invalid for sync. That page is written for Connect Sync, where Entra calculates a replacement UPN rather than refusing the user, so I wouldn't assume Cloud Sync handles it identically. In my lab, those users simply weren't there.

I rewrote the mapping to build the UPN from the first and last name fields instead, and to clean it up properly on the way:

```text
ToLower(Join("@", NormalizeDiacritics(StripSpaces(Join(".", [givenName], [surname]))), DefaultDomain()))
```

`StripSpaces` removes any spaces, `NormalizeDiacritics` turns characters like é into e, and `DefaultDomain()` uses the tenant's default verified domain so there's no hard-coded suffix to go stale. All four are in Microsoft's [expression function reference](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/functions-for-customizing-application-data). I set the mapping to apply always, so it would correct existing objects as well as new ones.

For the objects already sitting in AD with bad UPNs, I wrote a fix-up script: back up the current values to CSV, rebuild each UPN from `givenName` and `sn`, add a number if the result is already taken, and run it with `-WhatIf` first.

```powershell
$targets = Get-ADUser -Filter * -SearchBase $ou -Properties userPrincipalName, givenName, sn |
  Where-Object { $_.userPrincipalName -like "* *" }

foreach ($u in $targets) {
    $local  = ("{0}.{1}" -f $u.givenName, $u.sn).ToLower() -replace '\s', ''
    $newUpn = "$local@$domain"
    $i = 1
    while (Get-ADUser -Filter "userPrincipalName -eq '$newUpn'" |
           Where-Object { $_.DistinguishedName -ne $u.DistinguishedName }) {
        $newUpn = "$local$i@$domain"; $i++
    }
    Set-ADUser -Identity $u.DistinguishedName -UserPrincipalName $newUpn -WhatIf
}
```

## The account that was two people

While I was testing the fix on a single user, I found something much stranger than a bad UPN.

I'd searched AD for one particular employee ID and got back exactly one object. Its name in the directory tree (the `cn`) belonged to one test user. Its first name, last name, display name and email all belonged to a different test user.

When I went back to the source file, the answer was sitting there: two different people had been given the same employee ID. My provisioning matched incoming records to AD objects on employee ID, so both of them resolved to the same object. Whichever record was processed last won, and wrote its details over the other's.

The name in the tree didn't change because, in my setup, provisioning updates never touched the `cn`. It's set when the object is created, so it still showed the first person while everything inside it described the second. Running provisioning again wouldn't have fixed anything either. It would just overwrite the object with whichever of the two records happened to go last.

Of everything in this lab, this is the part I'd worry about most in production. A missing user gets noticed quickly, because somebody rings up when they can't sign in, but a merged user can sit there for months. One person can end up with the other's group memberships, the audit trail mixes two people together, and a leaver workflow or an access review fires against whoever happens to be in the object at the time. None of it raises an error, because from provisioning's point of view it was a perfectly successful update.

## Fixing it at the source

The only real fix was in the data. Every worker needs an ID that's unique and doesn't change, and anything derived from it (in my case a user ID and an email prefix) has to be regenerated once it is.

This is the check I'd run on the file before sending anything to provisioning:

```powershell
Import-Csv .\workers.csv |
  Group-Object WorkerID |
  Where-Object { $_.Count -gt 1 } |
  Select-Object Name, Count
```

If that returns anything, the batch shouldn't go anywhere. In a real deployment, that check belongs in whatever sits between HR and the directory and normalises the data, because that layer's whole job is to hand clean, unique attributes to provisioning.

## Cleaning up without deleting

It's tempting to delete the damaged objects and let provisioning create them again cleanly. In a synced environment I'd avoid that. A deleted and recreated user is a new object with a new GUID, so as far as Entra is concerned it's a new person, and the old cloud account is left behind with its licences, groups and sign-in methods.

Everything here could be fixed in place. `Set-ADUser` handles the UPNs (trying it on a single user first is how I found the merged account). For the stale name, `Rename-ADObject` changes only the `cn`, and leaves the GUID, SID, UPN and group memberships alone:

```powershell
Get-ADUser -Filter "employeeID -eq '<id>'" | Rename-ADObject -NewName "<correct display name>"
```

The rename is mostly tidiness, since Entra takes the display name from `displayName` rather than `cn`. Still, an object whose name doesn't match the person inside it will confuse someone eventually.

## What I check first now

If I were setting up inbound provisioning again, I'd look at the matching attribute before anything else, and I don't just check that it's populated. I check that it's unique in the source data, because the provisioning service will trust it completely. After that, I'd make sure the UPN expression produces something valid for every name in the file, including the ones with spaces, apostrophes and accents. Both checks take a few minutes, and either problem is far more painful to find once the directory is full.
