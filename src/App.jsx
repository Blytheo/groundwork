import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import AppShell from './layouts/AppShell.jsx';
import HomeShell from './layouts/HomeShell.jsx';
import Home from './pages/Home.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import FullAnalysisPage from './pages/FullAnalysisPage.jsx';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<HomeShell />}>
          <Route index element={<Home />} />
        </Route>
        <Route element={<AppShell />}>
          <Route path="search/:category" element={<CategoryPage />} />
          <Route path="full-analysis" element={<FullAnalysisPage />} />
        </Route>
      </Routes>
    </>
  );
}
