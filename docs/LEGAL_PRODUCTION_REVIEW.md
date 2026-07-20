# Clikarage legal production review

Status: technical and editorial draft for human legal review. This document does not state or imply approval by a lawyer.

> Document à faire valider par un conseil juridique avant la première contractualisation commerciale importante.

## Scope and versions

| Route | Current purpose | Version | Reference language |
|---|---|---|---|
| `/legal` | Legal notice | `legal-2026-01` | French |
| `/privacy` | Privacy policy | `privacy-2026-01` | French |
| `/terms` | B2B SaaS terms and limited motorist access terms | `terms-2026-01` | French |
| `/dpa` | Article 28 GDPR data processing draft | `dpa-2026-01` | French |
| `/pilot-agreement` | Historical pilot agreement only | `2026-07-02` | French |
| `/pro/legal-status` | Current and historical acceptance journal | N/A | Active UI language |

No effective date is published yet. `legalEffectiveDate` remains `null` until a reviewed deployment date is approved. English and Arabic pages identify the French text as the reference in case of discrepancy.

## Publisher identity

- Publisher: Anas RODRIGUEZ BENKARROUM, Entrepreneur individuel.
- Trading name: RODANBTECH.
- Software product: Clikarage. Clikarage is not represented as a separate company.
- SIREN: `103 878 187`.
- SIRET: `103 878 187 00014`.
- Address: `47 rue Vivienne, 75002 Paris, France`.
- Contact: `anas.rodriguez@rodanbtech.com`, `+33 7 81 18 93 65`.
- Publication director: Anas RODRIGUEZ BENKARROUM.

The current corpus consistently states: `Clikarage est un service édité par RODANBTECH.`

## Editorial changes

- The current terms describe a commercial B2B SaaS for independent garages, groups and multi-center organizations.
- The roles of professional contracting customer, garage user and end motorist are separated.
- RODANBTECH is not presented as a repairer, automotive expert, insurer or payment intermediary.
- Availability and security use reasonable-means wording; no uninterrupted service or absolute-security promise is made.
- The privacy policy covers Auth accounts, profiles, organizations, centers, vehicles, service records, quotes, decisions, private attachments, signed URLs, reports, reminders, notifications, legal acceptances, logs and backups.
- The DPA distinguishes the garage as controller for its customer records and RODANBTECH as processor when acting on documented garage instructions.
- The pilot agreement is absent from the current public footer and from new acceptance requirements.

## Historical preservation

The `2026-07-02` legal notice, privacy policy, terms, pilot agreement and DPA are retained as immutable source snapshots. Their public configuration is frozen in `historicalLegal20260702.ts`; current legal constants cannot change their displayed version or identity values.

`/pilot-agreement` displays an explicit historical notice and links to `/terms`. Historical versions of the other documents remain available through `?version=2026-07-02`. Source hashes are covered by automated tests. Existing acceptances are never rewritten.

The production schema currently stores document type, version, user, role, date, user agent and acceptance context. The additive, unapplied migration `20260719111617_add_legal_acceptance_versioning_contracts.sql` adds nullable `displayed_language`, `document_id` and `organization_id`. Historical rows remain `NULL` for these fields; new rows use the stable identifier `document_type:document_version` and record the language actually displayed.

## Data protection assumptions

The following retention periods are proposals, not final commitments:

| Data | Proposed rule requiring legal validation |
|---|---|
| Accounts | Active relationship plus a proportionate evidence period |
| Service records, quotes, decisions, reports and attachments | Garage instructions and applicable automotive/accounting obligations |
| Legal acceptances | Up to five years after the relationship where needed as evidence |
| Technical logs | Up to 90 days, longer only for a documented incident |
| Notification recipient addresses | Only as long as needed to send, troubleshoot and evidence the message |
| Backups | Documented technical overwrite cycle |

Marketing and maintenance reminders require a documented legal basis configured by the garage. Signed download URLs are temporary confidential links and must not be intentionally logged by the application.

## Providers to confirm

- Supabase provides database, Auth and Storage; the production database region is configured as `eu-west-3` (Paris). Confirm the current contracting entity, subprocessor list, DPA and transfer safeguards before signature: [Supabase regions](https://supabase.com/docs/guides/platform/regions), [Supabase DPA](https://supabase.com/downloads/docs/Supabase%2BDPA%2B260601.pdf).
- Vercel hosts the web interface. Confirm the plan-specific contracting entity and terms before signature: [Vercel terms](https://vercel.com/legal/terms).
- Squarespace is identified for domain administration. Confirm its precise role and current contractual entity: [Squarespace terms](https://www.squarespace.com/terms-of-service).
- The email provider is still described as `Google Workspace / Squarespace, selon la configuration du domaine`; the actual provider and DPA must be confirmed.
- No SMS, DMS or payment provider is represented as connected.

## Arabic PDF evidence

The Arabic handover report is generated with the bundled Amiri regular and bold fonts. The test fixture contains fictional identities, dates, mileage, technical references, amounts, recommendations, decisions and two explicit photo placeholders. Technical identifiers use LTR rendering while the document, sections and lists use RTL layout.

- PDF: [`output/pdf/clikarage-delivery-report-ar.pdf`](../output/pdf/clikarage-delivery-report-ar.pdf)
- Page 1: [`docs/assets/legal/clikarage-delivery-report-ar-page-1.png`](assets/legal/clikarage-delivery-report-ar-page-1.png)
- Page 2: [`docs/assets/legal/clikarage-delivery-report-ar-page-2.png`](assets/legal/clikarage-delivery-report-ar-page-2.png)

The committed captures were rendered at 1310 x 1853 pixels and visually inspected before the independent review. Arabic letters are joined, lists are RTL, dates are readable, technical values remain LTR, page numbers are present, and no clipping, overlap or missing glyph was observed. Those captures still predate the final localization of the three financial labels and are no longer sufficient as final visual evidence. The generator and PDF test now use Arabic labels with LTR amount values; the PDF and captures must be regenerated and inspected before activation.

## Independent review corrections

The post-validation review corrected nine merge-blocking issues without enabling the corpus: flags-off routes and active versions now remain frozen on `2026-07-02`; the legacy DPA path remains user-scoped; center-scoped legacy admins cannot accept an organization DPA; non-public service-level and AI-policy text is absent from the frontend runtime; Arabic PDF financial labels are localized in the generator; the V2 publisher/VAT identity block no longer leaks French into English or Arabic; the unverified `Supabase, Inc.` entity assertion was replaced with the neutral product name `Supabase`; and the language-switch regression test now covers the fail-closed historical layout as well as the V2 wording. The forward-only migration `20260720151800_preserve_legacy_legal_acceptance_fail_closed.sql` contains no data rewrite.

## Blocking before contracting

- Obtain human legal review of the French legal notice, terms, privacy policy and DPA.
- Approve the effective date and deployment versions without changing historical versions.
- Confirm pricing/order-form hierarchy, support commitment, maintenance notice, liability cap, termination notice and competent-court wording.
- Validate every proposed retention period and the legal basis for reminders and marketing communications.
- Confirm subprocessors, contracting entities, locations, international transfers and Article 28 terms.
- Confirm the process for data-subject requests, breach notices, exports, deletion and backup expiry.
- Determine whether any consumer-facing mediation or pre-contract information is required for the end-motorist journey.

## Recommended before broad rollout

- Publish and maintain a current subprocessor register and change-notice procedure.
- Define an operational privacy mailbox workflow and incident response contacts.
- Document support hours, recovery objectives and export formats in the commercial order form.
- Add a human-reviewed accessibility and plain-language pass to all three languages.

## Future improvements

- Store a cryptographic content digest in addition to the stable document identifier if evidentiary requirements justify it.
- Add configurable retention enforcement after the legal schedule is approved.
- Introduce provider-specific notice templates only when each provider is actually connected.

## Future deployment procedure

1. Obtain written legal approval and confirm the effective date.
2. Freeze and hash the approved FR/EN/AR corpus; update versions only if counsel requires a new revision.
3. Rebuild locally and on staging, including the additive acceptance migration.
4. Apply the migration through the reviewed Supabase pipeline; never rewrite historical acceptances.
5. Deploy with all product feature flags still off and smoke-test every legal route.
6. Verify new acceptances record version, language, stable document identifier and organization context.
7. Monitor Auth/API logs without logging document URLs, tokens or personal data.
8. Activate product modules only through the separately approved progressive rollout.
