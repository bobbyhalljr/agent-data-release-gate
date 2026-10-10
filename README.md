# Agent data release gate

A dependency-free TypeScript example accompanying the pending article **Your Agent Bought a Tool. Who Got Your Data?**

Article: approved for publication; live article URL will be added after DEV publication.

## Purpose

Validate untrusted selectors against trusted task scope, tool routes, tenant ownership, and field classifications. Return an all-or-nothing projection. The model cannot supply raw outgoing values or relabel records.

## Run

Prerequisite: Node.js 22.20.0 or newer.

```sh
git clone https://github.com/bobbyhalljr/agent-data-release-gate.git
cd agent-data-release-gate
npm test
```

No installation or API key required. This uses Node type stripping, not a TypeScript type check.

## Tested summary

```text
25/25 checks passed
publicSearch: ALLOW recipient=research-provider credential=instant fields=company,domain
privateSearch: DENY data-class-not-approved
connectedNotes: ALLOW recipient=tenant-crm credential=connected fields=notes
crossTenant: DENY tenant-mismatch
```

Full check output: test-output.txt. Fixture tool names and records are fictional, not Composio API identifiers. No provider call, charge, or data transfer occurs.

## Limitations

This validates proposals, not the trusted policy/store inputs. No authentication, automatic classification, provider integration, account resolution, retention verification, network enforcement, or free-text provenance. A trusted label can be wrong. The connected CRM rule is explicitly allowed by the sample policy; connected credentials do not inherently grant release permission. A production dispatcher must enforce the real recipient/account and send only the checked projection.

## Primary references

- [October 8 launch](https://composio.dev/blog/composio-instant)
- [Instant Tools docs, checked October 10](https://docs.composio.dev/docs/instant-tools)
- [Node TypeScript execution](https://nodejs.org/api/typescript.html)

