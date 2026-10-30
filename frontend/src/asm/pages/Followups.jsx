import React from 'react';
import InchargeHeader from '../components/InchargeHeader';
import { getInchargeSession } from '../utils/inchargeAuth';
import WeeklyComplianceFollowup from '../../components/WeeklyComplianceFollowup';

/**
 * Area Sales Manager (ASM) / Incharge Follow-ups Page
 * Dedicated full-view routine 7-day pond water test compliance monitor,
 * supervisor directives, and audit thread histories for the assigned territory.
 */
const Followups = () => {
  const session = getInchargeSession();
  const inchargeId = session?.inchargeId || session?.id || 'INC001';

  return (
    <div>
      <InchargeHeader title="Weekly Testing Compliance & Follow-ups" showBack={false} />
      <div className="content-inner" style={{ padding: 'clamp(12px, 3vw, 24px)' }}>
        <WeeklyComplianceFollowup
          portalType="ASM"
          inchargeId={inchargeId}
          variant="full"
          style={{ margin: 0 }}
        />
      </div>
    </div>
  );
};

export default Followups;
