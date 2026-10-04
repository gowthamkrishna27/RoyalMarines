import React from 'react';

const PageHeader = ({ title, breadcrumbs, action }) => {
  return (
    <div style={styles.header}>
      <div>
        <h1 style={styles.title}>{title}</h1>
        {breadcrumbs && (
          <div style={styles.breadcrumbs}>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <span style={{ 
                  color: crumb.active ? '#1d4ed8' : '#64748b', 
                  fontWeight: crumb.active ? 600 : 400 
                }}>
                  {crumb.label}
                </span>
                {idx < breadcrumbs.length - 1 && <span style={{ color: '#cbd5e1' }}>/</span>}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0
  },
  breadcrumbs: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12.5px',
    color: '#64748b',
    marginTop: '4px'
  }
};

export default PageHeader;
