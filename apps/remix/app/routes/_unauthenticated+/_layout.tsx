import { Outlet } from 'react-router';

export default function Layout() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02060a] text-white">
      <Outlet />
    </main>
  );
}
