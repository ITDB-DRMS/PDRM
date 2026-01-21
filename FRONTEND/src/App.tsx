import { BrowserRouter as Router, Routes, Route } from "react-router";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Verify from "./pages/auth/Verify";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import SetupAccount from "./pages/auth/SetupAccount";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { HierarchyProvider } from "./context/HierarchyContext";
import Roles from "./pages/admin/Roles";
import Users from "./pages/admin/Users";
import OrganizationList from "./pages/admin/OrganizationList";
import SectorList from "./pages/admin/SectorList";
import DepartmentList from "./pages/admin/DepartmentList";
import PermissionList from "./pages/admin/PermissionList";
import Teams from "./pages/admin/Teams";
import StructureGraph from "./pages/admin/StructureGraph";
import HierarchyManagement from "./pages/admin/HierarchyManagement";
import AuditLogs from "./pages/admin/AuditLogs";
import EmailLogs from "./pages/admin/EmailLogs";

import UserProfiles from "./pages/UserProfiles";
import DisasterRiskAssessment from "./pages/DRM/DisasterRiskAssessment";
import DisasterRiskDatabase from "./pages/DRM/DisasterRiskDatabase";
import CommunityManagement from "./pages/DRM/CommunityManagement";
import EarlyWarning from "./pages/DRM/EarlyWarning";
import Volunteers from "./pages/DRM/Volunteers";
import Awareness from "./pages/DRM/Awareness";
import Inspection from "./pages/DRM/Inspection";
import Analytics from "./pages/DRM/Analytics";
import NotFound from "./pages/OtherPage/NotFound";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <>
      <AuthProvider>
        <HierarchyProvider>
          <Router>
            <ScrollToTop />
            <ToastContainer
              position="top-right"
              autoClose={3000}
              theme="colored"
              className="!z-[9999999]"
            />
            <Routes>
              {/* Protected Dashboard Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route index path="/" element={<Home />} />
                  <Route path="/dashboard" element={<Home />} />

                  {/* DRM Routes */}
                  <Route path="/disaster-risk-assessment" element={<DisasterRiskAssessment />} />
                  <Route path="/disaster-risk-database" element={<DisasterRiskDatabase />} />
                  <Route path="/community-management" element={<CommunityManagement />} />
                  <Route path="/early-warning" element={<EarlyWarning />} />
                  <Route path="/volunteers" element={<Volunteers />} />
                  <Route path="/awareness" element={<Awareness />} />
                  <Route path="/inspection" element={<Inspection />} />
                  <Route path="/analytics" element={<Analytics />} />

                  {/* Admin Routes */}
                  <Route path="/admin/organizations" element={<OrganizationList />} />
                  <Route path="/admin/sectors" element={<SectorList />} />
                  <Route path="/admin/departments" element={<DepartmentList />} />
                  <Route path="/admin/permissions" element={<PermissionList />} />
                  <Route path="/admin/roles" element={<Roles />} />
                  <Route path="/admin/users" element={<Users />} />
                  <Route path="/admin/teams" element={<Teams />} />
                  <Route path="/admin/structure-graph" element={<StructureGraph />} />
                  <Route path="/admin/hierarchy" element={<HierarchyManagement />} />
                  <Route path="/admin/audit-logs" element={<AuditLogs />} />
                  <Route path="/admin/email-logs" element={<EmailLogs />} />

                  {/* Others Page */}
                  <Route path="/profile" element={<UserProfiles />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/blank" element={<Blank />} />

                  {/* Forms */}
                  <Route path="/form-elements" element={<FormElements />} />

                  {/* Tables */}
                  <Route path="/basic-tables" element={<BasicTables />} />

                  {/* Ui Elements */}
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/avatars" element={<Avatars />} />
                  <Route path="/badge" element={<Badges />} />
                  <Route path="/buttons" element={<Buttons />} />
                  <Route path="/images" element={<Images />} />
                  <Route path="/videos" element={<Videos />} />

                  {/* Charts */}
                  <Route path="/line-chart" element={<LineChart />} />
                  <Route path="/bar-chart" element={<BarChart />} />
                </Route>
              </Route>

              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/setup-account" element={<SetupAccount />} />

              {/* Legacy redirects if needed, or simple fallbacks */}
              <Route path="/signin" element={<Login />} />
              <Route path="/signup" element={<Register />} />

              {/* Fallback Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </HierarchyProvider>
      </AuthProvider>
    </>
  );
}
