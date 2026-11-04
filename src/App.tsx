import React, { useState } from 'react';
import { StudioProvider, useStudio } from './context/StudioContext';
import { Header } from './components/Header';
import { LeftSidebar } from './components/CanvaEditor/LeftSidebar';
import { CanvasArea } from './components/CanvaEditor/CanvasArea';
import { RightInspector } from './components/CanvaEditor/RightInspector';
import { Timeline } from './components/CapCutTimeline/Timeline';
import { BulkAutomationView } from './components/BulkCreator/BulkAutomationView';
import { AdminDashboard } from './components/AdminPanel/AdminDashboard';
import { DesktopPackagingView } from './components/DesktopBuilds/DesktopPackagingView';
import { MediaLibraryView } from './components/MediaLibrary/MediaLibraryView';
import { TemplatesView } from './components/Templates/TemplatesView';
import { GuidesView } from './components/Docs/GuidesView';
import { LicenseModal } from './components/Modals/LicenseModal';
import { ExportModal } from './components/Modals/ExportModal';

function StudioApp() {
  const { activeView, toastMessage } = useStudio();
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Top Application Bar */}
      <Header
        onOpenLicenseModal={() => setShowLicenseModal(true)}
        onOpenExportModal={() => setShowExportModal(true)}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeView === 'editor' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Editor Area: Canva Left Sidebar + Center Canvas + Right Inspector */}
            <div className="flex-1 flex overflow-hidden">
              <LeftSidebar />
              <CanvasArea />
              <RightInspector />
            </div>

            {/* Bottom CapCut-Style Multi-Track Timeline */}
            <Timeline />
          </div>
        )}

        {activeView === 'bulk' && <BulkAutomationView />}
        {activeView === 'templates' && <TemplatesView />}
        {activeView === 'media' && <MediaLibraryView />}
        {activeView === 'admin' && <AdminDashboard />}
        {activeView === 'desktop' && <DesktopPackagingView />}
        {activeView === 'docs' && <GuidesView />}
      </main>

      {/* Modals */}
      {showLicenseModal && <LicenseModal onClose={() => setShowLicenseModal(false)} />}
      {showExportModal && <ExportModal onClose={() => setShowExportModal(false)} />}

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-indigo-500/50 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-slide-up backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StudioProvider>
      <StudioApp />
    </StudioProvider>
  );
}
