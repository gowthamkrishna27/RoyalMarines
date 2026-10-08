import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * GET /api/admin/submission-locations
 * Returns real GPS coordinates for submissions from MySQL database.
 * Supports query filters: userId, role, date
 */
export const getSubmissionLocations = async (req, res) => {
  try {
    const { userId, role, date } = req.query;
    const locations = await store.getSubmissionLocations({
      userId: userId || undefined,
      role: role || undefined,
      date: date || undefined,
    });

    return sendSuccess(
      res,
      locations,
      `Retrieved ${locations.length} submission location(s) successfully`,
      200,
      { total: locations.length }
    );
  } catch (error) {
    console.error('[Error in getSubmissionLocations]', error);
    return sendError(res, 'Failed to retrieve submission locations', 500);
  }
};

/**
 * GET /api/admin/field-staff
 * Returns list of real Agents and Incharges from MySQL database for filters.
 */
export const getFieldStaff = async (req, res) => {
  try {
    const staff = await store.getFieldStaff();
    return sendSuccess(res, staff, 'Field staff retrieved successfully', 200, { total: staff.length });
  } catch (error) {
    console.error('[Error in getFieldStaff]', error);
    return sendError(res, 'Failed to retrieve field staff', 500);
  }
};
