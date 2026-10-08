import React from 'react';
import SubmissionLocationMap from './SubmissionLocationMap';

/**
 * GPSRouteTracking wrapper
 * Displays the real-time submission location map with live MySQL data and interactive Leaflet map.
 */
const GPSRouteTracking = () => {
  return <SubmissionLocationMap />;
};

export default GPSRouteTracking;
