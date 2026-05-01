import { useEffect, useState } from "react";
import { Routes, Route } from "react-router";

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
        {status === null ? "checking..." : status === "ok" ? "✓ ok" : "✗ unreachable"}
      </p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  );
}

export default App;
