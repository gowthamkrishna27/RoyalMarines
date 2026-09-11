import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Check, AlertTriangle, 
  ChevronRight, X 
} from 'lucide-react';
import { useMockData } from '../../context/MockDataContext';
import { getSession } from '../utils/agentAuth';

const Farmers = () => {
  const navigate = useNavigate();
  const session = getSession();
  const { db, getFarmersByAgentId, getTanksByFarmerId } = useMockData();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL');

  const agentId = session?.agentId || 'agent001';
  const assignedFarmers = getFarmersByAgentId ? getFarmersByAgentId(agentId) : (db?.farmers || []);

  const farmerItems = assignedFarmers.map((farmer) => {
    const tanks = getTanksByFarmerId ? getTanksByFarmerId(farmer.id) : (db?.tanks || []).filter(t => t.farmerId === farmer.id);
    const hasPendingTest = tanks.some(p => p.testStatus === 'Pending' || p.testStatus === 'Overdue');

    return {
      ...farmer,
      tankCount: tanks.length || parseInt(farmer.numberOfTanks) || 1,
      villageName: farmer.village || farmer.location || 'Chinnamiram',
      testStatus: hasPendingTest ? 'Test Due' : 'Up to date',
      isDue: hasPendingTest,
    };
  });

  const dueCount = farmerItems.filter(f => f.isDue).length;
  const upToDateCount = farmerItems.filter(f => !f.isDue).length;

  const filteredFarmers = farmerItems.filter(f => {
    if (filterMode === 'DUE' && !f.isDue) return false;
    if (filterMode === 'UP_TO_DATE' && f.isDue) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        (f.villageName || '').toLowerCase().includes(q) ||
        (f.phone || '').includes(q)
      );
    }
    return true;
  });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.headerTitle}>My Farmers</h1>
        </div>

        <button 
          type="button"
          className="transition-all duration-150 active:scale-95 cursor-pointer"
          style={styles.addFarmerBtn}
          onClick={() => navigate('/add-farmer')}
        >
          <Plus size={16} strokeWidth={2.8} />
          <span>Add Farmer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div style={styles.searchBox}>
        <Search size={16} color="#94A3B8" />
        <input
          type="text"
          placeholder="Search farmers, tanks, or village..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        {searchQuery && (
          <button style={styles.clearBtn} onClick={() => setSearchQuery('')} type="button">
            <X size={14} color="#94A3B8" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div style={styles.filterTabs}>
        <button
          type="button"
          style={{
            ...styles.tabBtn,
            backgroundColor: filterMode === 'ALL' ? '#0018AD' : '#FFFFFF',
            color: filterMode === 'ALL' ? '#FFFFFF' : '#334155',
            borderColor: filterMode === 'ALL' ? '#0018AD' : '#E2E8F0',
            fontWeight: filterMode === 'ALL' ? '700' : '600',
          }}
          onClick={() => setFilterMode('ALL')}
        >
          All ({farmerItems.length})
        </button>

        <button
          type="button"
          style={{
            ...styles.tabBtn,
            backgroundColor: filterMode === 'DUE' ? '#D97706' : '#FFFFFF',
            color: filterMode === 'DUE' ? '#FFFFFF' : '#334155',
            borderColor: filterMode === 'DUE' ? '#D97706' : '#E2E8F0',
            fontWeight: filterMode === 'DUE' ? '700' : '600',
          }}
          onClick={() => setFilterMode('DUE')}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <AlertTriangle size={13} color={filterMode === 'DUE' ? '#FFFFFF' : '#D97706'} />
            Test Due ({dueCount})
          </span>
        </button>

        <button
          type="button"
          style={{
            ...styles.tabBtn,
            backgroundColor: filterMode === 'UP_TO_DATE' ? '#16A34A' : '#FFFFFF',
            color: filterMode === 'UP_TO_DATE' ? '#FFFFFF' : '#334155',
            borderColor: filterMode === 'UP_TO_DATE' ? '#16A34A' : '#E2E8F0',
            fontWeight: filterMode === 'UP_TO_DATE' ? '700' : '600',
          }}
          onClick={() => setFilterMode('UP_TO_DATE')}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Check size={13} strokeWidth={3} color={filterMode === 'UP_TO_DATE' ? '#FFFFFF' : '#16A34A'} />
            Up to date ({upToDateCount})
          </span>
        </button>
      </div>

      {/* Farmers List Cards */}
      <div style={styles.farmersList}>
        {filteredFarmers.length === 0 ? (
          <div style={styles.emptyState}>
            <span>No farmers found.</span>
          </div>
        ) : (
          filteredFarmers.map((farmer) => (
            <div
              key={farmer.id}
              style={styles.farmerCard}
              onClick={() => navigate(`/farmers/${farmer.id}`)}
              className="transition-all hover:border-slate-300 active:scale-[0.99] cursor-pointer"
            >
              <div style={styles.cardLeft}>
                <span style={styles.farmerName}>{farmer.name}</span>
                <div style={styles.farmerMeta}>
                  <span>{farmer.tankCount} Tanks</span>
                  <span>•</span>
                  <span>{farmer.villageName}</span>
                </div>
              </div>

              <div style={styles.cardRight}>
                {farmer.isDue ? (
                  <span style={styles.statusDue}>
                    <AlertTriangle size={12} color="#D97706" />
                    <span>Test Due</span>
                  </span>
                ) : (
                  <span style={styles.statusUpToDate}>
                    <Check size={12} strokeWidth={3} color="#16A34A" />
                    <span>Up to date</span>
                  </span>
                )}
                <ChevronRight size={16} color="#94A3B8" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '2px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  headerTag: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0F172A',
    margin: '2px 0 0 0',
  },
  addFarmerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#0018AD',
    color: '#FFFFFF',
    border: 'none',
    minHeight: '38px',
    padding: '0 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 24, 173, 0.25)',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '0 14px',
    minHeight: '44px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    fontSize: '13.5px',
    color: '#0F172A',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#94A3B8',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
  },
  filterTabs: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    paddingBottom: '2px',
  },
  tabBtn: {
    padding: '7px 16px',
    borderRadius: '20px',
    border: '1px solid',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
  },
  farmersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  farmerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '14px 16px',
    border: '1px solid #E2E8F0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  cardLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  farmerName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#0F172A',
  },
  farmerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12.5px',
    color: '#64748B',
  },
  cardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  statusUpToDate: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#16A34A',
    backgroundColor: '#DCFCE7',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  statusDue: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11.5px',
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  emptyState: {
    padding: '30px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '13px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px dashed #CBD5E1',
  },
};

export default Farmers;
