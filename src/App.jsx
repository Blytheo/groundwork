import { Routes, Route } from 'react-router-dom';
import AppShell from './layouts/AppShell.jsx';
import HomeShell from './layouts/HomeShell.jsx';
import Home from './pages/Home.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import FullAnalysisPage from './pages/FullAnalysisPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<HomeShell />}>
        <Route index element={<Home />} />
      </Route>
      <Route element={<AppShell />}>
        <Route path="search/:category" element={<CategoryPage />} />
        <Route path="full-analysis" element={<FullAnalysisPage />} />
      </Route>
    </Routes>
  );
}
