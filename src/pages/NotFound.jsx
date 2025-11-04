// src/pages/NotFound.jsx
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800">
      <img src="/logo.png" alt="Iceland Camping Weather" className="h-10 w-auto mb-4 opacity-80" />
      <h1 className="text-5xl font-extrabold mb-2">404</h1>
      <p className="text-lg text-slate-600 mb-6">
        Oops — we couldn’t find this page. Maybe it blew away in the Icelandic wind. 🌬️
      </p>
      <Link
        to="/"
        className="px-4 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold smooth focus-ring hover:bg-sky-700"
      >
        Go back home
      </Link>
    </div>
  );
}
