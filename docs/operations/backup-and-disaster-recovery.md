# AI CLUB — Backup, Disaster Recovery & Incident Response Runbook

> **Milestone 10: Production Hardening, Security, Testing, Deployment & Launch Readiness**  
> Operational strategy and procedures for disaster resilience, data backups, credential rotation, and incident management.

---

## 1. Resilience Objectives (RTO & RPO)

| Metric | Target | Description |
|---|---|---|
| **RPO (Recovery Point Objective)** | **< 5 minutes** | Maximum allowable data loss in the event of hardware or datacenter failure. |
| **RTO (Recovery Time Objective)** | **< 15 minutes** | Maximum allowable platform downtime before critical services are fully restored. |
| **Availability Target** | **99.95%** | Production SLA excluding scheduled maintenance windows. |

---

## 2. Backup Strategy & Procedures

### 2.1 Continuous Point-in-Time Recovery (PITR)
The primary persistence layer (Supabase PostgreSQL 15) utilizes Write-Ahead Log (WAL) streaming:
- **Continuous Archiving**: Every transaction is archived to off-site, geographically replicated object storage within seconds.
- **Granular Restoration**: The database can be restored to any millisecond within the past 7 to 30 days.

### 2.2 Automated Daily Logical Snapshots (`pg_dump`)
In addition to PITR, a nightly scheduled GitHub Action / cron job executes a schema and data dump:

```bash
#!/usr/bin/env bash
set -eo pipefail

TIMESTAMP=$(date -u +"%Y%m%d_%H%M%SZ")
BACKUP_DIR="/secure/backups/aiclub"
BACKUP_FILE="${BACKUP_DIR}/aiclub_db_${TIMESTAMP}.sql.gz"

echo "[BACKUP] Starting automated PostgreSQL backup at ${TIMESTAMP}..."

# Export schema and data, excluding transient audit logs older than retention period if desired
pg_dump "${SUPABASE_DB_URL}" \
    --format=custom \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    | gzip -9 > "${BACKUP_FILE}"

# Encrypt backup with AES-256 GPG key
gpg --batch --yes --encrypt --recipient ops@aiclub.university.edu "${BACKUP_FILE}"
rm -f "${BACKUP_FILE}"

# Replicate encrypted archive to secondary offsite cold storage (AWS S3 Glacier or equivalent)
aws s3 cp "${BACKUP_FILE}.gpg" "s3://aiclub-cold-backups/database/${TIMESTAMP}/"

echo "[BACKUP] Backup completed and archived successfully."
```

### 2.3 Object Storage Replication
The `avatars` and `project-media` Supabase Storage buckets store user assets:
- **Versioning**: Object versioning is enabled to defend against accidental overwrites or malicious deletes.
- **Sync Schedule**: Daily rsync/rclone job mirrors all media to an encrypted S3 bucket.

---

## 3. Database Restoration & Failover Runbook

### 3.1 Point-in-Time Recovery (PITR) Execution
If data corruption occurs (e.g. accidental bulk deletion or flawed migration):
1. Navigate to the **Supabase Dashboard** -> **Project Settings** -> **Database** -> **Backups**.
2. Select **Point in Time Recovery**.
3. Specify the exact UTC timestamp immediately preceding the incident (e.g. `2026-10-07 12:45:00 UTC`).
4. Trigger restoration. Supabase spins up a replica at the specified timestamp and switches traffic.
5. Verification: Check audit logs and run health probes (`GET /health`).

### 3.2 Manual Snapshot Restoration
To restore from a logical snapshot on a new or recovery database instance:

```bash
# 1. Decrypt snapshot
gpg --decrypt "${BACKUP_FILE}.gpg" > restored.sql.gz
gunzip restored.sql.gz

# 2. Restore schema and data using pg_restore
pg_restore -d "${RECOVERY_DB_URL}" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    restored.sql

# 3. Apply any subsequent delta migrations
supabase db push

# 4. Verify table row counts and RLS integrity
psql "${RECOVERY_DB_URL}" -c "SELECT count(*) FROM profiles; SELECT count(*) FROM memberships;"
```

---

## 4. Credential & Secret Rotation Policy

To comply with enterprise security standards, all credentials must be rotated on a regular schedule or immediately upon suspicion of compromise.

| Secret | Rotation Cadence | Rotation Procedure | Impact / Downtime |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | 90 days | Generate new key in Supabase settings; update backend secret manager; zero-downtime rolling restart of backend. | Zero downtime |
| `SUPABASE_JWT_SECRET` | 180 days | Update secret; causes all currently issued client JWTs to expire, requiring re-login. | Active sessions invalidated |
| `GEMINI_API_KEY` | 90 days | Generate new API key in Google Cloud Console; update backend env; rolling restart. | Zero downtime |
| Database Password | 90 days | Update master password in Supabase; update backend connection pool strings. | Rolling restart |

---

## 5. Incident Response & Severity Matrix

### 5.1 Severity Levels

| Severity | Definition | Notification SLA | Target Resolution SLA |
|---|---|---|---|
| **P1 - Critical** | Platform down, database unreachable, authentication outage, or active security exploit. | < 5 minutes | < 1 hour |
| **P2 - High** | Degraded performance, assessment engine failure, rate limiter false positives, or partial feature outage. | < 15 minutes | < 4 hours |
| **P3 - Medium** | Non-critical bug, UI formatting issue, minor notification delay. | < 1 business day | < 3 business days |

### 5.2 Incident Triage Protocol
1. **Detect & Alert**: Monitoring alert triggered via `/health` probe (503 response) or high error rate (> 1% of total HTTP requests).
2. **Containment**:
   - If security breach: immediately rotate service-role key, revoke active tokens, or activate Cloudflare under-attack mode.
   - If corrupted release: execute immediate rollback via PM2 / container orchestrator to the previous verified release tag.
3. **Investigation**: Inspect structured logs (`LOG_LEVEL=info/warn`), review audit log entries in `audit_logs` table (`action`, `actor_id`, `ip_address`).
4. **Resolution**: Deploy validated hotfix or restore snapshot.
5. **Post-Mortem**: Document root cause, timeline, affected users, and corrective actions within 48 hours.
