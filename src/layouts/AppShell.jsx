import { Outlet } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import Sidebar from '../components/Sidebar.jsx';
import SiteFooter from '../components/SiteFooter.jsx';

export default function AppShell() {
  return (
    <>
      <SiteHeader />
      <div className="app-shell">
        <Sidebar />
        <main className="app-content">
          <Outlet />
        </main>
      </div>
      <SiteFooter />
    </>
  );
}
