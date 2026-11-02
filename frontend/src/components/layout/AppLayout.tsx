import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

/**
 * Authenticated application shell: sidebar + topbar + routed content.
 * Keying the content wrapper on pathname re-triggers the fade-in
 * animation on every navigation for a smooth page transition.
 */
export default function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <main key={pathname} className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
