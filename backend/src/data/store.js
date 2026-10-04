import { query, isDbConnected } from '../config/database.js';
import {
  initialFarmers,
  initialTanks,
  initialSubmissions,
  initialHarvests,
  initialAgents,
  initialIncharges,
  initialRegions,
  authUsers,
} from './seedData.js';

class DataStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.farmers = JSON.parse(JSON.stringify(initialFarmers));
    this.tanks = JSON.parse(JSON.stringify(initialTanks));
    this.submissions = JSON.parse(JSON.stringify(initialSubmissions));
    this.harvests = JSON.parse(JSON.stringify(initialHarvests));
    this.agents = JSON.parse(JSON.stringify(initialAgents));
    this.incharges = JSON.parse(JSON.stringify(initialIncharges));
    this.regions = JSON.parse(JSON.stringify(initialRegions));
    this.users = JSON.parse(JSON.stringify(authUsers));
  }

  // --- Auth & Users ---
  async findUserByCredentials(identifier, password) {
    if (isDbConnected()) {
      try {
        const rows = await query(
          'SELECT * FROM users WHERE (LOWER(username) = LOWER(?) OR phone = ? OR LOWER(email) = LOWER(?)) AND password = ? LIMIT 1',
          [identifier, identifier, identifier, password]
        );
        if (rows && rows.length > 0) return rows[0];
      } catch (err) {
        console.error('[DB Error in findUserByCredentials]', err.message);
      }
    }

    return this.users.find(
      (u) =>
        (u.username?.toLowerCase() === identifier.toLowerCase() ||
          u.phone === identifier ||
          u.email?.toLowerCase() === identifier.toLowerCase()) &&
        u.password === password
    );
  }

  async findUserById(id) {
    if (isDbConnected()) {
      try {
        const rows = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
        if (rows && rows.length > 0) return rows[0];
      } catch (err) {
        console.error('[DB Error in findUserById]', err.message);
      }
    }

    return this.users.find((u) => u.id === id);
  }

  // --- Farmers ---
  async getFarmers(filter = {}) {
    if (isDbConnected()) {
      try {
        let sql = 'SELECT * FROM farmers WHERE 1=1';
        const params = [];

        if (filter.agentId) {
          sql += ' AND agent_id = ?';
          params.push(filter.agentId);
        }
        if (filter.inchargeId) {
          sql += ' AND incharge_id = ?';
          params.push(filter.inchargeId);
        }
        if (filter.search) {
          sql += ' AND (LOWER(name) LIKE ? OR LOWER(location) LIKE ? OR phone LIKE ?)';
          const term = `%${filter.search.toLowerCase()}%`;
          params.push(term, term, term);
        }
        sql += ' ORDER BY created_at DESC';

        const rows = await query(sql, params);
        return rows.map((r) => ({
          ...r,
          agentId: r.agent_id,
          inchargeId: r.incharge_id,
          assignedTo: r.assigned_to,
          assignedBy: r.assigned_by,
          waterSource: r.water_source,
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
        const rows = await query('SELECT * FROM farmers WHERE id = ? LIMIT 1', [id]);
        if (rows && rows.length > 0) {
          const r = rows[0];
          return {
            ...r,
            agentId: r.agent_id,
            inchargeId: r.incharge_id,
            assignedTo: r.assigned_to,
            assignedBy: r.assigned_by,
            waterSource: r.water_source,
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
      name: data.name,
      status: 'ACTIVE',
      agentId: data.agentId || null,
      inchargeId: data.inchargeId || 'INC001',
      assignedTo: data.assignedTo || (data.agentId ? 'Agent' : 'Incharge'),
      assignedBy: data.assignedBy || 'Admin',
      phone: data.phone || '',
      location: data.location || '',
      waterSource: data.waterSource || 'Borewell',
      acres: data.acres ? Number(data.acres) : 10,
      createdAt: new Date().toISOString(),
    };

    if (isDbConnected()) {
      try {
        await query(
          'INSERT INTO farmers (id, name, status, agent_id, incharge_id, assigned_to, assigned_by, phone, location, water_source, acres) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            newFarmer.id,
            newFarmer.name,
            newFarmer.status,
            newFarmer.agentId,
            newFarmer.inchargeId,
            newFarmer.assignedTo,
            newFarmer.assignedBy,
            newFarmer.phone,
            newFarmer.location,
            newFarmer.waterSource,
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
        if (updates.waterSource !== undefined) { fields.push('water_source = ?'); params.push(updates.waterSource); }
        if (updates.acres !== undefined) { fields.push('acres = ?'); params.push(Number(updates.acres)); }

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
      } catch (err) {
        console.error('[DB Error in deleteFarmer]', err.message);
      }
    }

    const index = this.farmers.findIndex((f) => f.id === id);
    if (index !== -1) {
      this.farmers.splice(index, 1);
      return true;
    }
    return true;
  }

  // --- Tanks / Ponds ---
  async getTanks(filter = {}) {
    if (isDbConnected()) {
      try {
        let sql = 'SELECT * FROM tanks WHERE 1=1';
        const params = [];

        if (filter.farmerId) { sql += ' AND farmer_id = ?'; params.push(filter.farmerId); }
        if (filter.agentId) { sql += ' AND agent_id = ?'; params.push(filter.agentId); }
        if (filter.inchargeId) { sql += ' AND incharge_id = ?'; params.push(filter.inchargeId); }
        if (filter.status) { sql += ' AND LOWER(status) = LOWER(?)'; params.push(filter.status); }
        if (filter.testStatus) { sql += ' AND LOWER(test_status) = LOWER(?)'; params.push(filter.testStatus); }

        const rows = await query(sql, params);
        return rows.map((r) => ({
          ...r,
          farmerId: r.farmer_id,
          agentId: r.agent_id,
          inchargeId: r.incharge_id,
          assignedTo: r.assigned_to,
          testStatus: r.test_status,
          lastTest: r.last_test,
          nextTest: r.next_test,
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
            farmerId: r.farmer_id,
            agentId: r.agent_id,
            inchargeId: r.incharge_id,
            assignedTo: r.assigned_to,
            testStatus: r.test_status,
            lastTest: r.last_test,
            nextTest: r.next_test,
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
      status: 'ACTIVE',
      testStatus: 'Due',
      abw: data.abw || '10g',
      biomass: data.biomass || '500kg',
      fcr: data.fcr || '1.20',
      lastTest: data.lastTest || new Date().toLocaleDateString('en-GB'),
      nextTest: data.nextTest || 'In 7 Days',
      size: data.size || '10 Acres',
      doc: data.doc ? Number(data.doc) : 1,
      createdAt: new Date().toISOString(),
    };

    if (isDbConnected()) {
      try {
        await query(
          'INSERT INTO tanks (id, name, farmer_id, agent_id, incharge_id, assigned_to, status, test_status, abw, biomass, fcr, last_test, next_test, size, doc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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

  // --- Submissions ---
  async getSubmissions(filter = {}) {
    if (isDbConnected()) {
      try {
        let sql = 'SELECT * FROM submissions WHERE 1=1';
        const params = [];
        if (filter.status) { sql += ' AND UPPER(status) = UPPER(?)'; params.push(filter.status); }
        if (filter.agentId) { sql += ' AND agent_id = ?'; params.push(filter.agentId); }
        if (filter.tankId) { sql += ' AND tank_id = ?'; params.push(filter.tankId); }
        sql += ' ORDER BY created_at DESC';

        const rows = await query(sql, params);
        return rows.map((r) => ({
          ...r,
          agentId: r.agent_id,
          farmerId: r.farmer_id,
          tankId: r.tank_id,
          testType: r.test_type,
          submittedAgo: r.submitted_ago,
          data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data,
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
    const id = `SUB${String(Date.now()).slice(-4)}`;
    const newSub = {
      id,
      agentId: data.agentId || 'agent001',
      farmerId: data.farmerId || '',
      tankId: data.tankId,
      testType: data.testType || 'Water Quality Test',
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING_VERIFICATION',
      submittedAgo: 'Just now',
      data: data.data || {},
      createdAt: new Date().toISOString(),
    };

    if (isDbConnected()) {
      try {
        await query(
          'INSERT INTO submissions (id, agent_id, farmer_id, tank_id, test_type, date, status, data, submitted_ago) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            newSub.id,
            newSub.agentId,
            newSub.farmerId,
            newSub.tankId,
            newSub.testType,
            newSub.date,
            newSub.status,
            JSON.stringify(newSub.data),
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
          tankId: r.tank_id,
          farmerId: r.farmer_id,
          quantityKg: r.quantity_kg,
          countPerKg: r.count_per_kg,
          pricePerKg: r.price_per_kg,
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
    const id = `HARV${String(Date.now()).slice(-4)}`;
    const newHarvest = {
      id,
      tankId: data.tankId,
      farmerId: data.farmerId || '',
      date: new Date().toISOString().split('T')[0],
      quantityKg: Number(data.quantityKg),
      countPerKg: data.countPerKg ? Number(data.countPerKg) : 30,
      quality: data.quality || 'A Grade',
      pricePerKg: Number(data.pricePerKg) || 380,
      revenue: Number(data.revenue) || 0,
      createdAt: new Date().toISOString(),
    };

    if (isDbConnected()) {
      try {
        await query(
          'INSERT INTO harvests (id, tank_id, farmer_id, date, quantity_kg, count_per_kg, quality, price_per_kg, revenue) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            newHarvest.id,
            newHarvest.tankId,
            newHarvest.farmerId,
            newHarvest.date,
            newHarvest.quantityKg,
            newHarvest.countPerKg,
            newHarvest.quality,
            newHarvest.pricePerKg,
            newHarvest.revenue,
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
        const [hr] = await query('SELECT COALESCE(SUM(revenue), 0) as total FROM harvests');
        const [ac] = await query('SELECT COUNT(*) as total FROM agents');
        const [rc] = await query('SELECT COUNT(*) as total FROM regions');

        return {
          totalFarmers: fc?.total || 0,
          totalTanks: tc?.total || 0,
          activeTanks: at?.total || 0,
          pendingTests: pt?.total || 0,
          totalHarvestRevenue: Number(hr?.total || 0),
          avgFcr: '1.16',
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
    const avgFcr = (
      this.tanks.reduce((acc, t) => acc + (parseFloat(t.fcr) || 1.15), 0) / (totalTanks || 1)
    ).toFixed(2);

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
