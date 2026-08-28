import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.js';
import { useAuth } from './contexts/AuthContext.js';
import { LanguageProvider } from './contexts/LanguageContext.js';
import { PublicLayout, ProtectedRoute, RoleRoute, DashboardLayout } from './components/common/Layouts.js';
import { ScrollToTop } from './components/common/ScrollToTop.js';
import { NetworkStatus } from './components/common/NetworkStatus.js';

// Public Views
import { Home } from './pages/public/Home.js';
import { About } from './pages/public/About.js';
import { Members } from './pages/public/Members.js';
import { MemberDetail } from './pages/public/MemberDetail.js';
import { Schemes } from './pages/public/Schemes.js';
import { SchemeDetail } from './pages/public/SchemeDetail.js';
import { Gallery } from './pages/public/Gallery.js';
import { GalleryAlbumDetail } from './pages/public/GalleryAlbumDetail.js';
import { SkillsDirectory } from './pages/public/SkillsDirectory.js';
import { IccComplaint } from './pages/public/IccComplaint.js';
import { Safety } from './pages/public/Safety.js';
import { SafetyGuideDetail } from './pages/public/SafetyGuideDetail.js';
import { EmergencyHelp } from './pages/public/EmergencyHelp.js';
import { CyberGuidance } from './pages/public/CyberGuidance.js';
import { AnonymousConcern } from './pages/public/AnonymousConcern.js';


// Auth Views
import { Login } from './pages/auth/Login.js';
import { Register } from './pages/auth/Register.js';
import { AnimationPreviewPage } from './pages/AnimationPreviewPage.js';

const StudentDashboard = React.lazy(() => import('./pages/student/Dashboard.js').then(module => ({ default: module.StudentDashboard })));
const StudentProfileView = React.lazy(() => import('./pages/student/Profile.js').then(module => ({ default: module.StudentProfileView })));
const StudentSkillsView = React.lazy(() => import('./pages/student/Skills.js').then(module => ({ default: module.StudentSkillsView })));
const StudentFuturePlanView = React.lazy(() => import('./pages/student/FuturePlan.js').then(module => ({ default: module.StudentFuturePlanView })));
const StudentSchemesView = React.lazy(() => import('./pages/student/Schemes.js').then(module => ({ default: module.StudentSchemesView })));
const StudentSkillRequests = React.lazy(() => import('./pages/student/SkillRequests.js').then(module => ({ default: module.StudentSkillRequests })));
const StudentNotifications = React.lazy(() => import('./pages/student/Notifications.js').then(module => ({ default: module.StudentNotifications })));
const StudentWorkshops = React.lazy(() => import('./pages/student/Workshops.js').then(module => ({ default: module.StudentWorkshops })));
const StudentSafety = React.lazy(() => import('./pages/student/Safety.js').then(module => ({ default: module.StudentSafety })));
const StudentRoleUpdates = React.lazy(() => import('./pages/student/RoleUpdates.js').then(module => ({ default: module.StudentRoleUpdates })));
const StudentWellbeing = React.lazy(() => import('./pages/student/Wellbeing.js').then(module => ({ default: module.StudentWellbeing })));
const StudentWellbeingChat = React.lazy(() => import('./pages/student/WellbeingChat.js').then(module => ({ default: module.StudentWellbeingChat })));
const StudentWellbeingSupport = React.lazy(() => import('./pages/student/WellbeingSupport.js').then(module => ({ default: module.StudentWellbeingSupport })));

const FacultyDashboard = React.lazy(() => import('./pages/faculty/Dashboard.js').then(module => ({ default: module.FacultyDashboard })));
const FacultyProfile = React.lazy(() => import('./pages/faculty/Profile.js').then(module => ({ default: module.FacultyProfile })));
const FacultySearch = React.lazy(() => import('./pages/faculty/Search.js').then(module => ({ default: module.FacultySearch })));
const FacultyWorkshops = React.lazy(() => import('./pages/faculty/Workshops.js').then(module => ({ default: module.FacultyWorkshops })));
const FacultySchemes = React.lazy(() => import('./pages/faculty/Schemes.js').then(module => ({ default: module.FacultySchemes })));
const FacultySafety = React.lazy(() => import('./pages/faculty/Safety.js').then(module => ({ default: module.FacultySafety })));
const FacultyNotifications = React.lazy(() => import('./pages/faculty/Notifications.js').then(module => ({ default: module.FacultyNotifications })));

const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard.js').then(module => ({ default: module.AdminDashboard })));
const AdminStudents = React.lazy(() => import('./pages/admin/Students.js').then(module => ({ default: module.AdminStudents })));
const AdminMembers = React.lazy(() => import('./pages/admin/Members.js').then(module => ({ default: module.AdminMembers })));
const AdminSchemes = React.lazy(() => import('./pages/admin/Schemes.js').then(module => ({ default: module.AdminSchemes })));
const AdminContent = React.lazy(() => import('./pages/admin/Content.js').then(module => ({ default: module.AdminContent })));
const GalleryManager = React.lazy(() => import('./pages/admin/GalleryManager.js').then(module => ({ default: module.GalleryManager })));
const AchievementsManager = React.lazy(() => import('./pages/admin/AchievementsManager.js').then(module => ({ default: module.AchievementsManager })));
const AdminIccComplaints = React.lazy(() => import('./pages/admin/IccComplaints.js').then(module => ({ default: module.AdminIccComplaints })));
const AdminIccComplaintDetail = React.lazy(() => import('./pages/admin/IccComplaintDetail.js').then(module => ({ default: module.AdminIccComplaintDetail })));
const AdminSkillRequests = React.lazy(() => import('./pages/admin/SkillRequests.js').then(module => ({ default: module.AdminSkillRequests })));
const AdminWorkshops = React.lazy(() => import('./pages/admin/Workshops.js').then(module => ({ default: module.AdminWorkshops })));
const AdminNotifications = React.lazy(() => import('./pages/admin/Notifications.js').then(module => ({ default: module.AdminNotifications })));
const AdminWorkshopRegistrations = React.lazy(() => import('./pages/admin/WorkshopRegistrations.js').then(module => ({ default: module.AdminWorkshopRegistrations })));
const AdminAlumni = React.lazy(() => import('./pages/admin/Alumni.js').then(module => ({ default: module.AdminAlumni })));
const AdminOpportunities = React.lazy(() => import('./pages/admin/Opportunities.js').then(module => ({ default: module.AdminOpportunities })));
const AdminSafetyDirectory = React.lazy(() => import('./pages/admin/SafetyDirectory.js').then(module => ({ default: module.AdminSafetyDirectory })));
const AdminReports = React.lazy(() => import('./pages/admin/Reports.js').then(module => ({ default: module.AdminReports })));
const AdminRoleUpdates = React.lazy(() => import('./pages/admin/RoleUpdates.js').then(module => ({ default: module.AdminRoleUpdates })));
const AdminSafetyWellbeing = React.lazy(() => import('./pages/admin/SafetyWellbeing.js').then(module => ({ default: module.AdminSafetyWellbeing })));
const AdminSettings = React.lazy(() => import('./pages/admin/Settings.js').then(module => ({ default: module.AdminSettings })));

// Stylized Unauthorized Page
const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-full bg-rose-50 text-maroon-700 flex items-center justify-center font-serif text-3xl font-bold border border-gold-600">
        !
      </div>
      <h2 className="font-serif text-2xl font-bold text-maroon-700">Access Unauthorized</h2>
      <p className="text-sm text-gray-500 max-w-sm">
        You do not hold the expected role clearances to view this executive committee management panel.
      </p>
      <Link to="/" className="px-5 py-2 bg-maroon-700 text-white rounded text-xs font-bold hover:bg-maroon-800 transition-colors">
        Return to Public Website
      </Link>
    </div>
  );
};

const NotFound: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
    <h2 className="font-serif text-3xl font-bold text-maroon-700">Page Not Found</h2>
    <p className="text-sm text-gray-500 max-w-sm">The page you requested does not exist in the Singa Pen portal.</p>
    <Link to="/" className="px-5 py-2 bg-maroon-700 text-white rounded text-xs font-bold hover:bg-maroon-800 transition-colors">
      Return Home
    </Link>
  </div>
);

const InitialWebsiteLoader: React.FC = () => (
  <div className="singa-app-loader" role="status" aria-live="polite" aria-label="Singa Pen Portal is loading">
    <div className="singa-app-loader__card">
      <div className="singa-app-loader__mark" aria-hidden="true">
        <span>SP</span>
      </div>
      <div>
        <p className="singa-app-loader__title">SINGA PEN</p>
        <p className="singa-app-loader__copy">Women Empowerment Cell Portal</p>
      </div>
      <div className="singa-app-loader__line" aria-hidden="true">
        <span />
      </div>
    </div>
  </div>
);

const RouteFallback: React.FC = () => (
  <div className="mx-auto max-w-4xl px-4 py-10" aria-busy="true" aria-label="Loading page">
    <div className="rounded-xl border border-rose-100 bg-white p-5 shadow-sm">
      <div className="h-6 w-48 rounded bg-rose-100 motion-safe:animate-pulse" />
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 rounded-lg bg-gray-100 motion-safe:animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

const MIN_INITIAL_LOADER_MS = 520;
const LOADER_FADE_MS = 240;

const AppRouter: React.FC = () => {
  const { loading: authLoading } = useAuth();
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [loaderMounted, setLoaderMounted] = useState(true);
  const [loaderExiting, setLoaderExiting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMinimumElapsed(true), MIN_INITIAL_LOADER_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!minimumElapsed || authLoading || loaderExiting) return;
    setLoaderExiting(true);
    const timer = window.setTimeout(() => setLoaderMounted(false), LOADER_FADE_MS);
    return () => window.clearTimeout(timer);
  }, [authLoading, loaderExiting, minimumElapsed]);

  return (
    <>
      <NetworkStatus />
      {loaderMounted && (
        <div className={loaderExiting ? 'singa-app-loader-exit' : ''}>
          <InitialWebsiteLoader />
        </div>
      )}
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public Routing Section */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/members" element={<Members />} />
            <Route path="/members/:id" element={<MemberDetail />} />
            <Route path="/schemes" element={<Schemes />} />
            <Route path="/schemes/:slug" element={<SchemeDetail />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/gallery/:slug" element={<GalleryAlbumDetail />} />
            <Route path="/skills" element={<SkillsDirectory />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/safety/guides/:slug" element={<SafetyGuideDetail />} />
            <Route path="/safety/emergency" element={<EmergencyHelp />} />
            <Route path="/safety/cyber" element={<CyberGuidance />} />
            <Route path="/safety/anonymous" element={<AnonymousConcern />} />
            <Route path="/icc-complaint" element={<IccComplaint />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/animation-preview/profile-card" element={<AnimationPreviewPage />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
          </Route>

          {/* Secure Dashboard routing wrapper */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* STUDENT CLEARANCE ROUTES */}
              <Route element={<RoleRoute allowedRoles={['STUDENT']} />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/profile" element={<StudentProfileView />} />
                <Route path="/student/skills" element={<StudentSkillsView />} />
                <Route path="/student/future-plan" element={<StudentFuturePlanView />} />
                <Route path="/student/schemes" element={<StudentSchemesView />} />
                <Route path="/student/club" element={<Navigate to="/members" replace />} />
                <Route path="/student/safety" element={<StudentSafety />} />
                <Route path="/student/skill-requests" element={<StudentSkillRequests />} />
                <Route path="/student/notifications" element={<StudentNotifications />} />
                <Route path="/student/workshops" element={<StudentWorkshops />} />
                <Route path="/student/role-updates" element={<StudentRoleUpdates />} />
                <Route path="/student/wellbeing" element={<StudentWellbeing />} />
                <Route path="/student/wellbeing/chat" element={<StudentWellbeingChat />} />
                <Route path="/student/wellbeing/support" element={<StudentWellbeingSupport />} />
                <Route path="/student/saved-schemes" element={<Navigate to="/student/schemes?saved=true" replace />} />
              </Route>

              {/* FACULTY CLEARANCE ROUTES */}
              <Route element={<RoleRoute allowedRoles={['FACULTY']} />}>
                <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
                <Route path="/faculty/profile" element={<FacultyProfile />} />
                <Route path="/faculty/search" element={<Navigate to="/faculty/students" replace />} />
                <Route path="/faculty/students" element={<FacultySearch />} />
                <Route path="/faculty/in-charges" element={<Navigate to="/faculty/students" replace />} />
                <Route path="/faculty/approvals" element={<Navigate to="/faculty/students" replace />} />
                <Route path="/faculty/workshops" element={<FacultyWorkshops />} />
                <Route path="/faculty/schemes" element={<FacultySchemes />} />
                <Route path="/faculty/reports" element={<Navigate to="/faculty/workshops" replace />} />
                <Route path="/faculty/safety" element={<FacultySafety />} />
                <Route path="/faculty/settings" element={<Navigate to="/faculty/profile" replace />} />
                <Route path="/faculty/role-updates" element={<Navigate to="/faculty/students" replace />} />
                <Route path="/faculty/notifications" element={<FacultyNotifications />} />
              </Route>

              {/* ADMINISTRATOR CLEARANCE ROUTES */}
              <Route element={<RoleRoute allowedRoles={['ADMIN', 'ICC_ADMIN']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
              </Route>

              {/* ADMINISTRATOR CLEARANCE ROUTES */}
              <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin/students" element={<AdminStudents />} />
                <Route path="/admin/users" element={<Navigate to="/admin/students" replace />} />
                <Route path="/admin/faculty" element={<Navigate to="/admin/members" replace />} />
                <Route path="/admin/members" element={<AdminMembers />} />
                <Route path="/admin/alumni" element={<AdminAlumni />} />
                <Route path="/admin/schemes" element={<AdminSchemes />} />
                <Route path="/admin/content" element={<AdminContent />} />
                <Route path="/admin/gallery" element={<GalleryManager />} />
                <Route path="/admin/achievements" element={<AchievementsManager />} />
                <Route path="/admin/skill-requests" element={<AdminSkillRequests />} />
                <Route path="/admin/opportunities" element={<AdminOpportunities />} />
                <Route path="/admin/workshops" element={<AdminWorkshops />} />
                <Route path="/admin/workshop-registrations" element={<AdminWorkshopRegistrations />} />
                <Route path="/admin/workshops/:workshopId/registrations" element={<AdminWorkshopRegistrations />} />
                <Route path="/admin/safety-directory" element={<AdminSafetyDirectory />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/role-updates" element={<AdminRoleUpdates />} />
                <Route path="/admin/safety/wellbeing" element={<AdminSafetyWellbeing />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>

              {/* ICC CLEARANCE ROUTES */}
              <Route element={<RoleRoute allowedRoles={['ICC_ADMIN']} />}>
                <Route path="/admin/icc-complaints" element={<AdminIccComplaints />} />
                <Route path="/admin/icc-complaints/:complaintId" element={<AdminIccComplaintDetail />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
};

// Main App Router Tree
export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </LanguageProvider>
  );
}
