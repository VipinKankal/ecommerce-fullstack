# Order Status

## 1. Purpose of This Document
This file describes the important order-related statuses currently visible or implied in the project. It covers:
- customer-facing display statuses
- raw delivery task statuses
- shipment statuses
- payment statuses
- cancellation rules
- delivery confirmation behavior
- current reverse-logistics status gap

## 2. Status Domains in This Project
There is not just one status in the system. The frontend uses multiple status domains together.

Main status domains:
- `orderStatus`
- `fulfillmentStatus`
- `shipmentStatus`
- `deliveryTaskStatus`
- `paymentStatus`

Customer UI derives a display status by combining more than one of these values.

## 3. Customer-Facing Display Statuses
Statuses commonly shown or derived in current customer flow:
- `PENDING`
- `PLACED`
- `CONFIRMED`
- `PACKED`
- `SHIPPED`
- `OUT_FOR_DELIVERY`
- `ARRIVED_AT_LOCATION`
- `CONFIRMATION_PENDING`
- `DELIVERED`
- `CANCELLED`

These are the statuses the customer is most likely to understand in account history and order details.

## 4. Delivery Task Statuses
Courier task statuses currently defined in frontend types:
- `ASSIGNED`
- `ACCEPTED`
- `PICKED_UP`
- `OUT_FOR_DELIVERY`
- `ARRIVED`
- `CONFIRMATION_PENDING`
- `DELIVERED`
- `FAILED`

### Meaning of each
- `ASSIGNED`: task assigned to courier
- `ACCEPTED`: courier accepted the task
- `PICKED_UP`: parcel is collected into courier flow
- `OUT_FOR_DELIVERY`: courier is moving toward customer
- `ARRIVED`: courier reached customer location
- `CONFIRMATION_PENDING`: OTP sent / delivery waiting for final verification
- `DELIVERED`: final successful delivery
- `FAILED`: delivery failed

## 5. Shipment Statuses
Current shipment status values seen in frontend types:
- `LABEL_CREATED`
- `HANDED_TO_COURIER`
- `IN_TRANSIT`
- `OUT_FOR_DELIVERY`
- `DELIVERED`
- `DELIVERY_EXCEPTION`
- `DELIVERY_FAILED`

### Practical meaning
- `LABEL_CREATED`: shipping label or shipment created
- `HANDED_TO_COURIER`: courier/logistics handoff complete
- `IN_TRANSIT`: package moving in logistics network
- `OUT_FOR_DELIVERY`: package on final route to customer
- `DELIVERED`: shipment completed
- `DELIVERY_EXCEPTION`: issue occurred during shipment
- `DELIVERY_FAILED`: shipment could not be delivered

## 6. Payment Statuses
Current payment-related values defined in frontend courier types:
- `PENDING`
- `AUTHORISED`
- `PAID`
- `FAILED`
- `COD_DUE`
- `COD_COLLECTED`
- `COD_DEPOSIT_PENDING`
- `COD_DEPOSITED`
- `COD_VERIFIED`
- `COD_DISPUTED`

### Practical meaning
- `PENDING`: payment not completed yet
- `AUTHORISED`: payment auth exists but may not be fully settled
- `PAID`: payment successful
- `FAILED`: payment failed
- `COD_DUE`: cash on delivery still pending collection
- `COD_COLLECTED`: courier collected COD
- `COD_DEPOSIT_PENDING`: courier has collected COD but deposit verification is pending
- `COD_DEPOSITED`: deposit submitted
- `COD_VERIFIED`: admin/system verified COD deposit
- `COD_DISPUTED`: mismatch or dispute exists

## 7. Customer Status Derivation Logic
Frontend does not simply display `orderStatus` as-is.

It derives display status using priority rules.

### Current effective priority
1. If raw order status is `CANCELLED`, customer sees `CANCELLED`.
2. If shipment or order is delivered, customer sees `DELIVERED`.
3. If courier task is `CONFIRMATION_PENDING`, customer sees `CONFIRMATION_PENDING`.
4. If courier task is `ARRIVED`, customer sees `ARRIVED_AT_LOCATION`.
5. If shipment is `OUT_FOR_DELIVERY`, customer sees `OUT_FOR_DELIVERY`.
6. If shipment is `IN_TRANSIT` or `HANDED_TO_COURIER`, customer sees `SHIPPED`.
7. If fulfillment is `FULFILLED`, customer sees `PACKED`.
8. Otherwise customer sees the raw order status fallback.

This logic keeps customer-facing UX more readable than raw operational state.

## 8. Tracking Milestone Mapping
The customer order details page builds a milestone journey from operational states.

Current milestone labels:
- Order Placed
- Packed
- Shipped
- Out for Delivery
- Delivered

Milestones are marked as:
- completed
- active
- pending

This is separate from exact raw status strings.

## 9. Cancellation Rule
Customer cancellation is restricted to early states only.

Allowed statuses:
- `PENDING`
- `PLACED`
- `CONFIRMED`

Once an order moves beyond that window, cancellation is not offered from current customer UI.

## 10. Delivered Flow
Delivered flow in this project is not a simple one-click success state.

### Typical prepaid/COD courier sequence
1. Courier progresses task to `ARRIVED`
2. Courier sends OTP to customer email
3. Task enters `CONFIRMATION_PENDING`
4. Courier collects OTP from customer
5. Courier verifies OTP
6. Final status becomes `DELIVERED`

This means `CONFIRMATION_PENDING` is an important operational state and should not be treated as final delivery.

## 11. Failure / Exception States
Operational failure may appear through:
- `FAILED` in courier task status
- `DELIVERY_EXCEPTION` in shipment status
- `DELIVERY_FAILED` in shipment status
- `FAILED` in payment status
- `CANCELLED` in order status

These states belong to different domains and should not be merged blindly.

## 12. Seller / Admin / Courier Interpretation Guidance

### Customer should see
Simple, trust-building statuses like:
- Confirmed
n- Packed
- Shipped
- Out for Delivery
- Delivered
- Cancelled

### Admin and seller may need
- raw order state
- shipment state
- payment state
- fulfillment state
- courier task state

### Courier needs
- task progression statuses
- COD-related states
- confirmation pending state
- failure reason handling

## 13. Return / Exchange Status Gap
Return and exchange status design is not yet fully normalized across the current frontend.

That means:
- there is no final single standard documented status chain for reverse logistics yet
- future return/exchange work should define a dedicated status family instead of overloading forward-delivery statuses

Recommended future reverse-logistics status family:
- `RETURN_REQUESTED`
- `RETURN_APPROVED`
- `RETURN_ASSIGNED`
- `RETURN_PICKED_UP`
- `RETURN_IN_TRANSIT`
- `RETURN_RECEIVED`
- `RETURN_COMPLETED`
- `RETURN_REJECTED`
- `EXCHANGE_REQUESTED`
- `EXCHANGE_APPROVED`
- `EXCHANGE_PICKED_UP`
- `REPLACEMENT_SHIPPED`
- `EXCHANGE_COMPLETED`

## 14. Important Implementation Guidance
Any future change to backend status values must be coordinated with frontend because:
- customer display mapping depends on exact strings
- courier dashboard validation depends on exact strings
- cancellation rules depend on exact strings
- chips, timelines, and filters depend on exact strings

## 15. Recommended Use of This Document
Use this file when you need to answer:
- Which statuses exist today?
- Which status belongs to which domain?
- How does customer status mapping work?
- Where should new return/exchange statuses fit?

