import React from 'react';
import { Droplets } from 'lucide-react';
import topnavlogo from '../assets/topnavlogo.png';

const MarineLoader = ({ message = 'Synchronizing Field Data...', size = 'default' }) => {
  const isCompact = size === 'compact';

  return (
    <div className={`marine-loader-container ${isCompact ? 'compact' : ''}`}>
      <style>{`
        .marine-loader-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          position: relative;
          user-select: none;
        }

        .marine-loader-container.compact {
          padding: 12px 8px;
        }

        .marine-sonar-box {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .compact .marine-sonar-box {
          width: 48px;
          height: 48px;
        }

        /* Sonar Ripple Rings */
        .sonar-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid #0018AD;
          opacity: 0;
          animation: sonarRipple 2s cubic-bezier(0.1, 0.2, 0.3, 1) infinite;
        }

        .sonar-ring:nth-child(2) {
          animation-delay: 0.6s;
          border-color: #0EA5E9;
        }

        .sonar-ring:nth-child(3) {
          animation-delay: 1.2s;
          border-color: #38BDF8;
        }

        @keyframes sonarRipple {
          0% {
            transform: scale(0.6);
            opacity: 0.8;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: scale(1.9);
            opacity: 0;
          }
        }

        /* Marine Center Orb with Liquid Wave Fill */
        .marine-center-orb {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0018AD 0%, #0A1128 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 2;
          box-shadow: 0 4px 16px rgba(0, 24, 173, 0.35);
          overflow: hidden;
        }

        .compact .marine-center-orb {
          width: 36px;
          height: 36px;
        }

        /* Water Liquid Wave inside Orb */
        .marine-liquid-wave {
          position: absolute;
          width: 200%;
          height: 200%;
          background: rgba(14, 165, 233, 0.35);
          top: 35%;
          left: -50%;
          border-radius: 40%;
          animation: liquidWaveSpin 3s linear infinite;
        }

        @keyframes liquidWaveSpin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        /* Rising Water Bubbles */
        .bubble-particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: #38BDF8;
          border-radius: 50%;
          opacity: 0;
          animation: bubbleRise 1.8s ease-in infinite;
        }

        .bubble-particle:nth-child(1) { left: 40%; animation-delay: 0.2s; }
        .bubble-particle:nth-child(2) { left: 60%; animation-delay: 0.7s; }
        .bubble-particle:nth-child(3) { left: 50%; animation-delay: 1.1s; }

        @keyframes bubbleRise {
          0% {
            transform: translateY(20px) scale(0.6);
            opacity: 0;
          }
          50% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(-25px) scale(1.2);
            opacity: 0;
          }
        }

        .marine-loader-text {
          margin-top: 14px;
          font-size: 13px;
          font-weight: 700;
          color: #0018AD;
          letter-spacing: 0.3px;
          text-align: center;
          animation: marinePulse 1.6s ease-in-out infinite alternate;
        }

        @keyframes marinePulse {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }

        .marine-loader-sub {
          font-size: 11px;
          color: #64748B;
          margin-top: 2px;
        }
      `}</style>

      <div className="marine-sonar-box">
        <div className="sonar-ring" />
        <div className="sonar-ring" />
        <div className="sonar-ring" />

        <div className="marine-center-orb">
          <div className="marine-liquid-wave" />
          <div className="bubble-particle" />
          <div className="bubble-particle" />
          <div className="bubble-particle" />
          <Droplets size={isCompact ? 16 : 22} color="#FFFFFF" style={{ position: 'relative', zIndex: 3 }} />
        </div>
      </div>

      {!isCompact && (
        <>
          <div className="marine-loader-text">{message}</div>
          <div className="marine-loader-sub">Royals Marine Field Network</div>
        </>
      )}
    </div>
  );
};

export default MarineLoader;
