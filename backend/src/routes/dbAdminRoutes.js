import { Router } from 'express';
import {
  getTables,
  getTableData,
  updateRow,
  insertRow,
  deleteRow,
  executeQuery,
  getSchema,
  bulkDelete,
  getDashboardMetrics,
  hashPassword,
  verifyPassword,
} from '../controllers/dbAdminController.js';

const router = Router();

// Detailed Dashboard overview
router.get('/dashboard', getDashboardMetrics);

// Table metadata and list
router.get('/tables', getTables);

// Table rows data, pagination, and searching
router.get('/tables/:table', getTableData);

// Table schema details
router.get('/tables/:table/schema', getSchema);

// Update a row
router.put('/tables/:table/:id', updateRow);

// Insert a new row
router.post('/tables/:table', insertRow);

// Bulk delete rows
router.post('/tables/:table/bulk-delete', bulkDelete);

// Delete a row
router.delete('/tables/:table/:id', deleteRow);

// SQL query console
router.post('/query', executeQuery);

// Password Hasher & Verifier (reverse lookup)
router.post('/hash-password', hashPassword);
router.post('/verify-password', verifyPassword);

export default router;
