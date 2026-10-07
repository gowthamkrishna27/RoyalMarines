import { query, isDbConnected } from '../config/database.js';

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
  constructor() {
    this.reset();
  }

  reset() {
    this.farmers = [];
    this.tanks = [];
    this.submissions = [];
    this.harvests = [];
    this.agents = [];
    this.incharges = [];
    this.regions = [];
    this.users = [];
  }

  // --- Auth & Users ---

  async findUserByIdentifier(identifier) {
    if (isDbConnected()) {
      try {
        const rows = await query(
          'SELECT u.*, r.name as role FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE LOWER(u.id) = LOWER(?) OR LOWER(u.username) = LOWER(?) OR u.phone = ? OR LOWER(u.email) = LOWER(?) LIMIT 1',
          [identifier, identifier, identifier, identifier]
        );
        if (rows && rows.length > 0) return normalizeUser(rows[0]);
      } catch (err) {
        console.error('[DB Error in findUserByIdentifier]', err.message);
      }
    }

    const u = this.users.find(
      (user) =>
        user.username?.toLowerCase() === identifier.toLowerCase() ||
        user.phone === identifier ||
        user.email?.toLowerCase() === identifier.toLowerCase() ||
        String(user.id).toLowerCase() === identifier.toLowerCase()
    );
    return normalizeUser(u);
  }

  async findUserByCredentials(identifier, password) {
    const user = await this.findUserByIdentifier(identifier);
    if (user && user.password === password) return user;
    return null;
  }

  async findUserById(id) {
    if (isDbConnected()) {
      try {
        const rows = await query(
          'SELECT u.*, r.name as role FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE LOWER(u.id) = LOWER(?) OR LOWER(u.username) = LOWER(?) LIMIT 1',
          [id, id]
        );
        if (rows && rows.length > 0) return normalizeUser(rows[0]);
      } catch (err) {
        console.error('[DB Error in findUserById]', err.message);
      }
    }

    const u = this.users.find((user) => String(user.id) === String(id) || user.username === id);
    return normalizeUser(u);
  }

  // --- Farmers ---
  async getFarmers(filter = {}) {
    if (isDbConnected()) {
      try {
        let sql = 'SELECT * FROM farmers WHERE 1=1';
        const params = [];

        if (filter.agentId) {
          sql += ' AND (agent_id = ? OR agent_id IS NULL)';
          params.push(filter.agentId);
        }
        if (filter.inchargeId) {
          sql += ' AND (incharge_id = ? OR incharge_id IS NULL)';
          params.push(filter.inchargeId);
        }
        if (filter.search) {
          sql += ' AND (LOWER(name) LIKE ? OR LOWER(location) LIKE ? OR LOWER(village) LIKE ? OR phone LIKE ?)';
          const term = `%${filter.search.toLowerCase()}%`;
          params.push(term, term, term, term);
        }
        sql += ' ORDER BY created_at DESC';

        const rows = await query(sql, params);
        return rows.map((r) => ({
          ...r,
          id: String(r.id),
          farmerCode: r.farmer_code || r.id,
          name: r.name,
          phone: r.phone || '',
          location: r.location || (r.village ? `${r.village}${r.mandal ? `, ${r.mandal}` : ''}` : ''),
          village: r.village || r.location || '',
          acres: r.acres != null ? Number(r.acres) : (r.total_acres != null ? Number(r.total_acres) : 0),
          totalAcres: r.total_acres != null ? Number(r.total_acres) : (r.acres != null ? Number(r.acres) : 0),
          agentId: r.agent_id,
          inchargeId: r.incharge_id,
          assignedTo: r.assigned_to,
          assignedBy: r.assigned_by,
          waterSource: r.water_source || 'Borewell',
          status: r.status || 'ACTIVE',
        }));
      } catch (err) {
        console.error('[DB Error in getFarmers]', err.message);
      }
    }

    let result = [...this.farmers];
    if (filter.agentId) result = result.filter((f) => f.agentId === filter.agentId);
    if (filter.inchargeId) result = result.filter((f) => f.inchargeId === filter.inchargeId);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.location?.toLowerCase().includes(q) ||
          f.phone?.includes(q)
      );
    }
    return result;
  }

  async getFarmerById(id) {
    if (isDbConnected()) {
      try {
        const rows = await query('SELECT * FROM farmers WHERE id = ? OR farmer_code = ? LIMIT 1', [id, id]);
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            ...r,
            id: String(r.id),
            farmerCode: r.farmer_code || r.id,
            name: r.name,
            phone: r.phone || '',
            location: r.location || (r.village ? `${r.village}${r.mandal ? `, ${r.mandal}` : ''}` : ''),
            village: r.village || r.location || '',
            acres: r.acres != null ? Number(r.acres) : (r.total_acres != null ? Number(r.total_acres) : 0),
            totalAcres: r.total_acres != null ? Number(r.total_acres) : (r.acres != null ? Number(r.acres) : 0),
            agentId: r.agent_id,
            inchargeId: r.incharge_id,
            assignedTo: r.assigned_to,
            assignedBy: r.assigned_by,
            waterSource: r.water_source || 'Borewell',
            status: r.status || 'ACTIVE',
          };
        }
      } catch (err) {
        console.error('[DB Error in getFarmerById]', err.message);
      }
    }

    return this.farmers.find((f) => f.id === id);
  }

  async createFarmer(data) {
    const id = data.id || `F${String(Date.now()).slice(-4)}`;
    const newFarmer = {
      id,
      farmerCode: data.farmerCode || id,
      name: data.name,
      status: data.status || 'ACTIVE',
      agentId: data.agentId || null,
      inchargeId: data.inchargeId || 'INC001',
      assignedTo: data.assignedTo || (data.agentId ? 'Agent' : 'Incharge'),
      assignedBy: data.assignedBy || 'Admin',
      phone: data.phone || '',
      location: data.location || data.village || '',
      village: data.village || data.location || '',
      waterSource: data.waterSource || 'Borewell',
      acres: data.acres ? Number(data.acres) : 10,
      totalAcres: data.acres ? Number(data.acres) : 10,
      createdAt: new Date().toISOString(),
    };

    if (isDbConnected()) {
      try {
        await query(
          `INSERT INTO farmers (id, farmer_code, name, status, agent_id, incharge_id, assigned_to, assigned_by, phone, location, village, water_source, acres, total_acres)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name=VALUES(name), phone=VALUES(phone), location=VALUES(location), village=VALUES(village),
             acres=VALUES(acres), total_acres=VALUES(total_acres), water_source=VALUES(water_source),
             agent_id=VALUES(agent_id), incharge_id=VALUES(incharge_id), assigned_to=VALUES(assigned_to), assigned_by=VALUES(assigned_by)`,
          [
            newFarmer.id,
            newFarmer.farmerCode,
            newFarmer.name,
            newFarmer.status,
            newFarmer.agentId,
            newFarmer.inchargeId,
            newFarmer.assignedTo,
            newFarmer.assignedBy,
            newFarmer.phone,
            newFarmer.location,
            newFarmer.village,
            newFarmer.waterSource,
            newFarmer.acres,
            newFarmer.acres,
          ]
        );
      } catch (err) {
        console.error('[DB Error in createFarmer]', err.message);
      }
    }

    this.farmers.unshift(newFarmer);
    return newFarmer;
  }

  async updateFarmer(id, updates) {
    if (isDbConnected()) {
      try {
        const fields = [];
        const params = [];

        if (updates.name !== undefined) { fields.push('name = ?'); params.push(updates.name); }
        if (updates.status !== undefined) { fields.push('status = ?'); params.push(updates.status); }
        if (updates.agentId !== undefined) { fields.push('agent_id = ?'); params.push(updates.agentId); }
        if (updates.inchargeId !== undefined) { fields.push('incharge_id = ?'); params.push(updates.inchargeId); }
        if (updates.assignedTo !== undefined) { fields.push('assigned_to = ?'); params.push(updates.assignedTo); }
        if (updates.phone !== undefined) { fields.push('phone = ?'); params.push(updates.phone); }
        if (updates.location !== undefined) { fields.push('location = ?'); params.push(updates.location); }
        if (updates.village !== undefined) { fields.push('village = ?'); params.push(updates.village); }
        if (updates.waterSource !== undefined) { fields.push('water_source = ?'); params.push(updates.waterSource); }
        if (updates.acres !== undefined) {
          fields.push('acres = ?'); params.push(Number(updates.acres));
          fields.push('total_acres = ?'); params.push(Number(updates.acres));
        }

        if (fields.length > 0) {
          params.push(id);
          await query(`UPDATE farmers SET ${fields.join(', ')} WHERE id = ?`, params);
        }
      } catch (err) {
        console.error('[DB Error in updateFarmer]', err.message);
      }
    }

    const index = this.farmers.findIndex((f) => f.id === id);
    if (index !== -1) {
      this.farmers[index] = { ...this.farmers[index], ...updates };
      return this.farmers[index];
    }
    return this.getFarmerById(id);
  }

  async deleteFarmer(id) {
    if (isDbConnected()) {
      try {
        await query('DELETE FROM farmers WHERE id = ?', [id]);
        await query('DELETE FROM tanks WHERE farmer_id = ?', [id]);
      } catch (err) {
        console.error('[DB Error in deleteFarmer]', err.message);
      }
    }

    const index = this.farmers.findIndex((f) => f.id === id);
    if (index !== -1) {
      this.farmers.splice(index, 1);
    }
    this.tanks = this.tanks.filter((t) => t.farmerId !== id);
    return true;
  }

  // --- Tanks / Ponds ---
  async getTanks(filter = {}) {
    if (isDbConnected()) {
      try {
        let sql = 'SELECT * FROM tanks WHERE 1=1';
        const params = [];

        if (filter.farmerId) { sql += ' AND farmer_id = ?'; params.push(filter.farmerId); }
        if (filter.agentId) { sql += ' AND (agent_id = ? OR agent_id IS NULL)'; params.push(filter.agentId); }
        if (filter.inchargeId) { sql += ' AND (incharge_id = ? OR incharge_id IS NULL)'; params.push(filter.inchargeId); }
        if (filter.status) { sql += ' AND LOWER(status) = LOWER(?)'; params.push(filter.status); }
        if (filter.testStatus) { sql += ' AND LOWER(test_status) = LOWER(?)'; params.push(filter.testStatus); }
        sql += ' ORDER BY created_at DESC';

        const rows = await query(sql, params);
        return rows.map((r) => ({
          ...r,
          id: String(r.id),
          farmerId: r.farmer_id,
          agentId: r.agent_id,
          inchargeId: r.incharge_id,
          assignedTo: r.assigned_to,
          testStatus: r.test_status,
          lastTest: r.last_test,
          nextTest: r.next_test,
          size: r.size || (r.area_acres ? `${r.area_acres} Acres` : '5.0 Acres'),
          acres: r.acres || (r.area_acres ? `${r.area_acres} Acres` : '5.0 Acres'),
          salinity: r.salinity || '15 ppt',
          species: r.species || 'Vannamei',
          cultureType: r.culture_type || 'Semi-Intensive',
        }));
      } catch (err) {
        console.error('[DB Error in getTanks]', err.message);
      }
    }

    let result = [...this.tanks];
    if (filter.farmerId) result = result.filter((t) => t.farmerId === filter.farmerId);
    if (filter.agentId) result = result.filter((t) => t.agentId === filter.agentId);
    if (filter.inchargeId) result = result.filter((t) => t.inchargeId === filter.inchargeId);
    if (filter.status) result = result.filter((t) => t.status?.toLowerCase() === filter.status.toLowerCase());
    if (filter.testStatus) result = result.filter((t) => t.testStatus?.toLowerCase() === filter.testStatus.toLowerCase());
    return result;
  }

  async getTankById(id) {
    if (isDbConnected()) {
      try {
        const rows = await query('SELECT * FROM tanks WHERE id = ? LIMIT 1', [id]);
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            ...r,
            id: String(r.id),
            farmerId: r.farmer_id,
            agentId: r.agent_id,
            inchargeId: r.incharge_id,
            assignedTo: r.assigned_to,
            testStatus: r.test_status,
            lastTest: r.last_test,
            nextTest: r.next_test,
            size: r.size || (r.area_acres ? `${r.area_acres} Acres` : '5.0 Acres'),
            acres: r.acres || (r.area_acres ? `${r.area_acres} Acres` : '5.0 Acres'),
            salinity: r.salinity || '15 ppt',
            species: r.species || 'Vannamei',
            cultureType: r.culture_type || 'Semi-Intensive',
          };
        }
      } catch (err) {
        console.error('[DB Error in getTankById]', err.message);
      }
    }

    return this.tanks.find((t) => t.id === id);
  }

  async createTank(data) {
    const id = data.id || `T${String(Date.now()).slice(-4)}`;
    const newTank = {
      id,
      name: data.name,
      farmerId: data.farmerId,
      agentId: data.agentId || null,
      inchargeId: data.inchargeId || null,
      assignedTo: data.assignedTo || 'Agent',
      status: data.status || 'ACTIVE',
      testStatus: data.testStatus || 'Due',
      abw: data.abw || '16.5g',
      biomass: data.biomass || '1500kg',
      fcr: data.fcr || '1.20',
      lastTest: data.lastTest || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      nextTest: data.nextTest || 'Due This Week',
      size: data.size || (data.acres ? `${data.acres} Acres` : '5.0 Acres'),
      doc: data.doc ? Number(data.doc) : 1,
      salinity: data.salinity || '15 ppt',
      species: data.species || 'Vannamei',
      cultureType: data.cultureType || 'Semi-Intensive',
      stockingDate: data.stockingDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    if (isDbConnected()) {
      try {
        await query(
          `INSERT INTO tanks (id, name, farmer_id, agent_id, incharge_id, assigned_to, status, test_status, abw, biomass, fcr, last_test, next_test, size, doc, salinity, species, culture_type, stocking_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name=VALUES(name), farmer_id=VALUES(farmer_id), agent_id=VALUES(agent_id), incharge_id=VALUES(incharge_id),
             assigned_to=VALUES(assigned_to), status=VALUES(status), test_status=VALUES(test_status), abw=VALUES(abw),
             biomass=VALUES(biomass), fcr=VALUES(fcr), last_test=VALUES(last_test), next_test=VALUES(next_test), size=VALUES(size), doc=VALUES(doc)`,
          [
            newTank.id,
            newTank.name,
            newTank.farmerId,
            newTank.agentId,
            newTank.inchargeId,
            newTank.assignedTo,
            newTank.status,
            newTank.testStatus,
            newTank.abw,
            newTank.biomass,
            newTank.fcr,
            newTank.lastTest,
            newTank.nextTest,
            newTank.size,
            newTank.doc,
            newTank.salinity,
            newTank.species,
            newTank.cultureType,
            newTank.stockingDate,
          ]
        );
      } catch (err) {
        console.error('[DB Error in createTank]', err.message);
      }
    }

    this.tanks.unshift(newTank);
    return newTank;
  }

  async updateTank(id, updates) {
    if (isDbConnected()) {
      try {
        const fields = [];
        const params = [];

        if (updates.name !== undefined) { fields.push('name = ?'); params.push(updates.name); }
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

        if (fields.length > 0) {
          params.push(id);
          await query(`UPDATE tanks SET ${fields.join(', ')} WHERE id = ?`, params);
        }
      } catch (err) {
        console.error('[DB Error in updateTank]', err.message);
      }
    }

    const index = this.tanks.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.tanks[index] = { ...this.tanks[index], ...updates };
      return this.tanks[index];
    }
    return this.getTankById(id);
  }

  async deleteTank(id) {
    if (isDbConnected()) {
      try {
        await query('DELETE FROM tanks WHERE id = ?', [id]);
      } catch (err) {
        console.error('[DB Error in deleteTank]', err.message);
      }
    }

    const index = this.tanks.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.tanks.splice(index, 1);
    }
    return true;
  }

  // --- Submissions ---
  async getSubmissions(filter = {}) {
    if (isDbConnected()) {
      try {
        let sql = 'SELECT * FROM submissions WHERE 1=1';
        const params = [];
        if (filter.status) { sql += ' AND UPPER(status) = UPPER(?)'; params.push(filter.status); }
        if (filter.agentId) { sql += ' AND (agent_id = ? OR agent_id IS NULL)'; params.push(filter.agentId); }
        if (filter.tankId) { sql += ' AND tank_id = ?'; params.push(filter.tankId); }
        sql += ' ORDER BY created_at DESC';

        const rows = await query(sql, params);
        return rows.map((r) => ({
          ...r,
          id: String(r.id),
          agentId: r.agent_id,
          farmerId: r.farmer_id,
          tankId: r.tank_id,
          testType: r.test_type,
          submittedAgo: r.submitted_ago || 'Recently',
          data: typeof r.data === 'string' ? JSON.parse(r.data) : (r.data || {}),
        }));
      } catch (err) {
        console.error('[DB Error in getSubmissions]', err.message);
      }
    }

    let result = [...this.submissions];
    if (filter.status) result = result.filter((s) => s.status?.toUpperCase() === filter.status.toUpperCase());
    if (filter.agentId) result = result.filter((s) => s.agentId === filter.agentId);
    if (filter.tankId) result = result.filter((s) => s.tankId === filter.tankId);
    return result;
  }

  async createSubmission(data) {
    const id = data.id || `SUB_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const latitude = data.latitude ?? data.lat ?? data.gps?.latitude ?? data.coordinates?.latitude ?? data.data?.gps?.latitude ?? data.data?.latitude ?? null;
    const longitude = data.longitude ?? data.lng ?? data.gps?.longitude ?? data.coordinates?.longitude ?? data.data?.gps?.longitude ?? data.data?.longitude ?? null;
    const locality = data.locality ?? data.gps?.locality ?? data.data?.gps?.locality ?? data.data?.locality ?? null;

    const newSub = {
      id,
      agentId: data.agentId || null,
      farmerId: data.farmerId || '',
      tankId: data.tankId,
      testType: data.testType || 'Water Quality Test',
      date: data.date || new Date().toISOString().split('T')[0],
      status: data.status || 'PENDING_VERIFICATION',
      submittedAgo: 'Just now',
      data: data.data || {},
      latitude: latitude != null ? Number(Number(latitude).toFixed(8)) : null,
      longitude: longitude != null ? Number(Number(longitude).toFixed(8)) : null,
      locality: locality || null,
      createdAt: new Date().toISOString(),
    };

    if (isDbConnected()) {
      try {
        await query(
          `INSERT INTO submissions (id, agent_id, farmer_id, tank_id, test_type, date, status, data, latitude, longitude, locality, submitted_ago)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE status=VALUES(status), data=VALUES(data), review_notes=VALUES(review_notes)`,
          [
            newSub.id,
            newSub.agentId,
            newSub.farmerId,
            newSub.tankId,
            newSub.testType,
            newSub.date,
            newSub.status,
            JSON.stringify(newSub.data),
            newSub.latitude,
            newSub.longitude,
            newSub.locality,
            newSub.submittedAgo,
          ]
        );
      } catch (err) {
        console.error('[DB Error in createSubmission]', err.message);
      }
    }

    this.submissions.unshift(newSub);
    return newSub;
  }

  async updateSubmissionStatus(id, status, notes = '') {
    if (isDbConnected()) {
      try {
        await query('UPDATE submissions SET status = ?, review_notes = ? WHERE id = ?', [status, notes, id]);
      } catch (err) {
        console.error('[DB Error in updateSubmissionStatus]', err.message);
      }
    }

    const index = this.submissions.findIndex((s) => s.id === id);
    if (index !== -1) {
      this.submissions[index].status = status;
      if (notes) this.submissions[index].reviewNotes = notes;
      this.submissions[index].reviewedAt = new Date().toISOString();
      return this.submissions[index];
    }
    return { id, status, reviewNotes: notes };
  }

  // --- Harvests ---
  async getHarvests(filter = {}) {
    if (isDbConnected()) {
      try {
        let sql = 'SELECT * FROM harvests WHERE 1=1';
        const params = [];
        if (filter.farmerId) { sql += ' AND farmer_id = ?'; params.push(filter.farmerId); }
        sql += ' ORDER BY created_at DESC';

        const rows = await query(sql, params);
        return rows.map((r) => ({
          ...r,
          id: String(r.id),
          tankId: r.tank_id,
          farmerId: r.farmer_id,
          date: r.date || (r.harvest_date ? String(r.harvest_date).split('T')[0] : ''),
          quantityKg: Number(r.quantity_kg || 0),
          countPerKg: r.count_per_kg || (r.average_weight_g ? Math.round(1000 / Number(r.average_weight_g)) : 30),
          quality: r.quality || 'A Grade',
          pricePerKg: Number(r.price_per_kg || 0),
          revenue: Number(r.revenue || r.total_value || 0),
          buyerName: r.buyer_name || 'Exporter',
          remarks: r.remarks || '',
        }));
      } catch (err) {
        console.error('[DB Error in getHarvests]', err.message);
      }
    }

    let result = [...this.harvests];
    if (filter.farmerId) result = result.filter((h) => h.farmerId === filter.farmerId);
    return result;
  }

  async createHarvest(data) {
    const id = data.id || `HARV${String(Date.now()).slice(-4)}`;
    const q = Number(data.quantityKg) || 0;
    const price = Number(data.pricePerKg) || 380;
    const rev = Number(data.revenue) || (q * price);

    const newHarvest = {
      id,
      tankId: data.tankId,
      farmerId: data.farmerId || '',
      date: data.date || new Date().toISOString().split('T')[0],
      quantityKg: q,
      countPerKg: data.countPerKg ? Number(data.countPerKg) : 30,
      quality: data.quality || 'A Grade',
      pricePerKg: price,
      revenue: rev,
      buyerName: data.buyerName || 'Local Exporter',
      remarks: data.remarks || '',
      createdAt: new Date().toISOString(),
    };

    if (isDbConnected()) {
      try {
        await query(
          `INSERT INTO harvests (id, harvest_code, tank_id, farmer_id, date, harvest_date, quantity_kg, count_per_kg, quality, price_per_kg, revenue, total_value, buyer_name, remarks)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             quantity_kg=VALUES(quantity_kg), count_per_kg=VALUES(count_per_kg),
             price_per_kg=VALUES(price_per_kg), revenue=VALUES(revenue), total_value=VALUES(total_value)`,
          [
            newHarvest.id,
            newHarvest.id,
            newHarvest.tankId,
            newHarvest.farmerId,
            newHarvest.date,
            newHarvest.date,
            newHarvest.quantityKg,
            newHarvest.countPerKg,
            newHarvest.quality,
            newHarvest.pricePerKg,
            newHarvest.revenue,
            newHarvest.revenue,
            newHarvest.buyerName,
            newHarvest.remarks,
          ]
        );
      } catch (err) {
        console.error('[DB Error in createHarvest]', err.message);
      }
    }

    if (data.tankId) {
      await this.updateTank(data.tankId, {
        status: 'Harvested',
        testStatus: 'Completed',
        nextTest: 'Cycle Closed',
      });
    }

    this.harvests.unshift(newHarvest);
    return newHarvest;
  }

  // --- Summary & Analytics ---
  async getAnalyticsSummary() {
    if (isDbConnected()) {
      try {
        const [fc] = await query('SELECT COUNT(*) as total FROM farmers');
        const [tc] = await query('SELECT COUNT(*) as total FROM tanks');
        const [at] = await query("SELECT COUNT(*) as total FROM tanks WHERE status = 'ACTIVE'");
        const [pt] = await query("SELECT COUNT(*) as total FROM tanks WHERE test_status IN ('Due', 'Overdue')");
        const [hr] = await query('SELECT COALESCE(SUM(COALESCE(revenue, total_value, 0)), 0) as total FROM harvests');
        const [fcrRes] = await query("SELECT ROUND(AVG(CAST(fcr AS DECIMAL(4,2))), 2) as avg_fcr FROM tanks WHERE fcr IS NOT NULL AND fcr != '' AND fcr != '0'");
        const [ac] = await query('SELECT COUNT(*) as total FROM agents');
        const [rc] = await query('SELECT COUNT(*) as total FROM regions');

        return {
          totalFarmers: fc?.total || 0,
          totalTanks: tc?.total || 0,
          activeTanks: at?.total || 0,
          pendingTests: pt?.total || 0,
          totalHarvestRevenue: Number(hr?.total || 0),
          avgFcr: fcrRes?.avg_fcr ? String(fcrRes.avg_fcr) : '0.00',
          activeAgents: ac?.total || 0,
          regionsCount: rc?.total || 0,
        };
      } catch (err) {
        console.error('[DB Error in getAnalyticsSummary]', err.message);
      }
    }

    const totalFarmers = this.farmers.length;
    const totalTanks = this.tanks.length;
    const activeTanks = this.tanks.filter((t) => t.status === 'ACTIVE').length;
    const pendingTests = this.tanks.filter((t) => t.testStatus === 'Due' || t.testStatus === 'Overdue').length;
    const totalHarvestRevenue = this.harvests.reduce((acc, h) => acc + (h.revenue || 0), 0);
    const tanksWithFcr = this.tanks.filter((t) => t.fcr && !isNaN(parseFloat(t.fcr)) && parseFloat(t.fcr) > 0);
    const avgFcr = tanksWithFcr.length > 0
      ? (tanksWithFcr.reduce((acc, t) => acc + parseFloat(t.fcr), 0) / tanksWithFcr.length).toFixed(2)
      : '0.00';

    return {
      totalFarmers,
      totalTanks,
      activeTanks,
      pendingTests,
      totalHarvestRevenue,
      avgFcr,
      activeAgents: this.agents.length,
      regionsCount: this.regions.length,
    };
  }
}

export const store = new DataStore();
