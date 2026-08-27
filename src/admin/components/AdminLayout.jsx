import React from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

const AdminLayout = ({ children }) => {
  return (
    <div style={styles.layoutContainer}>
      <AdminHeader />
      <div style={styles.bodyWrapper}>
        <AdminSidebar />
        <main style={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
};

const styles = {
  layoutContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#f1f5f9',
    overflow: 'hidden'
  },
  bodyWrapper: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden'
  },
  mainContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px 32px 16px'
  }
};

export default AdminLayout;
