# Clikarage product activation

This document describes the prepared architecture and the safe activation path. It is not an instruction to migrate production directly.

## Product model

The current garages table remains the customer organization for backward compatibility. A physical site is represented by garage_centers.

    organization (garages)
      -> establishments (garage_centers)
      -> members (garage_members)
      -> organization and establishment roles

An independent garage uses one organization and one establishment. Network-only navigation is enabled only when the organization has a network presentation profile or when an authorized deployment enables the network flag after schema validation.

Historical roles remain valid. The additive organization_role and center_role fields provide the generic mapping:

- organization_owner, network_admin, regional_manager, viewer ;
- center_manager, service_advisor, front_desk, technician, viewer.

## Prepared capabilities

| Capability | Persistent contract | Current presentation behavior |
|---|---|---|
| Workshop lifecycle | service_requests plus service_request_timeline | Complete local timeline and guarded transitions |
| Recommendations | workshop_recommendations and recommendation_decisions | Accept, decline, callback and question flows |
| Attachments | private Storage bucket plus service_request_attachments | Local metadata and image placeholders |
| Notifications | notification_outbox | Simulated provider; no external API |
| Delivery reports | delivery_reports | FR, EN and AR PDF generation |
| Maintenance | maintenance_reminders | Local scheduling and simulated conversion |
| Network dashboard | organization and center roles plus protected RPC | Multi-center comparison for authorized accounts |
| Center transfers | transfer journal plus protected RPCs | Same-organization transfer and customer decision |
| Integrations | provider-neutral metadata and TypeScript adapters | CSV preview, validation, deduplication and report |

The current request status remains denormalized for efficient reads. The timeline is append-only history. Sensitive transitions and decisions are represented by database RPCs in the prepared schema; the local presentation adapter enforces the same transition rules.

## Additive migration order

The following files are new, unique and strictly increasing. None is applied by this branch.

1. 20260715010000_workshop_lifecycle.sql
2. 20260715020000_workshop_recommendations.sql
3. 20260715030000_attachments_notifications.sql
4. 20260715040000_delivery_reports_reminders.sql
5. 20260715050000_organization_roles_network.sql
6. 20260715060000_center_transfers_integrations.sql

They depend on the reconciled platform admin migration and the two center migrations already present before them:

1. 20260706221227_platform_admins.sql
2. 20260713011000_garage_centers.sql
3. 20260713011100_service_request_center_stage.sql

The product migrations are additive: nullable compatibility columns, new tables, indexes, constraints, policies, triggers and RPCs. Existing rows and historical identifiers are preserved.

## Feature flags

Every schema-dependent capability is disabled by default in .env.example:

| Flag | Prerequisite |
|---|---|
| VITE_ENABLE_CENTERS | center migrations |
| VITE_ENABLE_WORKSHOP_TIMELINE | workshop lifecycle |
| VITE_ENABLE_RECOMMENDATIONS | lifecycle plus recommendations |
| VITE_ENABLE_ATTACHMENTS | recommendations plus private Storage policies |
| VITE_ENABLE_NOTIFICATIONS | lifecycle, recommendations and outbox |
| VITE_ENABLE_DELIVERY_REPORTS | lifecycle, recommendations and attachments |
| VITE_ENABLE_MAINTENANCE_REMINDERS | delivery reports |
| VITE_ENABLE_NETWORK_DASHBOARD | centers plus organization roles |
| VITE_ENABLE_INTEGRATIONS | centers plus integration metadata |

Outside presentation accounts, a false flag prevents the frontend from querying a new table. Missing-schema fallback is limited to missing relation or column errors; permission error 42501 is never hidden.

## Safe validation procedure

1. Create or select an explicitly non-production Supabase project with no production credentials in the local environment.
2. Confirm the project reference and database host before every CLI command.
3. Rebuild that database from all repository migrations in filename order.
4. Verify migration history has no duplicate version and matches the repository.
5. Run Supabase database advisors and inspect every SECURITY DEFINER function, fixed search_path, explicit authorization check, revoke and execute grant.
6. Run npm run test:rls only against that non-production database.
7. Test organization isolation, establishment integrity, client ownership, staff roles, network roles, attachments and transfer refusal across organizations.
8. Validate the private Storage bucket with allowed MIME types, file size limits and path ownership.
9. Exercise FR, EN, AR, RTL, PDFs and all presentation accounts.
10. Apply to production only through the normal reviewed migration pipeline and a separately approved maintenance window.
11. Keep every feature flag false immediately after schema deployment.
12. Enable flags one dependency group at a time, monitor errors, and preserve the existing path as rollback by disabling the flag.

No migration-history repair, database push, manual production SQL or direct data mutation belongs in this procedure.

## Suggested rollout

1. Centers and workshop timeline.
2. Recommendations and customer decisions.
3. Attachments, then notifications in in-app mode.
4. Delivery reports and reminders.
5. Network dashboard for eligible organizations.
6. Center transfers.
7. CSV integrations.
8. Real notification or business-system adapters only after provider-specific security and contractual review.

## External dependencies

Email, SMS, push, DMS, CRM, calendar, webhook and REST providers are interfaces only. No provider credentials exist in the frontend and no external API is called by presentation mode. A real integration requires a server-side secret store, retry and idempotency strategy, provider agreement, observability, rate limits and data-processing review.

## Blocking legal review

The current legal documents remain versioned working documents and must not be represented as legally finalized for commercial onboarding.

Legal review required before production onboarding:
- replace pilot-specific contractual wording;
- align DPA with attachment/document processing;
- define retention for notification recipient addresses;
- validate marketing reminder consent and legal basis.

## Validation boundary

Static TypeScript, lint, unit, build and security checks can run locally. Database reconstruction, RLS anti-leak tests, Storage policy tests and advisor output require an explicitly non-production migrated database. They must not be reported as successful until that environment has been used.
