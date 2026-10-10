import { query, isDbConnected } from '../config/database.js';
import bcrypt from 'bcryptjs';

const normalizeUser = (u) => {
  if (!u) return null;
  const roleStr = (u.role || (u.role_id === 1 ? 'ADMIN' : (u.role_id === 2 ? 'ASM' : 'AGENT')) || '').toUpperCase();
  const normalizedRole = (roleStr === 'TECHNICIAN' || roleStr === 'AGENT') ? 'AGENT' : (roleStr === 'INCHARGE' || roleStr === 'ASM') ? 'ASM' : roleStr;
  return {
    ...u,
    id: String(u.id),
    name: u.name || u.full_name || u.username,
    fullName: u.full_name || u.name || u.username,
    password: u.password || u.password_hash,
    passwordHash: u.password_hash || u.password,
    role: normalizedRole,
    rawRole: roleStr,
    phone: u.phone || '',
    email: u.email || '',
    locality: u.locality || '',
    region: u.region || '',
  };
};

class DataStore {
  constructor() {}

  _ensureDb() {
    if (!isDbConnected()) {
      const err = new Error('[Database Unavailable] MySQL connection is not active. Single source of truth is unreachable.');
      err.statusCode = 503;
      throw err;
    }
  }

  // --- Auth & Users ---

  async findUserByIdentifier(identifier) {
    this._ensureDb();
    try {
      const rows = await query(
        `SELECT u.*, r.name as role 
         FROM users u 
         LEFT JOIN roles r ON u.role_id = r.id 
         WHERE LOWER(u.id) = LOWER(?) OR LOWER(u.username) = LOWER(?) OR u.phone = ? OR LOWER(u.email) = LOWER(?) 
         LIMIT 1`,
        [identifier, identifier, identifier, identifier]
      );
      if (rows && rows.length > 0) {
        return normalizeUser(rows[0]);
      }
      return null;
    } catch (err) {
      console.error('[DB Error in findUserByIdentifier]', err.message);
      throw new Error(`[DB Error in findUserByIdentifier]: ${err.message}`);
    }
  }

  async findUserByCredentials(identifier, password) {
    const user = await this.findUserByIdentifier(identifier);
    if (user && user.password === password) return user;
    return null;
  }

  async findUserById(id) {
    this._ensureDb();
    try {
      const rows = await query(
        `SELECT u.*, r.name as role 
         FROM users u 
         LEFT JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ? 
         LIMIT 1`,
        [id]
      );
      if (rows && rows.length > 0) {
        return normalizeUser(rows[0]);
      }
      return null;
    } catch (err) {
      console.error('[DB Error in findUserById]', err.message);
      throw new Error(`[DB Error in findUserById]: ${err.message}`);
    }
  }

  // --- Farmers ---

  async getFarmers(filter = {}) {
    this._ensureDb();
    try {
      let sql = `
        SELECT 
          f.*,
          COALESCE(f.location, CONCAT_WS(', ', f.village, f.mandal)) as location,
          COALESCE(a.name, f.assigned_to) as agent_name,
          COALESCE(i.name, '') as incharge_name,
          COALESCE(r.name, '') as region_name,
          COALESCE(r.id, r.code, i.region_id, '') as region_id
        FROM farmers f
        LEFT JOIN agents a ON f.agent_id = a.id
        LEFT JOIN incharges i ON COALESCE(f.incharge_id, a.incharge_id) = i.id
        LEFT JOIN regions r ON i.region_id = r.id
        WHERE 1=1
      `;
      const params = [];

      if (filter.agentId) {
        sql += ' AND f.agent_id = ?';
        params.push(filter.agentId);
      }
      if (filter.inchargeId) {
        sql += ' AND (f.incharge_id = ? OR a.incharge_id = ?)';
        params.push(filter.inchargeId, filter.inchargeId);
      }
      if (filter.regionId) {
        sql += ' AND (i.region_id = ? OR r.code = ? OR r.id = ? OR LOWER(r.name) = LOWER(?) OR LOWER(r.name) LIKE ?)';
        const partial = `%${String(filter.regionId).toLowerCase()}%`;
        params.push(filter.regionId, filter.regionId, filter.regionId, filter.regionId, partial);
      }
      if (filter.search) {
        sql += ' AND (LOWER(f.name) LIKE ? OR LOWER(f.location) LIKE ? OR LOWER(f.village) LIKE ? OR f.phone LIKE ? OR f.farmer_code LIKE ?)';
        const term = `%${filter.search.toLowerCase()}%`;
        params.push(term, term, term, term, term);
      }
      sql += ' ORDER BY f.created_at DESC, f.id ASC';
      if (filter.limit && !isNaN(Number(filter.limit))) {
        sql += ' LIMIT ?';
        params.push(Number(filter.limit));
      }

      const rows = await query(sql, params);
      return rows.map((r) => ({
        ...r,
        id: String(r.id),
        farmerCode: r.farmer_code || r.id,
        name: r.name,
        phone: r.phone || '',
        agentId: r.agent_id,
        agent: r.agent_name || r.assigned_to || 'Unassigned',
        agent_name: r.agent_name || r.assigned_to || 'Unassigned',
        inchargeId: r.incharge_id,
        incharge: r.incharge_name || '',
        assignedTo: r.assigned_to,
        assignedBy: r.assigned_by,
        waterSource: r.water_source || 'Borewell',
        region: r.region_name || r.region || (r.incharge_id === 'INC002' ? 'Kakinada' : r.mandal?.includes('Kakinada') ? 'Kakinada' : r.mandal?.includes('Narasapuram') ? 'Narasapuram' : 'Bhimavaram'),
        region_name: r.region_name || '',
        regionId: r.region_id || '',
        location: r.location || (r.village ? `${r.village}${r.mandal ? `, ${r.mandal}` : ''}` : 'Bhimavaram'),
        village: r.village || r.location || '',
        totalAcres: r.acres != null ? Number(r.acres) : (r.total_acres != null ? Number(r.total_acres) : 0),
        acres: r.acres ? `${r.acres} Acres` : (r.total_acres ? `${r.total_acres} Acres` : '0 Acres'),
        status: r.status || 'ACTIVE',
      }));
    } catch (err) {
      console.error('[DB Error in getFarmers]', err.message);
      throw new Error(`[DB Error in getFarmers]: ${err.message}`);
    }
  }

  async getFarmerById(id) {
    this._ensureDb();
    try {
      const rows = await query(
        `SELECT 
          f.*,
          COALESCE(f.location, CONCAT_WS(', ', f.village, f.mandal)) as location,
          COALESCE(a.name, f.assigned_to) as agent_name,
          COALESCE(i.name, '') as incharge_name,
          COALESCE(r.name, '') as region_name,
          COALESCE(r.id, r.code, i.region_id, '') as region_id
        FROM farmers f
        LEFT JOIN agents a ON f.agent_id = a.id
        LEFT JOIN incharges i ON COALESCE(f.incharge_id, a.incharge_id) = i.id
        LEFT JOIN regions r ON i.region_id = r.id
        WHERE f.id = ? OR f.farmer_code = ?
        LIMIT 1`,
        [id, id]
      );
      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          ...r,
          id: String(r.id),
          farmerCode: r.farmer_code || r.id,
          agentId: r.agent_id,
          agent: r.agent_name || r.assigned_to || '',
          inchargeId: r.incharge_id,
          incharge: r.incharge_name || '',
          assignedTo: r.assigned_to,
          assignedBy: r.assigned_by,
          waterSource: r.water_source,
          region: r.region_name || '',
          regionId: r.region_id || '',
          totalAcres: r.acres ? Number(r.acres) : (r.total_acres ? Number(r.total_acres) : 0),
          acres: r.acres ? `${r.acres} Acres` : (r.total_acres ? `${r.total_acres} Acres` : '0 Acres'),
          status: r.status || 'ACTIVE',
        };
      }
      return null;
    } catch (err) {
      console.error('[DB Error in getFarmerById]', err.message);
      throw new Error(`[DB Error in getFarmerById]: ${err.message}`);
    }
  }

  async createFarmer(data) {
    this._ensureDb();
    if (!data.name || !String(data.name).trim()) {
      throw new Error('Farmer name is required');
    }

    const cleanName = String(data.name).trim();
    const cleanPhone = data.phone ? String(data.phone).trim() : null;
    const cleanLocation = data.location ? String(data.location).trim() : null;

    // Duplicate check: phone
    if (cleanPhone) {
      const existingPhone = await query('SELECT id, name FROM farmers WHERE phone = ? LIMIT 1', [cleanPhone]);
      if (existingPhone && existingPhone.length > 0) {
        const err = new Error(`A farmer with phone number "${cleanPhone}" already exists (${existingPhone[0].name})`);
        err.statusCode = 409;
        throw err;
      }
    }

    const id = data.id || `FAR_${Date.now().toString(36).toUpperCase()}`;
    const farmerCode = data.farmerCode || data.farmer_code || `FAR${String(Date.now()).slice(-4)}`;

    const newFarmer = {
      id,
      farmer_code: farmerCode,
      name: cleanName,
      status: 'ACTIVE',
      agent_id: data.agentId || null,
      incharge_id: data.inchargeId || null,
      assigned_to: data.assignedTo || (data.agentId ? 'Agent' : 'Incharge'),
      assigned_by: data.assignedBy || 'Admin',
      phone: cleanPhone || '',
      location: cleanLocation || '',
      water_source: data.waterSource || 'Borewell',
      acres: data.acres != null && data.acres !== '' ? Number(data.acres) : null,
      total_acres: data.acres != null && data.acres !== '' ? Number(data.acres) : null,
    };

    try {
      await query(
        `INSERT INTO farmers (id, farmer_code, name, status, agent_id, incharge_id, assigned_to, assigned_by, phone, location, water_source, acres, total_acres) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newFarmer.id,
          newFarmer.farmer_code,
          newFarmer.name,
          newFarmer.status,
          newFarmer.agent_id,
          newFarmer.incharge_id,
          newFarmer.assigned_to,
          newFarmer.assigned_by,
          newFarmer.phone,
          newFarmer.location,
          newFarmer.water_source,
          newFarmer.acres,
          newFarmer.total_acres,
        ]
      );
      return this.getFarmerById(newFarmer.id);
    } catch (err) {
      console.error('[DB Error in createFarmer]', err.message);
      throw new Error(`[DB Error in createFarmer]: ${err.message}`);
    }
  }

  async updateFarmer(id, updates) {
    this._ensureDb();
    try {
      const fields = [];
      const params = [];

      if (updates.name !== undefined) { fields.push('name = ?'); params.push(String(updates.name).trim()); }
      if (updates.status !== undefined) { fields.push('status = ?'); params.push(updates.status); }
      if (updates.agentId !== undefined) { fields.push('agent_id = ?'); params.push(updates.agentId || null); }
      if (updates.inchargeId !== undefined) { fields.push('incharge_id = ?'); params.push(updates.inchargeId || null); }
      if (updates.assignedTo !== undefined) { fields.push('assigned_to = ?'); params.push(updates.assignedTo || null); }
      if (updates.phone !== undefined) { fields.push('phone = ?'); params.push(updates.phone); }
      if (updates.location !== undefined) { fields.push('location = ?'); params.push(updates.location); }
      if (updates.waterSource !== undefined) { fields.push('water_source = ?'); params.push(updates.waterSource); }
      if (updates.acres !== undefined) {
        const val = updates.acres != null && updates.acres !== '' ? Number(updates.acres) : null;
        fields.push('acres = ?', 'total_acres = ?');
        params.push(val, val);
      }

      if (fields.length > 0) {
        params.push(id, id);
        await query(`UPDATE farmers SET ${fields.join(', ')} WHERE id = ? OR farmer_code = ?`, params);
      }
      return this.getFarmerById(id);
    } catch (err) {
      console.error('[DB Error in updateFarmer]', err.message);
      throw new Error(`[DB Error in updateFarmer]: ${err.message}`);
    }
  }

  async deleteFarmer(id) {
    this._ensureDb();
    try {
      const res = await query('DELETE FROM farmers WHERE id = ? OR farmer_code = ?', [id, id]);
      return res.affectedRows > 0;
    } catch (err) {
      console.error('[DB Error in deleteFarmer]', err.message);
      throw new Error(`[DB Error in deleteFarmer]: ${err.message}`);
    }
  }

  // --- Tanks / Ponds ---

  async getTanks(filter = {}) {
    this._ensureDb();
    try {
      let sql = `
        SELECT 
          t.*,
          COALESCE(f.name, '') as farmer_name,
          COALESCE(f.location, '') as farmer_location,
          COALESCE(a.name, '') as agent_name,
          COALESCE(i.name, '') as incharge_name,
          COALESCE(r.name, '') as region_name,
          COALESCE(r.id, r.code, i.region_id, '') as region_id
        FROM tanks t
        LEFT JOIN farmers f ON t.farmer_id = f.id
        LEFT JOIN agents a ON COALESCE(t.agent_id, f.agent_id) = a.id
        LEFT JOIN incharges i ON COALESCE(t.incharge_id, f.incharge_id, a.incharge_id) = i.id
        LEFT JOIN regions r ON i.region_id = r.id
        WHERE 1=1
      `;
      const params = [];

      if (filter.farmerId) {
        sql += ' AND (t.farmer_id = ? OR f.farmer_code = ?)';
        params.push(filter.farmerId, filter.farmerId);
      }
      if (filter.agentId) {
        sql += ' AND (t.agent_id = ? OR f.agent_id = ?)';
        params.push(filter.agentId, filter.agentId);
      }
      if (filter.inchargeId) {
        sql += ' AND (t.incharge_id = ? OR f.incharge_id = ? OR a.incharge_id = ?)';
        params.push(filter.inchargeId, filter.inchargeId, filter.inchargeId);
      }
      if (filter.status) {
        sql += ' AND LOWER(t.status) = LOWER(?)';
        params.push(filter.status);
      }
      if (filter.testStatus) {
        sql += ' AND LOWER(t.test_status) = LOWER(?)';
        params.push(filter.testStatus);
      }

      sql += ' ORDER BY t.created_at DESC, t.id ASC';

      const rows = await query(sql, params);
      return rows.map((r) => ({
        ...r,
        id: String(r.id),
        farmerId: r.farmer_id,
        farmerName: r.farmer_name,
        farmer: r.farmer_name,
        location: r.farmer_location || r.location || '',
        agentId: r.agent_id,
        agent: r.agent_name,
        inchargeId: r.incharge_id,
        incharge: r.incharge_name,
        region: r.region_name || '',
        regionId: r.region_id || '',
        testStatus: r.test_status || 'Due',
        lastTest: r.last_test,
        nextTest: r.next_test,
        status: r.status || 'ACTIVE',
      }));
    } catch (err) {
      console.error('[DB Error in getTanks]', err.message);
      throw new Error(`[DB Error in getTanks]: ${err.message}`);
    }
  }

  async getTankById(id) {
    this._ensureDb();
    try {
      const rows = await query(
        `SELECT 
          t.*,
          COALESCE(f.name, '') as farmer_name,
          COALESCE(f.location, '') as farmer_location,
          COALESCE(f.phone, '') as farmer_phone,
          COALESCE(a.name, '') as agent_name,
          COALESCE(a.phone, '') as agent_phone,
          COALESCE(i.name, '') as incharge_name,
          COALESCE(r.name, '') as region_name,
          COALESCE(r.id, r.code, i.region_id, '') as region_id
        FROM tanks t
        LEFT JOIN farmers f ON t.farmer_id = f.id
        LEFT JOIN agents a ON COALESCE(t.agent_id, f.agent_id) = a.id
        LEFT JOIN incharges i ON COALESCE(t.incharge_id, f.incharge_id, a.incharge_id) = i.id
        LEFT JOIN regions r ON i.region_id = r.id
        WHERE t.id = ? 
        LIMIT 1`,
        [id]
      );
      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          ...r,
          id: String(r.id),
          farmerId: r.farmer_id,
          farmerName: r.farmer_name,
          farmer: r.farmer_name,
          farmerPhone: r.farmer_phone,
          location: r.farmer_location || r.location || '',
          agentId: r.agent_id,
          agent: r.agent_name,
          agentPhone: r.agent_phone,
          inchargeId: r.incharge_id,
          incharge: r.incharge_name,
          region: r.region_name || '',
          regionId: r.region_id || '',
          testStatus: r.test_status || 'Due',
          lastTest: r.last_test,
          nextTest: r.next_test,
          status: r.status || 'ACTIVE',
        };
      }
      return null;
    } catch (err) {
      console.error('[DB Error in getTankById]', err.message);
      throw new Error(`[DB Error in getTankById]: ${err.message}`);
    }
  }

  async createTank(data) {
    this._ensureDb();
    if (!data.name || !String(data.name).trim()) {
      throw new Error('Tank name is required');
    }
    if (!data.farmerId) {
      throw new Error('farmerId is required');
    }

    const cleanName = String(data.name).trim();

    const existing = await query(
      'SELECT id, name FROM tanks WHERE farmer_id = ? AND LOWER(name) = LOWER(?) LIMIT 1',
      [data.farmerId, cleanName]
    );
    if (existing && existing.length > 0) {
      const err = new Error(`A tank named "${cleanName}" already exists for this farmer`);
      err.statusCode = 409;
      throw err;
    }

    const id = data.id || `T_${Date.now().toString(36).toUpperCase()}`;
    const newTank = {
      id,
      name: cleanName,
      farmer_id: data.farmerId,
      agent_id: data.agentId || null,
      incharge_id: data.inchargeId || null,
      assigned_to: data.assignedTo || (data.agentId ? 'Agent' : data.inchargeId ? 'Incharge' : 'Unassigned'),
      status: data.status || 'ACTIVE',
      test_status: data.testStatus || 'Due',
      abw: data.abw ? String(data.abw) : '16.5g',
      biomass: data.biomass ? String(data.biomass) : '1500kg',
      fcr: data.fcr ? String(data.fcr) : '1.20',
      last_test: data.lastTest || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      next_test: data.nextTest || 'In 7 Days',
      size: data.size || (data.acres ? `${data.acres} Acres` : '2.5 Acres'),
      doc: data.doc != null && data.doc !== '' ? Number(data.doc) : 1,
      salinity: data.salinity || '15 ppt',
      species: data.species || 'Vannamei',
      culture_type: data.cultureType || 'Semi-Intensive',
      stocking_date: data.stockingDate || new Date().toISOString().split('T')[0],
      latitude: data.latitude != null ? parseFloat(data.latitude) : null,
      longitude: data.longitude != null ? parseFloat(data.longitude) : null,
      location: data.location || null,
    };

    try {
      await query(
        `INSERT INTO tanks (id, name, farmer_id, agent_id, incharge_id, assigned_to, status, test_status, abw, biomass, fcr, last_test, next_test, size, doc, salinity, species, culture_type, stocking_date, latitude, longitude, location) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name=VALUES(name), farmer_id=VALUES(farmer_id), agent_id=VALUES(agent_id), incharge_id=VALUES(incharge_id),
           assigned_to=VALUES(assigned_to), status=VALUES(status), test_status=VALUES(test_status), abw=VALUES(abw),
           biomass=VALUES(biomass), fcr=VALUES(fcr), last_test=VALUES(last_test), next_test=VALUES(next_test), size=VALUES(size), doc=VALUES(doc),
           salinity=VALUES(salinity), species=VALUES(species), culture_type=VALUES(culture_type), stocking_date=VALUES(stocking_date),
           latitude=VALUES(latitude), longitude=VALUES(longitude), location=VALUES(location)`,
        [
          newTank.id,
          newTank.name,
          newTank.farmer_id,
          newTank.agent_id,
          newTank.incharge_id,
          newTank.assigned_to,
          newTank.status,
          newTank.test_status,
          newTank.abw,
          newTank.biomass,
          newTank.fcr,
          newTank.last_test,
          newTank.next_test,
          newTank.size,
          newTank.doc,
          newTank.salinity,
          newTank.species,
          newTank.culture_type,
          newTank.stocking_date,
          newTank.latitude,
          newTank.longitude,
          newTank.location,
        ]
      );
      return this.getTankById(newTank.id);
    } catch (err) {
      console.error('[DB Error in createTank]', err.message);
      throw new Error(`[DB Error in createTank]: ${err.message}`);
    }
  }

  async updateTank(id, updates) {
    this._ensureDb();
    try {
      const fields = [];
      const params = [];

      if (updates.name !== undefined) { fields.push('name = ?'); params.push(String(updates.name).trim()); }
      if (updates.status !== undefined) { fields.push('status = ?'); params.push(updates.status); }
      if (updates.testStatus !== undefined) { fields.push('test_status = ?'); params.push(updates.testStatus); }
      if (updates.abw !== undefined) { fields.push('abw = ?'); params.push(updates.abw); }
      if (updates.biomass !== undefined) { fields.push('biomass = ?'); params.push(updates.biomass); }
      if (updates.fcr !== undefined) { fields.push('fcr = ?'); params.push(updates.fcr); }
      if (updates.lastTest !== undefined) { fields.push('last_test = ?'); params.push(updates.lastTest); }
      if (updates.nextTest !== undefined) { fields.push('next_test = ?'); params.push(updates.nextTest); }
      if (updates.doc !== undefined) { fields.push('doc = ?'); params.push(Number(updates.doc)); }
      if (updates.agentId !== undefined) { fields.push('agent_id = ?'); params.push(updates.agentId); }
      if (updates.inchargeId !== undefined) { fields.push('incharge_id = ?'); params.push(updates.inchargeId); }
      if (updates.assignedTo !== undefined) { fields.push('assigned_to = ?'); params.push(updates.assignedTo); }
      if (updates.salinity !== undefined) { fields.push('salinity = ?'); params.push(updates.salinity); }
      if (updates.species !== undefined) { fields.push('species = ?'); params.push(updates.species); }
      if (updates.cultureType !== undefined) { fields.push('culture_type = ?'); params.push(updates.cultureType); }
      if (updates.stockingDate !== undefined) { fields.push('stocking_date = ?'); params.push(updates.stockingDate); }
      if (updates.latitude !== undefined) { fields.push('latitude = ?'); params.push(updates.latitude); }
      if (updates.longitude !== undefined) { fields.push('longitude = ?'); params.push(updates.longitude); }
      if (updates.location !== undefined) { fields.push('location = ?'); params.push(updates.location); }

      if (fields.length > 0) {
        params.push(id);
        await query(`UPDATE tanks SET ${fields.join(', ')} WHERE id = ?`, params);
      }
      return this.getTankById(id);
    } catch (err) {
      console.error('[DB Error in updateTank]', err.message);
      throw new Error(`[DB Error in updateTank]: ${err.message}`);
    }
  }

  async deleteTank(id) {
    this._ensureDb();
    try {
      const res = await query('DELETE FROM tanks WHERE id = ?', [id]);
      return res.affectedRows > 0;
    } catch (err) {
      console.error('[DB Error in deleteTank]', err.message);
      throw new Error(`[DB Error in deleteTank]: ${err.message}`);
    }
  }

  // --- Submissions ---

  async getSubmissions(filter = {}) {
    this._ensureDb();
    try {
      let sql = `
        SELECT 
          s.*,
          COALESCE(f.name, '') as farmer_name,
          COALESCE(t.name, '') as tank_name
        FROM submissions s
        LEFT JOIN farmers f ON s.farmer_id = f.id
        LEFT JOIN tanks t ON s.tank_id = t.id
        WHERE 1=1
      `;
      const params = [];
      if (filter.status) {
        sql += ' AND UPPER(s.status) = UPPER(?)';
        params.push(filter.status);
      }
      if (filter.agentId) {
        sql += ' AND (s.agent_id = ? OR s.user_id = ?)';
        params.push(filter.agentId, filter.agentId);
      }
      if (filter.tankId) {
        sql += ' AND s.tank_id = ?';
        params.push(filter.tankId);
      }
      if (filter.farmerId) {
        sql += ' AND s.farmer_id = ?';
        params.push(filter.farmerId);
      }
      sql += ' ORDER BY s.created_at DESC, s.id DESC';

      const rows = await query(sql, params);
      return rows.map((r) => ({
        ...r,
        id: String(r.id),
        agentId: r.agent_id,
        farmerId: r.farmer_id,
        farmerName: r.farmer_name,
        tankId: r.tank_id,
        tankName: r.tank_name,
        testType: r.test_type,
        submittedAgo: r.submitted_ago || 'Recently',
        data: typeof r.data === 'string' ? JSON.parse(r.data) : (r.data || {}),
      }));
    } catch (err) {
      console.error('[DB Error in getSubmissions]', err.message);
      throw new Error(`[DB Error in getSubmissions]: ${err.message}`);
    }
  }

  async getSubmissionLocations(filter = {}) {
    this._ensureDb();
    try {
      let sql = `
        SELECT 
          s.id AS submissionId,
          COALESCE(s.user_id, s.agent_id) AS userId,
          COALESCE(s.user_name, a.name, inc.name, u.name, 'Field Staff') AS userName,
          COALESCE(s.role, CASE WHEN s.agent_id LIKE 'INC%' OR s.user_id LIKE 'INC%' THEN 'Incharge' ELSE 'Agent' END) AS role,
          s.latitude,
          s.longitude,
          COALESCE(s.accuracy, 12.0) AS accuracy,
          s.date,
          COALESCE(s.submission_time, DATE_FORMAT(s.created_at, '%h:%i %p')) AS submissionTime,
          s.created_at AS submittedAt,
          s.test_type AS testType,
          s.tank_id AS tankId,
          s.farmer_id AS farmerId,
          COALESCE(s.locality, a.locality, 'Coastal Andhra') AS locality,
          s.status
        FROM submissions s
        LEFT JOIN agents a ON (s.user_id = a.id OR s.agent_id = a.id)
        LEFT JOIN incharges inc ON (s.user_id = inc.id OR s.agent_id = inc.id)
        LEFT JOIN users u ON (s.user_id = u.id OR s.agent_id = u.id)
        WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL
      `;
      const params = [];

      if (filter.userId && filter.userId !== 'ALL') {
        sql += ' AND (s.user_id = ? OR s.agent_id = ?)';
        params.push(filter.userId, filter.userId);
      }

      if (filter.role && filter.role !== 'ALL') {
        sql += ' AND LOWER(COALESCE(s.role, \'Agent\')) = LOWER(?)';
        params.push(filter.role);
      }

      if (filter.date && filter.date !== 'ALL') {
        if (filter.date.toLowerCase() === 'today') {
          sql += ' AND (s.date = DATE_FORMAT(NOW(), \'%Y-%m-%d\') OR DATE(s.created_at) = CURDATE())';
        } else {
          sql += ' AND (s.date = ? OR DATE(s.created_at) = ?)';
          params.push(filter.date, filter.date);
        }
      }

      sql += ' ORDER BY s.created_at DESC';

      const rows = await query(sql, params);
      return rows
        .filter((r) => r.latitude != null && r.longitude != null && !isNaN(parseFloat(r.latitude)) && !isNaN(parseFloat(r.longitude)))
        .map((r) => ({
          submissionId: r.submissionId,
          userId: r.userId || '',
          userName: r.userName || '',
          role: r.role || 'Agent',
          latitude: parseFloat(r.latitude),
          longitude: parseFloat(r.longitude),
          accuracy: r.accuracy != null ? parseFloat(r.accuracy) : 12,
          date: r.date,
          submissionTime: r.submissionTime,
          submittedAt: r.submittedAt ? new Date(r.submittedAt).toISOString() : new Date().toISOString(),
          testType: r.testType,
          tankId: r.tankId,
          farmerId: r.farmerId,
          locality: r.locality || 'No location available',
          status: r.status,
        }));
    } catch (err) {
      console.error('[DB Error in getSubmissionLocations]', err.message);
      throw new Error(`[DB Error in getSubmissionLocations]: ${err.message}`);
    }
  }

  async getFieldStaff() {
    this._ensureDb();
    try {
      const agents = await query("SELECT id, name, phone, locality, 'Agent' as role FROM agents WHERE name IS NOT NULL ORDER BY name ASC");
      const incharges = await query("SELECT id, name, phone, '' as locality, 'Incharge' as role FROM incharges WHERE name IS NOT NULL ORDER BY name ASC");
      return [...agents, ...incharges];
    } catch (err) {
      console.error('[DB Error in getFieldStaff]', err.message);
      throw new Error(`[DB Error in getFieldStaff]: ${err.message}`);
    }
  }

  async createSubmission(data) {
    this._ensureDb();
    if (!data.tankId) throw new Error('tankId is required');
    if (!data.data) throw new Error('data payload is required');

    const id = data.id || `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const latitude = data.latitude ?? data.lat ?? data.gps?.latitude ?? data.coordinates?.latitude ?? data.data?.gps?.latitude ?? data.data?.latitude ?? null;
    const longitude = data.longitude ?? data.lng ?? data.gps?.longitude ?? data.coordinates?.longitude ?? data.data?.gps?.longitude ?? data.data?.longitude ?? null;
    const accuracy = data.accuracy ?? data.gps?.accuracy ?? data.coordinates?.accuracy ?? data.data?.gps?.accuracy ?? null;
    const locality = data.locality ?? data.gps?.locality ?? data.data?.gps?.locality ?? data.data?.locality ?? null;

    const userId = data.userId || data.agentId || data.inchargeId || null;
    const userName = data.userName || data.agentName || data.name || null;
    const role = data.role || (data.inchargeId || (userId && String(userId).startsWith('INC')) ? 'Incharge' : 'Agent');
    const now = new Date();
    const submissionTime = data.submissionTime || data.time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newSub = {
      id,
      agent_id: userId,
      user_id: userId,
      user_name: userName,
      role,
      farmer_id: data.farmerId || '',
      tank_id: data.tankId,
      test_type: data.testType || 'Water Quality Test',
      date: data.date || now.toISOString().split('T')[0],
      submission_time: submissionTime,
      status: data.status || 'PENDING_VERIFICATION',
      submitted_ago: 'Just now',
      data: data.data || {},
      latitude: latitude != null ? Number(Number(latitude).toFixed(8)) : null,
      longitude: longitude != null ? Number(Number(longitude).toFixed(8)) : null,
      accuracy: accuracy != null ? Number(Number(accuracy).toFixed(2)) : null,
      locality: locality || null,
    };

    try {
      await query(
        `INSERT INTO submissions (id, agent_id, user_id, user_name, role, farmer_id, tank_id, test_type, date, submission_time, status, data, latitude, longitude, accuracy, locality, submitted_ago) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newSub.id,
          newSub.agent_id,
          newSub.user_id,
          newSub.user_name,
          newSub.role,
          newSub.farmer_id,
          newSub.tank_id,
          newSub.test_type,
          newSub.date,
          newSub.submission_time,
          newSub.status,
          JSON.stringify(newSub.data),
          newSub.latitude,
          newSub.longitude,
          newSub.accuracy,
          newSub.locality,
          newSub.submitted_ago,
        ]
      );
      return newSub;
    } catch (err) {
      console.error('[DB Error in createSubmission]', err.message);
      throw new Error(`[DB Error in createSubmission]: ${err.message}`);
    }
  }

  async updateSubmissionStatus(id, status, notes = '') {
    this._ensureDb();
    try {
      await query('UPDATE submissions SET status = ?, review_notes = ? WHERE id = ?', [status, notes, id]);
      const rows = await query('SELECT * FROM submissions WHERE id = ? LIMIT 1', [id]);
      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          ...r,
          id: String(r.id),
          agentId: r.agent_id,
          farmerId: r.farmer_id,
          tankId: r.tank_id,
          testType: r.test_type,
          data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data,
        };
      }
      return null;
    } catch (err) {
      console.error('[DB Error in updateSubmissionStatus]', err.message);
      throw new Error(`[DB Error in updateSubmissionStatus]: ${err.message}`);
    }
  }

  // --- Harvests ---

  async getHarvests(filter = {}) {
    this._ensureDb();
    try {
      let sql = `
        SELECT 
          h.*,
          COALESCE(t.name, h.tank_id) as tank_name,
          COALESCE(f.name, h.farmer_id) as farmer_name,
          t.fcr as tank_fcr,
          t.abw as tank_abw,
          t.doc as tank_doc,
          COALESCE(h.revenue, h.total_value, (h.quantity_kg * COALESCE(h.price_per_kg, 0))) as computed_revenue
        FROM harvests h
        LEFT JOIN tanks t ON h.tank_id = t.id
        LEFT JOIN farmers f ON (h.farmer_id = f.id OR t.farmer_id = f.id)
        WHERE 1=1
      `;
      const params = [];
      if (filter.farmerId) {
        sql += ' AND (h.farmer_id = ? OR t.farmer_id = ?)';
        params.push(filter.farmerId, filter.farmerId);
      }
      if (filter.tankId) {
        sql += ' AND h.tank_id = ?';
        params.push(filter.tankId);
      }
      sql += ' ORDER BY COALESCE(h.date, h.harvest_date, h.created_at) DESC';

      const rows = await query(sql, params);
      return rows.map((r) => ({
        ...r,
        id: String(r.id),
        tankId: r.tank_id,
        tankName: r.tank_name,
        farmerId: r.farmer_id,
        farmerName: r.farmer_name,
        date: r.date || (r.harvest_date ? String(r.harvest_date).split('T')[0] : ''),
        quantityKg: Number(r.quantity_kg || 0),
        countPerKg: r.count_per_kg || (r.average_weight_g ? Math.round(1000 / Number(r.average_weight_g)) : 30),
        quality: r.quality || 'A Grade',
        pricePerKg: Number(r.price_per_kg || 0),
        revenue: Number(r.computed_revenue || 0),
        fcr: r.fcr || r.tank_fcr || '1.25',
        abw: r.abw || r.tank_abw || '14.5g',
        doc: r.doc || r.tank_doc || 0,
        buyerName: r.buyer_name || 'Exporter',
        remarks: r.remarks || '',
      }));
    } catch (err) {
      console.error('[DB Error in getHarvests]', err.message);
      throw new Error(`[DB Error in getHarvests]: ${err.message}`);
    }
  }

  async createHarvest(data) {
    this._ensureDb();
    if (!data.tankId) throw new Error('tankId is required');
    if (!data.quantityKg) throw new Error('quantityKg is required');

    const cleanDate = data.date || new Date().toISOString().split('T')[0];

    const id = data.id || `HARV${String(Date.now()).slice(-4)}`;
    const q = Number(data.quantityKg) || 0;
    const price = Number(data.pricePerKg) || 380;
    const rev = Number(data.revenue) || (q * price);

    const newHarvest = {
      id,
      harvest_code: id,
      tank_id: data.tankId,
      farmer_id: data.farmerId || '',
      date: cleanDate,
      harvest_date: cleanDate,
      quantity_kg: q,
      count_per_kg: data.countPerKg ? Number(data.countPerKg) : 30,
      quality: data.quality || 'A Grade',
      price_per_kg: price,
      revenue: rev,
      total_value: rev,
      buyer_name: data.buyerName || 'Local Exporter',
      remarks: data.remarks || '',
    };

    try {
      await query(
        `INSERT INTO harvests (id, harvest_code, tank_id, farmer_id, date, harvest_date, quantity_kg, count_per_kg, quality, price_per_kg, revenue, total_value, buyer_name, remarks) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newHarvest.id,
          newHarvest.harvest_code,
          newHarvest.tank_id,
          newHarvest.farmer_id,
          newHarvest.date,
          newHarvest.harvest_date,
          newHarvest.quantity_kg,
          newHarvest.count_per_kg,
          newHarvest.quality,
          newHarvest.price_per_kg,
          newHarvest.revenue,
          newHarvest.total_value,
          newHarvest.buyer_name,
          newHarvest.remarks,
        ]
      );

      // Close cycle on tank
      await this.updateTank(data.tankId, {
        status: 'Harvested',
        testStatus: 'Completed',
        nextTest: 'Cycle Closed',
      });

      return newHarvest;
    } catch (err) {
      console.error('[DB Error in createHarvest]', err.message);
      throw new Error(`[DB Error in createHarvest]: ${err.message}`);
    }
  }

  // --- Summary & Analytics ---

  async getAnalyticsSummary() {
    this._ensureDb();
    try {
      const [fc] = await query('SELECT COUNT(DISTINCT id) as total FROM farmers');
      const [tc] = await query('SELECT COUNT(DISTINCT id) as total FROM tanks');
      const [at] = await query("SELECT COUNT(DISTINCT id) as total FROM tanks WHERE UPPER(status) = 'ACTIVE'");
      const [ht] = await query("SELECT COUNT(DISTINCT id) as total FROM tanks WHERE UPPER(status) = 'HARVESTED'");
      const [pt] = await query("SELECT COUNT(DISTINCT id) as total FROM tanks WHERE LOWER(test_status) IN ('due', 'overdue')");
      const [due] = await query("SELECT COUNT(DISTINCT id) as total FROM tanks WHERE LOWER(test_status) = 'due'");
      const [od] = await query("SELECT COUNT(DISTINCT id) as total FROM tanks WHERE LOWER(test_status) = 'overdue'");
      const [hr] = await query('SELECT COALESCE(SUM(COALESCE(revenue, total_value, 0)), 0) as total FROM harvests');
      const [hk] = await query('SELECT COALESCE(SUM(quantity_kg), 0) as total_kg, COUNT(DISTINCT id) as count FROM harvests');
      const [fcrRes] = await query("SELECT ROUND(AVG(CAST(fcr AS DECIMAL(4,2))), 2) as avg_fcr FROM tanks WHERE fcr IS NOT NULL AND fcr != '' AND fcr != '0'");
      const [abwRes] = await query("SELECT ROUND(AVG(CAST(REGEXP_REPLACE(abw, '[^0-9.]', '') AS DECIMAL(6,2))), 2) as avg_abw FROM tanks WHERE abw IS NOT NULL AND abw != ''");
      const [bioRes] = await query("SELECT ROUND(SUM(CAST(REGEXP_REPLACE(biomass, '[^0-9.]', '') AS DECIMAL(10,2))), 2) as total_biomass FROM tanks WHERE biomass IS NOT NULL AND biomass != ''");
      const [ac] = await query('SELECT COUNT(DISTINCT id) as total FROM agents');
      const [ic] = await query('SELECT COUNT(DISTINCT id) as total FROM incharges WHERE name IS NOT NULL');
      const [rc] = await query('SELECT COUNT(DISTINCT id) as total FROM regions');
      const [subTotal] = await query('SELECT COUNT(DISTINCT id) as total FROM submissions');
      const [subAppr] = await query("SELECT COUNT(DISTINCT id) as total FROM submissions WHERE UPPER(status) IN ('APPROVED', 'VERIFIED', 'COMPLETED')");
      const [subRej] = await query("SELECT COUNT(DISTINCT id) as total FROM submissions WHERE UPPER(status) IN ('REJECTED', 'FLAGGED')");
      const [subPend] = await query("SELECT COUNT(DISTINCT id) as total FROM submissions WHERE UPPER(status) IN ('PENDING', 'PENDING_VERIFICATION')");

      return {
        totalFarmers: Number(fc?.total || 0),
        totalTanks: Number(tc?.total || 0),
        activeTanks: Number(at?.total || 0),
        harvestedTanks: Number(ht?.total || 0),
        pendingTests: Number(pt?.total || 0),
        dueTests: Number(due?.total || 0),
        testsDue: Number(due?.total || 0),
        overdueTests: Number(od?.total || 0),
        testsOverdue: Number(od?.total || 0),
        totalHarvestRevenue: Number(hr?.total || 0),
        harvestsCount: Number(hk?.count || 0),
        harvestTotalKg: Number(hk?.total_kg || 0),
        avgFcr: fcrRes?.avg_fcr ? String(fcrRes.avg_fcr) : '0.00',
        avgAbw: abwRes?.avg_abw ? `${abwRes.avg_abw}g` : '0.0g',
        totalBiomassKg: Number(bioRes?.total_biomass || 0),
        activeAgents: Number(ac?.total || 0),
        totalAgents: Number(ac?.total || 0),
        totalIncharges: Number(ic?.total || 0),
        regionsCount: Number(rc?.total || 0),
        totalRegions: Number(rc?.total || 0),
        totalSubmissions: Number(subTotal?.total || 0),
        approvedSubmissions: Number(subAppr?.total || 0),
        rejectedSubmissions: Number(subRej?.total || 0),
        pendingSubmissions: Number(subPend?.total || 0),
      };
    } catch (err) {
      console.error('[DB Error in getAnalyticsSummary]', err.message);
      throw new Error(`[DB Error in getAnalyticsSummary]: ${err.message}`);
    }
  }

  // --- Audit & Activity Logs ---

  async getActivityLogs() {
    this._ensureDb();
    try {
      const rows = await query(`
        SELECT 
          al.id, 
          al.created_at, 
          al.action, 
          al.table_name, 
          al.record_id,
          COALESCE(u.name, u.full_name, 'System Administrator') as user_name,
          COALESCE(u.role, 'Admin') as role,
          COALESCE(u.locality, 'Coastal Andhra') as region
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 100
      `);
      return rows.map((r) => ({
        id: String(r.id),
        time: r.created_at ? new Date(r.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently',
        user: r.user_name,
        role: r.role,
        action: `${r.action} on ${r.table_name}`,
        detail: `Record ID #${r.record_id}`,
        module: r.table_name?.toUpperCase() || 'SYSTEM',
        region: r.region,
      }));
    } catch (err) {
      console.error('[DB Error in getActivityLogs]', err.message);
      throw new Error(`[DB Error in getActivityLogs]: ${err.message}`);
    }
  }

  // --- Agents ---

  async getAgents(filter = {}) {
    this._ensureDb();
    try {
      let sql = `
        SELECT 
          a.id,
          a.name,
          a.phone,
          a.incharge_id,
          a.locality,
          a.status,
          COALESCE(i.name, '') as incharge_name,
          COALESCE(i.region_id, '') as region_id,
          COALESCE(r.name, '') as region_name,
          COUNT(DISTINCT f.id) as farmers_count,
          COUNT(DISTINCT t.id) as tanks_count,
          COUNT(DISTINCT CASE WHEN LOWER(t.test_status) = 'completed' THEN t.id END) as completed_tests_count,
          COUNT(DISTINCT CASE WHEN LOWER(t.test_status) IN ('due', 'overdue') THEN t.id END) as due_tests_count
        FROM agents a
        LEFT JOIN incharges i ON a.incharge_id = i.id
        LEFT JOIN regions r ON (i.region_id = r.id OR (r.code = i.region_id AND NOT EXISTS (SELECT 1 FROM regions r2 WHERE r2.id = i.region_id)))
        LEFT JOIN farmers f ON f.agent_id = a.id
        LEFT JOIN tanks t ON (t.agent_id = a.id OR t.farmer_id = f.id)
        WHERE 1=1
      `;
      const params = [];
      if (filter.id) {
        sql += ' AND a.id = ?';
        params.push(filter.id);
      }
      if (filter.inchargeId) {
        sql += ' AND a.incharge_id = ?';
        params.push(filter.inchargeId);
      }
      if (filter.locality) {
        sql += ' AND a.locality = ?';
        params.push(filter.locality);
      }
      if (filter.status) {
        sql += ' AND UPPER(a.status) = UPPER(?)';
        params.push(filter.status);
      }
      sql += `
        GROUP BY a.id, a.name, a.phone, a.incharge_id, a.locality, a.status, i.name, i.region_id, r.name
        ORDER BY a.name ASC
      `;

      const rows = await query(sql, params);
      return rows.map((agent) => {
        const tanksCount = Number(agent.tanks_count || 0);
        const completedCount = Number(agent.completed_tests_count || 0);
        const dueCount = Number(agent.due_tests_count || 0);
        const complianceRate = tanksCount > 0 ? Math.round((completedCount / tanksCount) * 100) : 0;

        return {
          id: agent.id,
          name: agent.name,
          shortName: agent.name,
          role: `Field Agent - ${agent.locality || 'Coastal Andhra'}`,
          inchargeId: agent.incharge_id,
          incharge: agent.incharge_name,
          regionId: agent.region_id,
          region: agent.region_name || '',
          locality: agent.locality || '',
          phone: agent.phone || '',
          email: `${String(agent.id).toLowerCase()}@royalsmarine.com`,
          farmers: Number(agent.farmers_count || 0),
          farmersCount: Number(agent.farmers_count || 0),
          tanks: tanksCount,
          tanksCount,
          activePonds: tanksCount,
          tests: completedCount,
          dueTests: dueCount,
          compliance: complianceRate,
          complianceRate,
          status: agent.status || 'ACTIVE',
        };
      });
    } catch (err) {
      console.error('[DB Error in getAgents]', err.message);
      throw new Error(`[DB Error in getAgents]: ${err.message}`);
    }
  }

  async getAgentById(id) {
    this._ensureDb();
    const list = await this.getAgents({ id });
    return list.length > 0 ? list[0] : null;
  }

  async createAgent(data) {
    this._ensureDb();
    try {
      const name = (data.name || '').trim();
      if (!name) {
        throw new Error('Agent name is required');
      }

      // Generate next unique ID (e.g. agent012 or EMP-AGT-15)
      let newId = data.id && String(data.id).trim() ? String(data.id).trim() : null;
      if (!newId) {
        const existing = await query("SELECT id FROM agents");
        let maxNum = 0;
        for (const row of existing) {
          const match = String(row.id).match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }
        let counter = maxNum + 1;
        while (true) {
          const candidateId = `agent${String(counter).padStart(3, '0')}`;
          const [agentExists] = await query('SELECT id FROM agents WHERE id = ? LIMIT 1', [candidateId]);
          const [userExists] = await query('SELECT id FROM users WHERE id = ? LIMIT 1', [candidateId]);
          if (!agentExists && !userExists) {
            newId = candidateId;
            break;
          }
          counter++;
        }
      }

      const inchargeId = data.incharge_id || data.inchargeId || null;
      const locality = (data.locality || data.assignedArea || 'Coastal Andhra').trim();
      const cleanPhone = (data.phone || '').trim().replace(/[^0-9+]/g, '').slice(0, 20);
      const email = (data.email || '').trim() || `${newId.toLowerCase()}@royalsmarine.com`;
      const status = data.status || 'ACTIVE';

      // Insert into agents table
      await query(
        `INSERT INTO agents (id, name, phone, incharge_id, status, locality, active_ponds, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
        [newId, name, cleanPhone || null, inchargeId || null, status, locality]
      );

      // Sync into users table for authentication/permissions
      try {
        const [existingUser] = await query('SELECT id FROM users WHERE id = ? OR username = ? LIMIT 1', [newId, newId]);
        if (!existingUser) {
          const defaultPinHash = await bcrypt.hash('1234', 10);
          await query(
            `INSERT INTO users (id, username, password, password_hash, name, full_name, role, phone, email, locality, region, role_id, status)
             VALUES (?, ?, ?, ?, ?, ?, 'AGENT', ?, ?, ?, ?, 3, 'ACTIVE')`,
            [
              newId,
              newId,
              defaultPinHash,
              defaultPinHash,
              name.slice(0, 255),
              name.slice(0, 100),
              cleanPhone || null,
              email.slice(0, 150),
              locality.slice(0, 150),
              (data.region || locality).slice(0, 100),
            ]
          );
        }
      } catch (userErr) {
        console.warn('[Sync Agent User Warning]:', userErr.message);
      }

      const created = await this.getAgentById(newId);
      return created || {
        id: newId,
        name,
        shortName: name,
        role: `Field Agent - ${locality}`,
        inchargeId,
        incharge: '',
        locality,
        phone: cleanPhone,
        email,
        status,
        farmers: 0,
        tanks: 0,
        compliance: 0
      };
    } catch (err) {
      console.error('[DB Error in createAgent]', err.message);
      throw new Error(`[DB Error in createAgent]: ${err.message}`);
    }
  }

  async updateAgent(id, data) {
    this._ensureDb();
    try {
      const existing = await this.getAgentById(id);
      if (!existing) {
        throw new Error(`Agent ${id} not found in database`);
      }

      const name = data.name !== undefined ? data.name.trim() : existing.name;
      const cleanPhone = data.phone !== undefined ? data.phone.trim().replace(/[^0-9+]/g, '').slice(0, 20) : existing.phone;
      const inchargeId = data.incharge_id !== undefined ? (data.incharge_id || null) : (data.inchargeId !== undefined ? (data.inchargeId || null) : existing.inchargeId);
      const locality = data.locality !== undefined ? data.locality.trim() : existing.locality;
      const status = data.status || existing.status || 'ACTIVE';

      await query(
        `UPDATE agents SET name = ?, phone = ?, incharge_id = ?, locality = ?, status = ? WHERE id = ?`,
        [name, cleanPhone || null, inchargeId, locality, status, id]
      );

      // Sync with users table
      try {
        await query(
          `UPDATE users SET name = ?, full_name = ?, phone = ?, locality = ?, status = ? WHERE id = ? OR username = ?`,
          [name.slice(0, 255), name.slice(0, 100), cleanPhone || null, locality.slice(0, 150), status, id, id]
        );
        if (inchargeId) {
          const [incRow] = await query(
            `SELECT i.region_id, r.name as region_name 
             FROM incharges i 
             LEFT JOIN regions r ON (i.region_id = r.id OR i.region_id = r.code) 
             WHERE i.id = ? LIMIT 1`,
            [inchargeId]
          );
          if (incRow && incRow.region_name) {
            await query('UPDATE users SET region = ? WHERE id = ? OR username = ?', [incRow.region_name.slice(0, 100), id, id]);
          }
        }
      } catch (uErr) {
        console.warn('[Sync Update Agent User Warning]:', uErr.message);
      }

      return await this.getAgentById(id);
    } catch (err) {
      console.error('[DB Error in updateAgent]', err.message);
      throw new Error(`[DB Error in updateAgent]: ${err.message}`);
    }
  }

  async reassignAgent(id, inchargeId) {
    this._ensureDb();
    try {
      await query('UPDATE agents SET incharge_id = ? WHERE id = ?', [inchargeId, id]);
      return await this.getAgentById(id);
    } catch (err) {
      console.error('[DB Error in reassignAgent]', err.message);
      throw new Error(`[DB Error in reassignAgent]: ${err.message}`);
    }
  }

  async deleteAgent(id) {
    this._ensureDb();
    try {
      await query('UPDATE farmers SET agent_id = NULL WHERE agent_id = ?', [id]);
      await query('DELETE FROM agents WHERE id = ?', [id]);
      await query('DELETE FROM users WHERE (id = ? OR username = ?) AND role = ?', [id, id, 'AGENT']);
      return { id, deleted: true };
    } catch (err) {
      console.error('[DB Error in deleteAgent]', err.message);
      throw new Error(`[DB Error in deleteAgent]: ${err.message}`);
    }
  }


  // --- Regions ---

  async getRegions(filter = {}) {
    this._ensureDb();
    try {
      let sql = `
        SELECT 
          r.*,
          COUNT(DISTINCT f.id) as farmers_count,
          COUNT(DISTINCT t.id) as actual_tanks_count
        FROM regions r
        LEFT JOIN incharges i ON (i.region_id = r.id OR i.region_id = r.code)
        LEFT JOIN agents a ON a.incharge_id = i.id
        LEFT JOIN farmers f ON (f.incharge_id = i.id OR f.agent_id = a.id)
        LEFT JOIN tanks t ON (t.farmer_id = f.id OR t.agent_id = a.id OR t.incharge_id = i.id)
        WHERE 1=1
      `;
      const params = [];
      if (filter.status) {
        sql += ' AND UPPER(r.status) = UPPER(?)';
        params.push(filter.status);
      }
      sql += ' GROUP BY r.id, r.code, r.name, r.status, r.created_at, r.updated_at, r.active_ponds, r.total_yield, r.avg_fcr ORDER BY r.name ASC';
      const rows = await query(sql, params);
      return rows.map((r) => ({
        ...r,
        id: String(r.id),
        code: r.code || r.id,
        name: r.name,
        farmersCount: Number(r.farmers_count || 0),
        activePonds: Number(r.actual_tanks_count || r.active_ponds || 0),
        tanks: Number(r.actual_tanks_count || r.active_ponds || 0),
        avgFcr: r.avg_fcr ? Number(r.avg_fcr) : 1.25,
        totalYield: r.total_yield || '0 Tons',
        status: r.status || 'ACTIVE',
      }));
    } catch (err) {
      console.error('[DB Error in getRegions]', err.message);
      throw new Error(`[DB Error in getRegions]: ${err.message}`);
    }
  }

  async getRegionById(id) {
    this._ensureDb();
    const list = await this.getRegions();
    return list.find((r) => String(r.id) === String(id) || String(r.code) === String(id)) || null;
  }

  // --- Incharges ---

  async getIncharges(filter = {}) {
    this._ensureDb();
    try {
      let sql = `
        SELECT 
          i.id,
          COALESCE(MAX(i.name), MAX(u.name), MAX(u.full_name), 'Incharge') as name,
          COALESCE(MAX(i.email), MAX(u.email), '') as email,
          COALESCE(MAX(i.phone), MAX(u.phone), '') as phone,
          COALESCE(MAX(i.region_id), MAX(r.id), '') as region_id,
          COALESCE(MAX(r.name), 'Coastal Andhra') as region_name,
          COALESCE(MAX(u.locality), MAX(r.name), 'Coastal Andhra') as locality,
          COALESCE(MAX(u.status), 'ACTIVE') as status,
          COUNT(DISTINCT a.id) as agents_count,
          COUNT(DISTINCT f.id) as farmers_count,
          COUNT(DISTINCT t.id) as tanks_count
        FROM incharges i 
        LEFT JOIN users u ON (i.user_id = u.id OR i.id = u.id)
        LEFT JOIN regions r ON (r.id = i.region_id OR (r.code = i.region_id AND NOT EXISTS (SELECT 1 FROM regions r2 WHERE r2.id = i.region_id)))
        LEFT JOIN agents a ON a.incharge_id = i.id
        LEFT JOIN farmers f ON (f.incharge_id = i.id OR f.agent_id = a.id)
        LEFT JOIN tanks t ON (t.incharge_id = i.id OR t.farmer_id = f.id)
        WHERE 1=1
      `;
      const params = [];
      if (filter.id) {
        sql += ' AND i.id = ?';
        params.push(filter.id);
      }
      if (filter.regionId) {
        sql += ' AND (i.region_id = ? OR r.code = ? OR r.id = ?)';
        params.push(filter.regionId, filter.regionId, filter.regionId);
      }
      sql += ' GROUP BY i.id ORDER BY name ASC';
      const rows = await query(sql, params);
      const seen = new Set();
      const uniqueRows = [];
      for (const r of rows) {
        const idStr = String(r.id);
        if (!seen.has(idStr)) {
          seen.add(idStr);
          uniqueRows.push(r);
        }
      }
      return uniqueRows.map((r) => ({
        id: String(r.id),
        name: r.name,
        email: r.email,
        phone: r.phone,
        regionId: r.region_id,
        region: r.region_name || 'Coastal Andhra',
        locality: r.locality || r.region_name || 'Coastal Andhra',
        agentsCount: Number(r.agents_count || 0),
        farmersCount: Number(r.farmers_count || 0),
        tanksCount: Number(r.tanks_count || 0),
        activePonds: Number(r.tanks_count || 0),
        status: r.status || 'ACTIVE',
      }));
    } catch (err) {
      console.error('[DB Error in getIncharges]', err.message);
      throw new Error(`[DB Error in getIncharges]: ${err.message}`);
    }
  }

  async getInchargeById(id) {
    this._ensureDb();
    const list = await this.getIncharges({ id });
    return list.length > 0 ? list[0] : null;
  }

  async createIncharge(data) {
    this._ensureDb();
    try {
      const name = (data.name || '').trim();
      if (!name) {
        throw new Error('Incharge name is required');
      }

      // Generate next unique ID (e.g. INC007)
      let newId = data.id && String(data.id).startsWith('INC') ? String(data.id).trim() : null;
      if (!newId) {
        const existing = await query("SELECT id FROM incharges WHERE id LIKE 'INC%'");
        let maxNum = 0;
        for (const row of existing) {
          const match = String(row.id).match(/^INC(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }
        let counter = maxNum + 1;
        while (true) {
          const candidateId = `INC${String(counter).padStart(3, '0')}`;
          const [incExists] = await query('SELECT id FROM incharges WHERE id = ? LIMIT 1', [candidateId]);
          const [userExists] = await query('SELECT id FROM users WHERE id = ? LIMIT 1', [candidateId]);
          if (!incExists && !userExists) {
            newId = candidateId;
            break;
          }
          counter++;
        }
      }

      // Resolve region
      let regionId = data.regionId || data.region_id || null;
      let regionName = data.region || null;
      let locality = data.locality || null;
      if (regionId) {
        const [regRow] = await query(
          'SELECT id, code, name FROM regions WHERE id = ? OR code = ? OR name = ? LIMIT 1',
          [regionId, regionId, regionId]
        );
        if (regRow) {
          regionId = regRow.code || regRow.id;
          regionName = regRow.name;
        }
      }

      const email = (data.email || '').trim() || `${newId.toLowerCase()}@royalsmarine.com`;
      const cleanPhone = (data.phone || '').trim().replace(/[^0-9+]/g, '').slice(0, 20);

      // Insert into incharges table
      await query(
        `INSERT INTO incharges (id, user_id, region_id, name, email, phone, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [newId, newId, regionId, name, email, cleanPhone || null]
      );

      // Sync into users table for authentication/role management
      try {
        const [existingUser] = await query('SELECT id FROM users WHERE id = ? OR username = ? LIMIT 1', [newId, newId]);
        if (!existingUser) {
          const defaultPinHash = await bcrypt.hash('1234', 10);
          await query(
            `INSERT INTO users (id, username, password, password_hash, name, full_name, role, phone, email, locality, region, role_id, status)
             VALUES (?, ?, ?, ?, ?, ?, 'ASM', ?, ?, ?, ?, 2, 'ACTIVE')`,
            [
              newId,
              newId,
              defaultPinHash,
              defaultPinHash,
              name.slice(0, 255),
              name.slice(0, 100),
              cleanPhone || null,
              email.slice(0, 150),
              (locality || regionName || 'Coastal Andhra').slice(0, 150),
              (regionName || 'Coastal Andhra').slice(0, 100),
            ]
          );
        }
      } catch (userErr) {
        console.warn('[Sync Incharge User Warning]:', userErr.message);
      }

      const created = await this.getInchargeById(newId);
      return created || {
        id: newId,
        name,
        email,
        phone: cleanPhone,
        regionId,
        region: regionName || 'Coastal Andhra',
        locality: locality || regionName || 'Coastal Andhra',
        agentsCount: 0,
        farmersCount: 0,
        tanksCount: 0,
        status: 'ACTIVE'
      };
    } catch (err) {
      console.error('[DB Error in createIncharge]', err.message);
      throw new Error(`[DB Error in createIncharge]: ${err.message}`);
    }
  }

  async updateIncharge(id, data) {
    this._ensureDb();
    try {
      const existing = await this.getInchargeById(id);
      if (!existing) {
        throw new Error(`Incharge ${id} not found in database`);
      }

      const name = data.name !== undefined ? data.name.trim() : existing.name;
      const email = data.email !== undefined ? data.email.trim() : existing.email;
      const cleanPhone = data.phone !== undefined ? data.phone.trim().replace(/[^0-9+]/g, '').slice(0, 20) : existing.phone;
      const status = data.status || existing.status || 'ACTIVE';

      let regionId = data.regionId || data.region_id;
      if (regionId) {
        const [regRow] = await query(
          'SELECT id, code, name FROM regions WHERE id = ? OR code = ? OR name = ? LIMIT 1',
          [regionId, regionId, regionId]
        );
        if (regRow) {
          regionId = regRow.code || regRow.id;
        }
      } else {
        regionId = existing.regionId;
      }

      await query(
        `UPDATE incharges SET name = ?, email = ?, phone = ?, region_id = ? WHERE id = ?`,
        [name, email, cleanPhone || null, regionId, id]
      );

      // Sync with users table
      try {
        await query(
          `UPDATE users SET name = ?, full_name = ?, email = ?, phone = ?, status = ?, locality = COALESCE(?, locality), region = COALESCE(?, region) WHERE id = ? OR username = ?`,
          [name.slice(0, 255), name.slice(0, 100), email.slice(0, 150), cleanPhone || null, status, data.locality ? data.locality.slice(0, 150) : null, data.region ? data.region.slice(0, 100) : null, id, id]
        );
      } catch (uErr) {
        console.warn('[Sync Update Incharge User Warning]:', uErr.message);
      }

      return await this.getInchargeById(id);
    } catch (err) {
      console.error('[DB Error in updateIncharge]', err.message);
      throw new Error(`[DB Error in updateIncharge]: ${err.message}`);
    }
  }

  async deleteIncharge(id) {
    this._ensureDb();
    try {
      await query('UPDATE agents SET incharge_id = NULL WHERE incharge_id = ?', [id]);
      await query('DELETE FROM incharges WHERE id = ?', [id]);
      await query('DELETE FROM users WHERE (id = ? OR username = ?) AND role = ?', [id, id, 'ASM']);
      return { id, deleted: true };
    } catch (err) {
      console.error('[DB Error in deleteIncharge]', err.message);
      throw new Error(`[DB Error in deleteIncharge]: ${err.message}`);
    }
  }

  async assignAgentToIncharge(inchargeId, agentId) {
    this._ensureDb();
    try {
      await query('UPDATE agents SET incharge_id = ? WHERE id = ?', [inchargeId, agentId]);
      return { inchargeId, agentId, success: true };
    } catch (err) {
      console.error('[DB Error in assignAgentToIncharge]', err.message);
      throw new Error(`[DB Error in assignAgentToIncharge]: ${err.message}`);
    }
  }

  async unassignAgentFromIncharge(agentId) {
    this._ensureDb();
    try {
      await query('UPDATE agents SET incharge_id = NULL WHERE id = ?', [agentId]);
      return { agentId, success: true };
    } catch (err) {
      console.error('[DB Error in unassignAgentFromIncharge]', err.message);
      throw new Error(`[DB Error in unassignAgentFromIncharge]: ${err.message}`);
    }
  }
}

export const store = new DataStore();

