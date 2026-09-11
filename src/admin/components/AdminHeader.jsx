import React, { useState } from 'react';
import { getAdminSession } from '../utils/adminAuth';
import { Bell, Search, LogOut, User, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../../assets/topnavlogo.png';
import { useMockData } from '../../context/MockDataContext';

const AdminHeader = ({ onToggleSidebar }) => {
  const session = getAdminSession();
  const navigate = useNavigate();
  const mockData = useMockData();

  const [searchTerm, setSearchTerm] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('admin_auth_session');
    navigate('/admin-login');
  };

  // Search logic across farmers, tanks, and agents
  const db = mockData?.db;

  const filteredFarmers =
    db?.farmers
      ?.filter(
        (f) =>
          f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.phone?.includes(searchTerm) ||
          f.id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 3) || [];

  const filteredTanks =
    db?.tanks
      ?.filter(
        (t) =>
          t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 3) || [];

  const filteredAgents =
    db?.agents
      ?.filter(
        (a) =>
          a.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.locality?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 3) || [];

  const hasResults =
    searchTerm.trim().length > 0 &&
    (filteredFarmers.length > 0 ||
      filteredTanks.length > 0 ||
      filteredAgents.length > 0);

  const clearSearch = () => {
    setSearchTerm('');
    setShowSearchResults(false);
  };

  return (
    <header style={styles.header}>
      {/* LEFT - BRAND & HAMBURGER */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onToggleSidebar && (
          <button
            type="button"
            className="flex lg:hidden items-center justify-center w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer border border-slate-200 transition-colors"
            onClick={onToggleSidebar}
            aria-label="Open Admin Menu"
          >
            <Menu size={18} color="#0F172A" />
          </button>
        )}

        <div
          style={styles.brand}
          onClick={() => navigate('/admin/dashboard')}
        >
          <img
            src={logoImg}
            alt="Royal's Marine Logo"
            style={styles.logo}
          />
        </div>
      </div>

      {/* CENTER - SEARCH */}
      <div className="hidden md:flex relative flex-1 max-w-lg mx-6">
        <div style={styles.searchBar} className="w-full">
          <Search
            size={18}
            color="#64748B"
            style={{ flexShrink: 0 }}
          />

          <input
            type="text"
            placeholder="Search Farmer, Tank, Agent..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            style={styles.searchInput}
          />

          {searchTerm && (
            <button
              onClick={clearSearch}
              style={styles.clearBtn}
              type="button"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* SEARCH DROPDOWN */}
        {showSearchResults && searchTerm.trim().length > 0 && (
          <div style={styles.searchDropdown}>
            {hasResults ? (
              <>
                {/* FARMERS */}
                {filteredFarmers.length > 0 && (
                  <div style={styles.dropdownSection}>
                    <div style={styles.dropdownSectionHeader}>
                      Farmers
                    </div>

                    {filteredFarmers.map((farmer) => (
                      <div
                        key={farmer.id}
                        style={styles.dropdownItem}
                        onClick={() => {
                          navigate(`/admin/farmers/${farmer.id}`);
                          clearSearch();
                        }}
                      >
                        <span style={styles.itemTitle}>
                          {farmer.name}
                        </span>
                        <span style={styles.itemSub}>
                          {farmer.phone} • {farmer.location}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* TANKS */}
                {filteredTanks.length > 0 && (
                  <div style={styles.dropdownSection}>
                    <div style={styles.dropdownSectionHeader}>
                      Tanks
                    </div>

                    {filteredTanks.map((tank) => (
                      <div
                        key={tank.id}
                        style={styles.dropdownItem}
                        onClick={() => {
                          navigate(`/admin/tanks/${tank.id}`);
                          clearSearch();
                        }}
                      >
                        <span style={styles.itemTitle}>
                          {tank.name} ({tank.id})
                        </span>
                        <span style={styles.itemSub}>
                          ABW: {tank.abw} • Status: {tank.testStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* AGENTS */}
                {filteredAgents.length > 0 && (
                  <div style={styles.dropdownSection}>
                    <div style={styles.dropdownSectionHeader}>
                      Agents
                    </div>

                    {filteredAgents.map((agent) => (
                      <div
                        key={agent.id}
                        style={styles.dropdownItem}
                        onClick={() => {
                          navigate(`/admin/agents/${agent.id}`);
                          clearSearch();
                        }}
                      >
                        <span style={styles.itemTitle}>
                          {agent.name}
                        </span>
                        <span style={styles.itemSub}>
                          {agent.locality}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div style={styles.noResults}>
                No records found for "{searchTerm}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT CONTROLS */}
      <div style={styles.rightControls}>
        {/* NOTIFICATION */}
        <div
          style={styles.bellContainer}
          title="3 Overdue test alerts"
        >
          <Bell size={18} color="#475569" />
          <span style={styles.redDot} />
        </div>



        {/* PROFILE */}
        <div style={styles.profileWrapper}>
          <div
            style={styles.profileButton}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div style={styles.avatar}>
              <User size={16} color="#FFFFFF" />
            </div>

            <span style={styles.profileName}>
              {session?.name ? session.name : 'Royal Marine Admin'}
            </span>
          </div>

          {/* PROFILE DROPDOWN */}
          {showProfileMenu && (
            <div style={styles.profileDropdown}>
              <div style={styles.profileMenuHeader}>
                <div style={styles.profileHeaderName}>
                  {session?.name || 'Royal Marine Admin'}
                </div>
                <div style={styles.profileHeaderId}>
                  {session?.id || 'admin@royalsmarine.com'}
                </div>
              </div>

              <button
                type="button"
                style={styles.profileMenuItem}
                onClick={() => {
                  navigate('/admin/settings');
                  setShowProfileMenu(false);
                }}
              >
                <User size={15} color="#64748B" />
                <span>System Settings</span>
              </button>

              <button
                type="button"
                style={{
                  ...styles.profileMenuItem,
                  color: '#DC2626',
                  borderTop: '1px solid #F1F5F9',
                }}
                onClick={handleLogout}
              >
                <LogOut size={15} color="#DC2626" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const styles = {
  header: {
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    height: '64px',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
    fontFamily: 'Inter, system-ui, sans-serif'
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    flexShrink: 0,
  },

  logo: {
    height: '46px',
    maxHeight: '48px',
    width: 'auto',
    objectFit: 'contain',
    display: 'block',
  },



  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    padding: '0 14px',
    height: '44px',
    transition: 'all 0.15s ease',
  },

  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    fontSize: '13px',
    fontWeight: 500,
    color: '#0F172A',
    fontFamily: 'inherit',
  },

  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#64748B',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
  },

  searchDropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
    zIndex: 1000,
    maxHeight: '340px',
    overflowY: 'auto',
  },

  dropdownSection: {
    padding: '6px 0',
    borderBottom: '1px solid #F1F5F9',
  },

  dropdownSectionHeader: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#94A3B8',
    padding: '6px 14px 4px',
    letterSpacing: '0.5px',
  },

  dropdownItem: {
    padding: '8px 14px',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    transition: 'background-color 0.12s ease',
  },

  itemTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0F172A',
  },

  itemSub: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
  },

  noResults: {
    padding: '16px',
    fontSize: '13px',
    color: '#64748B',
    textAlign: 'center',
  },

  rightControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0,
  },

  bellContainer: {
    position: 'relative',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #E2E8F0',
    transition: 'background-color 0.15s ease',
  },

  redDot: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#DC2626',
    border: '1.5px solid #FFFFFF',
  },



  profileWrapper: {
    position: 'relative',
  },

  profileButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    padding: '4px 10px 4px 4px',
    borderRadius: '10px',
    border: '1px solid #E2E8F0',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.15s ease',
  },

  avatar: {
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '13px',
  },

  profileName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0F172A',
    maxWidth: '130px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  profileDropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    width: '210px',
    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
    zIndex: 1000,
    overflow: 'hidden',
  },

  profileMenuHeader: {
    padding: '12px 14px',
    borderBottom: '1px solid #F1F5F9',
    backgroundColor: '#F8FAFC',
  },

  profileHeaderName: {
    fontWeight: 600,
    color: '#0F172A',
    fontSize: '13px',
  },

  profileHeaderId: {
    fontSize: '11px',
    color: '#64748B',
    marginTop: '2px',
  },

  profileMenuItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: 'none',
    border: 'none',
    fontSize: '13px',
    fontWeight: 500,
    color: '#0F172A',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.12s ease',
  },
};

export default AdminHeader;