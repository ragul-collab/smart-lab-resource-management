import { Link } from 'react-router-dom';

export default function StatBox({ label, value, to, note, danger }) {
  const content = (
    <div className="stat-box">
      <div className="stat-box-label">{label}</div>
      <div className={`stat-box-value ${danger ? 'stat-box-value-danger' : ''}`}>
        {value}
      </div>
      {note && <div className="stat-box-note">{note}</div>}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="stat-box-link">
        {content}
      </Link>
    );
  }

  return content;
}

