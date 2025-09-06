// src/app/dashboard/page.js
"use client";

import { useState, useEffect } from "react";
import { Box, CssBaseline, Toolbar, Tabs, Tab } from "@mui/material";
import Header from "@/app/components/Header";
import Sidebar from "@/app/components/Sidebar";
import DashboardView from "@/app/components/DashboardView";
import StudentsView from "@/app/components/StudentsView";
import ClassesView from "@/app/components/ClassesView";
import SubjectView from "@/app/components/Subjects";
import ChaptersView from "../components/Chapter";
import SubscriptionsView from "@/app/components/SubscriptionsView";
import JobUpdatesView from "@/app/components/JobUpdatesView";
import NotificationsView from "@/app/components/NotificationsView";
import Loader from "@/app/components/Loader";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import GeneralSubjectView from "../components/GeneralSubjectView";
import GeneralChaptersView from "../components/GeneralChaptersView";
import QuizzesView from "../components/QuizzesView";

const drawerWidth = 280;

// This is the correct way to handle client-side-only components
const ContentManagementView = dynamic(
  () => import("@/app/components/ContentManagementView"),
  { 
    ssr: false,
    loading: () => <Loader contained /> 
  }
);

export default function DashboardPage() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeView, setActiveView] = useState("Dashboard");
  
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [classDisplayMode, setClassDisplayMode] = useState("active");
  
  const [classSubView, setClassSubView] = useState("classes");
  const [selectedGeneralSubject, setSelectedGeneralSubject] = useState(null);

  // This check ensures we don't try to server-render a protected page
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const adminId = sessionStorage.getItem("adminId");
    if (!adminId) {
      router.replace("/login");
    } else {
      setIsClient(true); // Now we can render the content
    }
  }, [router]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    setSelectedClass(null);
    setSelectedSubject(null);
    setSelectedGeneralSubject(null);
    setClassDisplayMode("active");
    setClassSubView("classes"); 
  };

  const handleClassSelect = (classData) => {
    setSelectedClass(classData);
  };

  const handleSubjectSelect = (subjectData) => {
    setSelectedSubject(subjectData);
  };

  const handleGeneralSubjectSelect = (subjectData) => {
    setSelectedGeneralSubject(subjectData);
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setSelectedSubject(null);
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
  };

  const handleBackToGeneralSubjects = () => {
    setSelectedGeneralSubject(null);
  };

  const renderView = () => {
    switch (activeView) {
      case "Dashboard":
        return <DashboardView />;
      case "Classes & Subjects":
        if (selectedSubject) {
          return <ChaptersView 
                      subjectId={selectedSubject.id}
                      subjectName={selectedSubject.name}
                      onBack={handleBackToSubjects}
                  />
        }
        if (selectedClass) {
          return (
            <SubjectView
              classId={selectedClass.id}
              className={selectedClass.name}
              onBack={handleBackToClasses}
              onSubjectSelect={handleSubjectSelect}
            />
          );
        }
        if (selectedGeneralSubject) {
          return (
            <GeneralChaptersView
              generalSubjectId={selectedGeneralSubject.id}
              generalSubjectName={selectedGeneralSubject.name}
              onBack={handleBackToGeneralSubjects}
            />
          );
        }
        return (
          <Box>
            <Tabs 
              value={classSubView} 
              onChange={(e, newValue) => setClassSubView(newValue)} 
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
            >
              <Tab label="Classes" value="classes" />
              <Tab label="General Subjects" value="generalSubjects" />
            </Tabs>
            {classSubView === 'classes' && (
              <ClassesView
                mode={classDisplayMode}
                onClassSelect={handleClassSelect}
                onToggleView={() =>
                  setClassDisplayMode(
                    classDisplayMode === "active" ? "inactive" : "active"
                  )
                }
              />
            )}
            {classSubView === 'generalSubjects' && (
              <GeneralSubjectView onSubjectSelect={handleGeneralSubjectSelect} />
            )}
          </Box>
        );
      case "Content Management":
        return <ContentManagementView />;
      case "Students":
        return <StudentsView />;
      case "Subscriptions":
        return <SubscriptionsView />;
      case "Quizzes":
        return <QuizzesView />;
      case "Job Updates":
        return <JobUpdatesView />;
      case "Notifications":
        return <NotificationsView />;
      default:
        return <DashboardView />;
    }
  };
  
  // Render a loader until the client-side check is complete
  if (!isClient) {
    return <Loader />;
  }

  return (
      <Box sx={{ display: "flex", bgcolor: 'background.default' }}>
        <CssBaseline />
        <Header
          drawerWidth={drawerWidth}
          handleDrawerToggle={handleDrawerToggle}
        />
        <Sidebar
          drawerWidth={drawerWidth}
          mobileOpen={mobileOpen}
          handleDrawerToggle={handleDrawerToggle}
          activeView={activeView}
          handleViewChange={handleViewChange}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            width: { md: `calc(100% - ${drawerWidth}px)` },
          }}
        >
          <Toolbar />
          {renderView()}
        </Box>
      </Box>
  );
}