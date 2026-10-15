import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle, CheckCircle2, Clock, Send, MessageSquare,
  Search, RefreshCw, User, Shield, ChevronRight, X,
  Calendar, MapPin, Phone, ArrowUpRight, Check, AlertTriangle
} from 'lucide-react';
import adminService from '../admin/utils/adminService';

/**
 * Weekly Tank-Test Follow-up & Due Tracking Component
 * Shared across Admin, ASM/Incharge, and Agent portals.
 * Enforces strict distinction between Test Compliance (COMPLIANT vs DUE)
 * and Follow-up State (DUE vs ADDRESSED).
 */
export default function WeeklyComplianceFollowup({
  portalType = 'ADMIN', // 'ADMIN' | 'ASM' | 'AGENT'
  inchargeId = null,
  agentId = null,
  compact = false,
  onComplianceUpdated = null
}) {
  const [activeTab, setActiveTab] = useState('DUE'); // 'DUE' | 'ADDRESSED'
  const [complianceData, setComplianceData] = useState({
    counts: { totalActiveTanks: 0, compliantCount: 0, dueCount: 0, addressedCount: 0, totalDueTests: 0 },
    dueList: [],
    addressedList: [],
    compliantList: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTank, setSelectedTank] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [followupText, setFollowupText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadData = async (force = false) => {
    try {
      if (force) setIsRefreshing(true);
      else setIsLoading(true);

      const params = {};
      if (portalType === 'ASM' && inchargeId) params.inchargeId = inchargeId;
      if (portalType === 'AGENT' && agentId) params.agentId = agentId;

      const data = await adminService.getComplianceDueList(params, force);
      if (data && data.counts) {
        setComplianceData(data);
        if (onComplianceUpdated) onComplianceUpdated(data);
      }
    } catch (err) {
      console.error('[WeeklyComplianceFollowup] Error loading compliance list:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);

    const handleEventRefresh = () => loadData(true);
    window.addEventListener('complianceFollowupCreated', handleEventRefresh);
    window.addEventListener('submissionCreated', handleEventRefresh);

    return () => {
      window.removeEventListener('complianceFollowupCreated', handleEventRefresh);
      window.removeEventListener('submissionCreated', handleEventRefresh);
    };
  }, [portalType, inchargeId, agentId]);

  // Load history when a tank is opened in detail modal
  const openDetailModal = async (tank) => {
    setSelectedTank(tank);
    setFollowupText('');
    setActionError('');
    setActionSuccess('');
    setIsLoadingHistory(true);

    try {
      const history = await adminService.getFollowupHistory(tank.tankId, tank.cycleKey);
      setHistoryList(history || []);
    } catch (err) {
      console.error('[WeeklyComplianceFollowup] Error loading history:', err);
      setHistoryList(tank.followups || []);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSendFollowup = async (e) => {
    e.preventDefault();
    const trimmed = (followupText || '').trim();
    if (!trimmed) {
      setActionError('Please enter a follow-up message before submitting.');
      return;
    }
    if (!selectedTank) return;

    setIsSubmitting(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await adminService.submitFollowup({
        tankId: selectedTank.tankId,
        cycleKey: selectedTank.cycleKey,
        recipientId: selectedTank.agentId || null,
        recipientName: selectedTank.agentName || null,
        message: trimmed
      });

      if (res) {
        setActionSuccess('Follow-up message successfully recorded! Due cycle moved to Addressed.');
        setFollowupText('');

        // Refresh conversation history in modal immediately
        const updatedHistory = await adminService.getFollowupHistory(selectedTank.tankId, selectedTank.cycleKey);
        setHistoryList(updatedHistory);

        // Refresh entire compliance state
        await loadData(true);

        // Update selectedTank reference to reflect Addressed state
        setSelectedTank(prev => prev ? {
          ...prev,
          followupStatus: 'ADDRESSED',
          followupCount: (prev.followupCount || 0) + 1,
          latestFollowup: {
            senderName: res.senderName || 'You',
            senderRole: res.senderRole || 'ADMIN',
            message: trimmed,
            createdAtDisplay: 'Just now'
          }
        } : null);
      }
    } catch (err) {
      console.error('[WeeklyComplianceFollowup] Submit error:', err);
      setActionError(err.message || 'Failed to submit follow-up message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentList = activeTab === 'DUE' ? complianceData.dueList : complianceData.addressedList;

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase();
    return currentList.filter(t =>
      (t.tankName || '').toLowerCase().includes(q) ||
      (t.farmerName || '').toLowerCase().includes(q) ||
      (t.farmerVillage || '').toLowerCase().includes(q) ||
      (t.agentName || '').toLowerCase().includes(q) ||
      (t.inchargeName || '').toLowerCase().includes(q) ||
      (t.latestFollowup?.message || '').toLowerCase().includes(q)
    );
  }, [currentList, searchQuery]);

  const { counts } = complianceData;

  return (
    <div style={styles.container}>
      {/* Header bar */}
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <div style={styles.titleIconBox}>
            <AlertCircle size={20} color="#DC2626" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={styles.title}>Weekly Tank-Test Follow-up &amp; Due Tracking</h3>
              <span style={styles.rollingTag}>Rolling 7-Day Cycle</span>
            </div>
            <p style={styles.subtitle}>
              Active culture ponds requiring weekly routine water telemetry testing and supervisor follow-up.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          style={styles.refreshBtn}
          title="Refresh compliance metrics from database"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* KPI Overview Strip */}
      <div style={styles.kpiStrip}>
        <div style={styles.kpiBox}>
          <span style={styles.kpiLabel}>TOTAL ACTIVE PONDS</span>
          <div style={styles.kpiValue}>{counts.totalActiveTanks}</div>
          <span style={styles.kpiHint}>Under Cultivation</span>
        </div>
        <div style={{ ...styles.kpiBox, borderLeft: '3px solid #16A34A' }}>
          <span style={styles.kpiLabel}>COMPLIANT (TESTED IN 7 DAYS)</span>
          <div style={{ ...styles.kpiValue, color: '#16A34A' }}>{counts.compliantCount}</div>
          <span style={styles.kpiHint}>Up to Date</span>
        </div>
        <div style={{ ...styles.kpiBox, borderLeft: '3px solid #DC2626' }}>
          <span style={styles.kpiLabel}>DUE FOR FOLLOW-UP</span>
          <div style={{ ...styles.kpiValue, color: '#DC2626' }}>{counts.dueCount}</div>
          <span style={styles.kpiHint}>Awaiting Message</span>
        </div>
        <div style={{ ...styles.kpiBox, borderLeft: '3px solid #2563EB' }}>
          <span style={styles.kpiLabel}>ADDRESSED (FOLLOWED UP)</span>
          <div style={{ ...styles.kpiValue, color: '#2563EB' }}>{counts.addressedCount}</div>
          <span style={styles.kpiHint}>Test Still Pending</span>
        </div>
      </div>

      {/* Distinction Note */}
      <div style={styles.bannerInfo}>
        <span style={{ fontWeight: 700, color: '#0F172A' }}>Note:</span>
        <span style={{ color: '#475569', marginLeft: '6px' }}>
          A tank in <strong style={{ color: '#2563EB' }}>Addressed</strong> has received a follow-up directive, but its test remains overdue until a valid field test is successfully saved.
        </span>
      </div>

      {/* Tab bar and Search */}
      <div style={styles.controlsRow}>
        <div style={styles.tabGroup}>
          <button
            type="button"
            onClick={() => setActiveTab('DUE')}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeTab === 'DUE' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'DUE' ? '#DC2626' : '#64748B',
              boxShadow: activeTab === 'DUE' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              fontWeight: activeTab === 'DUE' ? 700 : 500
            }}
          >
            <span>Due</span>
            <span style={{
              ...styles.tabBadge,
              backgroundColor: activeTab === 'DUE' ? '#FEE2E2' : '#E2E8F0',
              color: activeTab === 'DUE' ? '#DC2626' : '#64748B'
            }}>
              {counts.dueCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ADDRESSED')}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeTab === 'ADDRESSED' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'ADDRESSED' ? '#2563EB' : '#64748B',
              boxShadow: activeTab === 'ADDRESSED' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              fontWeight: activeTab === 'ADDRESSED' ? 700 : 500
            }}
          >
            <span>Addressed</span>
            <span style={{
              ...styles.tabBadge,
              backgroundColor: activeTab === 'ADDRESSED' ? '#DBEAFE' : '#E2E8F0',
              color: activeTab === 'ADDRESSED' ? '#1D4ED8' : '#64748B'
            }}>
              {counts.addressedCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div style={styles.searchBox}>
          <Search size={15} color="#64748B" />
          <input
            type="text"
            placeholder="Search by tank, farmer, village, agent, or ASM..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tanks List */}
      <div style={styles.listContainer}>
        {isLoading ? (
          <div style={styles.emptyState}>
            <div className="animate-spin" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', margin: '0 auto 12px' }} />
            <span>Loading compliance data from database...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div style={styles.emptyState}>
            <CheckCircle2 size={36} color="#16A34A" style={{ marginBottom: '8px' }} />
            <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '15px' }}>
              {activeTab === 'DUE' ? 'No Due Tests Awaiting Follow-up!' : 'No Addressed Items Yet'}
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0' }}>
              {activeTab === 'DUE'
                ? 'All overdue tanks have either been followed up or all active culture ponds are compliant.'
                : 'Follow-up messages sent to technicians will be tracked here.'}
            </p>
          </div>
        ) : (
          filteredList.map((tank) => (
            <div
              key={tank.tankId}
              style={{
                ...styles.itemCard,
                borderLeft: activeTab === 'DUE' ? '4px solid #DC2626' : '4px solid #2563EB'
              }}
              onClick={() => openDetailModal(tank)}
            >
              {/* Card Top Row */}
              <div style={styles.itemHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={styles.tankNameBadge}>{tank.tankName}</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                    {tank.farmerName}
                  </span>
                  <span style={styles.localityText}>• {tank.farmerVillage}</span>
                  {tank.farmerPhone && (
                    <span style={styles.localityText}>• 📞 {tank.farmerPhone}</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    ...styles.overdueBadge,
                    backgroundColor: tank.daysOverdue >= 7 ? '#FEE2E2' : '#FEF3C7',
                    color: tank.daysOverdue >= 7 ? '#DC2626' : '#B45309'
                  }}>
                    {tank.daysOverdue} {tank.daysOverdue === 1 ? 'Day' : 'Days'} Overdue
                  </span>

                  <span style={{
                    ...styles.statusChip,
                    backgroundColor: activeTab === 'DUE' ? '#FEF2F2' : '#EFF6FF',
                    color: activeTab === 'DUE' ? '#DC2626' : '#1D4ED8',
                    border: activeTab === 'DUE' ? '1px solid #FECACA' : '1px solid #BFDBFE'
                  }}>
                    {activeTab === 'DUE' ? '🔴 Due for Action' : '🔵 Addressed'}
                  </span>
                </div>
              </div>

              {/* Assignment & Compliance Metadata */}
              <div style={styles.itemMetaGrid}>
                <div style={styles.metaCell}>
                  <span style={styles.metaLabel}>ASSIGNED AGENT</span>
                  <span style={{ ...styles.metaVal, color: '#2563EB' }}>👤 {tank.agentName}</span>
                </div>
                <div style={styles.metaCell}>
                  <span style={styles.metaLabel}>RESPONSIBLE ASM / INCHARGE</span>
                  <span style={styles.metaVal}>🛡️ {tank.inchargeName}</span>
                </div>
                <div style={styles.metaCell}>
                  <span style={styles.metaLabel}>LAST QUALIFYING TEST</span>
                  <span style={styles.metaVal}>{tank.lastTestDisplay}</span>
                </div>
                <div style={styles.metaCell}>
                  <span style={styles.metaLabel}>TEST COMPLIANCE</span>
                  <span style={{ ...styles.metaVal, color: '#DC2626', fontWeight: 700 }}>Test Overdue</span>
                </div>
              </div>

              {/* If Addressed: Latest Message Preview */}
              {tank.latestFollowup && (
                <div style={styles.followupPreviewBox}>
                  <div style={styles.followupPreviewHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={styles.senderRoleBadge}>
                        {tank.latestFollowup.senderRole}
                      </span>
                      <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '12px' }}>
                        {tank.latestFollowup.senderName}
                      </span>
                      {tank.latestFollowup.recipientName && (
                        <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                          → {tank.latestFollowup.recipientName}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                      {tank.latestFollowup.createdAtDisplay}
                    </span>
                  </div>
                  <p style={styles.followupPreviewText}>
                    "{tank.latestFollowup.message}"
                  </p>
                </div>
              )}

              {/* Card Bottom Action */}
              <div style={styles.itemFooter}>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                  Cycle: <code style={styles.codeTag}>{tank.cycleKey}</code>
                </div>

                <button
                  type="button"
                  style={activeTab === 'DUE' ? styles.actionBtnPrimary : styles.actionBtnSecondary}
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetailModal(tank);
                  }}
                >
                  <MessageSquare size={13} />
                  <span>{activeTab === 'DUE' ? 'Follow Up' : 'View Thread / Reply'}</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DETAIL & FOLLOW-UP MODAL */}
      {selectedTank && (
        <div style={styles.modalBackdrop} onClick={() => setSelectedTank(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={styles.modalTitle}>{selectedTank.tankName} — Compliance Follow-Up</h3>
                  <span style={{
                    ...styles.statusChip,
                    backgroundColor: selectedTank.followupStatus === 'DUE' ? '#FEF2F2' : '#EFF6FF',
                    color: selectedTank.followupStatus === 'DUE' ? '#DC2626' : '#1D4ED8'
                  }}>
                    {selectedTank.followupStatus === 'DUE' ? 'Due for Action' : 'Addressed'}
                  </span>
                </div>
                <p style={styles.modalSubtitle}>
                  Farmer: <strong>{selectedTank.farmerName}</strong> • {selectedTank.farmerVillage} • Phone: {selectedTank.farmerPhone || '-'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTank(null)}
                style={styles.modalCloseBtn}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={styles.modalBody}>
              {/* Compliance Metadata Strip */}
              <div style={styles.modalMetaStrip}>
                <div>
                  <span style={styles.metaLabel}>CULTURE METRICS</span>
                  <div style={styles.metaVal}>Day {selectedTank.doc} DOC ({selectedTank.abw}) • {selectedTank.size}</div>
                </div>
                <div>
                  <span style={styles.metaLabel}>ASSIGNED AGENT</span>
                  <div style={{ ...styles.metaVal, color: '#2563EB' }}>{selectedTank.agentName}</div>
                </div>
                <div>
                  <span style={styles.metaLabel}>SUPERVISING ASM</span>
                  <div style={styles.metaVal}>{selectedTank.inchargeName}</div>
                </div>
                <div>
                  <span style={styles.metaLabel}>LAST QUALIFYING TEST</span>
                  <div style={styles.metaVal}>{selectedTank.lastTestDisplay}</div>
                </div>
                <div>
                  <span style={styles.metaLabel}>OVERDUE DURATION</span>
                  <div style={{ ...styles.metaVal, color: '#DC2626', fontWeight: 700 }}>
                    {selectedTank.daysOverdue} Days Overdue
                  </div>
                </div>
              </div>

              {/* Compliance Rule Alert */}
              <div style={styles.complianceNotice}>
                <AlertTriangle size={15} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '12px', color: '#92400E', lineHeight: '1.4' }}>
                  <strong>Compliance Requirement:</strong> Every active pond must have at least one valid routine test recorded in the last 7 days. Sending a message sets follow-up state to <em>Addressed</em>, but the test status remains overdue until a valid test submission is persisted.
                </div>
              </div>

              {/* Follow-up Conversation Thread */}
              <div style={{ marginTop: '16px' }}>
                <h4 style={styles.sectionHeading}>
                  Follow-Up Conversation History ({historyList.length})
                </h4>

                <div style={styles.historyContainer}>
                  {isLoadingHistory ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                      Loading conversation thread...
                    </div>
                  ) : historyList.length === 0 ? (
                    <div style={styles.noHistoryNotice}>
                      No follow-up messages have been submitted yet for this weekly due cycle.
                    </div>
                  ) : (
                    historyList.map((item) => {
                      const isAdmin = (item.senderRole || '').toUpperCase() === 'ADMIN';
                      const isAsm = (item.senderRole || '').toUpperCase() === 'INCHARGE' || (item.senderRole || '').toUpperCase() === 'ASM';
                      return (
                        <div key={item.id} style={styles.historyItem}>
                          <div style={styles.historyHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                ...styles.senderRoleBadge,
                                backgroundColor: isAdmin ? '#DCFCE7' : isAsm ? '#DBEAFE' : '#FEF3C7',
                                color: isAdmin ? '#166534' : isAsm ? '#1E40AF' : '#92400E',
                                border: isAdmin ? '1px solid #BBF7D0' : isAsm ? '1px solid #BFDBFE' : '1px solid #FDE68A'
                              }}>
                                {item.senderRole}
                              </span>
                              <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>
                                {item.senderName}
                              </span>
                              {item.recipientName && (
                                <span style={{ fontSize: '12px', color: '#64748B' }}>
                                  → {item.recipientName}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                              {item.createdAtDisplay}
                            </span>
                          </div>
                          <div style={styles.historyBody}>
                            {item.message}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Message Composer */}
              <form onSubmit={handleSendFollowup} style={styles.composerForm}>
                <h4 style={styles.sectionHeading}>
                  {portalType === 'AGENT' ? 'Reply to Follow-Up' : 'Submit Follow-Up Directive'}
                </h4>

                {actionError && (
                  <div style={styles.errorAlert}>{actionError}</div>
                )}
                {actionSuccess && (
                  <div style={styles.successAlert}>{actionSuccess}</div>
                )}

                <textarea
                  style={styles.textarea}
                  rows={3}
                  placeholder={
                    portalType === 'ADMIN'
                      ? 'Enter follow-up directive for the Agent and supervising ASM (e.g. "Weekly water telemetry test is 5 days overdue. Please visit pond and record parameters today")...'
                      : portalType === 'ASM'
                        ? 'Enter urgent reminder for responsible Agent (e.g. "Please complete water test and feed sampling for Tank 1 today")...'
                        : 'Explain reason for delay or expected test completion time...'
                  }
                  value={followupText}
                  onChange={(e) => setFollowupText(e.target.value)}
                  disabled={isSubmitting}
                />

                <div style={styles.composerActions}>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>
                    Authenticated as <strong>{portalType}</strong>
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmitting || !followupText.trim()}
                    style={{
                      ...styles.submitBtn,
                      opacity: isSubmitting || !followupText.trim() ? 0.6 : 1,
                      cursor: isSubmitting || !followupText.trim() ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Send size={14} />
                    <span>{isSubmitting ? 'Recording...' : 'Send Follow-up Message'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '24px',
    boxShadow: '0 4px 18px rgba(15, 23, 42, 0.05)',
    margin: '24px 0'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  titleGroup: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px'
  },
  titleIconBox: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#FEE2E2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.01em'
  },
  rollingTag: {
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    padding: '2px 8px',
    borderRadius: '10px',
    border: '1px solid #BFDBFE'
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748B',
    margin: '4px 0 0'
  },
  refreshBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    color: '#334155',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  kpiStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginBottom: '16px'
  },
  kpiBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    padding: '12px 14px'
  },
  kpiLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748B',
    letterSpacing: '0.02em',
    textTransform: 'uppercase'
  },
  kpiValue: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '2px 0',
    letterSpacing: '-0.02em'
  },
  kpiHint: {
    fontSize: '11px',
    color: '#94A3B8'
  },
  bannerInfo: {
    backgroundColor: '#F1F5F9',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '12.5px',
    marginBottom: '16px',
    border: '1px solid #E2E8F0'
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  tabGroup: {
    display: 'inline-flex',
    backgroundColor: '#F1F5F9',
    borderRadius: '10px',
    padding: '3px',
    gap: '4px'
  },
  tabBtn: {
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.15s ease'
  },
  tabBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: '10px'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    padding: '8px 12px',
    flex: '1 1 240px',
    maxWidth: '380px'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '13px',
    color: '#0F172A',
    background: 'transparent'
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px dashed #CBD5E1'
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '16px',
    boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
    cursor: 'pointer',
    transition: 'transform 0.1s ease, border-color 0.15s ease'
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  tankNameBadge: {
    fontSize: '12px',
    fontWeight: 700,
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    padding: '3px 8px',
    borderRadius: '6px'
  },
  localityText: {
    fontSize: '13px',
    color: '#64748B'
  },
  overdueBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '6px'
  },
  statusChip: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '6px'
  },
  itemMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '10px',
    padding: '10px 0',
    borderTop: '1px solid #F1F5F9',
    borderBottom: '1px solid #F1F5F9',
    marginBottom: '10px'
  },
  metaCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  metaLabel: {
    fontSize: '10.5px',
    fontWeight: 600,
    color: '#94A3B8',
    letterSpacing: '0.02em',
    textTransform: 'uppercase'
  },
  metaVal: {
    fontSize: '12.5px',
    fontWeight: 600,
    color: '#0F172A'
  },
  followupPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    padding: '10px 12px',
    border: '1px solid #E2E8F0',
    marginBottom: '10px'
  },
  followupPreviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  senderRoleBadge: {
    fontSize: '10px',
    fontWeight: 700,
    backgroundColor: '#DBEAFE',
    color: '#1D4ED8',
    padding: '1px 6px',
    borderRadius: '4px'
  },
  followupPreviewText: {
    fontSize: '12.5px',
    color: '#334155',
    margin: 0,
    fontStyle: 'italic',
    lineHeight: '1.4'
  },
  itemFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px'
  },
  codeTag: {
    fontFamily: 'monospace',
    backgroundColor: '#F1F5F9',
    padding: '2px 5px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#475569'
  },
  actionBtnPrimary: {
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    padding: '7px 14px',
    borderRadius: '6px',
    fontSize: '12.5px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer'
  },
  actionBtnSecondary: {
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    border: '1px solid #BFDBFE',
    padding: '7px 14px',
    borderRadius: '6px',
    fontSize: '12.5px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer'
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '20px'
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    maxWidth: '720px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden'
  },
  modalHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0
  },
  modalSubtitle: {
    fontSize: '13px',
    color: '#64748B',
    margin: '4px 0 0'
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px'
  },
  modalBody: {
    padding: '20px 24px',
    overflowY: 'auto'
  },
  modalMetaStrip: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '12px',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    padding: '12px 14px',
    border: '1px solid #E2E8F0',
    marginBottom: '14px'
  },
  complianceNotice: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    backgroundColor: '#FEF3C7',
    border: '1px solid #FDE68A',
    borderRadius: '8px',
    padding: '10px 12px'
  },
  sectionHeading: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '0 0 10px'
  },
  historyContainer: {
    maxHeight: '220px',
    overflowY: 'auto',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  noHistoryNotice: {
    padding: '20px',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '13px'
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    padding: '10px 12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  historyBody: {
    fontSize: '13px',
    color: '#1E293B',
    lineHeight: '1.45',
    whiteSpace: 'pre-wrap'
  },
  composerForm: {
    marginTop: '20px',
    borderTop: '1px solid #E2E8F0',
    paddingTop: '16px'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '13.5px',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box'
  },
  composerActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  submitBtn: {
    backgroundColor: '#03358F',
    color: '#FFFFFF',
    border: 'none',
    padding: '9px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  errorAlert: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12.5px',
    marginBottom: '10px',
    border: '1px solid #FECACA'
  },
  successAlert: {
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '12.5px',
    marginBottom: '10px',
    border: '1px solid #BBF7D0'
  }
};
