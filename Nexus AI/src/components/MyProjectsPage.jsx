import React, { useState, useEffect } from 'react';
import { Card, CustomButton, IconButton } from './UI';
import Sidebar from './Sidebar';
import Header from './Header';
import { API_URL, getAuthHeaders } from '../utils/api';

// Helper function to format dates as DD/MM/YYYY
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Helper function to format date for input type="date" (YYYY-MM-DD)
const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const MyProjectsPage = ({ activeMenu, setActiveMenu, onSignOut, userName }) => {
  // --- State ---
  const [projects, setProjects] = useState([]);

  // State for the "Add Project" form
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectStart, setNewProjectStart] = useState('');
  const [newProjectDueDate, setNewProjectDueDate] = useState('');
  const [newProjectPriority, setNewProjectPriority] = useState('Medium');
  const [newProjectStatus, setNewProjectStatus] = useState('Not Started');
  const [showAddForm, setShowAddForm] = useState(false);

  // State for inline editing
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', description: '', startDate: '', dueDate: '', priority: 'Medium', status: '' });

  // --- FETCH PROJECTS ---
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_URL}/projects`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (err) { console.error("Failed to fetch projects", err); }
    };
    fetchProjects();
  }, []);

  // --- Handlers ---
  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    // Calculate default dates if missing
    const startDate = newProjectStart ? new Date(newProjectStart) : new Date();
    let dueDate;
    if (newProjectDueDate) {
        dueDate = new Date(newProjectDueDate);
    } else {
        dueDate = new Date(startDate);
        dueDate.setMonth(startDate.getMonth() + 1); // Default 1 month duration
    }

    const newProjectData = {
      name: newProjectName,
      description: newProjectDesc,
      startDate: startDate,
      dueDate: dueDate,
      priority: newProjectPriority,
      status: newProjectStatus,
    };

    try {
        const res = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(newProjectData)
        });

        if (res.ok) {
            const savedProject = await res.json();
            setProjects([...projects, savedProject]);
            // Reset form and hide it
            setNewProjectName('');
            setNewProjectDesc('');
            setNewProjectStart('');
            setNewProjectDueDate('');
            setNewProjectPriority('Medium');
            setNewProjectStatus('Not Started');
            setShowAddForm(false);
        }
    } catch (err) { console.error("Error adding project", err); }
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
          const res = await fetch(`${API_URL}/projects/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
          if (res.ok) {
              setProjects(projects.filter(p => p._id !== id));
              if (editingProjectId === id) {
                setEditingProjectId(null);
              }
          }
      } catch (err) { console.error("Error deleting project", err); }
    }
  };

  const handleEditClick = (project) => {
    setEditingProjectId(project._id);
    setEditFormData({
      name: project.name,
      description: project.description,
      startDate: formatDateForInput(project.startDate),
      dueDate: formatDateForInput(project.dueDate),
      priority: project.priority,
      status: project.status,
    });
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
  };

  const handleSaveEdit = async (id) => {
    if (!editFormData.name.trim()) return;

    try {
        const res = await fetch(`${API_URL}/projects/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(editFormData)
        });

        if (res.ok) {
            const updatedProject = await res.json();
            setProjects(projects.map(p => p._id === id ? updatedProject : p));
            setEditingProjectId(null);
        }
    } catch (err) { console.error("Error updating project", err); }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Status & Priority Colors ---
  const statusColorClasses = (status) => {
    switch (status) {
      case 'In Progress': return 'border-amber-500 bg-amber-500/10 text-amber-400';
      case 'Completed': return 'border-green-500 bg-green-500/10 text-green-400';
      case 'Not Started': return 'border-gray-500 bg-gray-500/10 text-gray-400';
      default: return 'border-gray-500 bg-gray-500/10 text-gray-400';
    }
  };
   const priorityColorClasses = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-amber-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };


  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={onSignOut} />
      <main className="flex-1 overflow-y-scroll custom-scrollbar relative">
        <Header userName={userName} />
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">My Projects</h2>
            <CustomButton onClick={() => setShowAddForm(!showAddForm)} className="!bg-red-600 hover:!bg-red-700 !shadow-red-500/50">
              {showAddForm ? 'Cancel' : '+ Add Project'}
            </CustomButton>
          </div>

          {/* Add Project Form (Conditional) */}
          {showAddForm && (
            <Card className="mb-8 !bg-slate-800/80">
              <h3 className="text-xl font-bold mb-4 text-white">New Project Details</h3>
              <form onSubmit={handleAddProject} className="space-y-4">
                <input type="text" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Project Name*" required className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400" />
                <textarea value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} placeholder="Description (Optional)" rows="3" className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Start Date</label>
                    <input type="date" value={newProjectStart} onChange={(e) => setNewProjectStart(e.target.value)} className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 appearance-none focus:outline-none focus:ring-2 focus:ring-red-400" />
                  </div>
                   <div>
                    <label className="block text-sm text-white/70 mb-1">Due Date (Optional)</label>
                    <input type="date" value={newProjectDueDate} onChange={(e) => setNewProjectDueDate(e.target.value)} className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 appearance-none focus:outline-none focus:ring-2 focus:ring-red-400" />
                  </div>
                   <div>
                    <label className="block text-sm text-white/70 mb-1">Priority</label>
                    <select value={newProjectPriority} onChange={(e) => setNewProjectPriority(e.target.value)} className="w-full p-3 rounded-lg bg-white/10 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-red-400">
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/70 mb-1">Status</label>
                    <select value={newProjectStatus} onChange={(e) => setNewProjectStatus(e.target.value)} className="w-full p-3 rounded-lg bg-white/10 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-red-400">
                      <option>Not Started</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                  </div>
                </div>
                <div className="text-right">
                  <CustomButton type="submit" className="!bg-green-600 hover:!bg-green-700"> Save Project </CustomButton>
                </div>
              </form>
            </Card>
          )}

          {/* Project List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project._id} className={`flex flex-col border-t-4 ${statusColorClasses(project.status).split(' ')[0]}`} glass={true}>
                {editingProjectId === project._id ? (
                  // --- Edit Form ---
                  <div className="space-y-3 flex flex-col flex-grow">
                    <input type="text" name="name" value={editFormData.name} onChange={handleEditFormChange} className="w-full p-2 rounded bg-white/10 text-white font-bold text-lg focus:outline-none focus:ring-1 focus:ring-red-400" required />
                    <textarea name="description" value={editFormData.description} onChange={handleEditFormChange} rows="3" className="w-full p-2 rounded bg-white/10 text-white/90 text-sm flex-grow focus:outline-none focus:ring-1 focus:ring-red-400" />
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="block text-xs text-white/70 mb-1">Start</label>
                        <input type="date" name="startDate" value={editFormData.startDate} onChange={handleEditFormChange} className="w-full p-2 rounded bg-white/10 text-white/90 appearance-none focus:outline-none focus:ring-1 focus:ring-red-400" />
                      </div>
                       <div>
                        <label className="block text-xs text-white/70 mb-1">Due</label>
                        <input type="date" name="dueDate" value={editFormData.dueDate} onChange={handleEditFormChange} className="w-full p-2 rounded bg-white/10 text-white/90 appearance-none focus:outline-none focus:ring-1 focus:ring-red-400" />
                      </div>
                      <div>
                         <label className="block text-xs text-white/70 mb-1">Priority</label>
                         <select name="priority" value={editFormData.priority} onChange={handleEditFormChange} className="w-full p-2 rounded bg-white/10 text-white/90 appearance-none focus:outline-none focus:ring-1 focus:ring-red-400">
                             <option>Low</option>
                             <option>Medium</option>
                             <option>High</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-xs text-white/70 mb-1">Status</label>
                         <select name="status" value={editFormData.status} onChange={handleEditFormChange} className="w-full p-2 rounded bg-white/10 text-white/90 appearance-none focus:outline-none focus:ring-1 focus:ring-red-400">
                             <option>Not Started</option>
                             <option>In Progress</option>
                             <option>Completed</option>
                         </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-auto pt-3">
                      <CustomButton onClick={handleCancelEdit} className="!bg-gray-500 hover:!bg-gray-600 px-3 py-1 text-xs"> Cancel </CustomButton>
                      <CustomButton onClick={() => handleSaveEdit(project._id)} className="!bg-green-600 hover:!bg-green-700 px-3 py-1 text-xs"> Save </CustomButton>
                    </div>
                  </div>
                ) : (
                  // --- Display View ---
                  <div className="flex flex-col flex-grow justify-between"> {/* Added justify-between */}
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-white mr-2">{project.name}</h3>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${statusColorClasses(project.status)}`}> {project.status} </span>
                        </div>
                        <p className="text-sm text-white/80 mb-4 flex-grow">{project.description || 'No description.'}</p>
                    </div>
                    
                    <div className="flex flex-wrap justify-between items-end gap-y-1 mt-auto pt-2 border-t border-white/10 text-xs text-white/60">
                      <span className="flex items-center gap-1">
                          <span>Start:</span>
                          <span>{formatDate(project.startDate)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                          <span>Due:</span>
                          <span>{formatDate(project.dueDate)}</span>
                      </span>
                      <span className={`font-medium ${priorityColorClasses(project.priority)}`}>
                          {project.priority} Priority
                      </span>
                      <div className="flex gap-2">
                        <IconButton icon={ <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /> </svg> } onClick={() => handleEditClick(project)} className="!p-1.5 !text-blue-400 hover:!bg-blue-500/30 hover:!text-blue-300" />
                        <IconButton icon={ <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /> </svg> } onClick={() => handleDeleteProject(project._id)} className="!p-1.5 !text-red-400 hover:!bg-red-500/30 hover:!text-red-300" />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
             {projects.length === 0 && !showAddForm && ( <p className="text-center text-white/50 col-span-full mt-10">No projects found. Click '+ Add Project' to create one.</p> )}
          </div>
        </div>
        <div className="fixed bottom-6 right-6 z-50">
          <IconButton icon={<span className="text-2xl">🤖</span>} className="w-16 h-16 !bg-red-600 hover:!bg-red-700 !text-white !shadow-lg !shadow-red-500/50" onClick={() => alert("Nexus AI Clicked!")} />
        </div>
      </main>
    </div>
  );
};

export default MyProjectsPage;