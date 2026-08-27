import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ 
  fallback, 
  label = 'Back', 
  className = '', 
  style = {}, 
  variant = 'default' 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = (e) => {
    e.preventDefault();
    // Check if browser has history state to navigate back
    if (window.history.length > 1 && window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else if (fallback) {
      navigate(fallback);
    } else {
      // Fallback based on current URL path
      const currentPath = location.pathname;
      if (currentPath.startsWith('/admin')) {
        navigate('/admin/dashboard');
      } else if (currentPath.startsWith('/incharge')) {
        navigate('/incharge/dashboard');
      } else if (
        currentPath.startsWith('/agent-login') || 
        currentPath.startsWith('/incharge-login') || 
        currentPath.startsWith('/admin-login')
      ) {
        navigate('/login');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const isLight = variant === 'light';
  const isOutline = variant === 'outline';

  const defaultStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: '600',
    color: isLight ? '#0284c7' : 'var(--color-primary, #003399)',
    backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : isOutline ? 'transparent' : '#e0f2fe',
    border: isLight ? '1px solid #bae6fd' : isOutline ? '1px solid var(--color-border, #cbd5e1)' : '1px solid #bae6fd',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: isLight ? '0 2px 4px rgba(0,0,0,0.06)' : '0 1px 2px rgba(0,0,0,0.04)',
    userSelect: 'none',
    marginRight: '12px',
    ...style
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`back-button ${className}`}
      style={defaultStyle}
      title="Go back to previous page"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateX(-2px)';
        if (!isOutline) {
          e.currentTarget.style.backgroundColor = isLight ? '#ffffff' : '#bae6fd';
        } else {
          e.currentTarget.style.backgroundColor = '#f1f5f9';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateX(0)';
        if (!isOutline) {
          e.currentTarget.style.backgroundColor = isLight ? 'rgba(255, 255, 255, 0.95)' : '#e0f2fe';
        } else {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <ArrowLeft size={16} />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
