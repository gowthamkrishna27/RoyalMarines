import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, CheckCircle, Scale, Droplets, Calendar, 
  TrendingUp, Activity, Award, FileText, ChevronRight,
  Fish, Layers, MapPin, User, ArrowDownCircle, Printer, Clock, AlertCircle, Sparkles, Plus
} from 'lucide-react';

const HarvestCompletedModal = ({ isOpen, onClose, tank, farmer }) => {
  if (!isOpen || !tank) return null;

  const farmerName = farmer?.name || tank.farmer || 'Farmer';
  const farmerLocality = farmer?.location || farmer?.village || tank.locality || 'Bhimavaram';
  const tankName = tank.name || `Tank ${tank.id}`;
  const pondSize = String(tank.size || tank.acres || '2.5').replace(/\s*acres?/i, '') + ' Acres';
  const initialStock = parseInt(tank.seedStocked || tank.seedNumber || '150000', 10);
  const stockingDate = tank.seedDate || tank.stockingDate || '20 Jun 2026';
  const doc = tank.doc || 64;

  // Determine if the culture cycle is still active vs completely final harvested
  const isFinalHarvested = tank.status === 'Harvested' || tank.isHarvested === true;

  // Retrieve stored harvest records from localStorage if present
  const storeKey = `${tank.farmerId || farmer?.id}_${tank.id}`;
  let storedHarvests = [];
  let totalFeedStored = null;

  try {
    const store = JSON.parse(localStorage.getItem('agent_harvest_store') || '{}');
    const tankStore = store[storeKey];
    if (tankStore && Array.isArray(tankStore.harvests) && tankStore.harvests.length > 0) {
      storedHarvests = tankStore.harvests;
      totalFeedStored = parseFloat(tankStore.totalFeed);
    }
  } catch (e) {
    console.error('Error reading harvest store:', e);
  }

  // Build appropriate harvest records based on whether Final Harvest is completed or ongoing
  let rawHarvests = [];

  if (storedHarvests.length > 0) {
    rawHarvests = storedHarvests;
  } else if (isFinalHarvested) {
    // 1. Completed Cycle Seed (All Partial Harvests + Final Harvest)
    rawHarvests = [
      {
        id: 'h-part-1',
        harvestType: 'Partial Harvest',
        displayTitle: 'Partial Harvest #1',
        date: '10 Jul 2026',
        doc: 58,
        abw: 16.5,
        countPerKg: 60,
        harvestedNumber: 45000,
        harvestedBiomass: 742,
        feedConsumed: 853,
        fcr: '1.15',
        remarks: 'First partial thinning to reduce biomass density and promote faster growth.',
        buyer: 'Royals Marine Export Unit 1',
      },
      {
        id: 'h-part-2',
        harvestType: 'Partial Harvest',
        displayTitle: 'Partial Harvest #2',
        date: '05 Aug 2026',
        doc: 84,
        abw: 24.0,
        countPerKg: 42,
        harvestedNumber: 42000,
        harvestedBiomass: 1008,
        feedConsumed: 1189,
        fcr: '1.18',
        remarks: 'Second selective netting targeting 40-count high value export grade.',
        buyer: 'Coastal Sea Foods Ltd',
      },
      {
        id: 'h-final',
        harvestType: 'Final Harvest',
        displayTitle: 'Final Harvest (Cycle Closed)',
        isFinal: true,
        date: '24 Aug 2026',
        doc: 115,
        abw: 33.5,
        countPerKg: 30,
        harvestedNumber: 48000,
        harvestedBiomass: 1608,
        feedConsumed: 1913,
        fcr: '1.19',
        remarks: 'Complete pond drainage harvest. High grade SPF Vannamei batch.',
        buyer: 'Royals Marine Food Exports',
      }
    ];
  } else {
    // 2. Active Ongoing Cycle Seed (Partial Harvests done so far + Current Standing Crop)
    rawHarvests = [
      {
        id: 'h-part-1',
        harvestType: 'Partial Harvest',
        displayTitle: 'Partial Harvest #1',
        date: '12 Aug 2026',
        doc: 48,
        abw: 15.8,
        countPerKg: 63,
        harvestedNumber: 38000,
        harvestedBiomass: 600,
        feedConsumed: 690,
        fcr: '1.15',
        remarks: 'Partial drag net thinning to optimize pond oxygen balance.',
        buyer: 'Royals Marine Local Procurement',
      }
    ];
  }

  // Parse Present Standing Crop Values (for active pond)
  const presentABW = parseFloat(tank.abw || '21.2');
  const presentBiomassKg = parseFloat(String(tank.biomass || '2750kg').replace(/[^0-9.]/g, '')) || 2750;
  const presentFCR = parseFloat(tank.fcr || '1.17');
  const presentSurvivalPct = parseFloat(String(tank.survival || '88%').replace(/[^0-9.]/g, '')) || 88.0;
  const targetABW = 30.0;
  const growthProgressPct = Math.min(100, Math.round((presentABW / targetABW) * 100));
  const estimatedRemainingShrimp = Math.round((presentBiomassKg * 1000) / presentABW);

  // Normalize harvest records
  let partialCounter = 0;
  const processedHarvests = rawHarvests.map((h, i) => {
    const isFinal = h.harvestType === 'Final Harvest' || h.isFinal;
    if (!isFinal) partialCounter += 1;
    const title = h.displayTitle || (isFinal ? 'Final Harvest' : `Partial Harvest #${partialCounter}`);
    const biomass = parseFloat(h.harvestedBiomass || h.biomass || 0);
    const abw = parseFloat(h.abw || 20);
    const count = parseInt(h.harvestedNumber || (biomass > 0 && abw > 0 ? (biomass * 1000) / abw : 0), 10);
    const countPerKg = Math.round(1000 / (abw || 20));
    const stageFeed = h.feedConsumed ? parseFloat(h.feedConsumed) : Math.round(biomass * (parseFloat(h.fcr) || 1.15));
    const stageFcr = biomass > 0 ? (stageFeed / biomass).toFixed(2) : (h.fcr || '1.15');

    return {
      ...h,
      displayTitle: title,
      isFinal,
      biomass,
      abw,
      count,
      countPerKg,
      stageFeed,
      stageFcr,
      doc: h.doc || (45 + i * 20),
      date: h.date || 'Aug 2026',
      remarks: h.remarks || 'Standard partial drag net protocol.',
      buyer: h.buyer || 'Royals Marine Processing'
    };
  });

  // Calculate Cumulative Partial Harvested Totals
  const totalHarvestedBiomass = processedHarvests.reduce((sum, h) => sum + h.biomass, 0);
  const totalHarvestedShrimp = processedHarvests.reduce((sum, h) => sum + h.count, 0);
  const totalFeedUsedForHarvested = processedHarvests.reduce((sum, h) => sum + h.stageFeed, 0);

  // Total Crop Biomass (Realized Harvests + Present Standing Crop if active)
  const totalCropBiomass = isFinalHarvested ? totalHarvestedBiomass : (totalHarvestedBiomass + presentBiomassKg);
  const totalCropShrimp = isFinalHarvested ? totalHarvestedShrimp : (totalHarvestedShrimp + estimatedRemainingShrimp);
  const overallFCR = isFinalHarvested 
    ? (totalHarvestedBiomass > 0 ? (totalFeedUsedForHarvested / totalHarvestedBiomass).toFixed(2) : '1.18')
    : presentFCR.toFixed(2);
  const overallSurvival = initialStock > 0 
    ? ((totalCropShrimp / initialStock) * 100).toFixed(1) 
    : presentSurvivalPct.toFixed(1);

  return createPortal(
    <div style={styles.modalBackdrop} onClick={onClose}>
      <div 
        style={styles.modalCard} 
        onClick={e => e.stopPropagation()}
        className="animate-modal-in"
      >
        {/* ========================================================= */}
        {/* 1. MODAL HEADER */}
        {/* ========================================================= */}
        <div style={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              ...styles.headerIconBox,
              backgroundColor: isFinalHarvested ? '#DCFCE7' : '#FEF3C7',
              color: isFinalHarvested ? '#16A34A' : '#D97706'
            }}>
              <Scale size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={styles.headerTitle}>{tankName} — Harvest & Crop Report</h2>
                {isFinalHarvested ? (
                  <span style={styles.completedBadge}>
                    <CheckCircle size={12} /> Final Harvest Completed & Cycle Closed
                  </span>
                ) : (
                  <span style={styles.activeBadge}>
                    <Clock size={12} /> Active Culture • Pre-Final Harvest (Day {doc} DOC)
                  </span>
                )}
              </div>
              <p style={styles.headerSub}>
                👤 Farmer: <strong>{farmerName}</strong> • 📍 {farmerLocality} • 📐 Extent: {pondSize} • 🗓️ Stocked: {stockingDate}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={styles.closeBtn}
            title="Close Harvest Report"
          >
            <X size={20} />
          </button>
        </div>

        {/* ========================================================= */}
        {/* 2. PRESENT STANDING CROP REPORT (Shown when Final Harvest is Ongoing) */}
        {/* ========================================================= */}
        {!isFinalHarvested && (
          <div style={styles.presentCropContainer}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={styles.livePulseDot} />
                <h3 style={{ fontSize: '14.5px', fontWeight: '800', color: '#0F172A', margin: 0 }}>
                  Present Standing Crop Status (In Tank)
                </h3>
                <span style={styles.presentPill}>
                  <Sparkles size={11} /> Live Telemetry
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>
                Target Final Harvest: <strong>30.0g ABW (~Day 90-100 DOC)</strong>
              </span>
            </div>

            {/* 4 Core Present Metrics */}
            <div style={styles.presentGrid}>
              <div style={styles.presentTile}>
                <span style={styles.presentLabel}>PRESENT STANDING BIOMASS</span>
                <span style={{ ...styles.presentVal, color: '#1A2FB8' }}>
                  {presentBiomassKg.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: '600' }}>kg</span>
                </span>
                <span style={styles.presentSub}>In tank currently</span>
              </div>

              <div style={styles.presentTile}>
                <span style={styles.presentLabel}>PRESENT AVG BODY WEIGHT</span>
                <span style={{ ...styles.presentVal, color: '#16A34A' }}>
                  {presentABW} <span style={{ fontSize: '12px', fontWeight: '600' }}>g</span>
                </span>
                <span style={styles.presentSub}>Growth ADG: +0.28 g/day</span>
              </div>

              <div style={styles.presentTile}>
                <span style={styles.presentLabel}>EST. REMAINING POPULATION</span>
                <span style={{ ...styles.presentVal, color: '#0284C7' }}>
                  {estimatedRemainingShrimp.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: '600' }}>pcs</span>
                </span>
                <span style={styles.presentSub}>Est. Survival: {presentSurvivalPct}%</span>
              </div>

              <div style={styles.presentTile}>
                <span style={styles.presentLabel}>PRESENT FEED EFFICIENCY (FCR)</span>
                <span style={{ ...styles.presentVal, color: '#D97706' }}>
                  {presentFCR}
                </span>
                <span style={styles.presentSub}>Optimal feed conversion</span>
              </div>
            </div>

            {/* Target Growth Progress Bar */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                <span style={{ fontWeight: '700', color: '#475569' }}>
                  Growth Target Progress ({presentABW}g of {targetABW}g Target)
                </span>
                <span style={{ fontWeight: '800', color: '#1A2FB8' }}>
                  {growthProgressPct}% Progress
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${growthProgressPct}%`, height: '100%', backgroundColor: '#1A2FB8', borderRadius: '4px', transition: 'width 0.4s ease' }} />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. EXECUTIVE CROP TOTALS KPI STRIP */}
        {/* ========================================================= */}
        <div style={styles.kpiContainer}>
          {/* KPI 1: PARTIAL HARVESTS COMPLETED */}
          <div style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>
                {isFinalHarvested ? 'Total Biomass Harvested' : 'Partial Harvested Biomass'}
              </span>
              <Scale size={16} color="#1A2FB8" />
            </div>
            <div style={{ ...styles.kpiValue, color: '#1A2FB8' }}>
              {totalHarvestedBiomass.toLocaleString()} <span style={styles.kpiUnit}>kg</span>
            </div>
            <span style={styles.kpiSub}>
              {processedHarvests.length} Partial Cut{processedHarvests.length > 1 ? 's' : ''} Realized
            </span>
          </div>

          {/* KPI 2: TOTAL CROP ESTIMATED BIOMASS */}
          <div style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>
                {isFinalHarvested ? 'Total Harvest Count' : 'Total Cycle Biomass (Est.)'}
              </span>
              <Fish size={16} color="#0284C7" />
            </div>
            <div style={{ ...styles.kpiValue, color: '#0284C7' }}>
              {totalCropBiomass.toLocaleString()} <span style={styles.kpiUnit}>kg</span>
            </div>
            <span style={styles.kpiSub}>
              {isFinalHarvested ? `${totalCropShrimp.toLocaleString()} pcs total` : `Partial (${totalHarvestedBiomass}kg) + Tank (${presentBiomassKg}kg)`}
            </span>
          </div>

          {/* KPI 3: CROP FCR */}
          <div style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>Crop Feed Efficiency (FCR)</span>
              <TrendingUp size={16} color="#16A34A" />
            </div>
            <div style={{ ...styles.kpiValue, color: '#16A34A' }}>
              {overallFCR}
            </div>
            <span style={styles.kpiSub}>
              {isFinalHarvested ? 'Final verified cycle FCR' : 'Present active cycle FCR'}
            </span>
          </div>

          {/* KPI 4: SURVIVAL RATE */}
          <div style={styles.kpiCard}>
            <div style={styles.kpiHeader}>
              <span style={styles.kpiLabel}>Crop Survival Rate</span>
              <Activity size={16} color="#7C3AED" />
            </div>
            <div style={{ ...styles.kpiValue, color: '#7C3AED' }}>
              {overallSurvival}%
            </div>
            <span style={styles.kpiSub}>
              Stocked: {initialStock.toLocaleString()} PL
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. DETAILED PARTIAL & FINAL HARVEST RECORDS TABLE */}
        {/* ========================================================= */}
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={17} color="#1A2FB8" />
              <h3 style={styles.sectionTitle}>
                {isFinalHarvested ? 'Complete Harvest Records Log' : `Partial Harvest Records Log (${processedHarvests.length})`}
              </h3>
            </div>
            <span style={styles.verifiedTag}>
              ✓ Weighment Logs
            </span>
          </div>

          {/* Table Container */}
          <div style={{ overflowX: 'auto', marginTop: '12px' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Harvest Stage</th>
                  <th style={styles.th}>Date & DOC</th>
                  <th style={styles.th}>ABW / Size Count</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Shrimp Count</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Harvested Biomass</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Feed (kg)</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Stage FCR</th>
                  <th style={styles.th}>Buyer & Observations</th>
                </tr>
              </thead>
              <tbody>
                {processedHarvests.map((h, idx) => {
                  const biomassPct = totalCropBiomass > 0 ? ((h.biomass / totalCropBiomass) * 100).toFixed(0) : '0';
                  return (
                    <tr key={h.id || idx} style={styles.tr}>
                      {/* 1. Stage Title */}
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={h.isFinal ? styles.finalBadge : styles.partialBadge}>
                            {h.displayTitle}
                          </span>
                        </div>
                      </td>

                      {/* 2. Date & DOC */}
                      <td style={styles.td}>
                        <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px' }}>{h.date}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>Day {h.doc} DOC</div>
                      </td>

                      {/* 3. ABW & Count */}
                      <td style={styles.td}>
                        <div style={{ fontWeight: '800', color: '#16A34A', fontSize: '13.5px' }}>
                          {h.abw}g
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          ~{h.countPerKg} Count / kg
                        </div>
                      </td>

                      {/* 4. Shrimp Count */}
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <span style={{ fontWeight: '800', color: '#0284C7', fontSize: '13.5px' }}>
                          {h.count.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>pcs</span>
                      </td>

                      {/* 5. Biomass */}
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <span style={{ fontWeight: '800', color: '#1A2FB8', fontSize: '14px' }}>
                          {h.biomass.toLocaleString()} kg
                        </span>
                        <span style={{ fontSize: '10.5px', color: '#64748B', display: 'block' }}>
                          ({biomassPct}% of cycle)
                        </span>
                      </td>

                      {/* 6. Feed Consumed */}
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        <span style={{ fontWeight: '700', color: '#475569', fontSize: '13px' }}>
                          {h.stageFeed.toLocaleString()} kg
                        </span>
                      </td>

                      {/* 7. FCR */}
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={styles.fcrPill}>
                          {h.stageFcr}
                        </span>
                      </td>

                      {/* 8. Buyer & Remarks */}
                      <td style={{ ...styles.td, maxWidth: '220px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0F172A' }}>
                          {h.buyer}
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.35, display: 'block', marginTop: '2px' }}>
                          {h.remarks}
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {/* ACTIVE STANDING CROP ROW IN TABLE (When cycle is not final harvested) */}
                {!isFinalHarvested && (
                  <tr style={{ ...styles.tr, backgroundColor: '#F8FAFC' }}>
                    <td style={styles.td}>
                      <span style={styles.standingPondBadge}>
                        <Clock size={11} /> Standing Crop in Tank
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: '700', color: '#0F172A', fontSize: '13px' }}>Present Active</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>Day {doc} DOC</div>
                    </td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: '800', color: '#16A34A', fontSize: '13.5px' }}>
                        {presentABW}g
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>
                        ~{Math.round(1000 / presentABW)} Count / kg
                      </div>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <span style={{ fontWeight: '800', color: '#0284C7', fontSize: '13.5px' }}>
                        ~{estimatedRemainingShrimp.toLocaleString()}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748B', display: 'block' }}>pcs (est.)</span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <span style={{ fontWeight: '800', color: '#1A2FB8', fontSize: '14px' }}>
                        {presentBiomassKg.toLocaleString()} kg
                      </span>
                      <span style={{ fontSize: '10.5px', color: '#16A34A', display: 'block', fontWeight: '700' }}>
                        (Active in Tank)
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <span style={{ fontWeight: '700', color: '#475569', fontSize: '13px' }}>
                        ~{Math.round(presentBiomassKg * presentFCR).toLocaleString()} kg
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      <span style={{ ...styles.fcrPill, backgroundColor: '#EFF6FF', color: '#1A2FB8' }}>
                        {presentFCR}
                      </span>
                    </td>
                    <td style={{ ...styles.td, maxWidth: '220px' }}>
                      <span style={{ fontSize: '11.5px', color: '#059669', fontWeight: '700', display: 'block' }}>
                        ⚡ Final Harvest Forecast: Day 90-100 DOC (~30g Target)
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>

              {/* TOTALS FOOTER ROW */}
              <tfoot>
                <tr style={styles.tfootRow}>
                  <td colSpan="3" style={{ ...styles.tfTd, fontWeight: '800', color: '#0F172A' }}>
                    {isFinalHarvested ? 'TOTAL FINAL HARVESTED CROP:' : 'CUMULATIVE CROP SUMMARY (REALIZED + STANDING):'}
                  </td>
                  <td style={{ ...styles.tfTd, textAlign: 'right', fontWeight: '800', color: '#0284C7', fontSize: '14px' }}>
                    {totalCropShrimp.toLocaleString()} pcs
                  </td>
                  <td style={{ ...styles.tfTd, textAlign: 'right', fontWeight: '800', color: '#1A2FB8', fontSize: '15px' }}>
                    {totalCropBiomass.toLocaleString()} kg
                  </td>
                  <td style={{ ...styles.tfTd, textAlign: 'right', fontWeight: '800', color: '#475569', fontSize: '14px' }}>
                    {Math.round(totalFeedUsedForHarvested + (isFinalHarvested ? 0 : presentBiomassKg * presentFCR)).toLocaleString()} kg
                  </td>
                  <td style={{ ...styles.tfTd, textAlign: 'center' }}>
                    <span style={{ ...styles.fcrPill, backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: '800' }}>
                      {overallFCR} FCR
                    </span>
                  </td>
                  <td style={{ ...styles.tfTd, fontSize: '11.5px', color: isFinalHarvested ? '#16A34A' : '#D97706', fontWeight: '700' }}>
                    {isFinalHarvested ? '✓ Cycle Closed' : '🟡 Active Culture'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. FOOTER ACTIONS */}
        {/* ========================================================= */}
        <div style={styles.modalFooter}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748B' }}>
            <Calendar size={14} /> Stocked on {stockingDate} • Current Day {doc} DOC
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={styles.printBtn}
              className="transition-all duration-150 active:scale-95 cursor-pointer"
            >
              <Printer size={14} />
              <span>Print Harvest Report</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              style={styles.closeModalBtn}
              className="transition-all duration-150 active:scale-95 cursor-pointer"
            >
              Close Report
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const styles = {
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(5px)',
    zIndex: 99999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '24px 16px',
    boxSizing: 'border-box',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    padding: '24px',
    width: '100%',
    maxWidth: '960px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
    border: '1px solid #E2E8F0',
    boxSizing: 'border-box',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '16px',
    borderBottom: '1px solid #F1F5F9',
    gap: '12px',
  },
  headerIconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  headerSub: {
    fontSize: '12.5px',
    color: '#64748B',
    margin: '4px 0 0 0',
  },
  completedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  activeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid #FDE68A',
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#F1F5F9',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748B',
    flexShrink: 0,
  },
  presentCropContainer: {
    backgroundColor: '#F8FAFC',
    border: '1.5px solid #DBEAFE',
    borderRadius: '12px',
    padding: '16px 18px',
    marginTop: '16px',
  },
  livePulseDot: {
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    backgroundColor: '#16A34A',
    boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.2)',
  },
  presentPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    fontSize: '10.5px',
    fontWeight: '700',
    padding: '2px 7px',
    borderRadius: '5px',
    border: '1px solid #DBEAFE',
  },
  presentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '12px',
    marginTop: '8px',
  },
  presentTile: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  presentLabel: {
    fontSize: '10.5px',
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: '0.3px',
  },
  presentVal: {
    fontSize: '17px',
    fontWeight: '800',
  },
  presentSub: {
    fontSize: '11px',
    color: '#64748B',
  },
  kpiContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginTop: '16px',
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  kpiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#64748B',
  },
  kpiValue: {
    fontSize: '20px',
    fontWeight: '800',
  },
  kpiUnit: {
    fontSize: '13px',
    fontWeight: '600',
  },
  kpiSub: {
    fontSize: '11px',
    color: '#64748B',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '18px 20px',
    marginTop: '16px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '10px',
    borderBottom: '1px solid #F1F5F9',
  },
  sectionTitle: {
    fontSize: '14.5px',
    fontWeight: '800',
    color: '#0F172A',
    margin: 0,
  },
  verifiedTag: {
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#16A34A',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    backgroundColor: '#F8FAFC',
    borderBottom: '2px solid #E2E8F0',
  },
  th: {
    padding: '10px 12px',
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  tr: {
    borderBottom: '1px solid #F1F5F9',
  },
  td: {
    padding: '12px',
    verticalAlign: 'middle',
  },
  partialBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    backgroundColor: '#EFF6FF',
    color: '#1A2FB8',
    fontSize: '11px',
    fontWeight: '800',
    padding: '3px 8px',
    borderRadius: '5px',
    border: '1px solid #DBEAFE',
  },
  finalBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontSize: '11px',
    fontWeight: '800',
    padding: '3px 8px',
    borderRadius: '5px',
    border: '1px solid #BBF7D0',
  },
  standingPondBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    fontSize: '11px',
    fontWeight: '800',
    padding: '3px 8px',
    borderRadius: '5px',
    border: '1px solid #FDE68A',
  },
  fcrPill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3px 8px',
    borderRadius: '6px',
    backgroundColor: '#F1F5F9',
    color: '#0F172A',
    fontSize: '12px',
    fontWeight: '700',
  },
  tfootRow: {
    backgroundColor: '#F8FAFC',
    borderTop: '2px solid #E2E8F0',
  },
  tfTd: {
    padding: '12px',
    verticalAlign: 'middle',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #F1F5F9',
    flexWrap: 'wrap',
    gap: '12px',
  },
  printBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
    borderRadius: '8px',
    backgroundColor: '#F1F5F9',
    border: '1px solid #CBD5E1',
    color: '#334155',
    fontSize: '13px',
    fontWeight: '700',
  },
  closeModalBtn: {
    padding: '8px 18px',
    borderRadius: '8px',
    backgroundColor: '#1A2FB8',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '13px',
    fontWeight: '700',
  }
};

export default HarvestCompletedModal;
