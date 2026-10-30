import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AlertCircle, CheckCircle2, Clock, Send, MessageSquare,
  Search, RefreshCw, User, Shield, ChevronRight, X,
  Calendar, MapPin, Phone, ArrowUpRight, Check, AlertTriangle,
  ArrowLeft, MessageCircle, FileText, CheckCircle, Info
} from 'lucide-react';
import adminService from '../admin/utils/adminService';

/**
 * Weekly Tank-Test Follow-up & Due Tracking Component
 * Shared across Admin, ASM/Incharge, and Agent portals.
 *
 * Core Workflow Requirements:
 * 1. Two clearly labelled sections/tabs: Due (<count>) | Addressed (<count>).
 * 2. Clicking Due displays all overdue tank tests in a desktop table and mobile card list.
 * 3. Clicking an item opens its detail view without immediately opening the editor.
 * 4. Detail view features a prominent "Follow Up" button, which reveals the message composer.
 * 5. Sending a follow-up saves authenticated sender/role to MySQL, displays success notice,
 *    and moves item immediately from Due to Addressed without browser reload.
 * 6. Addressed section immediately displays "Addressed by" sender name, role, message excerpt,
 *    timestamp, and maintains "Still Due" test-compliance status.
 * 7. Admin and ASM share identical authoritative state in MySQL.
 * 8. Follow-up status (Addressed) and Test Compliance (Still Due) remain strictly separate.
 */
const getRoleBadgeStyle = (role, defaultRole = 'STAFF') => {
  const r = (role || defaultRole || '').toUpperCase();
  if (r === 'ADMIN') {
    return { bg: '#DCFCE7', text: '#166534', label: 'ADMIN' };
  }
  if (r === 'ASM' || r === 'INCHARGE') {
    return { bg: '#DBEAFE', text: '#1E40AF', label: 'ASM' };
  }
  if (r === 'AGENT' || r === 'TECHNICIAN') {
    return { bg: '#F3E8FF', text: '#6B21A8', label: 'AGENT' };
  }
  return { bg: '#F1F5F9', text: '#475569', label: r || 'STAFF' };
};

export default function WeeklyComplianceFollowup({
  portalType = 'ADMIN', // 'ADMIN' | 'ASM' | 'AGENT'
  inchargeId = null,
  agentId = null,
  compact = false,
  variant = 'full', // 'side-column' | 'full'
  onComplianceUpdated = null,
  style = {}
}) {
  const isSideColumn = variant === 'side-column' || compact;
  const [activeTab, setActiveTab] = useState('DUE'); // 'DUE' | 'ADDRESSED'
  const [complianceData, setComplianceData] = useState({
    counts: { totalActiveTanks: 0, compliantCount: 0, dueCount: 0, addressedCount: 0, totalDueTests: 0 },
    dueList: [],
    addressedList: [],
    compliantList: [],
    allTanks: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected item detail view
  const [selectedTank, setSelectedTank] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Follow-up message composer state
  const [isComposing, setIsComposing] = useState(false);
  const [followupText, setFollowupText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Mobile viewport detection
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadData = async (force = false) => {
    try {
      if (force) setIsRefreshing(true);
      else setIsLoading(true);
      setLoadError(null);

      const params = {};
      if (portalType === 'ASM' && inchargeId) params.inchargeId = inchargeId;
      if (portalType === 'AGENT' && agentId) params.agentId = agentId;

      const data = await adminService.getComplianceDueList(params, force);
      if (data && data.counts) {
        setComplianceData(data);
        if (onComplianceUpdated) onComplianceUpdated(data);
      } else {
        setLoadError('Failed to load compliance data from server.');
      }
    } catch (err) {
      console.error('[WeeklyComplianceFollowup] Error loading compliance list:', err);
      setLoadError(err.message || 'Failed to connect to database. Please retry.');
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

  // Open detail view for an item
  const openDetailModal = async (tank) => {
    setSelectedTank(tank);
    setIsComposing(false);
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

  // Close detail view
  const closeDetailModal = () => {
    setSelectedTank(null);
    setIsComposing(false);
    setFollowupText('');
    setActionError('');
    setActionSuccess('');
  };

  // Trigger composer
  const handleOpenComposer = () => {
    setIsComposing(true);
    setActionError('');
    setActionSuccess('');
  };

  // Cancel composer without modifying status
  const handleCancelComposer = () => {
    setIsComposing(false);
    setFollowupText('');
    setActionError('');
  };

  // Resolve authenticated user identity based on active portal and localStorage
  const getCurrentUser = () => {
    try {
      if (portalType === 'ASM') {
        const incSessionStr = localStorage.getItem('incharge_auth_session');
        if (incSessionStr) {
          const s = JSON.parse(incSessionStr);
          return {
            id: s.inchargeId || s.id || inchargeId || 'INC001',
            name: s.name || 'Ravi Kumar',
            role: 'ASM'
          };
        }
        const authUserStr = localStorage.getItem('auth_user');
        if (authUserStr) {
          const u = JSON.parse(authUserStr);
          return {
            id: u.id || inchargeId || 'INC001',
            name: u.name || u.full_name || 'Ravi Kumar',
            role: 'ASM'
          };
        }
        return {
          id: inchargeId || 'INC001',
          name: 'Ravi Kumar',
          role: 'ASM'
        };
      }

      if (portalType === 'AGENT') {
        const agSessionStr = localStorage.getItem('agent_auth_session');
        if (agSessionStr) {
          const s = JSON.parse(agSessionStr);
          return {
            id: s.agentId || s.id || agentId || 'agent001',
            name: s.name || 'Ramesh',
            role: 'AGENT'
          };
        }
        const authUserStr = localStorage.getItem('auth_user');
        if (authUserStr) {
          const u = JSON.parse(authUserStr);
          return {
            id: u.id || agentId || 'agent001',
            name: u.name || u.full_name || 'Ramesh',
            role: 'AGENT'
          };
        }
        return {
          id: agentId || 'agent001',
          name: 'Ramesh',
          role: 'AGENT'
        };
      }

      // Default Admin portal
      const admSessionStr = localStorage.getItem('admin_auth_session');
      if (admSessionStr) {
        const s = JSON.parse(admSessionStr);
        return {
          id: s.adminId || s.id || 'ADM001',
          name: s.name || 'System Administrator',
          role: 'ADMIN'
        };
      }
      const authUserStr = localStorage.getItem('auth_user');
      if (authUserStr) {
        const u = JSON.parse(authUserStr);
        return {
          id: u.id || 'ADM001',
          name: u.name || u.full_name || 'System Administrator',
          role: (u.role || 'ADMIN').toUpperCase()
        };
      }
    } catch (e) { }

    return { id: 'ADM001', name: 'System Administrator', role: 'ADMIN' };
  };

  // Submit follow-up message
  // Submit follow-up message
  const handleSendFollowup = async (e) => {
    if (e) e.preventDefault();
    const trimmed = (followupText || '').trim();

    // Frontend validation: non-empty message
    if (!trimmed) {
      setActionError(portalType === 'AGENT' ? 'Please enter a reply message before submitting.' : 'Please enter a follow-up message before submitting.');
      return;
    }
    if (!selectedTank) return;

    // Prevent accidental double-submission
    if (isSubmitting) return;
    setIsSubmitting(true);
    setActionError('');
    setActionSuccess('');

    try {
      const currentUser = getCurrentUser();
      const isAgent = portalType === 'AGENT';

      // For Agent portal, reply directly to the original supervisor/admin who messaged
      const originalSupervisor = historyList.find(f => {
        const r = (f.senderRole || '').toUpperCase();
        return r === 'ADMIN' || r === 'ASM' || r === 'INCHARGE';
      }) || (historyList.length > 0 ? historyList[0] : null);

      const recipientId = isAgent 
        ? (originalSupervisor?.senderId || null) 
        : (selectedTank.agentId || null);
      const recipientName = isAgent 
        ? (originalSupervisor?.senderName || 'Supervisor') 
        : (selectedTank.agentName || null);

      const res = await adminService.submitFollowup({
        tankId: selectedTank.tankId,
        cycleKey: selectedTank.cycleKey,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        recipientId,
        recipientName,
        message: trimmed
      });

      if (res) {
        if (isAgent) {
          setActionSuccess(`Reply sent successfully to ${recipientName}. Your response has been recorded in the follow-up history.`);
        } else {
          setActionSuccess('Follow-up sent successfully. This item has been moved to Addressed — test entry is not required for this cycle.');
        }
        setFollowupText('');
        setIsComposing(false);

        // Refresh conversation thread in detail view
        try {
          const updatedHistory = await adminService.getFollowupHistory(selectedTank.tankId, selectedTank.cycleKey);
          setHistoryList(updatedHistory);
        } catch (hErr) {
          console.warn('[WeeklyComplianceFollowup] History reload warning:', hErr);
        }

        // Authoritatively refresh the entire compliance list and counts from backend
        await loadData(true);

        // Update selectedTank in-memory reference so the modal immediately reflects Addressed status
        setSelectedTank(prev => prev ? {
          ...prev,
          followupStatus: 'ADDRESSED',
          followupCount: (prev.followupCount || 0) + 1,
          latestFollowup: {
            id: res?.id || `FUP_${Date.now()}`,
            senderId: res?.senderId || currentUser.id,
            senderName: res?.senderName || currentUser.name,
            senderRole: res?.senderRole || currentUser.role,
            message: trimmed,
            status: 'ADDRESSED',
            createdAtDisplay: 'Just now'
          }
        } : null);
      }
    } catch (err) {
      console.error('[WeeklyComplianceFollowup] Submit error:', err);
      // Retain item in Due, preserve text, and display actual error
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
      (t.tankId || '').toLowerCase().includes(q) ||
      (t.farmerName || '').toLowerCase().includes(q) ||
      (t.farmerVillage || '').toLowerCase().includes(q) ||
      (t.agentName || '').toLowerCase().includes(q) ||
      (t.inchargeName || '').toLowerCase().includes(q) ||
      (t.latestFollowup?.senderName || '').toLowerCase().includes(q) ||
      (t.latestFollowup?.message || '').toLowerCase().includes(q)
    );
  }, [currentList, searchQuery]);

  const { counts } = complianceData;

  // Detail Modal & Message Composer shared across full and side-column views
  const renderDetailModal = () => {
    if (!selectedTank) return null;

    const isAgent = portalType === 'AGENT';
    const currentUser = getCurrentUser();
    const isAssignedAgent = !selectedTank.agentId || selectedTank.agentId === currentUser.id;

    // Locate the supervisor/admin who initiated or participated in this follow-up thread
    const originalSupervisor = historyList.find(f => {
      const r = (f.senderRole || '').toUpperCase();
      return r === 'ADMIN' || r === 'ASM' || r === 'INCHARGE';
    }) || (historyList.length > 0 ? historyList[0] : null);

    const hasSupervisorFollowup = historyList.length > 0;
    const canAgentReply = isAgent && isAssignedAgent && hasSupervisorFollowup;

    return (
      <div style={styles.modalBackdrop} onClick={closeDetailModal}>
        <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div style={styles.modalHeader}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={closeDetailModal}
                  style={styles.backBtn}
                  title="Return to list"
                >
                  <ArrowLeft size={16} />
                  <span>Back to List</span>
                </button>
                <span style={styles.tankBadge}>{selectedTank.tankName}</span>
                <code style={styles.codeTag}>{selectedTank.tankId}</code>
                <span style={selectedTank.followupStatus === 'DUE' ? styles.statusPillDue : styles.statusPillAddressed}>
                  {selectedTank.followupStatus === 'DUE' ? '🔴 Due for Action' : '🔵 Addressed'}
                </span>
              </div>
              <h3 style={styles.modalFarmerTitle}>
                Farmer: {selectedTank.farmerName}
              </h3>
              <p style={styles.modalSubInfo}>
                <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {selectedTank.farmerVillage || 'Locality unassigned'}
                {selectedTank.farmerPhone && ` • 📞 Phone: ${selectedTank.farmerPhone}`}
              </p>
            </div>

            <button
              type="button"
              onClick={closeDetailModal}
              style={styles.modalCloseBtn}
              title="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div style={styles.modalBody}>
            {/* Telemetry and Assignment Strip */}
            <div style={styles.modalMetaGrid}>
              <div style={styles.modalMetaBox}>
                <span style={styles.tableSubLabel}>ASSIGNED AGENT</span>
                <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '13px' }}>
                  👤 {selectedTank.agentName || 'Unassigned'}
                </div>
                {selectedTank.agentPhone && (
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>📞 {selectedTank.agentPhone}</div>
                )}
              </div>

              <div style={styles.modalMetaBox}>
                <span style={styles.tableSubLabel}>RESPONSIBLE ASM</span>
                <div style={{ fontWeight: 600, color: '#1E293B', fontSize: '13px' }}>
                  🛡️ {selectedTank.inchargeName || 'Unassigned'}
                </div>
              </div>

              <div style={styles.modalMetaBox}>
                <span style={styles.tableSubLabel}>LAST QUALIFYING TEST</span>
                <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '13px' }}>
                  {selectedTank.lastTestDisplay || 'Never Tested'}
                </div>
              </div>

              <div style={styles.modalMetaBox}>
                <span style={styles.tableSubLabel}>OVERDUE DURATION</span>
                <div style={{ fontWeight: 700, color: '#DC2626', fontSize: '13px' }}>
                  {selectedTank.daysOverdue} Days Overdue
                </div>
              </div>

              <div style={styles.modalMetaBox}>
                <span style={styles.tableSubLabel}>CYCLE TEST REQUIREMENT</span>
                <div>
                  {selectedTank.followupStatus === 'ADDRESSED' ? (
                    <span style={styles.settledBadge}>
                      <CheckCircle2 size={12} color="#15803D" style={{ display: 'inline', marginRight: '4px' }} />
                      <span>No Test Required for This Week</span>
                    </span>
                  ) : (
                    <span style={styles.stillDueBadge}>
                      Test Due
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: selectedTank.followupStatus === 'ADDRESSED' ? '#15803D' : '#B45309', marginTop: '2px' }}>
                  {selectedTank.followupStatus === 'ADDRESSED' ? 'Settled by directive' : 'Field test required'}
                </div>
              </div>
            </div>

            {/* Requirement: Clear explanation of addressed policy */}
            {selectedTank.followupStatus === 'ADDRESSED' ? (
              <div style={styles.settledNotice}>
                <CheckCircle2 size={16} color="#15803D" style={{ flexShrink: 0, marginTop: '1px' }} />
                <div style={{ fontSize: '12px', color: '#166534', lineHeight: '1.45' }}>
                  <strong>Addressed Status:</strong> Because this pond's due cycle has been addressed by an authorized supervisor or admin, <strong>no routine test entry is required for this week's cycle</strong>.
                </div>
              </div>
            ) : (
              <div style={styles.complianceNotice}>
                <AlertTriangle size={16} color="#D97706" style={{ flexShrink: 0, marginTop: '1px' }} />
                <div style={{ fontSize: '12px', color: '#92400E', lineHeight: '1.45' }}>
                  {isAgent ? (
                    <><strong>Pond Testing Status:</strong> Routine water testing is overdue for this 7-day cycle. Awaiting supervisor directive.</>
                  ) : (
                    <><strong>Action Required:</strong> Routine water testing is overdue for this 7-day cycle. Submit a follow-up directive below to assign or instruct the technician. Once addressed, test entry is no longer required for this cycle.</>
                  )}
                </div>
              </div>
            )}

            {/* Conversation Thread / Message History */}
            <div style={{ marginTop: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={styles.sectionHeading}>
                  Follow-Up Message History ({historyList.length})
                </h4>
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Cycle: <code style={styles.codeTag}>{selectedTank.cycleKey}</code>
                </span>
              </div>

              <div style={styles.historyContainer}>
                {isLoadingHistory ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                    <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid #CBD5E1', borderTopColor: '#2563EB', borderRadius: '50%', margin: '0 auto 8px' }} />
                    Loading follow-up history...
                  </div>
                ) : historyList.length === 0 ? (
                  <div style={styles.noHistoryNotice}>
                    No follow-up messages have been recorded yet for this weekly due cycle.
                  </div>
                ) : (
                  historyList.map((item, idx) => {
                    const badge = getRoleBadgeStyle(item.senderRole, portalType);
                    return (
                      <div key={item.id || idx} style={styles.historyItem}>
                        <div style={styles.historyItemHeader}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              ...styles.roleChip,
                              backgroundColor: badge.bg,
                              color: badge.text
                            }}>
                              {badge.label}
                            </span>
                            <strong style={{ fontSize: '13px', color: '#0F172A' }}>
                              {item.senderName || 'Authorized User'}
                            </strong>
                            {item.recipientName && (
                              <span style={{ fontSize: '12px', color: '#64748B' }}>
                                → {item.recipientName}
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                            {item.createdAtDisplay || 'Recent'}
                          </span>
                        </div>
                        <div style={styles.historyMessageText}>
                          {item.message}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Success / Error Banners */}
            {actionSuccess && (
              <div style={styles.successAlert}>
                <CheckCircle size={15} color="#15803D" style={{ flexShrink: 0 }} />
                <span>{actionSuccess}</span>
              </div>
            )}
            {actionError && (
              <div style={styles.errorAlert}>
                <AlertCircle size={15} color="#B91C1C" style={{ flexShrink: 0 }} />
                <span>{actionError}</span>
              </div>
            )}

            {/* Two-Step Follow-Up / Reply Interaction */}
            <div style={styles.actionSectionWrapper}>
              {isAgent ? (
                /* Agent / Technician Portal Actions */
                !isAssignedAgent ? (
                  <div style={styles.noticeBoxWarning}>
                    <Shield size={16} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '12.5px', color: '#92400E', lineHeight: '1.45' }}>
                      <strong>Access Restricted:</strong> You are not the assigned technician for this pond ({selectedTank.agentName || 'assigned to another staff'}). Only the assigned technician is authorized to reply.
                    </div>
                  </div>
                ) : !hasSupervisorFollowup ? (
                  <div style={styles.noticeBoxInfo}>
                    <Info size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '12.5px', color: '#1E40AF', lineHeight: '1.45' }}>
                      <strong>No Supervisor Directive Yet:</strong> An Admin or ASM/Incharge has not issued a follow-up directive for this tank cycle yet. Technicians can reply once an authorized supervisor sends a follow-up.
                    </div>
                  </div>
                ) : !isComposing ? (
                  <div style={styles.followupTriggerBox}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                        Reply to Supervisor Follow-up
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        Send a message back to <strong>{originalSupervisor?.senderName || 'Supervisor'}</strong> ({originalSupervisor?.senderRole || 'ADMIN/ASM'}).
                      </span>
                    </div>

                    <button
                      type="button"
                      style={{
                        ...styles.prominentFollowupBtn,
                        backgroundColor: '#1A2FB8'
                      }}
                      onClick={handleOpenComposer}
                    >
                      <MessageSquare size={16} />
                      <span>Reply</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendFollowup} style={styles.composerCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <label style={styles.composerLabel}>
                        Your Reply Message
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {originalSupervisor && (
                          <span style={{ fontSize: '11.5px', color: '#1E40AF', backgroundColor: '#EFF6FF', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, border: '1px solid #BFDBFE' }}>
                            Replying to: {originalSupervisor.senderName} ({originalSupervisor.senderRole})
                          </span>
                        )}
                        <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                          From: <strong>{currentUser.name} (AGENT)</strong>
                        </span>
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      value={followupText}
                      onChange={(e) => setFollowupText(e.target.value)}
                      disabled={isSubmitting}
                      placeholder={`Write your reply to ${originalSupervisor?.senderName || 'the supervisor'} (e.g. 'Noted. Visiting pond today at 3 PM to inspect and test water parameters.')...`}
                      style={styles.composerTextarea}
                      autoFocus
                    />

                    <div style={styles.composerActionRow}>
                      <button
                        type="button"
                        onClick={handleCancelComposer}
                        disabled={isSubmitting}
                        style={styles.cancelBtn}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting || !followupText.trim()}
                        style={{
                          ...styles.sendBtn,
                          backgroundColor: '#1A2FB8',
                          opacity: isSubmitting || !followupText.trim() ? 0.6 : 1,
                          cursor: isSubmitting || !followupText.trim() ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <Send size={14} className={isSubmitting ? 'animate-spin' : ''} />
                        <span>{isSubmitting ? 'Sending...' : 'Send Reply'}</span>
                      </button>
                    </div>
                  </form>
                )
              ) : (
                /* Admin & ASM / Incharge Portal Actions */
                !isComposing ? (
                  <div style={styles.followupTriggerBox}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                        Send directive to assigned agent
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        Notify 👤 <strong>{selectedTank.agentName || 'assigned technician'}</strong> to conduct urgent routine pond water sampling.
                      </span>
                    </div>

                    <button
                      type="button"
                      style={styles.prominentFollowupBtn}
                      onClick={handleOpenComposer}
                    >
                      <MessageSquare size={16} />
                      <span>Follow Up</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendFollowup} style={styles.composerCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={styles.composerLabel}>
                        Follow-up Message
                      </label>
                      <span style={{ fontSize: '12px', color: '#64748B' }}>
                        Sender Identity: <strong>{portalType}</strong>
                      </span>
                    </div>

                    <textarea
                      rows={3}
                      value={followupText}
                      onChange={(e) => setFollowupText(e.target.value)}
                      disabled={isSubmitting}
                      placeholder="Write your message to the assigned Agent. Explain what action is required or ask for an update..."
                      style={styles.composerTextarea}
                      autoFocus
                    />

                    <div style={styles.composerActionRow}>
                      <button
                        type="button"
                        onClick={handleCancelComposer}
                        disabled={isSubmitting}
                        style={styles.cancelBtn}
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting || !followupText.trim()}
                        style={{
                          ...styles.sendBtn,
                          opacity: isSubmitting || !followupText.trim() ? 0.6 : 1,
                          cursor: isSubmitting || !followupText.trim() ? 'not-allowed' : 'pointer'
                        }}
                      >
                        <Send size={14} className={isSubmitting ? 'animate-spin' : ''} />
                        <span>{isSubmitting ? 'Sending...' : 'Send Follow-up'}</span>
                      </button>
                    </div>
                  </form>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isSideColumn) {
    return (
      <div style={styles.sideContainer} className="followups-side-column">
        {/* 1. Header & Live Synchronization */}
        <div style={styles.sideHeader}>
          <div style={styles.sideTitleGroup}>
            <div style={styles.sideTitleIconBox}>
              <AlertCircle size={18} color="#DC2626" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={styles.sideTitle}>Follow-ups</h3>
                <span style={styles.sideRollingTag}>7-Day Cycle</span>
              </div>
              <p style={styles.sideSubtitle}>Routine Testing Directives</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            style={styles.sideRefreshBtn}
            title="Sync compliance metrics with database"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>

        {/* 2. Prominent Due & Addressed Option Tabs (Requirement 2 & 3) */}
        <div style={styles.sideTabGroup} role="tablist">
          {/* Due Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'DUE'}
            onClick={() => setActiveTab('DUE')}
            style={{
              ...styles.sideTabBtn,
              backgroundColor: activeTab === 'DUE' ? '#FEF2F2' : '#F8FAFC',
              color: activeTab === 'DUE' ? '#DC2626' : '#64748B',
              borderColor: activeTab === 'DUE' ? '#FECACA' : '#E2E8F0',
              boxShadow: activeTab === 'DUE' ? '0 1px 3px rgba(220, 38, 38, 0.12)' : 'none'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: activeTab === 'DUE' ? '#DC2626' : '#94A3B8'
              }} />
              <span style={{ fontWeight: 700 }}>Due</span>
            </span>
            <span style={{
              ...styles.sideTabBadge,
              backgroundColor: activeTab === 'DUE' ? '#FEE2E2' : '#E2E8F0',
              color: activeTab === 'DUE' ? '#DC2626' : '#64748B'
            }}>
              {counts.dueCount}
            </span>
          </button>

          {/* Addressed Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ADDRESSED'}
            onClick={() => setActiveTab('ADDRESSED')}
            style={{
              ...styles.sideTabBtn,
              backgroundColor: activeTab === 'ADDRESSED' ? '#EFF6FF' : '#F8FAFC',
              color: activeTab === 'ADDRESSED' ? '#1D4ED8' : '#64748B',
              borderColor: activeTab === 'ADDRESSED' ? '#BFDBFE' : '#E2E8F0',
              boxShadow: activeTab === 'ADDRESSED' ? '0 1px 3px rgba(29, 78, 216, 0.12)' : 'none'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: activeTab === 'ADDRESSED' ? '#2563EB' : '#94A3B8'
              }} />
              <span style={{ fontWeight: 700 }}>Addressed</span>
            </span>
            <span style={{
              ...styles.sideTabBadge,
              backgroundColor: activeTab === 'ADDRESSED' ? '#DBEAFE' : '#E2E8F0',
              color: activeTab === 'ADDRESSED' ? '#1D4ED8' : '#64748B'
            }}>
              {counts.addressedCount}
            </span>
          </button>
        </div>

        {/* 3. Compact Search Box */}
        <div style={styles.sideSearchBox}>
          <Search size={14} color="#64748B" />
          <input
            type="text"
            placeholder={activeTab === 'DUE' ? "Search due tanks, farmers, agents..." : "Search addressed items, senders..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.sideSearchInput}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '0 2px' }}
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* 4. Scrollable Items List or States */}
        {isLoading ? (
          <div style={styles.sideStateContainer}>
            <div className="animate-spin" style={styles.sideLoadingSpinner} />
            <p style={{ color: '#64748B', fontSize: '13px', margin: 0 }}>
              Loading follow-ups from database...
            </p>
          </div>
        ) : loadError ? (
          <div style={{ ...styles.sideStateContainer, border: '1px solid #FECACA', backgroundColor: '#FEF2F2' }}>
            <AlertCircle size={24} color="#DC2626" style={{ marginBottom: '6px' }} />
            <p style={{ color: '#991B1B', fontWeight: 600, fontSize: '13px', margin: '0 0 8px' }}>
              {loadError}
            </p>
            <button
              type="button"
              onClick={() => loadData(true)}
              style={styles.sideActionBtnDue}
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          </div>
        ) : filteredList.length === 0 ? (
          <div style={styles.sideStateContainer}>
            {activeTab === 'DUE' ? (
              <>
                <CheckCircle2 size={32} color="#16A34A" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                  No overdue tests require follow-up.
                </div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0' }}>
                  All culture ponds are tested or already addressed for this cycle.
                </p>
              </>
            ) : (
              <>
                <Clock size={32} color="#2563EB" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                  No follow-ups recorded yet.
                </div>
                <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0' }}>
                  When an authorized user sends a follow-up directive, it will appear here.
                </p>
              </>
            )}
          </div>
        ) : (
          <div style={styles.sideItemList}>
            {filteredList.map((tank) => {
              const isDue = activeTab === 'DUE';
              return (
                <div
                  key={tank.tankId}
                  style={{
                    ...styles.sideItemCard,
                    borderLeft: isDue ? '3px solid #DC2626' : '3px solid #2563EB'
                  }}
                  onClick={() => openDetailModal(tank)}
                >
                  {/* Card Header: Tank & Overdue */}
                  <div style={styles.sideCardHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                      <span style={styles.sideTankBadge}>{tank.tankName}</span>
                      <code style={styles.sideCodeTag}>{tank.tankId}</code>
                    </div>
                    {isDue ? (
                      <span style={{
                        ...styles.sideDaysBadge,
                        backgroundColor: tank.daysOverdue >= 7 ? '#FEE2E2' : '#FEF3C7',
                        color: tank.daysOverdue >= 7 ? '#DC2626' : '#B45309'
                      }}>
                        {tank.daysOverdue}d overdue
                      </span>
                    ) : (
                      <span style={styles.sideSettledBadge}>
                        <CheckCircle2 size={11} color="#15803D" />
                        <span>Addressed</span>
                      </span>
                    )}
                  </div>

                  {/* Farmer & Locality */}
                  <div style={styles.sideFarmerRow}>
                    <span style={styles.sideFarmerName}>{tank.farmerName}</span>
                    <span style={styles.sideLocality}>
                      <MapPin size={10} style={{ display: 'inline', marginRight: '2px' }} />
                      {tank.farmerVillage || 'Locality unassigned'}
                    </span>
                  </div>

                  {/* Meta strip: Agent & Last Test */}
                  <div style={styles.sideMetaRow}>
                    <div style={styles.sideMetaItem}>
                      <span style={styles.sideMetaLabel}>Agent:</span>
                      <span style={styles.sideMetaVal}>{tank.agentName || 'Unassigned'}</span>
                    </div>
                    <div style={styles.sideMetaItem}>
                      <span style={styles.sideMetaLabel}>Last Test:</span>
                      <span style={styles.sideMetaVal}>{tank.lastTestDisplay || 'Pending'}</span>
                    </div>
                  </div>

                  {/* If addressed: sender badge, timestamp, message excerpt */}
                  {!isDue && tank.latestFollowup && (
                    <div style={styles.sideAddressedBox}>
                      <div style={styles.sideAddressedHeader}>
                        {(() => {
                          const badge = getRoleBadgeStyle(tank.latestFollowup.senderRole, portalType);
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{
                                ...styles.roleChip,
                                backgroundColor: badge.bg,
                                color: badge.text
                              }}>
                                {badge.label}
                              </span>
                              <strong style={{ fontSize: '11px', color: '#0F172A' }}>
                                {tank.latestFollowup.senderName || 'Authorized'}
                              </strong>
                            </div>
                          );
                        })()}
                        <span style={{ fontSize: '10px', color: '#64748B' }}>
                          {tank.latestFollowup.createdAtDisplay}
                        </span>
                      </div>
                      <p style={styles.sideAddressedSnippet}>
                        "{tank.latestFollowup.message}"
                      </p>
                    </div>
                  )}

                  {/* Footer with action */}
                  <div style={styles.sideCardFooter}>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      {isDue ? 'Routine test overdue' : 'Settled for cycle'}
                    </span>
                    <button
                      type="button"
                      style={isDue ? styles.sideActionBtnDue : styles.sideActionBtnAddressed}
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailModal(tank);
                      }}
                    >
                      <span>{isDue ? (portalType === 'AGENT' ? 'View Details' : 'Follow Up') : (portalType === 'AGENT' ? 'View & Reply' : 'History')}</span>
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail Modal & Composer (Shared) */}
        {renderDetailModal()}
      </div>
    );
  }

  return (
    <div style={{ ...styles.container, ...style }}>
      {/* 1. Header & Live Synchronization */}
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <div style={styles.titleIconBox}>
            <AlertCircle size={22} color="#DC2626" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={styles.title}>Weekly Tank-Test Follow-up &amp; Due Tracking</h3>
              <span style={styles.rollingTag}>7-Day Routine Testing</span>
            </div>
            <p style={styles.subtitle}>
              Monitor overdue routine pond water tests, issue supervisor directives, and audit follow-up compliance.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          style={styles.refreshBtn}
          title="Sync compliance metrics with database"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* 2. KPI Summary Strip */}
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
          <span style={styles.kpiLabel}>DUE FOR ACTION</span>
          <div style={{ ...styles.kpiValue, color: '#DC2626' }}>{counts.dueCount}</div>
          <span style={styles.kpiHint}>Awaiting Follow-up</span>
        </div>
        <div style={{ ...styles.kpiBox, borderLeft: '3px solid #2563EB' }}>
          <span style={styles.kpiLabel}>ADDRESSED (DIRECTIVE SENT)</span>
          <div style={{ ...styles.kpiValue, color: '#2563EB' }}>{counts.addressedCount}</div>
          <span style={styles.kpiHint}>No Test Required for Cycle</span>
        </div>
      </div>

      {/* 3. Strict Operational Policy Notice */}
      <div style={styles.bannerInfo}>
        <CheckCircle2 size={16} color="#0284C7" style={{ flexShrink: 0, marginTop: '1px' }} />
        <span style={{ color: '#334155', lineHeight: '1.4' }}>
          <strong>Policy:</strong> When a due tank is <strong>Addressed</strong> by an authorized supervisor or admin, its routine test requirement for that weekly cycle is marked settled — no test entry is required for that week.
        </span>
      </div>

      {/* 4. Two Clearly Labelled Sections/Tabs & Search Bar (Requirement 1 & 2) */}
      <div style={styles.controlsRow}>
        <div style={styles.tabGroup} role="tablist">
          {/* Due Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'DUE'}
            onClick={() => setActiveTab('DUE')}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeTab === 'DUE' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'DUE' ? '#B91C1C' : '#64748B',
              boxShadow: activeTab === 'DUE' ? '0 2px 6px rgba(185, 28, 28, 0.12)' : 'none',
              borderBottom: activeTab === 'DUE' ? '2px solid #DC2626' : '2px solid transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 700 }}>Due</span>
              <span style={{
                ...styles.tabBadge,
                backgroundColor: activeTab === 'DUE' ? '#FEE2E2' : '#F1F5F9',
                color: activeTab === 'DUE' ? '#DC2626' : '#64748B'
              }}>
                {counts.dueCount}
              </span>
            </div>
          </button>

          {/* Addressed Tab */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'ADDRESSED'}
            onClick={() => setActiveTab('ADDRESSED')}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeTab === 'ADDRESSED' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'ADDRESSED' ? '#1D4ED8' : '#64748B',
              boxShadow: activeTab === 'ADDRESSED' ? '0 2px 6px rgba(29, 78, 216, 0.12)' : 'none',
              borderBottom: activeTab === 'ADDRESSED' ? '2px solid #2563EB' : '2px solid transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 700 }}>Addressed</span>
              <span style={{
                ...styles.tabBadge,
                backgroundColor: activeTab === 'ADDRESSED' ? '#DBEAFE' : '#F1F5F9',
                color: activeTab === 'ADDRESSED' ? '#1D4ED8' : '#64748B'
              }}>
                {counts.addressedCount}
              </span>
            </div>
          </button>
        </div>

        {/* Search input with reset */}
        <div style={styles.searchBox}>
          <Search size={15} color="#64748B" />
          <input
            type="text"
            placeholder={activeTab === 'DUE' ? "Search due items by tank, farmer, agent, ASM..." : "Search addressed items by sender, tank, farmer..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 5. Main Content Area: Loading, Error, Empty, Desktop Table, or Mobile Cards */}
      {isLoading ? (
        <div style={styles.stateContainer}>
          <div className="animate-spin" style={styles.loadingSpinner} />
          <p style={{ color: '#64748B', fontSize: '14px', margin: 0 }}>
            Loading routine compliance records from database...
          </p>
        </div>
      ) : loadError ? (
        <div style={{ ...styles.stateContainer, border: '1px solid #FECACA', backgroundColor: '#FEF2F2' }}>
          <AlertCircle size={32} color="#DC2626" style={{ marginBottom: '8px' }} />
          <p style={{ color: '#991B1B', fontWeight: 600, fontSize: '14px', margin: '0 0 8px' }}>
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => loadData(true)}
            style={styles.actionBtnPrimary}
          >
            <RefreshCw size={13} />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : filteredList.length === 0 ? (
        /* Requirement 9: Exact requested empty states */
        <div style={styles.stateContainer}>
          {activeTab === 'DUE' ? (
            <>
              <CheckCircle2 size={40} color="#16A34A" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                No overdue tests currently require follow-up.
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '6px 0 0' }}>
                All active culture ponds have been tested within the required 7-day period or have already been addressed.
              </p>
            </>
          ) : (
            <>
              <Clock size={40} color="#2563EB" style={{ marginBottom: '10px' }} />
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                No follow-ups have been recorded for this period.
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '6px 0 0' }}>
                When an authorised supervisor or admin issues a follow-up message on an overdue tank, it will appear here.
              </p>
            </>
          )}
        </div>
      ) : isMobile ? (
        /* ========================================================================= */
        /* MOBILE RESPONSIVE CARD VIEW (Requirement 2 & 6)                          */
        /* ========================================================================= */
        <div style={styles.cardList}>
          {filteredList.map((tank) => {
            const isDue = activeTab === 'DUE';
            return (
              <div
                key={tank.tankId}
                style={{
                  ...styles.mobileCard,
                  borderLeft: isDue ? '4px solid #DC2626' : '4px solid #2563EB'
                }}
                onClick={() => openDetailModal(tank)}
              >
                {/* Mobile Card Header */}
                <div style={styles.mobileCardHeader}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={styles.tankBadge}>{tank.tankName}</span>
                      <code style={styles.codeTag}>{tank.tankId}</code>
                    </div>
                    <div style={styles.mobileFarmerName}>{tank.farmerName}</div>
                    <div style={styles.mobileLocality}>
                      <MapPin size={11} style={{ display: 'inline', marginRight: '3px' }} />
                      {tank.farmerVillage || 'Locality unassigned'}
                      {tank.farmerPhone && ` • 📞 ${tank.farmerPhone}`}
                    </div>
                  </div>

                  <span style={{
                    ...styles.daysBadge,
                    backgroundColor: tank.daysOverdue >= 7 ? '#FEE2E2' : '#FEF3C7',
                    color: tank.daysOverdue >= 7 ? '#DC2626' : '#B45309'
                  }}>
                    {tank.daysOverdue} {tank.daysOverdue === 1 ? 'day' : 'days'} overdue
                  </span>
                </div>

                {/* Mobile Meta Grid */}
                <div style={styles.mobileMetaGrid}>
                  <div>
                    <span style={styles.tableSubLabel}>AGENT</span>
                    <div style={styles.mobileMetaVal}>👤 {tank.agentName || 'Unassigned'}</div>
                  </div>
                  <div>
                    <span style={styles.tableSubLabel}>ASM / INCHARGE</span>
                    <div style={styles.mobileMetaVal}>🛡️ {tank.inchargeName || 'Unassigned'}</div>
                  </div>
                  <div>
                    <span style={styles.tableSubLabel}>LAST TEST</span>
                    <div style={styles.mobileMetaVal}>{tank.lastTestDisplay || 'Never Tested'}</div>
                  </div>
                  <div>
                    <span style={styles.tableSubLabel}>TEST REQUIREMENT</span>
                    <div style={{
                      ...styles.mobileMetaVal,
                      color: isDue ? '#DC2626' : '#15803D',
                      fontWeight: 700
                    }}>
                      {isDue ? 'Test Due' : '✓ No Test Required'}
                    </div>
                  </div>
                </div>

                {/* Requirement 6: Immediate visibility of Addressed By in Addressed Tab */}
                {!isDue && tank.latestFollowup && (
                  <div style={styles.addressedInfoBox}>
                    <div style={styles.addressedHeaderRow}>
                      {(() => {
                        const badge = getRoleBadgeStyle(tank.latestFollowup.senderRole, portalType);
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              ...styles.roleChip,
                              backgroundColor: badge.bg,
                              color: badge.text
                            }}>
                              {badge.label}
                            </span>
                            <strong style={{ fontSize: '12px', color: '#0F172A' }}>
                              {tank.latestFollowup.senderName || 'Authorized User'}
                            </strong>
                          </div>
                        );
                      })()}
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        {tank.latestFollowup.createdAtDisplay}
                      </span>
                    </div>
                    <p style={styles.addressedSnippet}>
                      "{tank.latestFollowup.message}"
                    </p>
                  </div>
                )}

                {/* Mobile Card Action Footer */}
                <div style={styles.mobileCardFooter}>
                  <span style={isDue ? styles.statusPillDue : styles.statusPillAddressed}>
                    {isDue ? '🔴 Due' : '🔵 Addressed'}
                  </span>

                  <button
                    type="button"
                    style={isDue ? styles.actionBtnPrimary : styles.actionBtnSecondary}
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetailModal(tank);
                    }}
                  >
                    <span>{isDue ? (portalType === 'AGENT' ? 'View Details' : 'Follow Up') : (portalType === 'AGENT' ? 'View & Reply' : 'View History')}</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* DESKTOP TABLE VIEW (Requirement 2 & 6)                                    */
        /* ========================================================================= */
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.th}>Farmer Name</th>
                <th style={styles.th}>Tank &amp; ID</th>
                <th style={styles.th}>Assigned Agent</th>
                <th style={styles.th}>Responsible ASM</th>
                {activeTab === 'DUE' ? (
                  <>
                    <th style={styles.th}>Last Qualifying Test</th>
                    <th style={styles.th}>Days Overdue</th>
                    <th style={styles.th}>Follow-up Status</th>
                  </>
                ) : (
                  <>
                    <th style={styles.th}>Addressed By (Sender)</th>
                    <th style={styles.th}>Follow-up Directive</th>
                    <th style={styles.th}>Date &amp; Time</th>
                    <th style={styles.th}>Cycle Status</th>
                  </>
                )}
                <th style={{ ...styles.th, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((tank) => {
                const isDue = activeTab === 'DUE';
                return (
                  <tr
                    key={tank.tankId}
                    style={styles.tableRow}
                    onClick={() => openDetailModal(tank)}
                  >
                    {/* 1. Farmer Name */}
                    <td style={styles.td}>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13.5px' }}>
                        {tank.farmerName}
                      </div>
                      <div style={styles.tableSubLabel}>
                        {tank.farmerVillage || 'Locality unassigned'}
                        {tank.farmerPhone && ` • 📞 ${tank.farmerPhone}`}
                      </div>
                    </td>

                    {/* 2. Tank Name & ID */}
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={styles.tankBadge}>{tank.tankName}</span>
                        <code style={styles.codeTag}>{tank.tankId}</code>
                      </div>
                      <div style={styles.tableSubLabel}>
                        DOC {tank.doc || '-'} • {tank.abw || '0.0g'}
                      </div>
                    </td>

                    {/* 3. Assigned Agent */}
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#1E293B', fontWeight: 600 }}>
                        <User size={13} color="#2563EB" />
                        <span>{tank.agentName || 'Unassigned'}</span>
                      </div>
                      {tank.agentPhone && (
                        <div style={styles.tableSubLabel}>📞 {tank.agentPhone}</div>
                      )}
                    </td>

                    {/* 4. Responsible ASM/Incharge */}
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#334155', fontWeight: 600 }}>
                        <Shield size={13} color="#475569" />
                        <span>{tank.inchargeName || 'Unassigned'}</span>
                      </div>
                    </td>

                    {/* Tab specific columns */}
                    {isDue ? (
                      <>
                        {/* 5. Last Qualifying Test */}
                        <td style={styles.td}>
                          <div style={{ fontSize: '13px', color: '#0F172A', fontWeight: 500 }}>
                            {tank.lastTestDisplay || 'Never Tested'}
                          </div>
                          <div style={styles.tableSubLabel}>Rolling 7-day cutoff</div>
                        </td>

                        {/* 6. Days Overdue */}
                        <td style={styles.td}>
                          <span style={{
                            ...styles.daysBadge,
                            backgroundColor: tank.daysOverdue >= 7 ? '#FEE2E2' : '#FEF3C7',
                            color: tank.daysOverdue >= 7 ? '#DC2626' : '#B45309'
                          }}>
                            {tank.daysOverdue} {tank.daysOverdue === 1 ? 'Day' : 'Days'} Overdue
                          </span>
                        </td>

                        {/* 7. Current Follow-up Status */}
                        <td style={styles.td}>
                          <span style={styles.statusPillDue}>
                            🔴 Due
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Requirement 6: Addressed By Sender immediately visible */}
                        <td style={styles.td}>
                          {(() => {
                            const badge = getRoleBadgeStyle(tank.latestFollowup?.senderRole, portalType);
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  ...styles.roleChip,
                                  backgroundColor: badge.bg,
                                  color: badge.text
                                }}>
                                  {badge.label}
                                </span>
                                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '13px' }}>
                                  {tank.latestFollowup?.senderName || 'Authorized User'}
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* Follow-up directive excerpt */}
                        <td style={styles.td}>
                          <div style={styles.directiveSnippet} title={tank.latestFollowup?.message}>
                            "{tank.latestFollowup?.message || 'Follow-up submitted'}"
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td style={styles.td}>
                          <div style={{ fontSize: '12px', color: '#475569' }}>
                            {tank.latestFollowup?.createdAtDisplay || '-'}
                          </div>
                        </td>

                        {/* Requirement: If due is addressed, no need to enter that week test */}
                        <td style={styles.td}>
                          <span style={styles.settledBadge} title="Directive sent. Routine test entry is not required for this weekly cycle.">
                            <CheckCircle2 size={12} color="#15803D" style={{ display: 'inline', marginRight: '4px' }} />
                            <span>Addressed (No Test Needed)</span>
                          </span>
                        </td>
                      </>
                    )}

                    {/* Action Column */}
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <button
                        type="button"
                        style={isDue ? styles.actionBtnPrimary : styles.actionBtnSecondary}
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetailModal(tank);
                        }}
                      >
                        <span>{isDue ? (portalType === 'AGENT' ? 'View Details' : 'Follow Up') : (portalType === 'AGENT' ? 'View & Reply' : 'View History')}</span>
                        <ArrowUpRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Shared Detail Modal & Two-Step Message Composer */}
      {renderDetailModal()}
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
    width: '40px',
    height: '40px',
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
    fontSize: '10.5px',
    fontWeight: 700,
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
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    backgroundColor: '#F0F9FF',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '12.5px',
    marginBottom: '18px',
    border: '1px solid #BAE6FD'
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
    maxWidth: '420px'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '13px',
    color: '#0F172A',
    background: 'transparent'
  },
  stateContainer: {
    textAlign: 'center',
    padding: '44px 20px',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px dashed #CBD5E1'
  },
  loadingSpinner: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    border: '3px solid #E2E8F0',
    borderTopColor: '#2563EB',
    margin: '0 auto 12px'
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '10px',
    border: '1px solid #E2E8F0'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  tableHeaderRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0'
  },
  th: {
    padding: '12px 14px',
    fontSize: '11.5px',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    whiteSpace: 'nowrap'
  },
  tableRow: {
    borderBottom: '1px solid #F1F5F9',
    transition: 'background-color 0.15s ease',
    cursor: 'pointer',
    backgroundColor: '#FFFFFF'
  },
  td: {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#334155',
    verticalAlign: 'middle'
  },
  tableSubLabel: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '2px'
  },
  tankBadge: {
    fontSize: '12px',
    fontWeight: 700,
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    padding: '3px 8px',
    borderRadius: '6px'
  },
  codeTag: {
    fontFamily: 'monospace',
    backgroundColor: '#F1F5F9',
    padding: '2px 5px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#475569'
  },
  daysBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '3px 8px',
    borderRadius: '6px',
    display: 'inline-block'
  },
  statusPillDue: {
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
    border: '1px solid #FECACA',
    padding: '3px 8px',
    borderRadius: '12px',
    display: 'inline-block'
  },
  statusPillAddressed: {
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    border: '1px solid #BFDBFE',
    padding: '3px 8px',
    borderRadius: '12px',
    display: 'inline-block'
  },
  stillDueBadge: {
    fontSize: '10.5px',
    fontWeight: 700,
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    border: '1px solid #FDE68A',
    padding: '2px 7px',
    borderRadius: '4px',
    display: 'inline-block'
  },
  settledBadge: {
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    border: '1px solid #BBF7D0',
    padding: '3px 8px',
    borderRadius: '4px',
    display: 'inline-flex',
    alignItems: 'center'
  },
  settledNotice: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    backgroundColor: '#F0FDF4',
    border: '1px solid #BBF7D0',
    borderRadius: '8px',
    padding: '10px 12px'
  },
  roleChip: {
    fontSize: '10px',
    fontWeight: 700,
    padding: '1px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase'
  },
  directiveSnippet: {
    fontSize: '12.5px',
    color: '#334155',
    fontStyle: 'italic',
    maxWidth: '260px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
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
    gap: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
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
    gap: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease'
  },
  /* Mobile card styles */
  cardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  mobileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #E2E8F0',
    padding: '14px',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
    cursor: 'pointer'
  },
  mobileCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '10px'
  },
  mobileFarmerName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0F172A',
    marginTop: '4px'
  },
  mobileLocality: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px'
  },
  mobileMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    padding: '8px 0',
    borderTop: '1px solid #F1F5F9',
    borderBottom: '1px solid #F1F5F9',
    marginBottom: '10px'
  },
  mobileMetaVal: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#1E293B',
    marginTop: '1px'
  },
  addressedInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: '8px',
    border: '1px solid #E2E8F0',
    padding: '8px 10px',
    marginBottom: '10px'
  },
  addressedHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  addressedSnippet: {
    fontSize: '12px',
    color: '#334155',
    margin: 0,
    fontStyle: 'italic',
    lineHeight: '1.4'
  },
  mobileCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  /* Modal / Detail Styles */
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
    padding: '16px'
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    maxWidth: '720px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden'
  },
  modalHeader: {
    padding: '18px 22px',
    borderBottom: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF'
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    background: '#F1F5F9',
    border: '1px solid #CBD5E1',
    borderRadius: '6px',
    padding: '3px 8px',
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer'
  },
  modalFarmerTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#0F172A',
    margin: '8px 0 2px'
  },
  modalSubInfo: {
    fontSize: '12.5px',
    color: '#64748B',
    margin: 0
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
    padding: '20px 22px',
    overflowY: 'auto'
  },
  modalMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '10px',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    padding: '12px 14px',
    border: '1px solid #E2E8F0',
    marginBottom: '14px'
  },
  modalMetaBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
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
    margin: 0
  },
  historyContainer: {
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
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
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  },
  historyItemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  historyMessageText: {
    fontSize: '13px',
    color: '#1E293B',
    lineHeight: '1.45',
    whiteSpace: 'pre-wrap'
  },
  actionSectionWrapper: {
    marginTop: '18px',
    borderTop: '1px solid #E2E8F0',
    paddingTop: '16px'
  },
  followupTriggerBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    padding: '14px 16px',
    border: '1px solid #E2E8F0',
    flexWrap: 'wrap',
    gap: '12px'
  },
  prominentFollowupBtn: {
    backgroundColor: '#03358F',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(3, 53, 143, 0.25)',
    transition: 'all 0.15s ease'
  },
  composerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    padding: '14px',
    border: '1px solid #CBD5E1'
  },
  composerLabel: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A'
  },
  composerTextarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #CBD5E1',
    fontSize: '13.5px',
    fontFamily: 'inherit',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
    backgroundColor: '#FFFFFF',
    lineHeight: '1.45'
  },
  composerActionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '10px',
    marginTop: '12px'
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    color: '#475569',
    border: '1px solid #CBD5E1',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  sendBtn: {
    backgroundColor: '#03358F',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    margin: '12px 0 0',
    border: '1px solid #FECACA'
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    margin: '12px 0 0',
    border: '1px solid #BBF7D0'
  },
  noticeBoxInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    backgroundColor: '#EFF6FF',
    border: '1px solid #BFDBFE',
    borderRadius: '10px',
    padding: '12px 14px'
  },
  noticeBoxWarning: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    backgroundColor: '#FFFBEB',
    border: '1px solid #FDE68A',
    borderRadius: '10px',
    padding: '12px 14px'
  },
  /* Dedicated Side-Column Layout Styles */
  sideContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    border: '1px solid #E2E8F0',
    padding: '18px 16px',
    boxShadow: '0 4px 18px rgba(15, 23, 42, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    boxSizing: 'border-box'
  },
  sideHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px'
  },
  sideTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  sideTitleIconBox: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    backgroundColor: '#FEE2E2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  sideTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.01em'
  },
  sideRollingTag: {
    fontSize: '10.5px',
    fontWeight: 600,
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    padding: '1px 6px',
    borderRadius: '8px',
    border: '1px solid #BFDBFE'
  },
  sideSubtitle: {
    fontSize: '11.5px',
    color: '#64748B',
    margin: '1px 0 0'
  },
  sideRefreshBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 10px',
    borderRadius: '6px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #CBD5E1',
    color: '#334155',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  sideTabGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    backgroundColor: '#F1F5F9',
    padding: '4px',
    borderRadius: '10px'
  },
  sideTabBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid transparent',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  sideTabBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: '10px'
  },
  sideSearchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '6px 10px'
  },
  sideSearchInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '12.5px',
    color: '#0F172A',
    backgroundColor: 'transparent'
  },
  sideStateContainer: {
    textAlign: 'center',
    padding: '32px 14px',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    border: '1px dashed #CBD5E1'
  },
  sideLoadingSpinner: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2.5px solid #E2E8F0',
    borderTopColor: '#2563EB',
    margin: '0 auto 10px'
  },
  sideItemList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '560px',
    overflowY: 'auto',
    paddingRight: '4px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#CBD5E1 transparent'
  },
  sideItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    padding: '12px',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '7px'
  },
  sideCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '6px'
  },
  sideTankBadge: {
    fontSize: '12px',
    fontWeight: 700,
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    padding: '2px 7px',
    borderRadius: '5px'
  },
  sideCodeTag: {
    fontFamily: 'monospace',
    backgroundColor: '#F1F5F9',
    padding: '2px 5px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#475569'
  },
  sideDaysBadge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: '6px',
    whiteSpace: 'nowrap'
  },
  sideSettledBadge: {
    fontSize: '10.5px',
    fontWeight: 700,
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    border: '1px solid #BBF7D0',
    padding: '2px 6px',
    borderRadius: '4px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px'
  },
  sideFarmerRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px'
  },
  sideFarmerName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0F172A'
  },
  sideLocality: {
    fontSize: '11.5px',
    color: '#64748B'
  },
  sideMetaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: '6px',
    padding: '5px 8px',
    fontSize: '11px',
    gap: '6px'
  },
  sideMetaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  sideMetaLabel: {
    color: '#64748B',
    fontWeight: 500
  },
  sideMetaVal: {
    color: '#0F172A',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  sideAddressedBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: '6px',
    border: '1px solid #BAE6FD',
    padding: '6px 8px',
    fontSize: '11px'
  },
  sideAddressedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2px'
  },
  sideAddressedSnippet: {
    margin: 0,
    color: '#0369A1',
    fontStyle: 'italic',
    lineHeight: '1.35',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  sideCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '4px',
    borderTop: '1px solid #F1F5F9'
  },
  sideActionBtnDue: {
    backgroundColor: '#DC2626',
    color: '#FFFFFF',
    border: 'none',
    padding: '4px 9px',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    cursor: 'pointer'
  },
  sideActionBtnAddressed: {
    backgroundColor: '#EFF6FF',
    color: '#2563EB',
    border: '1px solid #BFDBFE',
    padding: '4px 9px',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    cursor: 'pointer'
  }
};
