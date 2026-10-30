---
title: 'The 204 that does nothing: resuming Lifecycle Workflows from a second Logic App'
description: 'A Lifecycle Workflows resume call can come back 204 No Content and still leave the task waiting. If a different identity is sending the callback, that is very likely why.'
pubDate: 2026-10-30
stage: lifecycle
tags: ['Lifecycle Workflows', 'Custom task extensions', 'Logic Apps', 'Microsoft Graph']
draft: false
---

I spent longer than I'd like to admit on this one, so I'm writing it down in the hope it saves someone else the time.

The setup was a custom task extension in Lifecycle Workflows, set to launch and wait. A Logic App did some work for each new starter and then called Graph to tell the workflow it was finished. Graph replied `204 No Content` every time, which is what success looks like. The workflow tasks sat at *In progress* anyway, until they hit the timeout and failed. Nothing in the Logic App run history looked wrong, and nothing told me why.

## Why there were two Logic Apps

Before each new starter's onboarding ticket could be raised, they needed to exist in ServiceNow. Graph's `provisionOnDemand` action will push a user into ServiceNow straight away, but it's rate limited, and each call took around three seconds while it waited on ServiceNow.

The catch is that Lifecycle Workflows doesn't queue anything for you. When a workflow runs over a batch of users, it calls your Logic App once for each of them, all at roughly the same time. A busy week of joiners would have sent a burst of calls at an API that wants them spaced out.

So I split the extension across two Logic Apps. The first one, which the extension triggers, does almost nothing: it drops the user's ID and their `callbackUriPath` onto an Azure Storage queue and finishes. A second Logic App runs on a schedule, works through the queue one message at a time, provisions each user, and then sends the resume call for that user's task. It needs to be two apps rather than one because a Logic App can only have a single trigger, and these two are woken up by different things.

Provisioning worked fine. Every user landed in ServiceNow correctly, and every resume call got its 204. None of the tasks moved.

## How the resume call works

When Lifecycle Workflows triggers a launch-and-wait extension, the payload includes `data.callbackUriPath`. It's a relative path ending in `/resume`:

```text
/identityGovernance/lifecycleWorkflows/workflows/{workflowId}/tasks/{taskId}/taskProcessingResults/{taskProcessingResultId}/resume
```

You add the Graph host to the front yourself. Microsoft's [Logic App template](https://learn.microsoft.com/en-us/entra/id-governance/configure-logic-app-lifecycle-workflows) uses `https://graph.microsoft.com/beta`, and v1.0 behaves the same. The [body](https://learn.microsoft.com/en-us/graph/api/identitygovernance-taskprocessingresult-resume) is small:

```json
{
  "data": { "operationStatus": "Completed" },
  "source": "provisioning-worker",
  "type": "lifecycleEvent"
}
```

I'd keep it exactly that shape. When I added an `@odata.type` to the body, Graph rejected it with *Invalid OData type specified*.

This is roughly what the second Logic App's HTTP action looked like in code view, signing in with its own managed identity:

```json
"Resume_lifecycle_task": {
  "type": "Http",
  "inputs": {
    "method": "POST",
    "uri": "https://graph.microsoft.com/v1.0@{body('Parse_queue_message')?['callbackUriPath']}",
    "body": {
      "data": { "operationStatus": "Completed" },
      "source": "provisioning-worker",
      "type": "lifecycleEvent"
    },
    "authentication": {
      "type": "ManagedServiceIdentity",
      "audience": "https://graph.microsoft.com"
    }
  }
}
```

There's nothing wrong with that action as written. What I'd overlooked was whose identity it was using.

## Who is allowed to resume a task

The answer is on the resume page, in a note that's easy to skim past. A task can be resumed by any app listed in the extension's `authorizedApps` (part of its `callbackConfiguration`), or by the app named in `resourceId` under the extension's token authentication settings. Neither needs any Graph permission. Anything else needs `LifecycleWorkflows.ReadWrite.All`, or a user with the Lifecycle Workflows Administrator role.

In the portal this lives under **Response authorization** on a launch-and-wait extension, and the [default](https://learn.microsoft.com/en-us/entra/id-governance/lifecycle-workflow-extensibility) is the managed identity of the Logic App the extension triggers.

With a single Logic App you never notice any of this, because the app that gets triggered is the same app that calls back. Once you split the work, the identity Lifecycle Workflows trusts is the first Logic App's, and the second one is a stranger to it.

## Accepted, and then ignored

I would have expected a 403 from an identity with no standing. Instead the call went through, Graph said 204, and the task stayed exactly where it was.

That's the part worth remembering. A 204 from the resume endpoint tells you Graph accepted the request. It doesn't tell you the task resumed. If you're looking at a 204 and a task that's still waiting, check which identity sent the call before you check anything else.

## Fixing it

The fix is to add the second Logic App's managed identity to the extension's authorised apps.

The quickest way is in the portal: open the custom task extension, go to **Response authorization**, choose **Existing application**, and pick the worker's managed identity. That replaces the default, which didn't matter here because the first Logic App never calls back.

If you'd rather do it through Graph, find the managed identity's application (client) ID under **Enterprise applications** with the *Managed identities* filter, and patch the extension:

```http
PATCH https://graph.microsoft.com/v1.0/identityGovernance/lifecycleWorkflows/customTaskExtensions/{customTaskExtensionId}
Content-Type: application/json

{
  "callbackConfiguration": {
    "@odata.type": "#microsoft.graph.identityGovernance.customTaskExtensionCallbackConfiguration",
    "timeoutDuration": "PT1H",
    "authorizedApps": [
      { "id": "<worker managed identity application ID>" }
    ]
  }
}
```

I'd send the whole `callbackConfiguration` rather than just the list of apps, so the timeout and any apps already authorised come along with it. A quick `GET` on the extension first shows you what's there. It's also worth setting the timeout long enough to cover the queue on your busiest day.

You could instead grant the worker `LifecycleWorkflows.ReadWrite.All`, and that would work too. But it lets the worker create, change and delete every workflow in the tenant, which is a lot of power to hand over to fix one callback. Adding it to `authorizedApps` is the narrower fix.

Once the worker was on the list, its callbacks resumed tasks exactly the way a single Logic App's would.

## If you're stuck on a 204 right now

These are the things I'd check, roughly in the order I wish I'd checked them:

1. Which identity sent the call? It needs to be the triggered Logic App's managed identity, an app in `authorizedApps`, or the app in `resourceId`. If it's none of those, you've probably found your problem.
2. Did the Graph host get added to the front of `callbackUriPath`, and is the task ID in that path from the current run?
3. Is the body just `data.operationStatus`, `source` and `type`, with nothing extra?
4. What does the task processing result say? A `GET` on it shows `processingStatus`. If it has already failed on timeout, rerun the workflow for that user rather than trying the resume again.

Splitting an extension like this is still the right call whenever the work behind a task is slow, rate limited or batched. Just give the second app permission to report back when you build it, rather than after a pile of 204s has told you nothing.
