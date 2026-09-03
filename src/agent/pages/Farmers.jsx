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
      tankCount: tanks.length || parseInt(farmer.numberOfTanks) || 0,
      testStatus: hasPendingTest ? 'Test Due' : 'Up to date',
      isDue: hasPendingTest,
    };
  });

  const filteredFarmers = farmerItems.filter(f => {
    if (filterMode === 'DUE' && !f.isDue) return false;
    if (filterMode === 'UP_TO_DATE' && f.isDue) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        (f.village || f.location || '').toLowerCase().includes(q) ||
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
          <span style={styles.headerTag}>DIRECTORY</span>
          <h1 style={styles.headerTitle}>My Farmers</h1>
        </div>

        <button 
          className="transition-all duration-200 hover:brightness-110 active:scale-95 cursor-pointer"
          style={styles.addFarmerBtn}
          onClick={() => navigate('/add-farmer')}
        >
          <Plus size={15} strokeWidth={2.6} /> Add Farmer
        </button>
      </div>

      {/* Search Input */}
      <div style={styles.searchBox}>
        <Search size={15} color="#64748B" />
        <input
          type="text"
          placeholder="Search farmers, tanks, or village..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
        {searchQuery && (
          <button style={styles.clearBtn} onClick={() => setSearchQuery('')}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={styles.filterTabs}>
        <button
          style={{
            ...styles.tabBtn,
            backgroundColor: filterMode === 'ALL' ? '#0018AD' : '#FFFFFF',
            color: filterMode === 'ALL' ? '#FFFFFF' : '#64748B',
            borderColor: filterMode === 'ALL' ? '#0018AD' : '#CBD5E1',
          }}
          onClick={() => setFilterMode('ALL')}
        >
          All ({farmerItems.length})
        </button>
        <button
          style={{
            ...styles.tabBtn,
            backgroundColor: filterMode === 'DUE' ? '#D97706' : '#FFFFFF',
            color: filterMode === 'DUE' ? '#FFFFFF' : '#64748B',
            borderColor: filterMode === 'DUE' ? '#D97706' : '#CBD5E1',
          }}
          onClick={() => setFilterMode('DUE')}
        >
          ⚠ Test Due ({farmerItems.filter(f => f.isDue).length})
        </button>
        <button
          style={{
            ...styles.tabBtn,
            backgroundColor: filterMode === 'UP_TO_DATE' ? '#16A34A' : '#FFFFFF',
            color: filterMode === 'UP_TO_DATE' ? '#FFFFFF' : '#64748B',
            borderColor: filterMode === 'UP_TO_DATE' ? '#16A34A' : '#CBD5E1',
          }}
          onClick={() => setFilterMode('UP_TO_DATE')}
        >
          ✓ Up to date ({farmerItems.filter(f => !f.isDue).length})
        </button>
      </div>

      {/* Farmers List */}
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
            >
              <div style={styles.cardLeft}>
                <span style={styles.farmerName}>{farmer.name}</span>
                <div style={styles.farmerMeta}>
                  <span>{farmer.tankCount} Tanks</span>
                  <span>•</span>
                  <span>{farmer.village || farmer.location || 'Bhimavaram'}</span>
                </div>
              </div>

              <div style={styles.cardRight}>
                {farmer.isDue ? (
                  <span style={styles.statusDue}>
                    <AlertTriangle size={11} /> Test Due
                  </span>
                ) : (
                  <span style={styles.statusUpToDate}>
                    <Check size={11} strokeWidth={3} /> Up to date
                  </span>
                )}
                <ChevronRight size={15} color="#94A3B8" />
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
    gap: '20px',
    width: '100%',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '4px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  headerTag: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: '0.5px',
  },
  headerTitle: {
    fontSize: 'clamp(18px, 4vw, 22px)',
    fontWeight: '800',
    color: '#0F172A',
    margin: '1px 0 0 0',
  },
  addFarmerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    backgroundColor: '#1A2FB8',
    color: '#FFFFFF',
    border: 'none',
    minHeight: '40px',
    padding: '0 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(26, 47, 184, 0.22)',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    padding: '0 12px',
    minHeight: '42px',
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
    color: '#64748B',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
  },
  filterTabs: {
    display: 'flex',
    gap: '6px',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    paddingBottom: '2px',
  },
  tabBtn: {
    padding: '7px 14px',
    borderRadius: '14px',
    border: '1px solid',
    fontSize: '11.5px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  farmersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  farmerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '12px 14px',
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
    gap: '2px',
  },
  farmerName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0F172A',
  },
  farmerMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#64748B',
  },
  cardRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusUpToDate: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    padding: '2px 7px',
    borderRadius: '6px',
  },
  statusDue: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '3px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    padding: '2px 7px',
    borderRadius: '6px',
  },
  emptyState: {
    padding: '30px',
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: '12px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px dashed #CBD5E1',
  },
};

export default Farmers;
