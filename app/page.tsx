"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";

const portals = [
  { label: "Admin", value: "/admin" },
  { label: "Student", value: "/student" },
  { label: "Kiosk", value: "/kiosk" },
  { label: "Cashier", value: "/cashier" },
];

export default function Home() {
  const [selected, setSelected] = useState(portals[1].value); // Default to Student
  const router = useRouter();

  const handleEnter = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(selected);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100">
      <form
        onSubmit={handleEnter}
        className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-sm flex flex-col gap-7 animate-fade-in"
        style={{ minWidth: 320 }}
      >
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shadow-md mb-2">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M8 15c1.333-2 6.667-2 8 0" /><path d="M9 9h.01" /><path d="M15 9h.01" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-center text-blue-700 tracking-tight">Cafeteria System</h1>
          <p className="text-gray-500 text-sm text-center">Welcome! Please select your portal to continue.</p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="portal" className="text-sm font-medium text-gray-700">
            Select Portal
          </label>
          <div className="relative">
            <select
              id="portal"
              value={selected}
              onChange={e => setSelected(e.target.value)}
              className="border rounded-lg px-3 py-2 text-base w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-sm bg-gray-50 hover:bg-blue-50 cursor-pointer appearance-none"
            >
              {portals.map((p) => (
                <option key={p.value} value={p.value} className="text-base">
                  {p.label}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              ▼
            </span>
          </div>
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-md text-lg transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Enter
        </button>
      </form>
      <footer className="mt-8 text-xs text-gray-400 text-center select-none">
        &copy; {new Date().getFullYear()} Cafeteria System. All rights reserved.
      </footer>
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.7s cubic-bezier(.4,0,.2,1);
        }
      `}</style>
    </div>
  );
}
