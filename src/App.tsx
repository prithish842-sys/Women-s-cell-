import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.js';
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
const StudentRoleUpdates = React.lazy(() => import('./pages/student/RoleUpdates.js').then(module => ({ default: module.StudentRoleUpdates })));

const FacultyDashboard = React.lazy(() => import('./pages/faculty/Dashboard.js').then(module => ({ default: module.FacultyDashboard })));
const FacultySearch = React.lazy(() => import('./pages/faculty/Search.js').then(module => ({ default: module.FacultySearch })));
const FacultyRoleUpdates = React.lazy(() => import('./pages/faculty/RoleUpdates.js').then(module => ({ default: module.FacultyRoleUpdates })));
const FacultyNotifications = React.lazy(() => import('./pages/faculty/Notifications.js').then(module => ({ default: module.FacultyNotifications })));

const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard.js').then(module => ({ default: module.AdminDashboard })));
const AdminStudents = React.lazy(() => import('./pages/admin/Students.js').then(module => ({ default: module.AdminStudents })));
const AdminFaculty = React.lazy(() => import('./pages/admin/Faculty.js').then(module => ({ default: module.AdminFaculty })));
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
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-cream-50 text-maroon-700">
    <div className="flex flex-col items-center gap-4 px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full border border-rose-100 bg-white font-serif text-xl font-bold shadow-md">
        SP
      </div>
      <div className="space-y-1">
        <p className="font-serif text-xl font-bold">Singa Pen Portal</p>
        <p className="text-xs font-semibold uppercase text-gray-500">Women's Empowerment Cell Hub</p>
      </div>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-rose-100">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-maroon-700" />
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

// Main App Router Tree
export default function App() {
  const [showInitialLoader, setShowInitialLoader] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem('singa-pen-loader-seen') !== 'true';
  });

  useEffect(() => {
    if (!showInitialLoader) return;
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem('singa-pen-loader-seen', 'true');
      setShowInitialLoader(false);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [showInitialLoader]);

  return (
    <AuthProvider>
      <NetworkStatus />
      {showInitialLoader && <InitialWebsiteLoader />}
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
                <Route path="/student/skill-requests" element={<StudentSkillRequests />} />
                <Route path="/student/notifications" element={<StudentNotifications />} />
                <Route path="/student/workshops" element={<StudentWorkshops />} />
                <Route path="/student/role-updates" element={<StudentRoleUpdates />} />
                <Route path="/student/saved-schemes" element={<Navigate to="/student/schemes?saved=true" replace />} />
              </Route>

              {/* FACULTY CLEARANCE ROUTES */}
              <Route element={<RoleRoute allowedRoles={['FACULTY']} />}>
                <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
                <Route path="/faculty/search" element={<FacultySearch />} />
                <Route path="/faculty/role-updates" element={<FacultyRoleUpdates />} />
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
                <Route path="/admin/faculty" element={<AdminFaculty />} />
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
    </AuthProvider>
  );
}
