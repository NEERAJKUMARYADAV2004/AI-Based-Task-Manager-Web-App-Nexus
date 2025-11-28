import React, { useState, useEffect, useRef } from 'react';
import { Card, CustomButton, IconButton } from './UI';
import Sidebar from './Sidebar';
import Header from './Header';

// --- HELPER FUNCTIONS ---
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// --- MOCK DATA ---
const CURRENT_USER_ID = 'user1'; // Simulating logged-in user 'ironman7232'

const initialTeamsMock = [
    { id: 'team1', name: 'Nexus Development', description: 'Core dev team for Nexus AI.', ownerId: 'user1' },
    { id: 'team2', name: 'Marketing Crew', description: 'Social media and outreach.', ownerId: 'user4' },
];

const initialMembersMock = [
    { id: 'user1', name: 'ironman7232', avatar: '🤖', role: 'Owner', teamId: 'team1' },
    { id: 'user2', name: 'Alice', avatar: '👩', role: 'Editor', teamId: 'team1' },
    { id: 'user3', name: 'Bob', avatar: '👨', role: 'Viewer', teamId: 'team1' },
    { id: 'user4', name: 'Charlie', avatar: '🧑‍💻', role: 'Owner', teamId: 'team2' },
    { id: 'user1', name: 'ironman7232', avatar: '🤖', role: 'Editor', teamId: 'team2' },
];

const initialTasksMock = [
    { id: 'st1', title: 'Implement Auth Flow', description: 'Setup login.', status: 'In Progress', assignedTo: 'user2', teamId: 'team1', priority: 'High', dueDate: new Date('2025-11-20'), workplace: 'Office', comments: [] },
    { id: 'st2', title: 'Design Landing Page', description: 'Figma mocks.', status: 'Not Started', assignedTo: null, teamId: 'team1', priority: 'Medium', dueDate: new Date('2025-12-01'), workplace: 'Home', comments: [] },
];

const CollaborationPage = ({ activeMenu, setActiveMenu, onSignOut, userName }) => {
    // --- STATE WITH LOCALSTORAGE PERSISTENCE ---
    
    // Helper to load from local storage or fallback to mock
    const loadState = (key, fallback) => {
        const saved = localStorage.getItem(key);
        if (saved) {
            // Need to revive Date objects for tasks
            const parsed = JSON.parse(saved);
            if (key === 'nexus-collab-tasks') {
                return parsed.map(t => ({ ...t, dueDate: new Date(t.dueDate) }));
            }
            return parsed;
        }
        return fallback;
    };

    const [teams, setTeams] = useState(() => loadState('nexus-collab-teams', initialTeamsMock));
    const [members, setMembers] = useState(() => loadState('nexus-collab-members', initialMembersMock));
    const [tasks, setTasks] = useState(() => loadState('nexus-collab-tasks', initialTasksMock));
    
    // --- EFFECTS TO SAVE TO LOCAL STORAGE ---
    useEffect(() => { localStorage.setItem('nexus-collab-teams', JSON.stringify(teams)); }, [teams]);
    useEffect(() => { localStorage.setItem('nexus-collab-members', JSON.stringify(members)); }, [members]);
    useEffect(() => { localStorage.setItem('nexus-collab-tasks', JSON.stringify(tasks)); }, [tasks]);

    
    const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || null);
    const [selectedTask, setSelectedTask] = useState(null); 

    // --- FORM STATES ---
    const [viewState, setViewState] = useState('board'); 
    
    const [taskFormData, setTaskFormData] = useState({ title: '', description: '', dueDate: '', priority: 'Medium', workplace: '', status: 'Not Started' });
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [teamFormData, setTeamFormData] = useState({ name: '', description: '' });
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberRole, setNewMemberRole] = useState('Viewer'); // Default role for new members 

    // Voice State
    const [isListening, setIsListening] = useState(false);
    const [activeMicField, setActiveMicField] = useState(null); 
    const [countdown, setCountdown] = useState(0);
    const autoActionTimerRef = useRef(null);

    // --- DERIVED DATA ---
    const currentTeam = teams.find(t => t.id === selectedTeamId);
    const currentTeamMembers = members.filter(m => m.teamId === selectedTeamId);
    const currentTeamTasks = tasks.filter(t => t.teamId === selectedTeamId);
    
    const userMemberRecord = currentTeamMembers.find(m => m.id === CURRENT_USER_ID);
    const userRole = userMemberRecord ? userMemberRecord.role : 'Viewer'; 
    const isOwner = userRole === 'Owner';
    const canWrite = userRole === 'Owner' || userRole === 'Editor';

    // --- HANDLERS ---
    const cancelAutoAction = () => {
        if (autoActionTimerRef.current) {
            clearTimeout(autoActionTimerRef.current);
            autoActionTimerRef.current = null;
        }
        if (countdown > 0) setCountdown(0);
    };

    const handleVoiceInput = (field) => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Voice input is not supported.");
            return;
        }
        cancelAutoAction();
        setActiveMicField(field);

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => {
            setIsListening(false);
            setActiveMicField(null);
            if (taskFormData.title.trim()) {
                setCountdown(5);
                autoActionTimerRef.current = setTimeout(() => {
                    if (viewState === 'createTask') handleSaveTask();
                    if (viewState === 'editTask') handleSaveTask();
                    setCountdown(0);
                }, 5000);
            }
        };
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setTaskFormData(prev => ({ ...prev, [field === 'name' ? 'title' : 'description']: transcript }));
        };
        recognition.start();
    };

    const handleCreateTeam = () => {
        if (!teamFormData.name.trim()) return;
        const newTeam = {
            id: `team-${Date.now()}`,
            name: teamFormData.name,
            description: teamFormData.description,
            ownerId: CURRENT_USER_ID
        };
        setTeams([...teams, newTeam]);
        setMembers([...members, { id: CURRENT_USER_ID, name: userName, avatar: '🤖', role: 'Owner', teamId: newTeam.id }]);
        
        setTeamFormData({ name: '', description: '' });
        setSelectedTeamId(newTeam.id);
        setViewState('board');
    };

    const handleUpdateTeam = () => {
        if (!teamFormData.name.trim()) return;
        setTeams(teams.map(t => t.id === selectedTeamId ? { ...t, name: teamFormData.name, description: teamFormData.description } : t));
        setViewState('board');
    };

    const handleAddMember = () => {
        if (!newMemberName.trim()) return;
        const newMemberId = `user-${Date.now()}`;
        const newMember = {
            id: newMemberId,
            name: newMemberName,
            avatar: '👤', 
            role: newMemberRole, // Use selected role
            teamId: selectedTeamId
        };
        setMembers([...members, newMember]);
        setNewMemberName('');
        setNewMemberRole('Viewer'); // Reset role
    };

    const handleChangeMemberRole = (memberId, newRole) => {
        setMembers(members.map(m => m.id === memberId && m.teamId === selectedTeamId ? { ...m, role: newRole } : m));
    };

    const handleRemoveMember = (memberId) => {
        if (window.confirm('Remove this member from the team?')) {
            setMembers(members.filter(m => !(m.id === memberId && m.teamId === selectedTeamId)));
        }
    };

    const openCreateTask = () => {
        cancelAutoAction();
        setTaskFormData({ title: '', description: '', dueDate: '', priority: 'Medium', workplace: '', status: 'Not Started' });
        setViewState('createTask');
    };

    const openEditTask = (task) => {
        cancelAutoAction();
        setEditingTaskId(task.id);
        setTaskFormData({
            title: task.title,
            description: task.description,
            dueDate: formatDateForInput(task.dueDate),
            priority: task.priority,
            workplace: task.workplace || '',
            status: task.status
        });
        setViewState('editTask');
    };

    const handleSaveTask = (e) => {
        if (e) e.preventDefault();
        cancelAutoAction();
        if (!taskFormData.title.trim()) return;

        let taskDueDate;
        if (taskFormData.dueDate) {
            const [year, month, day] = taskFormData.dueDate.split('-');
            taskDueDate = new Date(year, month - 1, day);
        } else {
            taskDueDate = new Date();
            taskDueDate.setDate(taskDueDate.getDate() + 7);
        }

        if (viewState === 'createTask') {
            const newTask = {
                id: `st-${Date.now()}`,
                ...taskFormData,
                dueDate: taskDueDate,
                assignedTo: null,
                teamId: selectedTeamId,
                comments: []
            };
            setTasks([...tasks, newTask]);
        } else if (viewState === 'editTask') {
            setTasks(tasks.map(t => t.id === editingTaskId ? { ...t, ...taskFormData, dueDate: taskDueDate } : t));
        }

        setViewState('board');
        setEditingTaskId(null);
    };

    const handleDeleteTask = (id) => {
        if(window.confirm("Delete this shared task?")) {
            setTasks(tasks.filter(t => t.id !== id));
            if(selectedTask?.id === id) setSelectedTask(null);
        }
    };

    const handleAssignTask = (taskId, memberId) => {
        setTasks(tasks.map(t => t.id === taskId ? { ...t, assignedTo: memberId } : t));
        if (selectedTask?.id === taskId) setSelectedTask(prev => ({ ...prev, assignedTo: memberId }));
    };

    // Status Badge Styles Helper
    const getStatusStyle = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-500/20 text-green-400 border border-green-500/30';
            case 'In Progress': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
            case 'Not Started': return 'bg-gray-500/20 text-gray-400 border border-gray-500/30'; 
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="flex h-full w-full overflow-hidden">
            <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={onSignOut} />

            <main className="flex-1 flex overflow-hidden">
                
                {/* --- LEFT PANEL: TEAMS --- */}
                <div className="w-64 p-4 flex flex-col h-full bg-black/10 dark:bg-white/5 border-r border-gray-700 dark:border-white/10 flex-shrink-0">
                    <h3 className="text-xl font-bold text-white mb-4">Teams</h3>
                    <nav className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                        {teams
                            .filter(t => members.some(m => m.teamId === t.id && m.id === CURRENT_USER_ID))
                            .map(team => (
                            <button
                                key={team.id}
                                onClick={() => { setSelectedTeamId(team.id); setViewState('board'); setSelectedTask(null); }}
                                className={`w-full text-left p-3 my-1 rounded-lg transition-colors duration-200 ${selectedTeamId === team.id ? 'bg-red-600 text-white font-semibold' : 'text-white/70 hover:bg-white/10'}`}
                            >
                                {team.name}
                            </button>
                        ))}
                    </nav>
                    <div className="pt-4 border-t border-white/10">
                         <CustomButton 
                            onClick={() => { setTeamFormData({name: '', description: ''}); setViewState('createTeam'); }} 
                            className="w-full !bg-indigo-600 hover:!bg-indigo-700 text-sm"
                         >
                             + Create Team
                         </CustomButton>
                    </div>
                </div>

                {/* --- CENTER PANEL: WORKSPACE --- */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                     <Header userName={userName} />
                     
                     <div className="flex-grow p-6 overflow-y-auto custom-scrollbar">
                         
                         {/* HEADER AREA */}
                         <div className="flex justify-between items-center mb-6">
                            <div className='flex items-center gap-3'>
                                <h2 className="text-2xl font-bold text-white">
                                    {currentTeam ? currentTeam.name : 'Select a Team'}
                                </h2>
                                {currentTeam && isOwner && viewState === 'board' && (
                                    <IconButton 
                                        icon={<span className="text-sm">✏️</span>} 
                                        onClick={() => { setTeamFormData({ name: currentTeam.name, description: currentTeam.description || '' }); setViewState('editTeam'); }}
                                        className="!p-1 !bg-white/10 hover:!bg-white/20"
                                        title="Edit Team & Members"
                                    />
                                )}
                            </div>
                            
                            {canWrite && viewState === 'board' && (
                                <CustomButton onClick={openCreateTask} className="!bg-red-600 hover:!bg-red-700 text-sm">
                                    + Add Shared Task
                                </CustomButton>
                            )}
                         </div>

                         {/* --- DYNAMIC CONTENT AREA --- */}

                         {/* 1. CREATE/EDIT TEAM FORM */}
                         {(viewState === 'createTeam' || viewState === 'editTeam') && (
                             <Card title={viewState === 'createTeam' ? "Create New Team" : "Edit Team & Members"} className="max-w-2xl mx-auto !bg-slate-800/90">
                                 <div className="space-y-6">
                                     <div className="space-y-4">
                                         <div>
                                             <label className="text-xs text-white/70 mb-1 block">Team Name</label>
                                             <input type="text" value={teamFormData.name} onChange={(e) => setTeamFormData({...teamFormData, name: e.target.value})} className="w-full p-3 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-400 border-transparent" />
                                         </div>
                                         <div>
                                             <label className="text-xs text-white/70 mb-1 block">Description</label>
                                             <textarea value={teamFormData.description} onChange={(e) => setTeamFormData({...teamFormData, description: e.target.value})} className="w-full p-3 rounded-lg bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-red-400 border-transparent" rows="3" />
                                         </div>
                                     </div>

                                     {/* MEMBER MANAGEMENT SECTION - Visible in Edit Mode */}
                                     {viewState === 'editTeam' && (
                                         <div>
                                             <h4 className="text-sm font-bold text-white mb-3 border-b border-white/10 pb-2">Manage Members</h4>
                                             <div className="flex gap-2 mb-4 items-end">
                                                 <div className="flex-grow">
                                                     <label className="text-xs text-white/70 mb-1 block">Member Name</label>
                                                     <input 
                                                        type="text" 
                                                        placeholder="New member name" 
                                                        value={newMemberName}
                                                        onChange={(e) => setNewMemberName(e.target.value)}
                                                        className="w-full p-2 rounded bg-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                     />
                                                 </div>
                                                 <div className="w-1/3">
                                                     <label className="text-xs text-white/70 mb-1 block">Role</label>
                                                     <select
                                                        value={newMemberRole}
                                                        onChange={(e) => setNewMemberRole(e.target.value)}
                                                        className="w-full p-2 rounded bg-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 border-none"
                                                     >
                                                         <option value="Viewer">Viewer</option>
                                                         <option value="Editor">Editor</option>
                                                         <option value="Owner">Owner</option>
                                                     </select>
                                                 </div>
                                                 <CustomButton onClick={handleAddMember} className="!bg-indigo-600 !py-2 text-xs h-[36px]">Add</CustomButton>
                                             </div>
                                             <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                                 {currentTeamMembers.map(member => (
                                                     <li key={member.id} className="flex items-center justify-between bg-white/5 p-2 rounded">
                                                         <div className="flex items-center gap-2">
                                                             <span>{member.avatar}</span>
                                                             <span className="text-sm text-white">{member.name}</span>
                                                         </div>
                                                         <div className="flex items-center gap-2">
                                                             <select 
                                                                value={member.role} 
                                                                onChange={(e) => handleChangeMemberRole(member.id, e.target.value)}
                                                                disabled={member.id === CURRENT_USER_ID} 
                                                                className="bg-black/20 text-xs text-white p-1 rounded border border-white/10 focus:outline-none"
                                                             >
                                                                 <option value="Viewer">Viewer (Read)</option>
                                                                 <option value="Editor">Editor (Write)</option>
                                                                 <option value="Owner">Owner (Full)</option>
                                                             </select>
                                                             {member.id !== CURRENT_USER_ID && (
                                                                 <IconButton icon={<span className="text-xs">🗑️</span>} onClick={() => handleRemoveMember(member.id)} className="!p-1 hover:bg-red-500/20 text-red-400"/>
                                                             )}
                                                         </div>
                                                     </li>
                                                 ))}
                                             </ul>
                                         </div>
                                     )}

                                     <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
                                         <CustomButton onClick={() => setViewState('board')} className="!bg-gray-600">Cancel</CustomButton>
                                         <CustomButton onClick={viewState === 'createTeam' ? handleCreateTeam : handleUpdateTeam} className="!bg-green-600">
                                             {viewState === 'createTeam' ? 'Create Team' : 'Save Changes'}
                                         </CustomButton>
                                     </div>
                                 </div>
                             </Card>
                         )}

                         {/* 2. CREATE/EDIT TASK FORM */}
                         {(viewState === 'createTask' || viewState === 'editTask') && (
                             <Card title={viewState === 'createTask' ? "Add Shared Task" : "Edit Task"} className="max-w-3xl mx-auto !bg-slate-800/90 mb-8">
                                 {countdown > 0 && (
                                    <div className="mb-4 bg-indigo-900/50 border border-indigo-500/30 rounded-lg p-3 flex justify-between items-center animate-pulse">
                                        <div className="flex items-center gap-2 text-indigo-200">
                                            <span className="text-xl">⏳</span>
                                            <span>Saving in <strong>{countdown}s</strong>...</span>
                                        </div>
                                        <CustomButton onClick={cancelAutoAction} className="!bg-white/10 hover:!bg-white/20 !py-1 !px-3 text-xs">Tap to Edit / Cancel</CustomButton>
                                    </div>
                                 )}

                                 <form onSubmit={handleSaveTask} className="space-y-4">
                                     <div className="flex items-center gap-4">
                                         <input type="text" value={taskFormData.title} onChange={(e) => { setTaskFormData({...taskFormData, title: e.target.value}); cancelAutoAction(); }} placeholder={isListening && activeMicField === 'name' ? "Listening..." : "Task Name*"} required className={`flex-grow p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400 border border-transparent ${isListening && activeMicField === 'name' ? 'border-red-500 animate-pulse' : ''}`} />
                                         <IconButton icon={<span className="text-xl">🎤</span>} onClick={() => handleVoiceInput('name')} className={`!bg-indigo-600 hover:!bg-indigo-700 !text-white ${isListening && activeMicField === 'name' ? '!bg-red-600 animate-pulse' : ''}`} type="button" />
                                     </div>
                                     <div className="flex items-center gap-4">
                                         <textarea value={taskFormData.description} onChange={(e) => { setTaskFormData({...taskFormData, description: e.target.value}); cancelAutoAction(); }} placeholder={isListening && activeMicField === 'desc' ? "Listening..." : "Description (Optional)"} rows="2" className={`flex-grow p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400 border border-transparent ${isListening && activeMicField === 'desc' ? 'border-red-500 animate-pulse' : ''}`} />
                                         <IconButton icon={<span className="text-xl">🎤</span>} onClick={() => handleVoiceInput('desc')} className={`!bg-indigo-600 hover:!bg-indigo-700 !text-white ${isListening && activeMicField === 'desc' ? '!bg-red-600 animate-pulse' : ''}`} type="button" />
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                         <div><label className="text-xs text-white/50 ml-1">Due Date</label><input type="date" value={taskFormData.dueDate} onChange={(e) => { setTaskFormData({...taskFormData, dueDate: e.target.value}); cancelAutoAction(); }} className="w-full p-3 rounded-lg bg-white/10 text-white appearance-none" /></div>
                                         <div><label className="text-xs text-white/50 ml-1">Priority</label><select value={taskFormData.priority} onChange={(e) => { setTaskFormData({...taskFormData, priority: e.target.value}); cancelAutoAction(); }} className="w-full p-3 rounded-lg bg-white/10 text-white appearance-none"><option>Low</option><option>Medium</option><option>High</option></select></div>
                                         <div><label className="text-xs text-white/50 ml-1">Status</label><select value={taskFormData.status} onChange={(e) => { setTaskFormData({...taskFormData, status: e.target.value}); cancelAutoAction(); }} className="w-full p-3 rounded-lg bg-white/10 text-white appearance-none"><option>Not Started</option><option>In Progress</option><option>Completed</option></select></div>
                                         <div><label className="text-xs text-white/50 ml-1">Workplace</label><input type="text" value={taskFormData.workplace} onChange={(e) => { setTaskFormData({...taskFormData, workplace: e.target.value}); cancelAutoAction(); }} placeholder="e.g. Office" className="w-full p-3 rounded-lg bg-white/10 text-white" /></div>
                                     </div>
                                     <div className="flex justify-end gap-3">
                                         <CustomButton onClick={() => setViewState('board')} className="!bg-gray-600">Cancel</CustomButton>
                                         <CustomButton type="submit" className="!bg-green-600 hover:!bg-green-700">{viewState === 'createTask' ? 'Add Task' : 'Save Changes'}</CustomButton>
                                     </div>
                                 </form>
                             </Card>
                         )}

                         {/* 3. TASK BOARD */}
                         {viewState === 'board' && (
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                 {currentTeamTasks.length > 0 ? currentTeamTasks.map(task => (
                                     <Card 
                                        key={task.id} 
                                        className={`cursor-pointer hover:shadow-red-500/30 transition-all flex flex-col min-h-[180px] ${selectedTask?.id === task.id ? 'ring-2 ring-red-500' : ''}`}
                                        onClick={() => setSelectedTask(task)}
                                     >
                                         <div className="flex justify-between items-start mb-2">
                                             <span className="text-base font-semibold text-white break-words mr-2">{task.title}</span>
                                             <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap font-medium ${getStatusStyle(task.status)}`}>
                                                 {task.status}
                                             </span>
                                         </div>
                                         <p className="text-xs text-white/70 mb-3 flex-grow">{task.description}</p>
                                         
                                         <div className="flex flex-wrap gap-2 text-[10px] text-white/50 mb-2">
                                             <span className={`px-1.5 rounded border ${task.priority === 'High' ? 'border-red-500 text-red-400' : 'border-gray-500'}`}>{task.priority}</span>
                                             <span>📅 {formatDate(task.dueDate)}</span>
                                         </div>

                                         <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs text-white/60">
                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                <select 
                                                    className="bg-transparent text-xs text-white/90 focus:outline-none p-0 cursor-pointer appearance-none hover:text-red-400 max-w-[80px]"
                                                    value={task.assignedTo || ''}
                                                    disabled={!canWrite} 
                                                    onChange={(e) => handleAssignTask(task.id, e.target.value)}
                                                >
                                                    <option value="" className="bg-slate-700">Unassigned</option>
                                                    {currentTeamMembers.map(m => <option key={m.id} value={m.id} className="bg-slate-700">{m.name}</option>)}
                                                </select>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <span>💬 {task.comments.length}</span>
                                                {canWrite && (
                                                    <IconButton 
                                                        icon={<span className="text-xs">✏️</span>} 
                                                        onClick={(e) => { e.stopPropagation(); openEditTask(task); }} 
                                                        className="!p-1 hover:bg-white/10"
                                                    />
                                                )}
                                                {isOwner && (
                                                    <IconButton 
                                                        icon={<span className="text-xs">🗑️</span>} 
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }} 
                                                        className="!p-1 hover:bg-red-500/20 text-red-400"
                                                    />
                                                )}
                                            </div>
                                         </div>
                                     </Card>
                                 )) : <p className="text-white/50 col-span-full text-center mt-10">No shared tasks in this team yet.</p>}
                             </div>
                         )}
                     </div>
                </div>

                {/* --- RIGHT PANEL --- */}
                <div className={`w-80 p-4 flex flex-col h-full bg-black/40 border-l border-white/10 flex-shrink-0 transition-transform duration-300 absolute right-0 top-0 z-20 ${selectedTask ? 'translate-x-0' : 'translate-x-full hidden lg:flex lg:translate-x-0 lg:static'}`}>
                    
                    {selectedTask ? (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-white">Task Details</h3>
                                <div className="flex gap-2">
                                    {canWrite && <IconButton icon={<span className="text-xs">✏️</span>} onClick={() => openEditTask(selectedTask)} className="!p-1 hover:bg-white/10"/>}
                                    <button onClick={() => setSelectedTask(null)} className="text-white/50 hover:text-white">✕</button>
                                </div>
                            </div>
                            <div className="flex-grow overflow-y-auto custom-scrollbar space-y-4">
                                <div>
                                    <h4 className="text-xl font-semibold text-white">{selectedTask.title}</h4>
                                    <p className="text-sm text-white/70 mt-1">{selectedTask.description}</p>
                                </div>
                                <div className="text-xs text-white/60 space-y-2 bg-white/5 p-3 rounded-lg">
                                    <div className="flex justify-between"><span>Status:</span> <span className="text-white">{selectedTask.status}</span></div>
                                    <div className="flex justify-between"><span>Priority:</span> <span className={selectedTask.priority === 'High' ? 'text-red-400' : 'text-white'}>{selectedTask.priority}</span></div>
                                    <div className="flex justify-between"><span>Due:</span> <span className="text-white">{formatDate(selectedTask.dueDate)}</span></div>
                                    <div className="flex justify-between"><span>Workplace:</span> <span className="text-white">{selectedTask.workplace || 'N/A'}</span></div>
                                    <div className="flex justify-between"><span>Assigned:</span> <span className="text-white">{members.find(m => m.id === selectedTask.assignedTo)?.name || 'Unassigned'}</span></div>
                                </div>
                                
                                <div className="border-t border-white/10 pt-4">
                                     <h5 className="text-sm font-semibold text-white mb-2">Comments</h5>
                                     <div className="space-y-2 mb-3">
                                        {selectedTask.comments.map((c, i) => (
                                            <div key={i} className="bg-white/5 p-2 rounded text-xs text-white/80">
                                                <span className="text-red-400 font-bold block">{members.find(m=>m.id===c.userId)?.name}:</span>
                                                {c.text}
                                            </div>
                                        ))}
                                     </div>
                                     <form onSubmit={(e) => { 
                                         e.preventDefault(); 
                                         /* Handle Comment */
                                     }}>
                                         <textarea rows="2" placeholder="Add a comment..." className="w-full p-2 text-sm rounded bg-white/10 text-white focus:outline-none focus:ring-1 focus:ring-red-400" />
                                         <div className="text-right mt-2"><CustomButton type="submit" className="!bg-indigo-600 hover:!bg-indigo-700 px-3 py-1 text-xs">Post</CustomButton></div>
                                     </form>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2">Team Members</h3>
                            <p className="text-xs text-white/50 mb-4">You are: <span className="text-red-400 font-bold">{userRole}</span></p>
                            <ul className="space-y-3">
                                {currentTeamMembers.map(member => (
                                    <li key={member.id} className="flex items-center gap-3 text-sm text-white/90">
                                        <span className="text-xl">{member.avatar}</span>
                                        <div className="flex-grow">
                                            <div className="font-medium">{member.name}</div>
                                            <div className="text-xs text-white/50">{member.role}</div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </main>

            <div className="fixed bottom-6 right-6 z-50">
                <IconButton icon={<span className="text-2xl">🤖</span>} className="w-16 h-16 !bg-red-600 hover:!bg-red-700 !text-white !shadow-lg !shadow-red-500/50" onClick={() => alert("Nexus AI Clicked!")} />
            </div>
        </div>
    );
};

export default CollaborationPage;