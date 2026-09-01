import React, { useState, useEffect } from 'react';
import { 
  Wifi, WifiOff, RefreshCw, CheckCircle, AlertTriangle, 
  Trash2, X, ArrowRight, ShieldCheck, Database 
} from 'lucide-react';
import { 
  isDeviceOnline, getPendingSyncRecords, 
  syncPendingRecords, clearPendingQueue, removeQueuedRecord 
} from '../utils/syncService';
import { useMockData } from '../../context/MockDataContext';

const SyncStatusModal = ({ isOpen, onClose }) => {
  const { recordFieldEntry } = useMockData();
  const [online, setOnline] = useState(isDeviceOnline());
  const [pendingRecords, setPendingRecords] = useState(getPendingSyncRecords());
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const refreshState = () => {
    setOnline(isDeviceOnline());
    setPendingRecords(getPendingSyncRecords());
  };

  useEffect(() => {
    refreshState();

    const handleOnline = () => {
      setOnline(true);
      setSyncMessage('Device is back ONLINE! Ready to sync.');
    };
    const handleOffline = () => {
      setOnline(false);
      setSyncMessage('Device is OFFLINE. New entries will be saved locally.');
    };
    const handleQueueChange = () => {
      setPendingRecords(getPendingSyncRecords());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offlineQueueUpdated', handleQueueChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offlineQueueUpdated', handleQueueChange);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    if (!online) {
      alert('Cannot sync while offline. Please connect to Wi-Fi or mobile data.');
      return;
    }

    setSyncing(true);
    setSyncMessage('Synchronizing pending field records...');

    try {
      const result = await syncPendingRecords(async (record) => {
        // Push record into mock data store
        recordFieldEntry({
          ...record,
          offline: false,
        });
      });

      if (result.success) {
        setSyncMessage(`✓ All ${result.syncedCount} records synced successfully!`);
      } else {
        setSyncMessage(`Synced ${result.syncedCount} records. ${result.failedCount} failed.`);
      }
      refreshState();
    } catch (err) {
      setSyncMessage(`Sync error: ${err.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 4000);
    }
  };

  const handleRemove = (localId) => {
    removeQueuedRecord(localId);
    refreshState();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              ...styles.statusIconCircle,
              backgroundColor: online ? '#E8F8EE' : '#FEE2E2',
              color: online ? '#15803D' : '#B91C1C'
            }}>
              {online ? <Wifi size={20} /> : <WifiOff size={20} />}
            </div>
            <div>
              <h3 style={styles.title}>Field Sync Manager</h3>
              <p style={styles.subtitle}>
                {online ? 'Connected to Cloud • Ready to Sync' : 'Offline Mode Active • Local Storage Safe'}
              </p>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Status Card */}
        <div style={styles.body}>
          <div style={{
            ...styles.networkBanner,
            backgroundColor: online ? '#F0FDF4' : '#FEF2F2',
            borderColor: online ? '#BBF7D0' : '#FECACA',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: online ? '#22C55E' : '#EF4444',
                boxShadow: online ? '0 0 8px #22C55E' : '0 0 8px #EF4444'
              }}></div>
              <span style={{
                fontSize: '13px',
                fontWeight: '700',
                color: online ? '#166534' : '#991B1B'
              }}>
                {online ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>
              {pendingRecords.length === 0 
                ? '✓ All field records synced' 
                : `⚠ ${pendingRecords.length} records waiting to sync`}
            </span>
          </div>

          {syncMessage && (
            <div style={{
              ...styles.messageBox,
              backgroundColor: syncMessage.includes('✓') || syncMessage.includes('ONLINE') ? '#E8F8EE' : '#FEF3C7',
              color: syncMessage.includes('✓') || syncMessage.includes('ONLINE') ? '#15803D' : '#92400E',
            }}>
              <CheckCircle size={15} />
              <span>{syncMessage}</span>
            </div>
          )}

          {/* Pending Queue List */}
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Pending Records Queue ({pendingRecords.length})</span>
            {pendingRecords.length > 0 && (
              <button 
                type="button"
                style={styles.clearBtn}
                onClick={() => {
                  if (window.confirm('Clear all queued records?')) {
                    clearPendingQueue();
                    refreshState();
                  }
                }}
              >
                <Trash2 size={12} /> Clear Queue
              </button>
            )}
          </div>

          <div style={styles.queueList}>
            {pendingRecords.length === 0 ? (
              <div style={styles.emptyState}>
                <ShieldCheck size={36} color="#10B981" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '14px' }}>Everything is up to date</div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                  No pending field records in local queue. All tests and visits are synced.
                </div>
              </div>
            ) : (
              pendingRecords.map((item, idx) => (
                <div key={item.localId || idx} style={styles.queueItem}>
                  <div style={{ flex: 1 }}>
                    <div style={styles.itemHeader}>
                      <span style={styles.itemType}>{item.recordType || item.testType || 'Water Test'}</span>
                      <span style={styles.itemTime}>{new Date(item.queuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={styles.itemMeta}>
                      Farmer: <b>{item.farmerName || item.farmerId}</b> • Tank: <b>{item.tankName || (item.tankId ? `Tank ${item.tankId.replace(/\D/g, '') || item.tankId}` : 'Tank 1')}</b>
                    </div>
                    <div style={styles.itemGps}>
                      📍 {item.gps?.locality || 'GPS Attached'} (±{item.gps?.accuracy || 8}m)
                    </div>
                  </div>
                  <button 
                    style={styles.removeBtn}
                    onClick={() => handleRemove(item.localId)}
                    title="Remove item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Action Bar */}
          <div style={styles.actionRow}>
            <button
              type="button"
              style={{
                ...styles.syncBtn,
                opacity: (pendingRecords.length === 0 || !online || syncing) ? 0.6 : 1,
                cursor: (pendingRecords.length === 0 || !online || syncing) ? 'not-allowed' : 'pointer',
              }}
              onClick={handleSyncNow}
              disabled={pendingRecords.length === 0 || !online || syncing}
            >
              <RefreshCw size={16} className={syncing ? 'spin-animation' : ''} />
              <span>{syncing ? 'Syncing to Cloud...' : 'SYNC ALL RECORDS NOW'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    padding: '16px',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  statusIconCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
  },
  subtitle: {
    fontSize: '11px',
    color: '#64748B',
    margin: '2px 0 0 0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: '16px 20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  networkBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid',
  },
  messageBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#334155',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  clearBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    color: '#DC2626',
    fontSize: '11px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  queueList: {
    maxHeight: '260px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  emptyState: {
    padding: '30px 16px',
    textAlign: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: '12px',
    border: '1px dashed #CBD5E1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  queueItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    backgroundColor: '#F8FAFC',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
  },
  itemHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '2px',
  },
  itemType: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#0018AD',
  },
  itemTime: {
    fontSize: '11px',
    color: '#94A3B8',
  },
  itemMeta: {
    fontSize: '12px',
    color: '#334155',
  },
  itemGps: {
    fontSize: '11px',
    color: '#15803D',
    marginTop: '2px',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
  },
  actionRow: {
    marginTop: '6px',
  },
  syncBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '13px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#0018AD',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: '700',
    boxShadow: '0 4px 14px rgba(0, 24, 173, 0.35)',
  },
};

export default SyncStatusModal;
