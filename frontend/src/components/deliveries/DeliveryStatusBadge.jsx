import { DELIVERY_STATUS } from "../../utils/constants.js";

/**
 * Colored pill for a delivery status, matching the NexusRoute palette:
 *   delivered → emerald, in transit → amber, pending → slate.
 */
const STATUS_META = {
  [DELIVERY_STATUS.DELIVERED]: {
    label: "Entregado",
    classes: "bg-status-delivered/15 text-status-delivered",
    dot: "bg-status-delivered",
  },
  [DELIVERY_STATUS.IN_TRANSIT]: {
    label: "En tránsito",
    classes: "bg-status-transit/15 text-status-transit",
    dot: "bg-status-transit",
  },
  [DELIVERY_STATUS.PENDING]: {
    label: "Pendiente",
    classes: "bg-status-pending/15 text-status-pending",
    dot: "bg-status-pending",
  },
};

export default function DeliveryStatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META[DELIVERY_STATUS.PENDING];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.classes}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
