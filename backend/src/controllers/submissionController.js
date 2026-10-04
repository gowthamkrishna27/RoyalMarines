import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getSubmissions = async (req, res) => {
  const { status, agentId, tankId } = req.query;
  const submissions = await store.getSubmissions({ status, agentId, tankId });
  return sendSuccess(res, submissions, 'Submissions retrieved successfully', 200, {
    total: submissions.length,
  });
};

export const createSubmission = async (req, res) => {
  const { farmerId, tankId, testType, data } = req.body;

  if (!tankId || !data) {
    return sendError(res, 'tankId and data are required', 400);
  }

  const submission = await store.createSubmission({
    agentId: req.user?.id || req.body.agentId || 'agent001',
    farmerId: farmerId || '',
    tankId,
    testType: testType || 'Water Quality Test',
    data,
  });

  return sendSuccess(res, submission, 'Submission created successfully', 201);
};

export const verifySubmission = async (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status || !['COMPLETED', 'FLAGGED', 'REJECTED'].includes(status.toUpperCase())) {
    return sendError(res, 'Valid status (COMPLETED, FLAGGED, REJECTED) is required', 400);
  }

  const updated = await store.updateSubmissionStatus(id, status.toUpperCase(), notes);

  if (!updated) {
    return sendError(res, `Submission with ID ${id} not found`, 404);
  }

  return sendSuccess(res, updated, `Submission ${status.toLowerCase()} successfully`);
};
