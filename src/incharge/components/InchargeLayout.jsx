import React from 'react';
import InchargeSidebar from './InchargeSidebar';

const InchargeLayout = ({ children }) => {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--color-bg-main)',
      overflow: 'hidden'
    }}>
      <InchargeSidebar />
      <div style={{
        marginLeft: '260px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* We'll render the header within the page components to pass the correct title easily, 
            or we can render it here and pass title via context/props. Let's render it in the pages for simplicity. */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default InchargeLayout;
