# Your Agent Bought a Tool. Who Got Your Data?

*Composio Instant launched October 8, 2026. Here is the application boundary I would put in front of a newly available tool.*

Your agent needs to research a vendor. It finds a tool. The tool costs pocket change. The agent pays, runs the search, and comes back with a useful answer.

Lovely.

Except the search included your internal renewal notes. You approved researching the vendor. Somehow that became approval to brief an external provider on your negotiation strategy.

The tool was read-only. Your data still left the building.

On October 8, [Composio launched Instant](https://composio.dev/blog/composio-instant): access to more than 100 supported paid tools without separate provider signups. Its announcement includes research, enrichment, transcription, and media generation. This is an October 8 launch, not something announced today.

Removing setup friction is useful. It also makes one engineering question harder to postpone:

**What is this particular call allowed to disclose?**

I built a tiny TypeScript gate that answers that question for a deliberately narrow workflow. No API key. No model call. No money. Twenty-five deterministic checks.

![Tool availability, task permission, and data release are separate decisions.](https://raw.githubusercontent.com/bobbyhalljr/agent-data-release-gate/main/images/cover.png)

## A read-only call can still export data

A search tool does not need a `send_email` permission to disclose information. Its input is a message to its provider.

Think about these two requests:

```text
Research Example Robotics at example.com.

Research Example Robotics. Our private renewal notes say
we can tolerate a 40% price increase. Use that context.
```

The operation name can be identical. The data boundary is different.

The company and negotiation detail above are fictional. The distinction is the point: a tool's effect on the remote system and its effect on your information are separate questions.

![Both calls are read-only, but only one contains approved public inputs.](https://raw.githubusercontent.com/bobbyhalljr/agent-data-release-gate/main/images/read-only.png)

A budget control asks whether you can afford the call. A tool allowlist asks whether the operation is available. Neither establishes whether this recipient can receive these fields for this task.

## What the launch changes, and what it does not

[Composio's current Instant documentation](https://docs.composio.dev/docs/instant-tools) describes supported actions running on its provider accounts, billed to the organization's balance. Users still need their own connections for private or account-specific access. The docs explicitly say inputs reach the provider and Instant does not imply zero data retention.

That is not a claim that Composio leaked anything. It is a reason to build the boundary intentionally.

As checked on October 10, the documentation marks Instant experimental. It also distinguishes the Session's tool availability from Instant account usage. Once the project enables Instant, omitting the Session's `instant` setting permits eligible usage; `instant: false` prevents Instant charges for that Session. Connected accounts can remain usable.

Those are product controls. The gate below is a separate application policy. It does not configure or test the Composio SDK, and its fictional tool IDs are not Composio slugs.

## Make the model select, not rewrite

The useful design choice is to keep raw arguments out of this tiny proposal:

```ts
const proposal = {
  tool: 'companySearch',
  recordIds: ['vendor'],
  fields: ['company', 'domain'],
};
```

The model can propose a known tool, record IDs, and field names. The application supplies three trusted inputs:

- The authenticated task scope: tenant, permitted tools, recipients, and fields.
- The reviewed tool registry: recipient, credential source, and accepted data classes.
- The record store: values, tenant ownership, and field classifications.

The model cannot attach `label: 'public'` to a private paragraph. It cannot add a free-text `query` argument. The parser rejects extra keys rather than quietly ignoring them.

This is restrictive on purpose. If the model can copy any paragraph into an unrestricted search string, the neat field labels no longer control what leaves.

![Model selectors enter the gate; application-owned records and policy determine the outgoing projection.](https://raw.githubusercontent.com/bobbyhalljr/agent-data-release-gate/main/images/projection.png)

The fixture's `companySearch` route accepts public fields. Its `crmLookup` route accepts public and internal fields. The task explicitly permits both recipients. That CRM permission is an example policy decision, not a universal rule that connected accounts are safe.

Restricted fields are denied on both routes. Another tenant's records are denied before projection, even if the requested fields are public. Public classification does not erase ownership.

## Check every field before returning any payload

Here is the core loop from `gate.ts`:

```ts
const rows: Record<string, string>[] = [];
for (const id of recordIds) {
  if (!own(records, id)) return deny('unknown-record');
  const record = records[id];
  if (record.tenant !== task.tenant) return deny('tenant-mismatch');
  const row: Record<string, string> = {};
  for (const f of fields) {
    if (!own(record.cells, f)) return deny('unknown-field');
    const cell = record.cells[f];
    if (!route.labels.includes(cell.label)) {
      return deny('data-class-not-approved');
    }
    row[f] = cell.value;
  }
  rows.push(row);
}
```

Before this loop, the function validates the proposal shape, rejects unknown tools, checks the task's tool and recipient scope, and checks its field scope. Identifier lists have a ten-item bound and cannot contain duplicates. Registry lookups require own properties so a name such as `toString` cannot resolve through the object prototype.

The function returns an outgoing projection only after the entire batch passes. A public record followed by another tenant's record returns a denial, not the first half of a payload.

An allow decision includes the reviewed recipient and credential source. The example treats those as trusted registry facts. A real adapter must resolve and enforce the actual account and destination at dispatch time. A friendly tool name is not that proof.

![The exact four fixture decisions: public search allowed, private search denied, permitted CRM notes allowed, cross-tenant selection denied.](https://raw.githubusercontent.com/bobbyhalljr/agent-data-release-gate/main/images/decisions.png)

## Run it locally

The review bundle contains `gate.ts`, `fixtures.ts`, `test.ts`, and `package.json`. Save them together. With Node.js 22.20.0 or newer:

```sh
git clone https://github.com/bobbyhalljr/agent-data-release-gate.git
cd agent-data-release-gate
npm test
```

There are no package dependencies to install. The command runs `node --experimental-strip-types test.ts`. [Node's TypeScript documentation](https://nodejs.org/api/typescript.html) explains the supported syntax. Type stripping executes these files; it does not type-check them.

The tests print each named check, then these exact lines:

```text
25/25 checks passed
publicSearch: ALLOW recipient=research-provider credential=instant fields=company,domain
privateSearch: DENY data-class-not-approved
connectedNotes: ALLOW recipient=tenant-crm credential=connected fields=notes
crossTenant: DENY tenant-mismatch
```

These are local policy decisions, not observed Composio responses. The tests cover private inputs, restricted fields, task scope, recipients, mixed-tenant batches, unknown records, extra arguments, duplicates, and malformed proposals. They also inspect the allowed projection to confirm that unselected notes and the synthetic token are absent.

Public source: [bobbyhalljr/agent-data-release-gate](https://github.com/bobbyhalljr/agent-data-release-gate).

## What this little gate cannot prove

It does not inspect natural language for secrets. A wrongly labeled public field can still contain private information. It does not classify data, authenticate a tenant, verify provider retention, resolve real credentials, or intercept network traffic.

It also does not support arbitrary model-written queries, derived summaries, attachments, URLs, or tool results being fed directly into another call. Those need their own provenance and release rules. A summary of an internal note does not become public because it is shorter.

The trusted task, registry, and record store must come from application state. Never fill them from the same model output you are checking. This example assumes those structures are valid; it validates the untrusted proposal at runtime.

For production, put the check in the only dispatcher that can execute the tool. Build the outgoing arguments from the permitted projection and send those exact arguments. Recheck stale policy or account mappings before dispatch. Record identifiers, policy version, resolved route, decision, and execution evidence without copying sensitive values into the audit log.

That last step matters. A function that says `ALLOW` does not prove which account ran a tool, what data the adapter sent, or whether an external call completed.

I am building Roster around AI employees that do real work. Tools should get easier to use. Permission to disclose information should remain an application decision.

A new tool is a new capability. Your customer's private notes are not the onboarding fee.
