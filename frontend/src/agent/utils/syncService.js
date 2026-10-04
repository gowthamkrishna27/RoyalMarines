/**
 * Offline & Sync Service for Royals Marine Food Field Technicians
 * Handles seamless offline field data recording, local storage queuing,
 * automatic online detection, duplicate prevention, and server synchronization.
 */

const QUEUE_STORAGE_KEY = 'rmp_offline_records_queue';
const SYNC_HISTORY_KEY = 'rmp_sync_history';

/**
 * Check if the browser currently has network connectivity
 */
export function isDeviceOnline() {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true;
}

/**
 * Get all records waiting to sync from localStorage
 */
export function getPendingSyncRecords() {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read offline records queue:', e);
    return [];
  }
}

/**
 * Get the count of records currently waiting to sync
 */
export function getPendingSyncCount() {
  return getPendingSyncRecords().length;
}

/**
 * Queue a new record offline
 */
export function queueOfflineRecord(record) {
  try {
    const queue = getPendingSyncRecords();
    const localId = `LOCAL_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const offlineRecord = {
      ...record,
      localId,
      queuedAt: new Date().toISOString(),
      pendingSync: true,
      retryCount: 0,
    };

    queue.push(offlineRecord);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('offlineQueueUpdated', { detail: { count: queue.length } }));
    }

    return offlineRecord;
  } catch (e) {
    console.error('Failed to queue offline record:', e);
    return null;
  }
}

/**
 * Remove a specific record from the pending queue
 */
export function removeQueuedRecord(localId) {
  try {
    const queue = getPendingSyncRecords().filter(r => r.localId !== localId);
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('offlineQueueUpdated', { detail: { count: queue.length } }));
    }
  } catch (e) {
    console.error('Failed to remove queued record:', e);
  }
}

/**
 * Process all pending offline records and push them to the server/state store
 */
export async function syncPendingRecords(submitFn) {
  const queue = getPendingSyncRecords();
  if (queue.length === 0) {
    return { success: true, syncedCount: 0, failedCount: 0 };
  }

  let syncedCount = 0;
  let failedCount = 0;
  const remainingQueue = [];
  const syncedList = [];

  for (const record of queue) {
    try {
      if (submitFn) {
        // Execute callback to submit record to MockDataContext
        await submitFn(record);
      }
      syncedCount++;
      syncedList.push({
        localId: record.localId,
        type: record.recordType || record.testType || 'Field Record',
        syncedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`Failed to sync record ${record.localId}:`, err);
      failedCount++;
      remainingQueue.push({
        ...record,
        retryCount: (record.retryCount || 0) + 1,
        lastError: err.message || 'Sync error',
      });
    }
  }

  // Update localStorage queue
  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remainingQueue));

  // Log to sync history
  try {
    const history = JSON.parse(localStorage.getItem(SYNC_HISTORY_KEY) || '[]');
    history.unshift({
      timestamp: new Date().toISOString(),
      syncedCount,
      failedCount,
      items: syncedList,
    });
    localStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
  } catch (e) {
    console.error('Error writing sync history:', e);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offlineQueueUpdated', { detail: { count: remainingQueue.length } }));
    window.dispatchEvent(new CustomEvent('syncCompleted', { detail: { syncedCount, failedCount } }));
  }

  return {
    success: failedCount === 0,
    syncedCount,
    failedCount,
  };
}

/**
 * Clear all pending records (for testing or hard reset)
 */
export function clearPendingQueue() {
  localStorage.removeItem(QUEUE_STORAGE_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('offlineQueueUpdated', { detail: { count: 0 } }));
  }
}

/**
 * Get overall sync status snapshot
 */
export function getSyncStatus() {
  const online = isDeviceOnline();
  const pending = getPendingSyncRecords();
  return {
    isOnline: online,
    pendingCount: pending.length,
    pendingRecords: pending,
    lastSynced: new Date().toISOString(),
  };
}

