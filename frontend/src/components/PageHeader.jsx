export default function PageHeader({ title, description, children, actions }) {
  const actionContent = children || actions;

  return (
    <div className="page-header no-print">
      <div className="page-header-info">
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-desc">{description}</p>}
      </div>
      {actionContent && <div className="page-header-actions">{actionContent}</div>}
    </div>
  );
}
