import React from 'react';
import { getSession } from '../utils/agentAuth';
import WeeklyComplianceFollowup from '../../components/WeeklyComplianceFollowup';
import { MessageSquare } from 'lucide-react';

/**
 * Field Agent / Technician Follow-ups Page
 * Displays routine pond testing compliance, supervisor follow-up directives,
 * and enables direct responses from technicians in the field.
 */
const Followups = () => {
  const session = getSession();
  const agentId = session?.agentId || session?.id || 'agent001';

  return (
    <div style={{ padding: 'clamp(12px, 3vw, 24px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          backgroundColor: '#EEF2FF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1A2FB8',
          flexShrink: 0
        }}>
          <MessageSquare size={22} />
        </div>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Weekly Testing Compliance &amp; Follow-ups
          </h1>
          <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
            Review overdue routine pond tests, supervisor follow-up directives, and replies.
          </p>
        </div>
      </div>

      <div className="content-inner">
        <WeeklyComplianceFollowup
          portalType="AGENT"
          agentId={agentId}
          variant="full"
          style={{ margin: 0 }}
        />
      </div>
    </div>
  );
};

export default Followups;
