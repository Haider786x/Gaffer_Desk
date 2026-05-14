import { useNavigate } from "react-router-dom";
import { Button } from "../components/shared/Button.jsx";
import { Card } from "../components/shared/Card.jsx";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(900px_360px_at_70%_-10%,rgba(82,82,91,0.22),transparent_62%)]" />
      <Card padded={false} className="max-w-xl w-full">
        <div className="text-center space-y-6 px-4 sm:px-8 py-10 app-gridlines">
        <div>
          <h1 className="text-6xl font-bold tracking-tight text-app-text mb-2">404</h1>
          <p className="text-2xl font-semibold text-app-text-secondary">
            Page Not Found
          </p>
        </div>

        <p className="text-app-text-muted max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex gap-4 justify-center">
          <Button variant="primary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="secondary" onClick={() => navigate("/dashboard")}>
            Go Home
          </Button>
        </div>
        </div>
      </Card>
    </div>
  );
}
