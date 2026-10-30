import React from 'react';
import PageHeader from '../components/PageHeader';
import WeeklyComplianceFollowup from '../../components/WeeklyComplianceFollowup';

/**
 * Enterprise Admin Follow-ups Management Page
 * Displays full-width weekly compliance monitoring, due tracking,
 * supervisor directives, and audit follow-up histories across all territories.
 */
const Followups = () => {
  return (
    <>
      <PageHeader
        title="Weekly Testing Compliance & Follow-ups"
        breadcrumbs={[
          { label: 'Admin', active: false },
          { label: 'Follow-ups', active: true }
        ]}
      />
      <div className="content-inner">
        <WeeklyComplianceFollowup
          portalType="ADMIN"
          variant="full"
          style={{ margin: 0 }}
        />
      </div>
    </>
  );
};

export default Followups;
