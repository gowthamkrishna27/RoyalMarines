import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getNotifications = async (req, res) => {
  try {
    const user = req.user || null;
    const { userId, agentId, inchargeId, role, unreadOnly } = req.query;

    const notifications = await store.getNotifications({
      userId,
      agentId,
      inchargeId,
      role,
      unreadOnly
    }, user);

    const unreadCount = notifications.filter(n => !n.read).length;

    return sendSuccess(res, notifications, 'Notifications retrieved successfully', 200, {
      total: notifications.length,
      unreadCount
    });
  } catch (error) {
    console.error('[Error in getNotifications]', error);
    return sendError(res, error.message || 'Failed to retrieve notifications from database', 500);
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return sendError(res, 'Notification ID is required', 400);
    }

    await store.markNotificationRead(id);
    return sendSuccess(res, { id, read: true }, 'Notification marked as read');
  } catch (error) {
    console.error('[Error in markNotificationRead]', error);
    return sendError(res, error.message || 'Failed to update notification read status', 500);
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    const targetId = req.body?.userId || req.body?.agentId || req.user?.id || req.query?.userId || null;
    await store.markAllNotificationsRead(targetId);
    return sendSuccess(res, { success: true, targetId }, 'All notifications marked as read');
  } catch (error) {
    console.error('[Error in markAllNotificationsRead]', error);
    return sendError(res, error.message || 'Failed to mark all notifications as read', 500);
  }
};

export default {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
