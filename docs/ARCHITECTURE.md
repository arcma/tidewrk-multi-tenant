# Architecture

Next.js browser UI → Laravel REST API → Sanctum authentication → tenant middleware →
role authorization → tenant-scoped Eloquent queries → MySQL.

## Isolation
Shared database/shared tables. Tenant-owned rows carry `tenant_id`. Middleware resolves the
tenant from the authenticated user's memberships. A request header cannot grant membership.
Every project/task query includes the resolved tenant ID. Never trust a tenant ID from a
request body. Consider composite foreign keys for stricter cross-tenant relational guarantees.

## Roles
`admin`, `manager`, `employee`, `viewer`. Backend checks are authoritative; hiding frontend
controls is only a UX feature.

## Caching and jobs
Use tenant-prefixed Redis keys such as `tenant:{id}:dashboard`, invalidating on writes.
Use Redis-backed Laravel queues for slow work. Jobs should carry tenant ID, re-establish
tenant context, be idempotent, and use retries/backoff and failed-job handling.

## Scaling
Run stateless Laravel instances behind a load balancer. Share MySQL, Redis, and object storage.
Scale queue workers separately. Use S3-compatible storage/CDN for uploaded files.
