import React from 'react';
import {
  Alert,
  Button,
  Paper,
  Snackbar,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  CourierDeliveryTaskDialog,
  CourierReversePickupDialog,
} from 'features/courier/components/CourierDashboardDialogs';
import {
  CourierCodSection,
  CourierDeliveredSection,
  CourierDeliveriesSection,
  CourierEarningsSection,
  CourierExchangePickupsSection,
  CourierPetrolSection,
  CourierReversePickupsSection,
} from 'features/courier/components/CourierDashboardSections';
import { useCourierDashboard } from 'features/courier/hooks/useCourierDashboard';

const CourierDashboard = () => {
  const {
    activeAssignments,
    activeTab,
    closeReverseTask,
    closeTaskDialog,
    codForm,
    codItems,
    currentReasonOptions,
    deliveredAssignments,
    deliveryAction,
    deliveryForm,
    earnings,
    error,
    handleAcceptReversePickup,
    handleCodDepositSubmit,
    handleDeliveryActionChange,
    handleDeliverySubmit,
    handleOtpInputChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handlePetrolClaimSubmit,
    handleProofUpload,
    handleReceiptUpload,
    handleReversePickupSubmit,
    handleReverseProofUpload,
    handleSendDeliveryOtp,
    handleStartReversePickup,
    isArrivedOrBeyond,
    isConfirmationStep,
    isReversePickupAccepted,
    isReversePickupInProgress,
    loadWorkspace,
    loading,
    month,
    openReverseTask,
    openTask,
    otpCooldownActive,
    otpCooldownSeconds,
    otpError,
    otpLooksEntered,
    otpRefs,
    otpSent,
    otpSlots,
    otpVerified,
    overview,
    petrolClaims,
    petrolForm,
    returnPickupAssignments,
    reversePickupForm,
    safeDeliveryAction,
    safeSelectedReasonValue,
    selectedReverseTask,
    selectedTask,
    setActiveTab,
    setCodForm,
    setDeliveryForm,
    setMonth,
    setPetrolForm,
    setReversePickupForm,
    setToast,
    submittingReversePickup,
    successMessage,
    toast,
    uploadingProof,
    uploadingReceipt,
    uploadingReverseProof,
    verifyingOtp,
  } = useCourierDashboard();

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((current) => ({ ...current, open: false }))}
        >
          {toast.message}
        </Alert>
      </Snackbar>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Courier Workspace
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assigned orders, COD deposits, petrol claims and earnings in one
              flow.
            </Typography>
          </div>
          <Button variant="outlined" onClick={loadWorkspace} disabled={loading}>
            Refresh
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
            <Tab value="deliveries" label="Deliveries" />
            <Tab value="returnPickups" label="Return Pickups" />
            <Tab value="exchangePickups" label="Exchange Pickups" />
            <Tab value="delivered" label="Delivered Orders" />
            <Tab value="cod" label="COD" />
            <Tab value="petrol" label="Petrol" />
            <Tab value="earnings" label="Earnings" />
          </Tabs>
        </Paper>

        {activeTab === 'deliveries' && (
          <CourierDeliveriesSection
            activeAssignments={activeAssignments}
            loading={loading}
            onOpenTask={openTask}
            onRefresh={loadWorkspace}
            overview={overview}
          />
        )}
        {activeTab === 'returnPickups' && (
          <CourierReversePickupsSection
            emptyState="No assigned return pickups right now."
            isReversePickupAccepted={isReversePickupAccepted}
            onOpenTask={openReverseTask}
            tasks={returnPickupAssignments}
            title="Return Pickups"
          />
        )}
        {activeTab === 'exchangePickups' && <CourierExchangePickupsSection />}
        {activeTab === 'delivered' && (
          <CourierDeliveredSection
            deliveredAssignments={deliveredAssignments}
            onOpenTask={openTask}
          />
        )}
        {activeTab === 'cod' && (
          <CourierCodSection
            codForm={codForm}
            codItems={codItems}
            onSubmit={handleCodDepositSubmit}
            setCodForm={setCodForm}
          />
        )}
        {activeTab === 'petrol' && (
          <CourierPetrolSection
            petrolClaims={petrolClaims}
            petrolForm={petrolForm}
            uploadingReceipt={uploadingReceipt}
            onReceiptUpload={handleReceiptUpload}
            onSubmit={handlePetrolClaimSubmit}
            setPetrolForm={setPetrolForm}
          />
        )}
        {activeTab === 'earnings' && (
          <CourierEarningsSection
            earnings={earnings}
            month={month}
            setMonth={setMonth}
          />
        )}
      </div>

      <CourierReversePickupDialog
        open={Boolean(selectedReverseTask)}
        selectedReverseTask={selectedReverseTask}
        reversePickupForm={reversePickupForm}
        setReversePickupForm={setReversePickupForm}
        uploadingReverseProof={uploadingReverseProof}
        submittingReversePickup={submittingReversePickup}
        onClose={closeReverseTask}
        onAccept={handleAcceptReversePickup}
        onStart={handleStartReversePickup}
        onSubmit={handleReversePickupSubmit}
        onProofUpload={handleReverseProofUpload}
        isReversePickupAccepted={isReversePickupAccepted}
        isReversePickupInProgress={isReversePickupInProgress}
      />

      <CourierDeliveryTaskDialog
        open={Boolean(selectedTask)}
        selectedTask={selectedTask}
        deliveryAction={deliveryAction}
        safeDeliveryAction={safeDeliveryAction}
        onDeliveryActionChange={handleDeliveryActionChange}
        isConfirmationStep={isConfirmationStep}
        isArrivedOrBeyond={isArrivedOrBeyond}
        otpSent={otpSent}
        otpVerified={otpVerified}
        otpError={otpError}
        otpLooksEntered={otpLooksEntered}
        otpCooldownActive={otpCooldownActive}
        otpCooldownSeconds={otpCooldownSeconds}
        deliveryForm={deliveryForm}
        setDeliveryForm={setDeliveryForm}
        successMessage={successMessage}
        error={error}
        verifyingOtp={verifyingOtp}
        uploadingProof={uploadingProof}
        otpSlots={otpSlots}
        otpRefs={otpRefs}
        currentReasonOptions={currentReasonOptions}
        safeSelectedReasonValue={safeSelectedReasonValue}
        onClose={closeTaskDialog}
        onSendDeliveryOtp={handleSendDeliveryOtp}
        onDeliverySubmit={handleDeliverySubmit}
        onOtpKeyDown={handleOtpKeyDown}
        onOtpPaste={handleOtpPaste}
        onOtpInputChange={handleOtpInputChange}
        onProofUpload={handleProofUpload}
      />
    </div>
  );
};

export default CourierDashboard;
