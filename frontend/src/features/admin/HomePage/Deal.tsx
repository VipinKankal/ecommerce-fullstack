import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import DealTable from './DealTable';
import DealCategoryTable from './DealCategoryTable';
import CreateDealTable from './CreateDealTable';

const Deal = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h4"
        sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}
      >
        Deals Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="deal management tabs"
        >
          <Tab label="Active Deals" sx={{ fontWeight: 'bold' }} />
          <Tab label="Deal Categories" sx={{ fontWeight: 'bold' }} />
          <Tab label="Create New Deal" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Box>

      <Box>
        {activeTab === 0 && <DealTable />}
        {activeTab === 1 && <DealCategoryTable />}
        {activeTab === 2 && <CreateDealTable />}
      </Box>
    </Box>
  );
};

export default Deal;
