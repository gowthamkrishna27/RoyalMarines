import bcrypt from 'bcryptjs';
import { getPool, query } from './database.js';

export const initializeDatabaseSchema = async () => {
  try {

    // 1. Concurrent Table Verifications
    await Promise.all([
      query(`
        CREATE TABLE IF NOT EXISTS roles (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(30) NOT NULL UNIQUE,
          description VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `),
      query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(50) PRIMARY KEY,
          username VARCHAR(100) UNIQUE,
          password VARCHAR(255),
          password_hash VARCHAR(255),
          name VARCHAR(255),
          full_name VARCHAR(255),
          role VARCHAR(50),
          role_id INT UNSIGNED,
          phone VARCHAR(50),
          email VARCHAR(255),
          locality VARCHAR(150),
          region VARCHAR(100),
          status VARCHAR(50) DEFAULT 'ACTIVE',
          last_login_at DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `),
      query(`
        CREATE TABLE IF NOT EXISTS regions (
          id VARCHAR(50) PRIMARY KEY,
          code VARCHAR(50),
          name VARCHAR(100) NOT NULL,
          active_ponds INT DEFAULT 0,
          total_yield VARCHAR(50),
          avg_fcr DECIMAL(4, 2),
          status VARCHAR(50) DEFAULT 'ACTIVE',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `),
      query(`
        CREATE TABLE IF NOT EXISTS localities (
          id VARCHAR(50) PRIMARY KEY,
          region_id VARCHAR(50) NOT NULL,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_reg (region_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `),
      query(`
        CREATE TABLE IF NOT EXISTS incharges (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          user_id VARCHAR(50) NULL,
          region_id VARCHAR(50) NULL,
          email VARCHAR(255),
          phone VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `),
      query(`
        CREATE TABLE IF NOT EXISTS agents (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          incharge_id VARCHAR(50),
          status VARCHAR(50) DEFAULT 'ACTIVE',
          locality VARCHAR(100),
          active_ponds INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `),
      query(`
        CREATE TABLE IF NOT EXISTS farmers (
          id VARCHAR(50) PRIMARY KEY,
          farmer_code VARCHAR(50),
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(50),
          alternate_phone VARCHAR(50),
          address TEXT,
          village VARCHAR(100),
          mandal VARCHAR(100),
          district VARCHAR(100),
          state VARCHAR(100),
          location VARCHAR(255),
          latitude DECIMAL(10, 7),
          longitude DECIMAL(10, 7),
          acres DECIMAL(10, 2),
          total_acres DECIMAL(10, 2),
          water_source VARCHAR(100),
          agent_id VARCHAR(50),
          incharge_id VARCHAR(50),
          assigned_to VARCHAR(50),
          assigned_by VARCHAR(50),
          status VARCHAR(50) DEFAULT 'ACTIVE',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `),
      query(`
        CREATE TABLE IF NOT EXISTS tanks (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          farmer_id VARCHAR(50) NOT NULL,
          agent_id VARCHAR(50),
          incharge_id VARCHAR(50),
          assigned_to VARCHAR(50),
          status VARCHAR(50) DEFAULT 'ACTIVE',
          test_status VARCHAR(50) DEFAULT 'Due',
          abw VARCHAR(50),
          biomass VARCHAR(50),
          fcr VARCHAR(50),
          size VARCHAR(50),
          acres VARCHAR(50),
          area_acres DECIMAL(10, 2),
          doc INT DEFAULT 0,
          last_test VARCHAR(100),
          next_test VARCHAR(100),
          salinity VARCHAR(50),
          species VARCHAR(100),
          water_source VARCHAR(100),
          culture_type VARCHAR(100),
          stocking_date VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `),
      query(`
        CREATE TABLE IF NOT EXISTS submissions (
          id VARCHAR(50) PRIMARY KEY,
          agent_id VARCHAR(50),
          user_id VARCHAR(50),
          user_name VARCHAR(100),
          role VARCHAR(50),
          farmer_id VARCHAR(50),
          tank_id VARCHAR(50),
          test_type VARCHAR(100),
          date VARCHAR(50),
          submission_time VARCHAR(50),
          status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
          data JSON,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          accuracy DECIMAL(8, 2),
          locality VARCHAR(255),
          review_notes TEXT,
          submitted_ago VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `),
      query(`
        CREATE TABLE IF NOT EXISTS harvests (
          id VARCHAR(50) PRIMARY KEY,
          culture_cycle_id VARCHAR(50) NULL,
          harvest_code VARCHAR(50) NULL,
          tank_id VARCHAR(50) NULL,
          farmer_id VARCHAR(50) NULL,
          date VARCHAR(50) NULL,
          harvest_date DATE NULL,
          harvest_type VARCHAR(50) DEFAULT 'FINAL',
          doc INT NULL,
          abw VARCHAR(20) NULL,
          harvested_number INT NULL,
          harvested_biomass DECIMAL(14, 2) NULL,
          total_harvested_seed BIGINT NULL,
          total_biomass_kg DECIMAL(14, 2) NULL,
          total_feed_kg DECIMAL(14, 2) NULL,
          fcr DECIMAL(5, 2) NULL,
          buyer_name VARCHAR(150) NULL,
          remarks TEXT NULL,
          recorded_by VARCHAR(50) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `),
      query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          action VARCHAR(100),
          module VARCHAR(100),
          entity_type VARCHAR(100),
          record_id VARCHAR(50),
          entity_id VARCHAR(50),
          performed_by VARCHAR(50),
          user_id VARCHAR(50),
          ip_address VARCHAR(50),
          notes TEXT,
          details JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `)
    ]);

    // 2. Fetch existing schema columns in parallel (1 network round trip instead of 30)
    const [subCols, harvestCols, tankCols] = await Promise.all([
      query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'submissions'"),
      query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'harvests'"),
      query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tanks'"),
    ]);

    const subColSet = new Set(subCols.map((c) => c.COLUMN_NAME.toLowerCase()));
    const harvestColSet = new Set(harvestCols.map((c) => c.COLUMN_NAME.toLowerCase()));
    const tankColSet = new Set(tankCols.map((c) => c.COLUMN_NAME.toLowerCase()));

    // Submissions Column Verification
    const subColAlters = [
      { col: 'user_id', sql: 'ALTER TABLE submissions ADD COLUMN user_id VARCHAR(50) AFTER agent_id' },
      { col: 'user_name', sql: 'ALTER TABLE submissions ADD COLUMN user_name VARCHAR(100) AFTER user_id' },
      { col: 'role', sql: 'ALTER TABLE submissions ADD COLUMN role VARCHAR(50) AFTER user_name' },
      { col: 'submission_time', sql: 'ALTER TABLE submissions ADD COLUMN submission_time VARCHAR(50) AFTER date' },
      { col: 'accuracy', sql: 'ALTER TABLE submissions ADD COLUMN accuracy DECIMAL(8, 2) AFTER longitude' }
    ];
    for (const alt of subColAlters) {
      if (!subColSet.has(alt.col.toLowerCase())) {
        try { await query(alt.sql); } catch (e) { }
      }
    }

    // Harvests Column Verification
    const harvestColAlters = [
      { col: 'culture_cycle_id', sql: 'ALTER TABLE harvests ADD COLUMN culture_cycle_id VARCHAR(50) NULL' },
      { col: 'harvest_code', sql: 'ALTER TABLE harvests ADD COLUMN harvest_code VARCHAR(50) NULL' },
      { col: 'tank_id', sql: 'ALTER TABLE harvests ADD COLUMN tank_id VARCHAR(50) NULL' },
      { col: 'farmer_id', sql: 'ALTER TABLE harvests ADD COLUMN farmer_id VARCHAR(50) NULL' },
      { col: 'date', sql: 'ALTER TABLE harvests ADD COLUMN date VARCHAR(50) NULL' },
      { col: 'harvest_date', sql: 'ALTER TABLE harvests ADD COLUMN harvest_date DATE NULL' },
      { col: 'harvest_type', sql: "ALTER TABLE harvests ADD COLUMN harvest_type VARCHAR(50) DEFAULT 'FINAL'" },
      { col: 'quantity_kg', sql: 'ALTER TABLE harvests ADD COLUMN quantity_kg DECIMAL(14, 2) DEFAULT 0' },
      { col: 'count_per_kg', sql: 'ALTER TABLE harvests ADD COLUMN count_per_kg INT NULL' },
      { col: 'quality', sql: "ALTER TABLE harvests ADD COLUMN quality VARCHAR(50) DEFAULT 'A Grade'" },
      { col: 'price_per_kg', sql: 'ALTER TABLE harvests ADD COLUMN price_per_kg DECIMAL(12, 2) DEFAULT 0' },
      { col: 'revenue', sql: 'ALTER TABLE harvests ADD COLUMN revenue DECIMAL(16, 2) DEFAULT 0' },
      { col: 'total_value', sql: 'ALTER TABLE harvests ADD COLUMN total_value DECIMAL(16, 2) DEFAULT 0' },
      { col: 'buyer_name', sql: 'ALTER TABLE harvests ADD COLUMN buyer_name VARCHAR(150) NULL' },
      { col: 'remarks', sql: 'ALTER TABLE harvests ADD COLUMN remarks TEXT NULL' },
      { col: 'recorded_by', sql: 'ALTER TABLE harvests ADD COLUMN recorded_by VARCHAR(50) NULL' },
      { col: 'doc', sql: 'ALTER TABLE harvests ADD COLUMN doc INT NULL AFTER harvest_type' },
      { col: 'abw', sql: 'ALTER TABLE harvests ADD COLUMN abw VARCHAR(20) NULL AFTER doc' },
      { col: 'harvested_number', sql: 'ALTER TABLE harvests ADD COLUMN harvested_number INT NULL AFTER abw' },
      { col: 'harvested_biomass', sql: 'ALTER TABLE harvests ADD COLUMN harvested_biomass DECIMAL(14, 2) NULL AFTER harvested_number' },
      { col: 'total_harvested_seed', sql: 'ALTER TABLE harvests ADD COLUMN total_harvested_seed BIGINT NULL AFTER harvested_biomass' },
      { col: 'total_biomass_kg', sql: 'ALTER TABLE harvests ADD COLUMN total_biomass_kg DECIMAL(14, 2) NULL AFTER total_harvested_seed' },
      { col: 'total_feed_kg', sql: 'ALTER TABLE harvests ADD COLUMN total_feed_kg DECIMAL(14, 2) NULL AFTER total_biomass_kg' },
      { col: 'fcr', sql: 'ALTER TABLE harvests ADD COLUMN fcr DECIMAL(5, 2) NULL AFTER total_feed_kg' }
    ];
    for (const alt of harvestColAlters) {
      if (!harvestColSet.has(alt.col.toLowerCase())) {
        try { await query(alt.sql); } catch (e) { }
      }
    }

    // 11. Tank Due Follow-ups Table (Weekly testing monitoring and follow-up conversation threads)
    await query(`
      CREATE TABLE IF NOT EXISTS tank_due_followups (
        id VARCHAR(50) PRIMARY KEY,
        tank_id VARCHAR(50) NOT NULL,
        farmer_id VARCHAR(50) NOT NULL,
        agent_id VARCHAR(50) NULL,
        incharge_id VARCHAR(50) NULL,
        cycle_key VARCHAR(100) NOT NULL,
        sender_id VARCHAR(50) NOT NULL,
        sender_name VARCHAR(150) NOT NULL,
        sender_role VARCHAR(50) NOT NULL,
        recipient_id VARCHAR(50) NULL,
        recipient_name VARCHAR(150) NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'ADDRESSED',
        test_waived TINYINT(1) DEFAULT 1,
        resolved_reason VARCHAR(100) DEFAULT 'ADDRESSED_BY_SUPERVISOR',
        settled_at DATETIME NULL,
        resolved_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_fup_tank (tank_id),
        INDEX idx_fup_cycle (cycle_key),
        INDEX idx_fup_tank_cycle (tank_id, cycle_key),
        INDEX idx_fup_agent (agent_id),
        INDEX idx_fup_incharge (incharge_id),
        INDEX idx_fup_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure follow-up waiver columns exist on tank_due_followups
    const fupColAlters = [
      'ALTER TABLE tank_due_followups ADD COLUMN test_waived TINYINT(1) DEFAULT 1 AFTER status',
      "ALTER TABLE tank_due_followups ADD COLUMN resolved_reason VARCHAR(100) DEFAULT 'ADDRESSED_BY_SUPERVISOR' AFTER test_waived",
      'ALTER TABLE tank_due_followups ADD COLUMN settled_at DATETIME NULL AFTER resolved_reason'
    ];
    for (const alt of fupColAlters) {
      try { await query(alt); } catch (e) { }
    }

    // Ensure compliance columns exist on tanks table
    const tankCompAlters = [
      "ALTER TABLE tanks ADD COLUMN compliance_status VARCHAR(50) DEFAULT 'COMPLIANT'",
      'ALTER TABLE tanks ADD COLUMN last_followup_at DATETIME NULL',
      'ALTER TABLE tanks ADD COLUMN last_followup_by VARCHAR(150) NULL',
      'ALTER TABLE tanks ADD COLUMN last_followup_role VARCHAR(50) NULL',
      'ALTER TABLE tanks ADD COLUMN weekly_test_waived TINYINT(1) DEFAULT 0'
    ];
    for (const alt of tankCompAlters) {
      try { await query(alt); } catch (e) { }
    }

    // 12. Tank Weekly Compliance Cycles Table (Authoritative 7-day routine test cycle & waiver tracking)
    await query(`
      CREATE TABLE IF NOT EXISTS tank_compliance_cycles (
        id VARCHAR(100) PRIMARY KEY,
        cycle_key VARCHAR(100) NOT NULL UNIQUE,
        tank_id VARCHAR(50) NOT NULL,
        farmer_id VARCHAR(50) NOT NULL,
        agent_id VARCHAR(50) NULL,
        incharge_id VARCHAR(50) NULL,
        cycle_number INT DEFAULT 1,
        week_start_date DATE NULL,
        due_date DATE NULL,
        days_overdue INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'DUE',
        test_required TINYINT(1) DEFAULT 1,
        addressed_by_id VARCHAR(50) NULL,
        addressed_by_name VARCHAR(150) NULL,
        addressed_by_role VARCHAR(50) NULL,
        addressed_at DATETIME NULL,
        qualifying_test_id VARCHAR(50) NULL,
        qualifying_test_date DATETIME NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_tcc_tank (tank_id),
        INDEX idx_tcc_status (status),
        INDEX idx_tcc_agent (agent_id),
        INDEX idx_tcc_incharge (incharge_id),
        INDEX idx_tcc_due_date (due_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 13. Culture Cycles Table (Cultivation batches, growth metrics, and harvest milestones)
    await query(`
      CREATE TABLE IF NOT EXISTS culture_cycles (
        id VARCHAR(50) PRIMARY KEY,
        tank_id VARCHAR(50) NOT NULL,
        farmer_id VARCHAR(50) NOT NULL,
        cycle_number INT DEFAULT 1,
        species VARCHAR(100) DEFAULT 'Vannamei',
        seed_count INT NULL,
        stocking_date DATE NULL,
        harvest_date DATE NULL,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        total_biomass_kg DECIMAL(14, 2) DEFAULT 0,
        total_feed_kg DECIMAL(14, 2) DEFAULT 0,
        fcr DECIMAL(5, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cc_tank (tank_id),
        INDEX idx_cc_farmer (farmer_id),
        INDEX idx_cc_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 14. Staff Locations Table (Real-time GPS coordinates, route tracking, and mobility logs)
    await query(`
      CREATE TABLE IF NOT EXISTS staff_locations (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        user_name VARCHAR(150) NOT NULL,
        role VARCHAR(50) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        accuracy DECIMAL(8, 2) DEFAULT 0,
        speed DECIMAL(8, 2) DEFAULT 0,
        battery_level INT NULL,
        status VARCHAR(50) DEFAULT 'ONLINE',
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_sl_user (user_id),
        INDEX idx_sl_recorded (recorded_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 15. Feed Records Table (Daily feed feeding logs, brands, and sampling records)
    await query(`
      CREATE TABLE IF NOT EXISTS feed_records (
        id VARCHAR(50) PRIMARY KEY,
        tank_id VARCHAR(50) NOT NULL,
        farmer_id VARCHAR(50) NOT NULL,
        agent_id VARCHAR(50) NULL,
        date DATE NOT NULL,
        feed_brand VARCHAR(100) NULL,
        feed_type VARCHAR(100) NULL,
        quantity_kg DECIMAL(10, 2) NOT NULL DEFAULT 0,
        cumulative_feed_kg DECIMAL(14, 2) DEFAULT 0,
        doc INT DEFAULT 0,
        remarks TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_fr_tank (tank_id),
        INDEX idx_fr_date (date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 16. Notifications Table (User alerts, weekly test reminders, review statuses)
    await query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50) NOT NULL,
        agent_id VARCHAR(50) NULL,
        title VARCHAR(200) NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read TINYINT(1) DEFAULT 0,
        meta JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notif_user (user_id),
        INDEX idx_notif_agent (agent_id),
        INDEX idx_notif_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 17. Farmer Allocations Table (ASM/Incharge assigning field agents to farmers/ponds)
    await query(`
      CREATE TABLE IF NOT EXISTS farmer_allocations (
        id VARCHAR(50) PRIMARY KEY,
        farmer_id VARCHAR(50) NOT NULL,
        agent_id VARCHAR(50) NOT NULL,
        incharge_id VARCHAR(50) NULL,
        allocated_by VARCHAR(50) NULL,
        status VARCHAR(50) DEFAULT 'ACTIVE',
        notes TEXT NULL,
        allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_fa_farmer (farmer_id),
        INDEX idx_fa_agent (agent_id),
        INDEX idx_fa_incharge (incharge_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 18. Water Quality Records Table (Detailed physical & chemical lab testing parameters)
    await query(`
      CREATE TABLE IF NOT EXISTS water_quality_records (
        id VARCHAR(50) PRIMARY KEY,
        tank_id VARCHAR(50) NOT NULL,
        farmer_id VARCHAR(50) NULL,
        agent_id VARCHAR(50) NULL,
        recorded_at DATETIME NOT NULL,
        ph DECIMAL(4, 2) NULL,
        salinity DECIMAL(6, 2) NULL,
        do_level DECIMAL(5, 2) NULL,
        temperature DECIMAL(5, 2) NULL,
        alkalinity DECIMAL(6, 2) NULL,
        ammonia DECIMAL(5, 2) NULL,
        nitrite DECIMAL(5, 2) NULL,
        transparency INT NULL,
        water_color VARCHAR(100) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_wqr_tank (tank_id),
        INDEX idx_wqr_date (recorded_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 19. Biomass Records Table (Sampling, ABW, growth curves, and survival rates)
    await query(`
      CREATE TABLE IF NOT EXISTS biomass_records (
        id VARCHAR(50) PRIMARY KEY,
        tank_id VARCHAR(50) NOT NULL,
        farmer_id VARCHAR(50) NULL,
        agent_id VARCHAR(50) NULL,
        recorded_at DATETIME NOT NULL,
        doc INT DEFAULT 0,
        abw DECIMAL(6, 2) NULL,
        estimated_biomass DECIMAL(14, 2) NULL,
        survival_rate DECIMAL(5, 2) NULL,
        sampling_count INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_bmr_tank (tank_id),
        INDEX idx_bmr_date (recorded_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 20. Health Records Table (Shrimp & fish clinical health, hepatopancreas, gills)
    await query(`
      CREATE TABLE IF NOT EXISTS health_records (
        id VARCHAR(50) PRIMARY KEY,
        tank_id VARCHAR(50) NOT NULL,
        farmer_id VARCHAR(50) NULL,
        agent_id VARCHAR(50) NULL,
        check_date DATE NOT NULL,
        gut_condition VARCHAR(100) NULL,
        hepatopancreas VARCHAR(100) NULL,
        gills_condition VARCHAR(100) NULL,
        body_cramps VARCHAR(100) NULL,
        remedies TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_hr_tank (tank_id),
        INDEX idx_hr_date (check_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 21. Feed Products Table (Commercial brand catalogues, protein ratios, pellet size)
    await query(`
      CREATE TABLE IF NOT EXISTS feed_products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        protein_percentage DECIMAL(4, 1) NULL,
        pellet_size VARCHAR(50) NULL,
        price_per_bag DECIMAL(10, 2) DEFAULT 0,
        bag_weight_kg DECIMAL(6, 2) DEFAULT 25.0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 22. Field Visits Table (Technician on-site inspection visits and geolocations)
    await query(`
      CREATE TABLE IF NOT EXISTS field_visits (
        id VARCHAR(50) PRIMARY KEY,
        agent_id VARCHAR(50) NOT NULL,
        farmer_id VARCHAR(50) NOT NULL,
        tank_id VARCHAR(50) NULL,
        visit_date DATE NOT NULL,
        purpose VARCHAR(100) NULL,
        latitude DECIMAL(10, 8) NULL,
        longitude DECIMAL(11, 8) NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_fv_agent (agent_id),
        INDEX idx_fv_farmer (farmer_id),
        INDEX idx_fv_date (visit_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 23. Recommendations Table (Advisory recommendations for ponds from ASM/Admin)
    await query(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id VARCHAR(50) PRIMARY KEY,
        tank_id VARCHAR(50) NOT NULL,
        farmer_id VARCHAR(50) NULL,
        given_by VARCHAR(50) NOT NULL,
        recommendation_text TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'WATER_QUALITY',
        priority VARCHAR(20) DEFAULT 'MEDIUM',
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rec_tank (tank_id),
        INDEX idx_rec_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Synchronize tank_due_followups waiver columns for any existing records
    try {
      await query(`
        UPDATE tank_due_followups
        SET test_waived = 1,
            resolved_reason = 'ADDRESSED_BY_SUPERVISOR',
            settled_at = COALESCE(settled_at, created_at)
        WHERE status = 'ADDRESSED' AND (test_waived IS NULL OR test_waived = 0 OR settled_at IS NULL)
      `);
    } catch (e) { }

    // Synchronize tanks compliance status & weekly_test_waived from latest follow-ups
    try {
      await query(`
        UPDATE tanks t
        JOIN (
          SELECT f1.tank_id, f1.sender_name, f1.sender_role, f1.created_at
          FROM tank_due_followups f1
          JOIN (
            SELECT tank_id, MAX(created_at) as max_created
            FROM tank_due_followups
            WHERE status = 'ADDRESSED'
            GROUP BY tank_id
          ) f2 ON f1.tank_id = f2.tank_id AND f1.created_at = f2.max_created
        ) latest ON t.id = latest.tank_id
        SET t.compliance_status = 'ADDRESSED',
            t.weekly_test_waived = 1,
            t.last_followup_at = latest.created_at,
            t.last_followup_by = latest.sender_name,
            t.last_followup_role = latest.sender_role
        WHERE t.compliance_status != 'ADDRESSED' OR t.weekly_test_waived = 0
      `);
    } catch (e) { }
    // Ensure tanks table has seed_date column
    if (!tankColSet.has('seed_date')) {
      try {
        await query('ALTER TABLE tanks ADD COLUMN seed_date VARCHAR(50) NULL AFTER stocking_date');
      } catch (e) { }
    }

    // Check whether legacy harvest synchronization is needed before querying full-table updates
    const [needSync] = await query(`
      SELECT 1 FROM harvests 
      WHERE (harvested_biomass IS NULL AND quantity_kg IS NOT NULL)
         OR ((quantity_kg IS NULL OR quantity_kg = 0) AND (harvested_biomass IS NOT NULL OR total_biomass_kg IS NOT NULL))
         OR (price_per_kg IS NULL OR price_per_kg = 0)
         OR ((revenue IS NULL OR revenue = 0) AND quantity_kg > 0)
      LIMIT 1
    `);

    if (needSync) {
      try {
        await query(`
          UPDATE harvests 
          SET harvested_biomass = quantity_kg 
          WHERE (harvested_biomass IS NULL OR harvested_biomass = 0) AND quantity_kg IS NOT NULL AND quantity_kg > 0
        `);
        await query(`
          UPDATE harvests 
          SET quantity_kg = CAST(REGEXP_REPLACE(COALESCE(harvested_biomass, total_biomass_kg, '0'), '[^0-9.]', '') AS DECIMAL(14, 2))
          WHERE (quantity_kg IS NULL OR quantity_kg = 0) 
            AND (harvested_biomass IS NOT NULL OR total_biomass_kg IS NOT NULL)
        `);
        await query(`
          UPDATE harvests 
          SET price_per_kg = 350
          WHERE (price_per_kg IS NULL OR price_per_kg = 0)
        `);
        await query(`
          UPDATE harvests 
          SET revenue = quantity_kg * COALESCE(price_per_kg, 350),
              total_value = quantity_kg * COALESCE(price_per_kg, 350)
          WHERE (revenue IS NULL OR revenue = 0) AND quantity_kg > 0
        `);
      } catch (e) { }
    }

    // Ensure final 13 operational regions
    const finalRegions = [
      ['REG_ELU', 'ELU', 'Eluru'],
      ['REG_KKL', 'KKL', 'Kaikaluru'],
      ['REG_KLD', 'KLD', 'Kaldhindi'],
      ['REG_AKV', 'AKV', 'Akividu'],
      ['REG001', 'BVRM', 'Bhimavaram'],
      ['REG_GNP', 'GNP', 'Ganapavaram'],
      ['REG_MLKP', 'MLKP', 'Malkipuram'],
      ['REG_AMP', 'AMP', 'Amalapuram'],
      ['REG_MUM', 'MUM', 'Mummidivaram'],
      ['REG002', 'KKD', 'Kakinada'],
      ['REG_SKLM', 'SKLM', 'Srikakulam'],
      ['REG005', 'MPM', 'Machilipatnam'],
      ['REG_BPT', 'BPT', 'Bapatla']
    ];
    for (const [id, code, name] of finalRegions) {
      try {
        await query(
          `INSERT INTO regions (id, code, name, active_ponds, total_yield, avg_fcr, status)
           VALUES (?, ?, ?, 0, '0 Tons', 1.25, 'ACTIVE')
           ON DUPLICATE KEY UPDATE code = VALUES(code), name = VALUES(name), status = 'ACTIVE'`,
          [id, code, name]
        );
      } catch (e) { }
    }

      console.log('\x1b[32m[Database Init]\x1b[0m All MySQL tables verified successfully.');
      return true;
    } catch (error) {
      console.error('\x1b[31m[Database Init Error]\x1b[0m', error.message);
      return false;
    }
  };

  export const seedDatabase = async () => {
    try {
      console.log('\x1b[33m[Database Seed]\x1b[0m Explicit seeding requested...');
      const defaultPinHash = await bcrypt.hash('1234', 10);
      const [existing] = await query('SELECT id FROM users WHERE id = "ADM001" OR username = "admin" LIMIT 1');
      if (!existing) {
        await query(
          `INSERT INTO users (id, name, full_name, role, role_id, username, phone, email, password, password_hash, locality, region, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
          ['ADM001', 'System Administrator', 'System Administrator', 'ADMIN', 1, 'admin', '9999999999', 'admin@royalsmarine.com', defaultPinHash, defaultPinHash, 'HQ', 'Headquarters']
        );
      }
      console.log('\x1b[32m[Database Seed]\x1b[0m Seeding completed successfully.');
      return true;
    } catch (error) {
      console.error('\x1b[31m[Database Seed Error]\x1b[0m', error.message);
      return false;
    }
  };
