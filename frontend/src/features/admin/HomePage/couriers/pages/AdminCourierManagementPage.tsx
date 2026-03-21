import React from 'react';
import { Alert, Button, Paper, Tab, Tabs, Typography } from '@mui/material';
import {
  AdminCourierProfileDialog,
  AdminCourierTrackingDialog,
} from '../components/AdminCourierDialogs';
import {
  AdminCourierCodSection,
  AdminCourierCouriersSection,
  AdminCourierDispatchSection,
  AdminCourierOrdersSection,
  AdminCourierOverviewSection,
  AdminCourierPayrollSection,
} from '../components/AdminCourierSections';
import { useAdminCourierManagement } from '../hooks/useAdminCourierManagement';

const AdminCourierManagementPage = () => {
  const {
    activeTab,
    busy,
    closeProfile,
    closeTracking,
    codCollections,
    codFrequency,
    couriers,
    dispatchQueue,
    earnings,
    error,
    handleBatchAssign,
    handleCodSettlementUpdate,
    handleCourierStatus,
    handleCreateCourier,
    handleFetchEarnings,
    handleLockPayroll,
    handleMarkPayout,
    handleOpenProfile,
    handleOpenTracking,
    handlePetrolClaimUpdate,
    handleRunPayroll,
    handleSalaryUpdate,
    loadWorkspace,
    month,
    newCourier,
    orders,
    overview,
    payrollRows,
    petrolClaims,
    petrolNotes,
    profileOpen,
    salaryConfig,
    selectedCourier,
    selectedCourierId,
    selectedDispatchIds,
    selectedOrderTracking,
    setActiveTab,
    setCodFrequency,
    setMonth,
    setNewCourier,
    setPetrolNotes,
    setSalaryConfig,
    setSelectedCourierId,
    setStatusUpdate,
    statusUpdate,
    toggleDispatchSelection,
    trackingOpen,
  } = useAdminCourierManagement();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Courier Operations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            End-to-end command center for courier onboarding, dispatch, COD
            settlement and payroll.
          </Typography>
        </div>
        <Button variant="outlined" onClick={loadWorkspace} disabled={busy}>
          Refresh Workspace
        </Button>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper className="rounded-3xl border border-slate-200 shadow-none overflow-hidden">
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="overview" label="Overview" />
          <Tab value="couriers" label="Couriers" />
          <Tab value="orders" label="Orders" />
          <Tab value="dispatch" label="Dispatch" />
          <Tab value="cod" label="COD & Petrol" />
          <Tab value="payroll" label="Salary" />
        </Tabs>
      </Paper>

      {activeTab === 'overview' && (
        <AdminCourierOverviewSection
          overview={overview}
          selectedCourier={selectedCourier}
        />
      )}
      {activeTab === 'couriers' && (
        <AdminCourierCouriersSection
          codFrequency={codFrequency}
          couriers={couriers}
          newCourier={newCourier}
          onCreateCourier={handleCreateCourier}
          onOpenProfile={handleOpenProfile}
          onSaveControls={handleCourierStatus}
          onUpdateSalary={handleSalaryUpdate}
          salaryConfig={salaryConfig}
          selectedCourierId={selectedCourierId}
          setCodFrequency={setCodFrequency}
          setNewCourier={setNewCourier}
          setSalaryConfig={setSalaryConfig}
          setSelectedCourierId={setSelectedCourierId}
          setStatusUpdate={setStatusUpdate}
          statusUpdate={statusUpdate}
        />
      )}
      {activeTab === 'orders' && (
        <AdminCourierOrdersSection
          orders={orders}
          onOpenTracking={handleOpenTracking}
        />
      )}
      {activeTab === 'dispatch' && (
        <AdminCourierDispatchSection
          couriers={couriers}
          dispatchQueue={dispatchQueue}
          onBatchAssign={handleBatchAssign}
          selectedCourierId={selectedCourierId}
          selectedDispatchIds={selectedDispatchIds}
          setSelectedCourierId={setSelectedCourierId}
          toggleDispatchSelection={toggleDispatchSelection}
        />
      )}
      {activeTab === 'cod' && (
        <AdminCourierCodSection
          codCollections={codCollections}
          onCodSettlementUpdate={handleCodSettlementUpdate}
          onPetrolClaimUpdate={handlePetrolClaimUpdate}
          petrolClaims={petrolClaims}
          petrolNotes={petrolNotes}
          setPetrolNotes={setPetrolNotes}
        />
      )}
      {activeTab === 'payroll' && (
        <AdminCourierPayrollSection
          earnings={earnings}
          month={month}
          onFetchEarnings={handleFetchEarnings}
          onLockPayroll={handleLockPayroll}
          onMarkPayout={handleMarkPayout}
          onRunPayroll={handleRunPayroll}
          payrollRows={payrollRows}
          selectedCourierId={selectedCourierId}
          setMonth={setMonth}
        />
      )}

      <AdminCourierTrackingDialog
        open={trackingOpen}
        onClose={closeTracking}
        selectedOrderTracking={selectedOrderTracking}
      />
      <AdminCourierProfileDialog
        open={profileOpen}
        onClose={closeProfile}
        selectedCourier={selectedCourier}
      />
    </div>
  );
};

export default AdminCourierManagementPage;
