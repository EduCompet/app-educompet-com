// src/app/components/ContentManagementView.js
"use client";

import {
  Typography,
  Box,
  Grid,
  Card,
  CardActionArea,
  Alert,
  Breadcrumbs,
  Link,
  Paper,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  IconButton,
  CircularProgress,
  styled,
  Pagination,
  Stack,
  InputAdornment, // Import InputAdornment
} from "@mui/material";
import { useState, useEffect, useCallback } from "react";
import Loader from "./Loader";

// Import icons
import SchoolIcon from "@mui/icons-material/School";
import BookIcon from "@mui/icons-material/Book";
import FolderIcon from "@mui/icons-material/Folder";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search"; // Import SearchIcon

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const ITEMS_PER_PAGE = 6;

const ContentManagementView = () => {
  // State for content structure
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [generalSubjects, setGeneralSubjects] = useState([]);
  const [generalChapters, setGeneralChapters] = useState([]);

  // State for selections
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedGeneralSubject, setSelectedGeneralSubject] = useState(null);
  const [selectedGeneralChapter, setSelectedGeneralChapter] = useState(null);

  // UI and Data states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(""); // State for search bar
  const [activeTab, setActiveTab] = useState(0);
  const [activeContentTab, setActiveContentTab] = useState("class");
  const [uploading, setUploading] = useState(false);

  // Modal states
  const [modalState, setModalState] = useState({
    video: false,
    pdf: false,
    editPdf: false,
    pdfViewer: false,
  });
  const [videoForm, setVideoForm] = useState({ title: "", url: "" });
  const [pdfForm, setPdfForm] = useState({ title: "", file: null });
  const [editPdfForm, setEditPdfForm] = useState({ url: "", title: "" });
  const [pdfUrl, setPdfUrl] = useState("");

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const responses = await Promise.all([
        fetch(`${baseURL}/api/coreClassData`, { headers: { "x-api-key": apiKey } }),
        fetch(`${baseURL}/api/coreSubjectsData`, { headers: { "x-api-key": apiKey } }),
        fetch(`${baseURL}/api/coreChaptersData`, { headers: { "x-api-key": apiKey } }),
        fetch(`${baseURL}/api/coreGeneralSubjectData`, { headers: { "x-api-key": apiKey } }),
        fetch(`${baseURL}/api/coreGeneralChaptersData`, { headers: { "x-api-key": apiKey } }),
      ]);
      const [classRes, subjectRes, chapterRes, genSubRes, genChapRes] = await Promise.all(responses.map(res => res.json()));

      if (classRes.success) setClasses(classRes.data.filter((c) => c.isActive));
      if (subjectRes.success) setSubjects(subjectRes.data.filter((s) => s.isActive));
      if (chapterRes.success) setChapters(chapterRes.data);
      if (genSubRes.success) setGeneralSubjects(genSubRes.data.filter(s => s.isActive));
      if (genChapRes.success) setGeneralChapters(genChapRes.data);

    } catch (err) {
      setError("Failed to fetch initial data.");
    } finally {
      setLoading(false);
    }
  }, [apiKey, baseURL]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const updateChapterMedia = async (chapter, newMedia, feedbackMessage, isGeneral) => {
    if (!chapter) return;
    setLoading(true);
    const endpoint = isGeneral
      ? `${baseURL}/api/putGeneralChapterDataWithSubjectId?chapterId=${chapter._id}`
      : `${baseURL}/api/putChapterDataWithSubjectId?chapterId=${chapter._id}`;

    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ media: newMedia }),
      });
      const result = await response.json();
      if (result.success) {
        const updatedChapter = result.data;
        if (isGeneral) {
          setSelectedGeneralChapter(updatedChapter);
          setGeneralChapters((prev) => prev.map((c) => (c._id === updatedChapter._id ? updatedChapter : c)));
        } else {
          setSelectedChapter(updatedChapter);
          setChapters((prev) => prev.map((c) => (c._id === updatedChapter._id ? updatedChapter : c)));
        }
      } else {
        setError(result.message || `Failed to ${feedbackMessage}.`);
      }
    } catch (err) {
      setError(`An error occurred while ${feedbackMessage}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    const isGeneral = activeContentTab === "general";
    const currentChapter = isGeneral ? selectedGeneralChapter : selectedChapter;
    if (!videoForm.title.trim() || !videoForm.url.trim()) return setError("Please fill in all video fields.");
    const newVideo = { type: "video", ...videoForm };
    const currentMedia = currentChapter.media || [];
    await updateChapterMedia(currentChapter, [...currentMedia, newVideo], "adding video", isGeneral);
    setModalState({ ...modalState, video: false });
    setVideoForm({ title: "", url: "" });
  };

  const handlePdfUpload = async (e) => {
    e.preventDefault();
    const isGeneral = activeContentTab === "general";
    const currentChapter = isGeneral ? selectedGeneralChapter : selectedChapter;
    if (!pdfForm.file || !pdfForm.title.trim()) return setError("Please select a file and enter a title.");
    
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", pdfForm.file);

    try {
      const uploadResponse = await fetch(`${baseURL}/api/upload`, {
        method: "POST", headers: { "x-api-key": apiKey }, body: formData,
      });
      if (!uploadResponse.ok) throw new Error((await uploadResponse.json()).error || "Upload failed");
      const uploadResult = await uploadResponse.json();

      const newPdf = { type: "pdf", title: pdfForm.title, url: uploadResult.url };
      const currentMedia = currentChapter.media || [];
      await updateChapterMedia(currentChapter, [...currentMedia, newPdf], "adding document", isGeneral);
      setModalState({ ...modalState, pdf: false });
      setPdfForm({ title: "", file: null });
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setUploading(false);
    }
  };
  
  const handleEditPdfTitle = async (e) => {
    e.preventDefault();
    const isGeneral = activeContentTab === "general";
    const currentChapter = isGeneral ? selectedGeneralChapter : selectedChapter;
    if (!editPdfForm.title.trim()) return setError("Please enter a valid title.");
    
    const currentMedia = JSON.parse(JSON.stringify(currentChapter.media || []));
    const mediaItemIndex = currentMedia.findIndex((m) => m.url === editPdfForm.url);
    if (mediaItemIndex > -1) {
      currentMedia[mediaItemIndex].title = editPdfForm.title;
      await updateChapterMedia(currentChapter, currentMedia, "editing PDF title", isGeneral);
    }
    setModalState({ ...modalState, editPdf: false });
    setEditPdfForm({ url: "", title: "" });
  };

  const handleDeleteMedia = async (mediaItem) => {
    if (!confirm(`Are you sure you want to delete "${mediaItem.title}"?`)) return;
    const isGeneral = activeContentTab === "general";
    const currentChapter = isGeneral ? selectedGeneralChapter : selectedChapter;
    const currentMedia = currentChapter.media || [];
    const updatedMedia = currentMedia.filter((m) => m.url !== mediaItem.url || m.title !== mediaItem.title);
    await updateChapterMedia(currentChapter, updatedMedia, "deleting media item", isGeneral);
  };
  
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  const handleClassSelect = (classItem) => { setSelectedClass(classItem); setSelectedSubject(null); setSelectedChapter(null); setPage(1); setSearchTerm(""); };
  const handleSubjectSelect = (subjectItem) => { setSelectedSubject(subjectItem); setSelectedChapter(null); setPage(1); setSearchTerm(""); };
  const handleChapterSelect = (chapterItem) => { setSelectedChapter(chapterItem); setActiveTab(0); };
  const handleGeneralSubjectSelect = (subjectItem) => { setSelectedGeneralSubject(subjectItem); setSelectedGeneralChapter(null); setPage(1); setSearchTerm(""); };
  const handleGeneralChapterSelect = (chapterItem) => { setSelectedGeneralChapter(chapterItem); setActiveTab(0); };
  
  const handleBreadcrumbClick = (level) => {
    setPage(1);
    setSearchTerm("");
    if (level === "classes") { setSelectedClass(null); setSelectedSubject(null); setSelectedChapter(null); }
    else if (level === "subjects") { setSelectedSubject(null); setSelectedChapter(null); }
    else if (level === "chapters") { setSelectedChapter(null); }
    else if (level === "generalSubjects") { setSelectedGeneralSubject(null); setSelectedGeneralChapter(null); }
    else if (level === "generalChapters") { setSelectedGeneralChapter(null); }
  };

  const currentChapter = activeContentTab === 'general' ? selectedGeneralChapter : selectedChapter;
  const videoLessons = currentChapter?.media?.filter((m) => m.type === "video") || [];
  const pdfNotes = currentChapter?.media?.filter((m) => m.type === "pdf") || [];

  const openPdfViewer = (url) => { setPdfUrl(url); setModalState({ ...modalState, pdfViewer: true }); };

  const renderContentPanel = () => (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<VideoLibraryIcon />} iconPosition="start" label="Video Lessons" />
          <Tab icon={<PictureAsPdfIcon />} iconPosition="start" label="PDF Notes" />
        </Tabs>
      </Box>
      {activeTab === 0 && ( <Box> <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}> <Typography variant="h6">Video Lessons ({videoLessons.length})</Typography> <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalState({ ...modalState, video: true })}>Add Video</Button> </Box> <List> {videoLessons.map((video, index) => ( <ListItem key={index} secondaryAction={<IconButton edge="end" onClick={() => handleDeleteMedia(video)} color="error"><DeleteIcon /></IconButton>}> <ListItemIcon><VideoLibraryIcon /></ListItemIcon> <ListItemText primary={video.title} secondary={<Link href={video.url} target="_blank" rel="noopener">{video.url}</Link>} /> </ListItem> ))} {videoLessons.length === 0 && <Typography sx={{ textAlign: "center", p: 2, color: "text.secondary" }}>No video lessons added yet.</Typography>} </List> </Box> )}
      {activeTab === 1 && ( <Box> <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}> <Typography variant="h6">PDF Notes ({pdfNotes.length})</Typography> <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalState({ ...modalState, pdf: true })}>Add PDF</Button> </Box> <List> {pdfNotes.map((pdf, index) => ( <ListItem key={index} disablePadding secondaryAction={<><IconButton edge="end" onClick={(e) => { e.stopPropagation(); setEditPdfForm({ url: pdf.url, title: pdf.title }); setModalState({ ...modalState, editPdf: true }); }} color="primary"><EditIcon /></IconButton><IconButton edge="end" sx={{ ml: 1 }} onClick={(e) => { e.stopPropagation(); handleDeleteMedia(pdf); }} color="error"><DeleteIcon /></IconButton></>}> <ListItemButton onClick={() => openPdfViewer(pdf.url)}> <ListItemIcon><PictureAsPdfIcon /></ListItemIcon> <ListItemText primary={pdf.title} secondary="Click to view" /> </ListItemButton> </ListItem> ))} {pdfNotes.length === 0 && <Typography sx={{ textAlign: "center", p: 2, color: "text.secondary" }}>No PDF notes added yet.</Typography>} </List> </Box> )}
    </Paper>
  );

  const renderSelectionList = (items, type, handler, getCountText) => {
    const icons = { Class: <SchoolIcon sx={{ color: "primary.main" }} />, Subject: <BookIcon sx={{ color: "secondary.main" }} />, Chapter: <FolderIcon sx={{ color: "success.main" }} /> };
    const paginatedItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    return ( <Box> <Grid container spacing={3}> {paginatedItems.length > 0 ? ( paginatedItems.map((item) => ( <Grid item xs={12} sm={6} md={4} key={item._id}> <Card sx={{ transition: "transform 0.2s, box-shadow 0.2s", "&:hover": { transform: "translateY(-4px)", boxShadow: (theme) => theme.shadows[4], }, }}> <CardActionArea sx={{ p: 2.5 }} onClick={() => handler(item)}> <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}> <Box sx={{ backgroundColor: "action.hover", borderRadius: "50%", p: 1.5, display: "flex", }}>{icons[type]}</Box> <Box> <Typography variant="h6" sx={{ fontWeight: 600 }}>{item.name}</Typography> <Typography variant="body2" color="text.secondary">{getCountText(item)}</Typography> </Box> </Box> </CardActionArea> </Card> </Grid> )) ) : (<Grid item xs={12}><Typography sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>No results found for &quot;{searchTerm}&quot;.</Typography></Grid>)} </Grid> {items.length > ITEMS_PER_PAGE && ( <Stack alignItems="center" sx={{ mt: 4, width: '100%' }}> <Pagination count={Math.ceil(items.length / ITEMS_PER_PAGE)} page={page} onChange={handlePageChange} color="primary" /> </Stack> )} </Box> );
  };
  
  const getCountTextForClass = (item) => `${subjects.filter((s) => s.classId && s.classId._id === item._id).length} Subject(s)`;
  const getCountTextForSubject = (item) => `${chapters.filter((c) => c.subjectId && c.subjectId._id === item._id).length} Chapter(s)`;
  const getCountTextForChapter = (item) => `${item.media?.length || 0} Content Item(s)`;
  const getCountTextForGeneralSubject = (item) => `${generalChapters.filter((c) => c.generalSubjectId && c.generalSubjectId._id === item._id).length} Chapter(s)`;
  const getCountTextForGeneralChapter = (item) => `${item.media?.length || 0} Content Item(s)`;

  const renderView = () => {
    const filterByName = (items) => items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (loading && !currentChapter) return <Loader contained />;
    if (currentChapter) return renderContentPanel();
    
    if (activeContentTab === "class") {
        if (selectedSubject) return renderSelectionList(filterByName(chapters.filter((c) => c.subjectId && c.subjectId._id === selectedSubject._id)), "Chapter", handleChapterSelect, getCountTextForChapter);
        if (selectedClass) return renderSelectionList(filterByName(subjects.filter((s) => s.classId && s.classId._id === selectedClass._id)), "Subject", handleSubjectSelect, getCountTextForSubject);
        return renderSelectionList(filterByName(classes), "Class", handleClassSelect, getCountTextForClass);
    } else {
        if(selectedGeneralSubject) return renderSelectionList(filterByName(generalChapters.filter((c) => c.generalSubjectId && c.generalSubjectId._id === selectedGeneralSubject._id)), "Chapter", handleGeneralChapterSelect, getCountTextForGeneralChapter);
        return renderSelectionList(filterByName(generalSubjects), "Subject", handleGeneralSubjectSelect, getCountTextForGeneralSubject);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Content Management</Typography>
      
       <Tabs value={activeContentTab} onChange={(e, newValue) => { setActiveContentTab(newValue); setPage(1); setSearchTerm(""); }} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tab label="Class Content" value="class" />
            <Tab label="General Content" value="general" />
        </Tabs>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
                {activeContentTab === 'class' ? [
                    <Link key="classes-crumb" component="button" underline="hover" color="inherit" onClick={() => handleBreadcrumbClick("classes")}>Classes</Link>,
                    selectedClass && <Link key="class-crumb" component="button" underline="hover" color="inherit" onClick={() => handleBreadcrumbClick("subjects")}>{selectedClass.name}</Link>,
                    selectedSubject && <Link key="subject-crumb" component="button" underline="hover" color="inherit" onClick={() => handleBreadcrumbClick("chapters")}>{selectedSubject.name}</Link>,
                    selectedChapter && <Typography key="chapter-crumb" color="text.primary">{selectedChapter.name}</Typography>
                ] : [
                    <Link key="general-subjects-crumb" component="button" underline="hover" color="inherit" onClick={() => handleBreadcrumbClick("generalSubjects")}>General Subjects</Link>,
                    selectedGeneralSubject && <Link key="general-subject-crumb" component="button" underline="hover" color="inherit" onClick={() => handleBreadcrumbClick("generalChapters")}>{selectedGeneralSubject.name}</Link>,
                    selectedGeneralChapter && <Typography key="general-chapter-crumb" color="text.primary">{selectedGeneralChapter.name}</Typography>
                ]}
            </Breadcrumbs>
            
            {!currentChapter && (
                <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1); 
                    }}
                    InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                        </InputAdornment>
                    ),
                    }}
                    sx={{ width: { xs: '100%', sm: 300 }, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                />
            )}
        </Box>

      {error && (<Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>{error}</Alert>)}
      {renderView()}

      {/* MODALS */}
      <Dialog open={modalState.video} onClose={() => setModalState({ ...modalState, video: false })} fullWidth maxWidth="sm">
        <DialogTitle>Add New Video Lesson</DialogTitle>
        <DialogContent dividers><Box component="form" onSubmit={handleAddVideo} sx={{ mt: 1 }}><TextField autoFocus margin="dense" required fullWidth label="Video Title" value={videoForm.title} onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })} /><TextField margin="dense" required fullWidth label="Video URL" value={videoForm.url} onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })} /></Box></DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setModalState({ ...modalState, video: false })}>Cancel</Button><Button onClick={handleAddVideo} variant="contained">Add Video</Button></DialogActions>
      </Dialog>
      
      <Dialog open={modalState.pdf} onClose={() => setModalState({ ...modalState, pdf: false })} fullWidth maxWidth="sm">
        <DialogTitle>Add New Document</DialogTitle>
        <DialogContent dividers>
          <Box component="form" onSubmit={handlePdfUpload} sx={{ mt: 1 }}>
            <TextField autoFocus margin="dense" required fullWidth label="Document Title" value={pdfForm.title} onChange={(e) => setPdfForm({ ...pdfForm, title: e.target.value })} />
            <Button component="label" role={undefined} variant="contained" tabIndex={-1} startIcon={<UploadFileIcon />} sx={{ mt: 2 }}>Select Document<VisuallyHiddenInput type="file" accept=".pdf,.docx" onChange={(e) => setPdfForm({ ...pdfForm, file: e.target.files[0] })} /></Button>
            {pdfForm.file && (<Typography sx={{ mt: 1, display: 'inline-block', ml: 2 }}>{pdfForm.file.name}</Typography>)}
             <Typography variant="caption" display="block" sx={{ mt: 1.5, color: 'text.secondary' }}>You can upload a PDF directly or a .docx file which will be automatically converted to PDF.</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setModalState({ ...modalState, pdf: false })}>Cancel</Button><Button onClick={handlePdfUpload} variant="contained" disabled={uploading}>{uploading ? "Uploading..." : "Upload & Add"}</Button></DialogActions>
      </Dialog>
      
      <Dialog open={modalState.editPdf} onClose={() => setModalState({ ...modalState, editPdf: false })} fullWidth maxWidth="sm">
        <DialogTitle>Edit PDF Title</DialogTitle>
        <DialogContent dividers><Box component="form" onSubmit={handleEditPdfTitle} sx={{ mt: 1 }}><TextField autoFocus margin="dense" required fullWidth label="New Title" value={editPdfForm.title} onChange={(e) => setEditPdfForm({ ...editPdfForm, title: e.target.value })} /></Box></DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setModalState({ ...modalState, editPdf: false })}>Cancel</Button><Button onClick={handleEditPdfTitle} variant="contained">Save Changes</Button></DialogActions>
      </Dialog>

      <Dialog open={modalState.pdfViewer} onClose={() => setModalState({ ...modalState, pdfViewer: false })} fullWidth maxWidth="lg" PaperProps={{ sx: { height: "90vh" } }}>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>PDF Viewer<IconButton onClick={() => setModalState({ ...modalState, pdfViewer: false })}><CloseIcon /></IconButton></DialogTitle>
        <DialogContent dividers sx={{ p: 0, overflow: "hidden" }}>
          {pdfUrl ? (<iframe title="PDF Viewer" src={`${pdfUrl}#toolbar=0`} width="100%" height="100%" style={{ border: "none" }} onContextMenu={(e) => e.preventDefault()} />) : (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>)}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ContentManagementView;