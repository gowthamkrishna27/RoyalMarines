import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getSubmissions = async (req, res) => {
  try {
    const { status, agentId, tankId, farmerId } = req.query;
    const submissions = await store.getSubmissions({ status, agentId, tankId, farmerId });
    return sendSuccess(res, submissions, 'Submissions retrieved successfully', 200, {
      total: submissions.length,
    });
  } catch (error) {
    console.error('[Error in getSubmissions]', error);
    return sendError(res, 'Failed to retrieve submissions from database', 500);
  }
};

export const createSubmission = async (req, res) => {
  try {
    const { 
      farmerId, 
      tankId, 
      testType, 
      data, 
      agentId, 
      id, 
      date, 
      submissionTime,
      accuracy,
      status,
      latitude,
      longitude,
      locality,
      gps,
      coordinates
    } = req.body;

    if (!tankId || !data) {
      return sendError(res, 'tankId and data are required', 400);
    }

    const resolvedUserId = req.user?.id || req.body.userId || req.body.agentId || agentId || null;
    const resolvedUserName = req.user?.name || req.body.userName || req.body.agentName || null;
    const resolvedRole = req.user?.role || req.body.role || (resolvedUserId && String(resolvedUserId).startsWith('INC') ? 'Incharge' : 'Agent');

    const submission = await store.createSubmission({
      id: id || req.body.id,
      agentId: resolvedUserId,
      userId: resolvedUserId,
      userName: resolvedUserName,
      role: resolvedRole,
      farmerId: farmerId || '',
      tankId,
      testType: testType || 'Water Quality Test',
      date: date || new Date().toISOString().split('T')[0],
      submissionTime: submissionTime || req.body.submissionTime || null,
      status: status || 'PENDING_VERIFICATION',
      data,
      latitude: latitude ?? gps?.latitude ?? coordinates?.latitude ?? data?.gps?.latitude,
      longitude: longitude ?? gps?.longitude ?? coordinates?.longitude ?? data?.gps?.longitude,
      accuracy: accuracy ?? gps?.accuracy ?? coordinates?.accuracy ?? data?.gps?.accuracy,
      locality: locality ?? gps?.locality ?? coordinates?.locality ?? data?.gps?.locality,
    });

    return sendSuccess(res, submission, 'Submission created successfully with GPS coordinates', 201);
  } catch (error) {
    console.error('[Error in createSubmission]', error);
    return sendError(res, error.message || 'Failed to create submission in database', 500);
  }
};

export const verifySubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['COMPLETED', 'VERIFIED', 'APPROVED', 'FLAGGED', 'REJECTED', 'CHANGES REQUESTED', 'PENDING_VERIFICATION'];
    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return sendError(res, `Valid status (${validStatuses.join(', ')}) is required`, 400);
    }

    const updated = await store.updateSubmissionStatus(id, status, notes);

    if (!updated) {
      return sendError(res, `Submission with ID ${id} not found`, 404);
    }

    return sendSuccess(res, updated, `Submission ${status.toLowerCase()} successfully`);
  } catch (error) {
    console.error('[Error in verifySubmission]', error);
    return sendError(res, error.message || 'Failed to verify submission in database', 500);
  }
};
