import { useEffect, useState } from "react";
import { Outlet, Routes, Route, Navigate, useNavigate } from "react-router";
import { authClient } from "./lib/auth-client";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";

function Navbar() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => navigate("/login") },
    });
  };

  return (
    <header className="border-b border-gray-200 bg-white px-6 py-3 flex items-center justify-between">
      <span className="font-semibold text-gray-900">Helpdesk</span>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{session?.user.name}</span>
        <button
          onClick={handleSignOut}
          className="text-sm text-blue-600 hover:underline"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

function AuthenticatedLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function HomePage() {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Helpdesk</h1>
      <p>
        API status:{" "}
        {status === null
          ? "checking..."
          : status === "ok"
            ? "✓ ok"
            : "✗ unreachable"}
      </p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AuthenticatedLayout />}>
          <Route path="/" element={<HomePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
