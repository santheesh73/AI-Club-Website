import { supabaseAdmin } from '../../services/supabase';
import { logger } from '../../utils/logger';

export interface AuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  requestId?: string;
  createdAt: string;
}

// In-memory store for fallback / testing environment
const mockAuditLogs: AuditLogEntry[] = [];

export class AuditService {
  /**
   * Append an immutable audit record
   */
  async createLog(params: {
    actorId: string;
    action: string;
    entityType?: string;
    entityId: string;
    metadata?: Record<string, unknown>;
    requestId?: string;
  }): Promise<AuditLogEntry> {
    const {
      actorId,
      action,
      entityType = 'APPLICATION',
      entityId,
      metadata = {},
      requestId,
    } = params;

    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorId,
      action,
      entityType,
      entityId,
      metadata,
      requestId,
      createdAt: new Date().toISOString(),
    };

    logger.info(`[AUDIT] Action: ${action} on ${entityType}:${entityId} by Actor:${actorId}`, {
      action,
      entityType,
      entityId,
      actorId,
      requestId,
    });

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('audit_logs')
          .insert({
            actor_id: actorId,
            action,
            entity_type: entityType,
            entity_id: entityId,
            metadata,
            request_id: requestId,
          })
          .select()
          .single();

        if (error) {
          logger.error('Failed to persist audit log to PostgreSQL', { error: error.message });
        } else if (data) {
          return {
            id: data.id,
            actorId: data.actor_id,
            action: data.action,
            entityType: data.entity_type,
            entityId: data.entity_id,
            metadata: data.metadata,
            requestId: data.request_id,
            createdAt: data.created_at,
          };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Database error';
        logger.error('AuditLog insert exception', { error: msg });
      }
    }

    mockAuditLogs.unshift(entry);
    return entry;
  }

  /**
   * Retrieve audit history for an entity
   */
  async getLogsForEntity(entityId: string): Promise<AuditLogEntry[]> {
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from('audit_logs')
          .select('*')
          .eq('entity_id', entityId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data.map((d) => ({
            id: d.id,
            actorId: d.actor_id,
            action: d.action,
            entityType: d.entity_type,
            entityId: d.entity_id,
            metadata: d.metadata,
            requestId: d.request_id,
            createdAt: d.created_at,
          }));
        }
      } catch {
        // Fallback to in-memory store
      }
    }

    return mockAuditLogs.filter((log) => log.entityId === entityId);
  }
}

export const auditService = new AuditService();
