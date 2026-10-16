# Archive module

## Placement and access

The admin sidebar has **Administration → Archive**. It is not part of the employee menu.
All `/api/archive/*` endpoints authenticate the caller against the current employee record and require an admin department. A stale JWT admin claim cannot grant admin access. Archiving an employee increments `auth_version`: their old JWT remains invalid even if the employee is later restored. They must sign in again.

Existing operational DELETE routes now archive records, preserving their prior route permissions with additional department checks. Front desk may archive front desk logs, guest requests and lost-and-found records; housekeeping may archive its tasks/logs, guest requests, lost-and-found and maintenance requests; maintenance may archive maintenance requests and housekeeping logs. Other categories require admin access. Staff cannot browse the archive, restore, or purge records.

## Storage and query behavior

Every existing top-level Mongoose model has `deleted_at: Date | null`, `deleted_by: String | null`, and an internal `archive_revision` counter. Embedded booking transactions also have `deleted_at`/`deleted_by`. Legacy documents with no flag are treated as active. No SQL tables are introduced.

- Normal find/findOne/count/distinct/update queries and existing aggregations are scoped to active documents.
- Normal booking JSON and the transactions listing exclude individually archived ledger entries.
- Internal `.withArchived()` is a server-side query capability, never an HTTP option.
- Generic request payloads cannot write archive fields or revocation counters.
- Ordinary model hard deletes, document deletes, and bulk deletes fail closed. The purge service explicitly opts in after checking that the record is archived.
- Direct database access is outside these application protections; restrict database users and retain backups.

Guests are embedded in bookings. The Guests category is a view of archived reservation records, **not a separate independently deletable guest table**. Its restore/purge actions affect the entire booking, including its guest details and ledger. The dashboard states this before either action.

Transactions are embedded rows identified by `<booking MongoDB _id>:<txn_id>`. Only voided transactions can be individually archived. They remain voided when restored; restoration never revives a charge/payment/refund. An archived parent booking must be restored first. Guests and transactions are not duplicated into new collections.

## Financial and relationship safeguards

- Only checked-out, cancelled or no-show reservations with zero outstanding balance can be archived. Their original ledger is retained unchanged; genuine payments must **not** be voided merely to archive a stay.
- Reservations containing any non-voided financial entry cannot be permanently deleted. Restore them or retain them in Archive.
- Archived reservations are omitted from standard dashboards/reports, as requested; archiving is therefore not a financial period-close operation. Export required historical reports before archival if needed.
- Active dependent records block parent archival. Both active and archived dependents block parent purging. Restore checks natural identifiers, account username/email collisions, shift-day conflicts and required active parent records.
- Active identifier uniqueness is enforced by partial unique indexes (installed by the migration). Restoration refuses to run if its required unique indexes are missing.
- Mutation plus archive-journal entries commit together inside a MongoDB transaction. This requires a replica set (including Atlas) or supported sharded deployment. There is deliberately no unsafe non-transactional fallback.
- The acting account and restored parent dependencies are touched inside the transaction so concurrent archival/revocation causes a write conflict. Existing unrelated creation/edit workflows still use their own validations; this is not a database-wide foreign-key system.
- The last active admin and your own account cannot be archived. Financial audits and the dedicated `archive_events` journal are not archivable. Only `LOG-` operational entries are available in the Front desk logs category.

## API

Use a Bearer JWT. Category names are allowlisted; arbitrary collection names are rejected. Canonical names: `bookings`, `guests`, `transactions`, `employees`, `rooms`, `room_types`, `shifts`, `shift_assignments`, `guest_requests`, `cleaning_tasks`, `lost_and_found`, `maintenance_requests`, `housekeeping_logs`, `front_desk_logs`. Hyphens may replace underscores; `reservations` aliases `bookings` and `audits` aliases **only** front desk logs.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/archive/categories` | Allowed categories and notices |
| GET | `/api/archive/:category` | Paginated archived records and original column metadata |
| POST | `/api/archive/:category/:id/archive` | Soft-delete an active record (admin only) |
| PATCH | `/api/archive/:category/:id/restore` | Restore an archived record |
| DELETE | `/api/archive/:category/:id` | Permanently remove an archived record after safeguards |

List parameters: `search`, `status`, `from=YYYY-MM-DD`, `to=YYYY-MM-DD`, `page` (default 1), `limit` (default 25, max 100). Date filters use Philippine calendar days. Search is escaped literal text, not executable regex. Password hashes/photos and internal counters are excluded from archive responses. Original fields are flattened into column keys; long nested values are available in Details.

Permanent DELETE JSON body:

```json
{
  "confirmation": "housekeeping_logs:507f1f77bcf86cd799439011",
  "password": "<current administrator password>",
  "reason": "Duplicate record confirmed by administrator"
}
```

The confirmation must match the **canonical category and exact ID**. Passwords are bcrypt-verified, never stored in audit events. Five password attempts per account per 15 minutes are allowed per API process; a multi-instance deployment should replace this in-memory throttle with a shared limiter. Use HTTPS in production. A new token may be required for legacy plaintext-password accounts: the existing login flow upgrades them.

Errors: 400 invalid inputs/category; 401 revoked/expired access; 403 insufficient permissions/password; 404 missing record; 409 state/identifier/dependency conflict; 429 password throttle; 503 missing indexes or transaction-capable database. No automatic cascading deletion.

## Deployment / migration

The application and tests do not automatically connect to a database or run this migration. Run the following manually **from `back-end`**, against the intended database after a backup and while application writes are stopped:

```sh
npm run archive:check
npm run archive:migrate
```

Both commands use the existing `MONGO_URI` environment configuration. The first is read-only and does not create indexes. It reports duplicate active identifier counts without printing personal records or connection strings. Resolve duplicates deliberately before continuing; no script silently deletes or renumbers them.

The apply command checks transaction support, fills only missing metadata, and adds archive/active-unique indexes. It is idempotent, never drops existing indexes, and leaves already archived timestamps intact. Embedded legacy transaction flags can stay missing (meaning active); new rows get null defaults. Index/migration errors can leave a partially applied **additive** migration; fix the reported issue and rerun. Server auto-indexing is disabled to avoid unreviewed index changes at startup. Successful migration is required before production rollout.

Indexes cover each model's business identifier, case-insensitive active portal usernames, and active employee/shift-date assignments. Empty or duplicate active usernames with portal access must be corrected before applying.

## Verification

`npm test` in `back-end` exercises actual Mongoose query hooks with stubbed collections and the actual Express router on an isolated local port. It does not read `.env`, contact MongoDB, or mutate hotel records. Frontend tests cover filters, confirmation requirements, failed restores and duplicate-submission protection. Transaction orchestration tests stub the transaction wrapper: database-level rollback/concurrent-write behavior still requires staging verification on a replica set.

Staging checklist: archive → standard list/count/report excludes → archive list includes → restore → original ID/data returns; purge only an archived disposable fixture; reject employee/nonadmin/old revoked JWT; verify dependency and duplicate-ID conflicts; force journal-write failure and confirm transaction rollback. Never use real guest or financial records for destructive testing.

Implementation references: [Mongoose middleware](https://mongoosejs.com/docs/middleware.html), [Mongoose transactions](https://mongoosejs.com/docs/transactions.html).
