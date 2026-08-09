# Security baseline

This repository is an independently maintained fork of TencentDB Agent Memory.
The fork starts from upstream commit `104e9d88588d506d1cd75cf7eb5957513319cad4`.

The upstream project is useful prior art, but its release artifacts are not
interchangeable with this fork. Production use should pin a reviewed release
of `dev-agent-memory` and follow the adopting organization's artifact
approval process.

## Security invariants

1. Package installation must not modify OpenClaw, another dependency, or any
   host-runtime files. The upstream `postinstall` runtime patch is not part of
   this package's lifecycle.
2. Conversation, tool, prompt, source-code, and memory content must not be sent
   to an observability vendor. The upstream optional Opik integration is
   disabled in this fork.
3. The HTTP Gateway must fail closed when authentication is not configured,
   except for an explicit local-development override.
4. Every stored record and every retrieval operation must be scoped to an
   authorized tenant and resource boundary before semantic ranking occurs.
5. External LLM, embedding, VectorDB, proxy, and offload endpoints must be
   explicitly allow-listed. Local mode must not imply that model processing is
   local unless the configured endpoint is local.
6. Secrets and sensitive identifiers must be redacted before persistence,
   model submission, diagnostics, and logs.
7. Memory is advisory. It must never authorize a merge, deployment, approval,
   access grant, destructive action, or other workflow state transition.
8. Dependencies must be locked, scanned, represented in an SBOM, and obtained
   through an approved registry in CI and production.

## Data handled by this component

- Slack messages and user identifiers
- agent prompts and responses
- tool parameters and results
- source snippets, diffs, test output, and logs
- inferred facts, scenarios, preferences, and operating procedures
- LLM and embedding credentials in runtime configuration

Treat the default data classification as confidential engineering data. The
component is not approved for regulated, export-controlled, production-secret,
or customer data until the owning team completes the relevant data review.

## Approved production shape

- private network or loopback Gateway binding;
- mandatory authenticated requests;
- company-approved LLM and embedding endpoints;
- SQLite or an approved US-hosted internal datastore;
- encryption at rest supplied by the host platform;
- outbound network deny-by-default with explicit endpoint allow-listing;
- separate storage roots and encryption boundaries where tenant isolation is
  required;
- centralized audit events that contain metadata, not prompt/message content.

## Upstream update process

Upstream changes are never merged directly into the production branch. Create
an update branch, record the old and new upstream commits, review the complete
diff, regenerate the lockfile and SBOM, run security and functional tests, and
document any change to network, filesystem, process, credential, prompt, or
storage behavior.
