---
title: 'The 204 that does nothing: resuming Lifecycle Workflows from a second Logic App'
description: 'A Lifecycle Workflows resume call can return 204 No Content and still leave the task waiting. If a different identity sends the callback, this is almost always why.'
pubDate: 2026-10-30
stage: lifecycle
tags: ['Lifecycle Workflows', 'Custom task extensions', 'Logic Apps', 'Microsoft Graph']
draft: false
---

You build a custom task extension in Lifecycle Workflows, set it to **launch and wait**, and have your Logic App post the resume call when its work is done. Graph answers `204 No Content`. The workflow task stays *In progress* until the timeout, then fails.

There's no error, and nothing in the Logic App run history says anything went wrong. On a recent hybrid deployment this took me far longer to find than it should have. The cause was one property on the extension.

## Why I split the work across two Logic Apps

The joiner workflow needed to provision each new starter into ServiceNow before it raised their onboarding ticket. Graph's `provisionOnDemand` action does that, but it's rate limited, and a ServiceNow round trip takes about three seconds.

Lifecycle Workflows doesn't queue for you. When a workflow runs for a batch of users, it calls the Logic App once per user, in parallel. Fifty joiners on a busy day means fifty simultaneous calls against a rate-limited API.

So I split the extension in two:

1. **Enqueuer.** The Logic App the extension triggers. It writes the user's object ID and their `callbackUriPath` to an Azure Storage queue, then ends without calling back.
2. **Worker.** A second Logic App on a recurrence trigger. It drains the queue one message at a time, provisions the user, then posts the resume call for that user's task.

It has to be two Logic Apps because a Logic App has exactly one trigger. The enqueuer is triggered by Lifecycle Workflows; the worker is triggered by a schedule.

The design was sound. The worker provisioned every user correctly, posted every resume, and got `204` every time. Not one task resumed.

## How the resume call works

When Lifecycle Workflows triggers a launch-and-wait extension, the payload includes `data.callbackUriPath`. It's a **relative** path that ends in `/resume`:

```text
/identityGovernance/lifecycleWorkflows/workflows/{workflowId}/tasks/{taskId}/taskProcessingResults/{taskProcessingResultId}/resume
```

You prefix the Graph root yourself. Microsoft's own [Logic App template](https://learn.microsoft.com/en-us/entra/id-governance/configure-logic-app-lifecycle-workflows) builds the URI as `https://graph.microsoft.com/beta` plus the path; v1.0 works the same way.

The body is small, and it's [documented](https://learn.microsoft.com/en-us/graph/api/identitygovernance-taskprocessingresult-resume):

```json
{
  "data": { "operationStatus": "Completed" },
  "source": "provisioning-worker",
  "type": "lifecycleEvent"
}
```

Send exactly that shape. In my testing, adding an `@odata.type` to the body made Graph reject it with *Invalid OData type specified*. Success is `204 No Content`.

Here is the worker's HTTP action in code view, authenticating with its own system-assigned managed identity:

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

Everything in that action is correct. The problem is whose identity it uses.

## Who is allowed to resume a task

The resume page lists the rule, though it's easy to read past. A task processing result can be resumed by:

- **An app in the extension's `authorizedApps`**, part of its `callbackConfiguration`. No Graph permission or role assignment is needed.
- **The app named in `resourceId`** of the extension's `azureAdTokenAuthentication`, also with no extra permission.
- **Anything else holding `LifecycleWorkflows.ReadWrite.All`**, or a user with the Lifecycle Workflows Administrator role.

In the portal this appears as **Response authorization** on a launch-and-wait extension. The [default](https://learn.microsoft.com/en-us/entra/id-governance/lifecycle-workflow-extensibility) is the system-assigned managed identity of the Logic App the extension triggers.

In a single Logic App design, that default is always right: the app that gets triggered is the app that calls back. In a split design, the identity Lifecycle Workflows trusts is the enqueuer's. The worker has its own managed identity, and Lifecycle Workflows has never heard of it.

## The trap: accepted, but ignored

I expected a `403` from an identity with no standing. That's not what happened. The worker's call reached the endpoint, Graph returned `204`, and the task processing result didn't move.

That changes how you read the response. **A 204 from resume means Graph accepted the request. It does not prove the task resumed.** When the task is still *In progress* after a 204, check the identity before you check anything else.

## The fix

Add the worker's managed identity to the extension's authorised apps. You have two ways to do it.

**In the portal.** Open the custom task extension, go to **Response authorization**, choose **Existing application**, and select the worker's managed identity. This replaces the default, which is fine here because the enqueuer never calls back.

**With Graph.** Find the worker identity's application (client) ID under **Enterprise applications** with the *Managed identities* filter. Then patch the extension:

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

Send the whole `callbackConfiguration`, not just the app list. That means the timeout plus every app that should be able to resume. `GET` the extension first so you don't drop anything already there. Set the timeout long enough to cover a full queue drain on your busiest day.

The other option is granting the worker `LifecycleWorkflows.ReadWrite.All`. It works, but it lets the worker create, change and delete every workflow in the tenant to fix one callback. Use `authorizedApps`.

After the change, the worker's callbacks resumed their tasks exactly as a single Logic App's would.

## If your resume returns 204 and nothing happens

Work through these in order:

1. **Identity.** Is the caller the triggered Logic App's managed identity, an app in `authorizedApps`, or the app in `resourceId`? If none of these, stop here; that's your fault.
2. **URI.** Did you prefix the Graph root onto `callbackUriPath`, and is the task ID in the path the one from this run?
3. **Body.** Is it exactly `data.operationStatus`, `source` and `type`, with nothing extra?
4. **State.** `GET` the task processing result and read `processingStatus`. If it has already failed on timeout, rerun the workflow for that user instead of retrying the resume.

Split extension designs are the right answer whenever the work behind a task is slow, rate-limited or batched. Just remember that splitting the work also splits the identity, and Lifecycle Workflows only listens to the one you told it about.
