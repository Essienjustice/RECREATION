import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell.jsx";
import { ExportPage } from "./pages/ExportPage.jsx";
import { FootagePage } from "./pages/FootagePage.jsx";
import { ProjectsPage } from "./pages/ProjectsPage.jsx";
import { WritePage } from "./pages/WritePage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/write" replace />} />
        <Route path="/write" element={<WritePage />} />
        <Route path="/footage" element={<FootagePage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="*" element={<Navigate to="/write" replace />} />
      </Route>
    </Routes>
  );
}
