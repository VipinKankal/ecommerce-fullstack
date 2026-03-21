type AccountOrderItem = {
  id?: number;
  title: string;
  description?: string;
  size?: string;
  image?: string;
  orderStatus: string;
  statusDate?: string;
  cancelReasonText?: string;
  orderId: number;
  onOpen?: (orderId: number, orderItemId?: number) => void;
};

const statusColorMap: Record<string, string> = {
  PENDING: '#f59e0b',
  PLACED: '#3b82f6',
  CONFIRMED: '#6366f1',
  PACKED: '#7c3aed',
  SHIPPED: '#06b6d4',
  OUT_FOR_DELIVERY: '#0284c7',
  ARRIVED_AT_LOCATION: '#0f766e',
  CONFIRMATION_PENDING: '#d97706',
  DELIVERED: '#16a34a',
  CANCELLED: '#ef4444',
};

const prettyStatus = (value: string) => value.replaceAll('_', ' ');

const OrderItem = ({
  title,
  size,
  image,
  orderStatus,
  statusDate,
  orderId,
  onOpen,
  id,
}: AccountOrderItem) => {
  const status = (orderStatus || 'PENDING').toUpperCase();
  const statusColor = statusColorMap[status] || '#16a34a';
  const productImage = image || '/no-image.png';

  return (
    <div
      onClick={() => onOpen?.(orderId, id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen?.(orderId, id);
        }
      }}
      role="button"
      tabIndex={0}
      className="flex gap-4 py-5 border-b border-gray-100 last:border-0 hover:bg-[#f9f9f9] cursor-pointer transition-colors group px-2"
    >
      <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden shrink-0">
        <img
          src={productImage}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 flex flex-col md:flex-row justify-between">
        <div>
          <p className="text-sm font-bold text-[#282c3f] leading-tight mb-1">
            {title}
          </p>
          <p className="text-xs text-gray-500">Size: {size || 'Onesize'}</p>
          <p className="text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-tighter">
            Order ID: #{orderId}
          </p>
        </div>

        <div className="mt-3 md:mt-0 md:text-right">
          <div className="flex items-center md:justify-end gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: statusColor }}
            ></span>
            <span
              className="text-xs font-bold uppercase"
              style={{ color: statusColor }}
            >
              {prettyStatus(status)}
            </span>
          </div>
          {statusDate && (
            <p className="text-[11px] text-gray-500 mt-1">on {statusDate}</p>
          )}
          <span className="hidden md:inline-block mt-2 text-[#ff3f6c] text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            VIEW DETAILS
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderItem;
