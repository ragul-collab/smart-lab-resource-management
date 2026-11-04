import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { EmptyState } from '../components/States';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page Not Found | Smart Lab';
  }, []);

  return (
    <div className="container">
      <PageHeader
        title="Page Not Found"
        description="The requested page could not be found."
      />
      <EmptyState
        inCard={true}
        message="The page you are looking for does not exist or has been moved."
        action={
          <Link to="/" className="btn btn-primary">
            Back to Home
          </Link>
        }
      />
    </div>
  );
}
