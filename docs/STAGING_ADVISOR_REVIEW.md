# Supabase staging advisor review

This review applies only to project `zazdhzmfrtecxtglhoso`. It does not authorize
any production change.

## Public branding storage

`garage-logos` follows the public-branding model. Its objects are organization
logos intentionally embedded in public pages, public quotes, emails, and PDFs.
No customer document, workshop attachment, invoice, report, or diagnostic may
be stored there. Business attachments remain in the private
`service-request-attachments` bucket.

The branding bucket accepts only PNG, JPEG, and WebP files up to 2 MiB. Object
names must follow `{organization_uuid}/logo.{png|jpg|jpeg|webp}`. Only active
organization owners and admins may list, create, replace, or delete their own
logo. Public URL reads are intentional; anonymous and cross-organization
listings are not.

## Security Advisor before and after

The staging baseline contained 35 warnings. The hardened state contains 34:

- 33 SECURITY DEFINER execution warnings remain. Three anonymous quote RPCs are
  intentional capability-token endpoints. Authenticated business RPCs are
  intentional and enforce authenticated identity, tenant ownership, and role
  checks. `is_garage_member` is a policy helper required by legacy RLS. These
  warnings remain documented rather than being disabled blindly.
- The `expire_quotes()` warning was removed: it is not an interactive user
  operation and is now restricted to `service_role` by the hardening migration.
- One Auth warning remains because leaked-password protection is disabled. It
  must be evaluated against the
  staging plan and fixture-account compatibility before activation.

All SECURITY DEFINER functions use a fixed search path. The `public` schema
does not grant CREATE to `public`, `anon`, or `authenticated`. Private trigger
functions are not executable through the Data API.

## Performance Advisor before and after

The staging baseline contained 111 warnings. After migration and the hosted
validation suite, 92 remain:

- 32 unindexed foreign keys: corrected with covering indexes.
- 16 RLS init-plan warnings: corrected by evaluating `auth.uid()` through a
  scalar select once per statement.
- 75 currently unused indexes: retained because staging has too little traffic
  and data to establish that an index is redundant. This count includes the new
  foreign-key indexes and can fall as representative queries exercise them.
- 17 multiple-permissive-policy warnings: retained because they model distinct
  valid access paths such as staff versus owning customer. They require load
  testing before any consolidation.

Representative staging plans are sub-millisecond to low-millisecond on the
current fictitious dataset. Sequential scans on dashboard and dossier queries
are expected with only nine requests; index removal is not justified by this
volume.

## Validation cleanup

Request, quote, recommendation, report, notification, and Storage fixtures are
removed through their normal tenant-scoped APIs. Maintenance reminders are
intentionally retained by the product when a request is deleted, so staging
validation reminders use only the sources `local_validation` and
`staging_journey_validation`. A privileged staging-only cleanup must remove
those tagged rows after the remote suite; production must never be targeted.
