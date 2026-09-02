import React, { useState } from 'react';
import { getAdminSession } from '../utils/adminAuth';
import { Bell, Search, LogOut, User, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../../assets/new_logo_v2.png';
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {onToggleSidebar && (
          <button
            type="button"
            className="flex lg:hidden items-center justify-center w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer border border-slate-200"
            onClick={onToggleSidebar}
            aria-label="Open Admin Menu"
          >
            <Menu size={20} color="#1e293b" />
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

          <div className="hidden sm:flex flex-col">
            <div style={styles.brandTitle}>
              ROYAL'S MARINE FOOD
            </div>

            <div style={styles.brandSubtitle}>
              Aqua Field &amp; Feed Performance Platform
            </div>
          </div>
        </div>
      </div>

      {/* CENTER - SEARCH */}
      <div className="hidden md:flex relative flex-1 max-w-md mx-4">
        <div style={styles.searchBar} className="w-full">
          <Search
            size={17}
            color="#94a3b8"
            style={{ flexShrink: 0 }}
          />

          <input
            type="text"
            placeholder="Search Farmer, Tank ID, Agent, Phone..."
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
            >
              ×
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
          <Bell size={20} color="#475569" />
          <span style={styles.redDot} />
        </div>

        {/* ADMIN BADGE */}
        <div style={styles.adminBadge}>
          ADMIN
        </div>

        {/* PROFILE */}
        <div style={styles.profileWrapper}>
          <div
            style={styles.profileButton}
            onClick={() =>
              setShowProfileMenu(!showProfileMenu)
            }
          >
            <div style={styles.avatar}>R</div>

            <span style={styles.profileName}>
              {session?.name
                ? session.name
                : 'Royal Marine A...'}
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
                <User size={16} />
                System Settings
              </button>

              <button
                type="button"
                style={{
                  ...styles.profileMenuItem,
                  color: '#dc2626',
                  borderTop: '1px solid #f1f5f9',
                }}
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Sign Out
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
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '10px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    height: '68px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    flexShrink: 0,
  },

  logo: {
    height: '56px',
    objectFit: 'contain',
  },

  brandText: {
    display: 'flex',
    flexDirection: 'column',
  },

  brandTitle: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#173873',
    letterSpacing: '0.4px',
    lineHeight: '1.2',
  },

  brandSubtitle: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#0284c7',
    letterSpacing: '0.2px',
    lineHeight: '1.2',
    marginTop: '2px',
  },

  searchWrapper: {
    position: 'relative',
    flex: '0 1 440px',
    margin: '0 20px',
  },

  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '8px 14px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },

  searchInput: {
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    width: '100%',
    fontSize: '13.5px',
    color: '#1e293b',
    fontFamily: 'inherit',
  },

  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '16px',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  },

  searchDropdown: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    boxShadow:
      '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    maxHeight: '340px',
    overflowY: 'auto',
  },

  dropdownSection: {
    padding: '6px 0',
    borderBottom: '1px solid #f1f5f9',
  },

  dropdownSectionHeader: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#94a3b8',
    padding: '4px 14px',
    letterSpacing: '0.5px',
  },

  dropdownItem: {
    padding: '8px 14px',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
  },

  itemTitle: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: '#0f172a',
  },

  itemSub: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px',
  },

  noResults: {
    padding: '14px',
    fontSize: '13px',
    color: '#64748b',
    textAlign: 'center',
  },

  rightControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexShrink: 0,
  },

  bellContainer: {
    position: 'relative',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#f8fafc',
    border: '1px solid #f1f5f9',
  },

  redDot: {
    position: 'absolute',
    top: '6px',
    right: '7px',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#ef4444',
    border: '1.5px solid #ffffff',
  },

  adminBadge: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.8px',
    padding: '4px 12px',
    borderRadius: '9999px',
    border: '1px solid #fde68a',
  },

  profileWrapper: {
    position: 'relative',
  },

  profileButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    padding: '4px 8px 4px 4px',
    borderRadius: '24px',
  },

  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '15px',
    boxShadow: '0 1px 3px rgba(29, 78, 216, 0.3)',
  },

  profileName: {
    fontSize: '13.5px',
    fontWeight: 600,
    color: '#1e293b',
    maxWidth: '130px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  profileDropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    width: '210px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    overflow: 'hidden',
  },

  profileMenuHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc',
  },

  profileHeaderName: {
    fontWeight: 700,
    color: '#0f172a',
    fontSize: '14px',
  },

  profileHeaderId: {
    fontSize: '12px',
    color: '#64748b',
  },

  profileMenuItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    background: 'none',
    border: 'none',
    fontSize: '13px',
    fontWeight: 500,
    color: '#334155',
    cursor: 'pointer',
    textAlign: 'left',
  },
};

export default AdminHeader;