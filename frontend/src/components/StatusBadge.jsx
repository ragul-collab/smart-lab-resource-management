export default function StatusBadge({ status, label: customLabel }) {
  if (!status) return null;
  const raw = String(status).toUpperCase().trim();
  const label = customLabel || raw.replace(/_/g, ' ');

  let bg = '#F1F3F4';
  let color = '#5F6368';

  if (['AVAILABLE', 'GOOD', 'RETURNED', 'COMPLETED'].includes(raw)) {
    bg = '#E6F4EA';
    color = '#137333';
  } else if (['ISSUED', 'IN_PROGRESS'].includes(raw)) {
    bg = '#E8F0FE';
    color = '#1A73E8';
  } else if (['PENDING', 'RETURN_REQUESTED', 'FAIR', 'OPEN', 'RETURNED_LATE', 'RETURNED LATE', 'LATE'].includes(raw)) {
    bg = '#FEF7E0';
    color = '#B06000';
  } else if (['REJECTED', 'NEEDS_REPAIR', 'OVERDUE'].includes(raw)) {
    bg = '#FCE8E6';
    color = '#C5221F';
  } else if (['CANCELLED', 'RETIRED', 'IN_MAINTENANCE'].includes(raw)) {
    bg = '#F1F3F4';
    color = '#5F6368';
  }

  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: '999px',
        padding: '2px 10px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: bg,
        color: color,
        whiteSpace: 'nowrap',
        lineHeight: '1.4',
      }}
    >
      {label}
    </span>
  );
}
