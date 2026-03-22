import React, { useState, useEffect, useRef } from 'react';
import { Card, CustomButton, IconButton } from './UI';
import Sidebar from './Sidebar';
import Header from './Header';
import { Calendar, MessageSquare, Edit2, Trash2, Plus, Users, UserPlus, Mic, X } from 'lucide-react';
import { API_URL, getAuthHeaders } from '../utils/api';
import { io } from 'socket.io-client';

// --- CRASH-PROOF HELPERS & CONSTANTS ---
const formatDate = (date) => {
    if (!date) return '';
    try {
        const d = new Date(date);
        return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return ''; }
};

const formatDateForInput = (date) => {
    if (!date) return '';
    try {
        const d = new Date(date);
        return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
    } catch (e) { return ''; }
};

const STATUS_STYLES = {
    'Completed': 'bg-[#064e3b]/80 text-[#34d399]',
    'In Progress': 'bg-[#78350f]/80 text-[#fbbf24]',
    'Not Started': 'bg-slate-700/60 text-slate-300'
};
const PRIORITY_STYLES = {
    'High': 'border border-red-500/30 text-red-400 bg-red-500/5',
    'Medium': 'border border-indigo-500/30 text-indigo-400 bg-indigo-500/5',
    'Low': 'border border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
};

// --- REUSABLE COMPONENTS ---
const InputGrp = ({ label, children }) => (
    <div className="flex-1">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">
            {label}
        </label>
        {children}
    </div>
);

const CollaborationPage = ({ activeMenu, setActiveMenu, onSignOut, userName, userAvatar, notifications, onDismissNotification, onClearAll }) => { // <--- ADDED userAvatar HERE
    // --- STATE ---
    const [currentUser, setCurrentUser] = useState(null);
    const [teams, setTeams] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [members, setMembers] = useState([]); 
    const [socket, setSocket] = useState(null);

    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null); 
    const [viewState, setViewState] = useState('board'); 
    
    const [taskFormData, setTaskFormData] = useState({ taskName: '', description: '', dueDate: '', priority: 'Medium', workplace: '', status: 'Not Started' });
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [teamFormData, setTeamFormData] = useState({ name: '', description: '' });
    const [newMemberEmail, setNewMemberEmail] = useState(''); 
    const [newMemberRole, setNewMemberRole] = useState('Viewer');
    const [stagedMembers, setStagedMembers] = useState([]);

    const [editingComment, setEditingComment] = useState({ index: null, text: '' });

    const [isListening, setIsListening] = useState(false);
    const [activeMicField, setActiveMicField] = useState(null); 

    // Refs
    const silenceTimerRef = useRef(null);
    const speechPauseCountRef = useRef(0);
    const lastResultTimeRef = useRef(Date.now());
    const commentsEndRef = useRef(null);

    // --- INITIALIZATION & SOCKET SETUP ---
    useEffect(() => {
        try {
            const savedTeams = localStorage.getItem('nexus-collab-teams');
            const savedTasks = localStorage.getItem('nexus-collab-tasks');
            if (savedTeams) setTeams(JSON.parse(savedTeams));
            if (savedTasks) setTasks(JSON.parse(savedTasks));
        } catch (e) { console.warn("Failed to parse local storage", e); }

        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);

        const initFetch = async () => {
            try {
                const userRes = await fetch(`${API_URL}/auth/user`, { headers: getAuthHeaders() });
                if (userRes.ok) setCurrentUser(await userRes.json());

                const teamsRes = await fetch(`${API_URL}/teams`, { headers: getAuthHeaders() });
                if (teamsRes.ok) {
                    const data = await teamsRes.json();
                    setTeams(data);
                    localStorage.setItem('nexus-collab-teams', JSON.stringify(data));
                    if (data.length > 0 && !selectedTeamId) setSelectedTeamId(data[0]._id || data[0].id);
                }
            } catch (e) { console.error("Initialization error", e); }
        };

        initFetch();
        return () => newSocket.close();
    }, []);

    // --- ROOM JOINING & REAL-TIME LISTENER ---
    useEffect(() => {
        if (!selectedTeamId || !socket) return;

        const fetchTasks = async () => {
            try {
                const res = await fetch(`${API_URL}/teams/${selectedTeamId}/tasks`, { headers: getAuthHeaders() });
                if (res.ok) {
                    const data = await res.json();
                    const parsedTasks = data.map(t => ({ ...t, dueDate: new Date(t.dueDate) }));
                    setTasks(parsedTasks);
                    localStorage.setItem('nexus-collab-tasks', JSON.stringify(parsedTasks));
                }
            } catch (e) { console.error(e); }
        };

        fetchTasks();
        socket.emit('join_team', selectedTeamId);

        const handleUpdate = (data) => {
            if (data.type === 'NEW_TASK') {
                setTasks(prev => [...prev, { ...data.payload, dueDate: new Date(data.payload.dueDate) }]);
            } else if (data.type === 'UPDATE_TASK') {
                const updatedPayload = { ...data.payload, dueDate: new Date(data.payload.dueDate) };
                setTasks(prev => prev.map(t => (t._id || t.id) === updatedPayload._id ? updatedPayload : t));
                setSelectedTask(prev => (prev?._id || prev?.id) === updatedPayload._id ? updatedPayload : prev);
            } else if (data.type === 'DELETE_TASK') {
                setTasks(prev => prev.filter(t => (t._id || t.id) !== data.payload));
                setSelectedTask(prev => (prev?._id || prev?.id) === data.payload ? null : prev);
            }
        };

        socket.on('receive_update', handleUpdate);
        return () => socket.off('receive_update', handleUpdate);
    }, [selectedTeamId, socket]);

    // --- AUTO SCROLL COMMENTS ---
    useEffect(() => {
        if (commentsEndRef.current) {
            commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [selectedTask?.comments]);

    // --- SAFE DERIVED DATA ---
    const safeTeams = Array.isArray(teams) ? teams : [];
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    
    const currentTeam = safeTeams.find(t => (t._id || t.id) === selectedTeamId);
    const currentTeamMembers = currentTeam?.members?.length ? currentTeam.members : [];
    const currentTeamTasks = safeTasks.filter(t => (t.teamId === selectedTeamId || t.teamId === currentTeam?.id));
    
    const isOwner = Boolean(currentUser?._id && ((currentTeam?.admin === currentUser._id) || (currentTeam?.ownerId === currentUser._id)));
    const userRole = isOwner ? 'Owner' : 'Viewer/Editor'; 
    const canWrite = true;

    // --- HANDLERS: VOICE (10s Wait, Max 5 Stacks, No Auto-Save) ---
    const handleVoiceInput = (field) => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return alert("Voice input not supported.");
        
        setActiveMicField(field);
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'en-US';
        recognition.continuous = true; 
        recognition.interimResults = true; 

        let finalTranscript = '';
        speechPauseCountRef.current = 0;
        lastResultTimeRef.current = Date.now();

        const startSilenceTimer = () => {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => {
                recognition.stop();
            }, 10000); 
        };

        recognition.onstart = () => {
            setIsListening(true);
            startSilenceTimer();
        };

        recognition.onresult = (e) => {
            let currentTranscript = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) {
                if (e.results[i].isFinal) {
                    finalTranscript += e.results[i][0].transcript + ' ';
                } else {
                    currentTranscript += e.results[i][0].transcript;
                }
            }
            
            const transcript = (finalTranscript + currentTranscript).trim();
            if (!transcript) return;

            if (field === 'taskName') setTaskFormData(p => ({ ...p, taskName: transcript }));
            else if (field === 'taskDesc') setTaskFormData(p => ({ ...p, description: transcript }));
            else if (field === 'teamName') setTeamFormData(p => ({ ...p, name: transcript }));
            else if (field === 'teamDesc') setTeamFormData(p => ({ ...p, description: transcript }));

            const now = Date.now();
            if (now - lastResultTimeRef.current > 2000) {
                speechPauseCountRef.current += 1;
            }
            lastResultTimeRef.current = now;

            if (speechPauseCountRef.current >= 5) {
                clearTimeout(silenceTimerRef.current);
                recognition.stop();
            } else {
                startSilenceTimer(); 
            }
        };

        recognition.onend = () => {
            clearTimeout(silenceTimerRef.current);
            setIsListening(false); 
            setActiveMicField(null);
        };

        recognition.start();
    };

    // --- STRICT BACKEND-SYNCED HANDLERS: TEAMS ---
    const openCreateTeam = () => { setTeamFormData({ name: '', description: '' }); setStagedMembers([]); setViewState('createTeam'); };

    const handleCreateTeam = async () => {
        if (!teamFormData.name.trim()) return alert("Team name required.");
        try {
            const res = await fetch(`${API_URL}/teams`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(teamFormData) });
            if (res.ok) {
                const newTeam = await res.json();
                setTeams([...safeTeams, newTeam]);
                setSelectedTeamId(newTeam._id); 
                setViewState('board');
            } else alert("Failed to create team.");
        } catch (e) { console.error(e); }
    };

    const handleUpdateTeam = async () => {
        if (!teamFormData.name.trim()) return alert("Team name required.");
        try {
            const res = await fetch(`${API_URL}/teams/${selectedTeamId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ name: teamFormData.name, description: teamFormData.description }) });
            if (res.ok) {
                setTeams(safeTeams.map(t => (t._id || t.id) === selectedTeamId ? { ...t, name: teamFormData.name, description: teamFormData.description } : t));
                setViewState('board');
            } else alert("Failed to update team details.");
        } catch (e) { console.error(e); }
    };

    const handleDeleteTeam = async () => {
        if (!isOwner || !window.confirm(`Delete "${currentTeam?.name}" entirely?`)) return;
        try {
            const res = await fetch(`${API_URL}/teams/${selectedTeamId}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (res.ok) {
                const updatedTeams = safeTeams.filter(t => (t._id || t.id) !== selectedTeamId);
                setTeams(updatedTeams); setTasks(safeTasks.filter(t => t.teamId !== selectedTeamId));
                setSelectedTeamId(updatedTeams[0]?._id || updatedTeams[0]?.id || null); 
                setViewState('board');
            } else alert("Failed to delete team.");
        } catch(e) { console.error(e); }
    };

    const handleAddMember = async () => {
        const email = newMemberEmail.trim();
        if (!email.includes('@')) return alert("Valid email required.");
        const newMember = { _id: `temp-${Date.now()}`, name: email.split('@')[0], email, avatar: '👤', role: newMemberRole };
        
        if (viewState === 'createTeam') setStagedMembers([...stagedMembers, newMember]);
        else if (isOwner) {
            const updatedMembers = [...(currentTeam.members || []), newMember];
            try {
                const res = await fetch(`${API_URL}/teams/${selectedTeamId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ members: updatedMembers }) });
                if (res.ok) setTeams(safeTeams.map(t => (t._id || t.id) === selectedTeamId ? { ...t, members: updatedMembers } : t));
            } catch (e) { console.error(e); }
        }
        setNewMemberEmail(''); setNewMemberRole('Viewer');
    };

    const handleRemoveMember = async (memberId) => {
        if (viewState === 'createTeam') setStagedMembers(stagedMembers.filter(sm => sm._id !== memberId));
        else if (isOwner && window.confirm('Remove member?')) {
            const updatedMembers = (currentTeam.members || []).filter(m => (m._id || m.id) !== memberId);
            try {
                const res = await fetch(`${API_URL}/teams/${selectedTeamId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ members: updatedMembers }) });
                if (res.ok) setTeams(safeTeams.map(t => (t._id || t.id) === selectedTeamId ? { ...t, members: updatedMembers } : t));
            } catch (e) { console.error(e); }
        }
    };

    const handleChangeMemberRole = async (memberId, newRole) => {
        if (viewState === 'createTeam') setStagedMembers(stagedMembers.map(sm => sm._id === memberId ? { ...sm, role: newRole } : sm));
        else if (isOwner) {
            const updatedMembers = (currentTeam.members || []).map(m => (m._id || m.id) === memberId ? { ...m, role: newRole } : m);
            try {
                const res = await fetch(`${API_URL}/teams/${selectedTeamId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ members: updatedMembers }) });
                if (res.ok) setTeams(safeTeams.map(t => (t._id || t.id) === selectedTeamId ? { ...t, members: updatedMembers } : t));
            } catch (e) { console.error(e); }
        }
    };

    // --- HANDLERS: TASKS ---
    const openCreateTask = () => {
        setTaskFormData({ taskName: '', description: '', dueDate: '', priority: 'Medium', workplace: '', status: 'Not Started' });
        setViewState('createTask');
    };

    const openEditTask = (task) => {
        setEditingTaskId(task._id || task.id);
        setTaskFormData({
            taskName: task.taskName || task.title || '',
            description: task.description || '',
            dueDate: formatDateForInput(task.dueDate),
            priority: task.priority || 'Medium',
            workplace: task.workplace || '',
            status: task.status || 'Not Started'
        });
        setViewState('editTask');
    };

    const handleSaveTask = async (e) => {
        if (e) e.preventDefault();
        if (!taskFormData.taskName.trim()) return;

        const payload = {
            ...taskFormData,
            dueDate: taskFormData.dueDate || new Date(Date.now() + 7*86400000).toISOString()
        };

        if (viewState === 'createTask') {
            try {
                const res = await fetch(`${API_URL}/teams/${selectedTeamId}/tasks`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(payload) });
                if (res.ok) {
                    const newTask = await res.json();
                    setTasks(prev => [...(Array.isArray(prev)?prev:[]), { ...newTask, dueDate: new Date(newTask.dueDate) }]);
                    
                    socket?.emit('send_update', { 
                        teamId: selectedTeamId, type: 'NEW_TASK', payload: newTask,
                        senderId: currentUser?._id, senderName: currentUser?.name,
                        actionMessage: `created a new task: "${newTask.taskName}"`
                    });
                } else alert("Failed to save task to database.");
            } catch (e) { console.error(e); }
        } else if (viewState === 'editTask') {
            try {
                const res = await fetch(`${API_URL}/tasks/${editingTaskId}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) });
                if (res.ok) {
                    const updatedTask = await res.json();
                    const parsedUpdated = { ...updatedTask, dueDate: new Date(updatedTask.dueDate) };
                    setTasks(prev => (Array.isArray(prev)?prev:[]).map(t => (t._id || t.id) === editingTaskId ? parsedUpdated : t));
                    if ((selectedTask?._id || selectedTask?.id) === editingTaskId) setSelectedTask(parsedUpdated);
                    
                    socket?.emit('send_update', { 
                        teamId: selectedTeamId, type: 'UPDATE_TASK', payload: updatedTask,
                        senderId: currentUser?._id, senderName: currentUser?.name,
                        actionMessage: `updated the task "${updatedTask.taskName}"`
                    });
                } else alert("Failed to update task.");
            } catch (e) { console.error(e); }
        }
        setViewState(selectedTask && viewState === 'editTask' ? 'taskDetails' : 'board');
        setEditingTaskId(null);
    };

    const handleAction = async (action, id, val) => {
        const targetTask = safeTasks.find(t => (t._id || t.id) === id);
        
        if (action === 'deleteTask' && isOwner && window.confirm("Delete shared task?")) { 
            try {
                const res = await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
                if (res.ok) {
                    setTasks(prev => (Array.isArray(prev)?prev:[]).filter(t => (t._id || t.id) !== id)); 
                    if((selectedTask?._id || selectedTask?.id) === id) { setSelectedTask(null); setViewState('board'); }
                    socket?.emit('send_update', { 
                        teamId: selectedTeamId, type: 'DELETE_TASK', payload: id,
                        senderId: currentUser?._id, senderName: currentUser?.name,
                        actionMessage: `deleted a task.`
                    });
                }
            } catch(e) { console.error(e); }
        }
        if (action === 'assignTask' && canWrite) { 
            try {
                const res = await fetch(`${API_URL}/tasks/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ assignedTo: val }) });
                if (res.ok) {
                    const updatedTask = await res.json();
                    const parsedUpdated = { ...updatedTask, dueDate: new Date(updatedTask.dueDate) };
                    setTasks(prev => (Array.isArray(prev)?prev:[]).map(t => (t._id || t.id) === id ? parsedUpdated : t));
                    if ((selectedTask?._id || selectedTask?.id) === id) setSelectedTask(parsedUpdated); 
                    
                    const assigneeName = currentTeamMembers.find(m => m._id === val)?.name || 'Someone';
                    socket?.emit('send_update', { 
                        teamId: selectedTeamId, type: 'UPDATE_TASK', payload: updatedTask,
                        senderId: currentUser?._id, senderName: currentUser?.name,
                        actionMessage: `assigned "${targetTask?.taskName}" to ${assigneeName}.`
                    });
                }
            } catch (e) { console.error(e); }
        }
    };

    // --- REAL-TIME CHAT (COMMENTS) HANDLER ---
    const handleComment = async (action, taskId, val1, val2) => {
        const targetTask = safeTasks.find(t => (t._id || t.id) === taskId);
        if (!targetTask) return;

        let updatedComments = [...(targetTask.comments || [])];
        let actionMsg = '';

        if (action === 'add' && val1?.trim()) {
            updatedComments.push({ userId: currentUser?._id || 'user1', text: val1.trim(), date: new Date() });
            actionMsg = `commented on "${targetTask.taskName}": ${val1.trim()}`;
        } else if (action === 'delete' && window.confirm("Delete comment?")) {
            updatedComments.splice(val1, 1);
            actionMsg = `deleted a comment from "${targetTask.taskName}".`;
        } else if (action === 'edit' && val2?.trim()) {
            updatedComments[val1].text = val2.trim();
            actionMsg = `edited their comment on "${targetTask.taskName}".`;
        } else {
            return;
        }

        try {
            const res = await fetch(`${API_URL}/tasks/${taskId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ comments: updatedComments })
            });

            if (res.ok) {
                const optimisticTask = { ...targetTask, comments: updatedComments };
                setTasks(prev => (Array.isArray(prev)?prev:[]).map(t => (t._id || t.id) === taskId ? optimisticTask : t));
                if ((selectedTask?._id || selectedTask?.id) === taskId) setSelectedTask(optimisticTask);
                
                socket?.emit('send_update', { 
                    teamId: selectedTeamId, type: 'UPDATE_TASK', payload: optimisticTask,
                    senderId: currentUser?._id, senderName: currentUser?.name,
                    actionMessage: actionMsg
                });
            } else {
                alert("Failed to sync comment with database.");
            }
        } catch (e) { console.error("Comment sync error", e); }
    };

    // --- RENDERS ---
    const renderAssigneeSelect = (task, sizeClass) => (
        <select 
            value={task.assignedTo || ''} 
            disabled={!canWrite} 
            onChange={(e) => handleAction('assignTask', task._id || task.id, e.target.value)} 
            onClick={e => e.stopPropagation()} 
            className={`bg-transparent font-semibold text-white focus:outline-none cursor-pointer appearance-none outline-none hover:text-emerald-400 transition-colors text-center-last ${sizeClass}`}
        >
            <option value="" className="bg-slate-800">Unassigned</option>
            {currentTeamMembers.map(m => <option key={m._id || m.id} value={m._id || m.id} className="bg-slate-800">{m.name}</option>)}
        </select>
    );

    const renderTaskCard = (task) => {
        const taskId = task._id || task.id;
        const assignee = currentTeamMembers.find(m => (m._id || m.id) === task.assignedTo);
        return (
            <div key={taskId} onClick={() => { setSelectedTask(task); setViewState('taskDetails'); }} className="collab-task-card bg-[#1e293b]/80 hover:bg-[#1e293b] rounded-[16px] p-5 flex flex-col h-[170px] cursor-pointer transition-all relative group border border-slate-700/50 hover:border-slate-500/70 shadow-sm">
                <div className="flex justify-between items-start mb-2 gap-3">
                    <h4 className="font-bold text-[16px] text-white leading-snug break-words pr-1 line-clamp-2">{task.taskName || task.title || 'Untitled Task'}</h4>
                    <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-extrabold tracking-widest uppercase flex-shrink-0 ${STATUS_STYLES[task.status] || STATUS_STYLES['Not Started']}`}>{task.status}</span>
                </div>
                <p className="text-[13px] text-slate-400 mb-3 flex-grow line-clamp-1 leading-relaxed">{task.description || <span className="italic text-slate-600">No description.</span>}</p>
                <div className="flex items-center gap-3 mb-4">
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest flex-shrink-0 ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
                    <span className="flex items-center gap-1.5 text-[12px] text-slate-400 font-medium"><Calendar size={13} className="opacity-80"/> {formatDate(task.dueDate)}</span>
                </div>
                <div className="mt-auto pt-3.5 border-t border-slate-700/40 flex justify-between items-center">
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${assignee ? 'bg-slate-800 border border-slate-600' : 'unassigned-avatar border border-dashed border-slate-600 text-slate-500'}`}>{assignee ? (assignee.avatar || '👤') : '?'}</div>
                        {renderAssigneeSelect(task, `text-[12px] max-w-[80px] truncate ${!assignee && 'italic text-slate-500'}`)}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500" title="Comments"><MessageSquare size={14} strokeWidth={1.5} /> <span className="text-[12px] font-medium">{task.comments?.length || 0}</span></div>
                </div>
            </div>
        );
    };

    const renderTaskDetails = () => {
        const taskId = selectedTask._id || selectedTask.id;
        return (
            <div className="flex-1 w-full max-w-4xl mx-auto pb-8 animate-fadeIn collab-details-wrapper">
                <div className="flex justify-end mb-2">
                    <button onClick={() => { setViewState('board'); setSelectedTask(null); }} className="action-icon text-slate-500 hover:text-white transition-colors p-2 flex items-center gap-1.5 text-[12px] font-bold tracking-wider uppercase">
                        <X size={18} strokeWidth={2.5} /> Close
                    </button>
                </div>

                {/* MAIN INFO BOX */}
                <div className="collab-detail-card border border-slate-600/50 rounded-2xl p-8 mb-6 bg-[#1e293b]/50 shadow-2xl relative">
                    <div className="flex justify-between items-start mb-8 gap-4">
                        <div className="flex-1 flex flex-col border-b border-slate-600/50 pb-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h2 className="text-[20px] text-white font-bold tracking-wide break-words">{selectedTask.taskName || selectedTask.title || 'Untitled Task'}</h2>
                                {selectedTask.workplace && (
                                    <span className="px-2.5 py-1 bg-[#1e293b] text-slate-300 text-[10px] rounded border border-slate-600/80 font-bold tracking-wider uppercase whitespace-nowrap">
                                        {selectedTask.workplace}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 border-b border-slate-600/50 pb-4 min-w-[120px]">
                            <div className="flex items-center gap-2 mb-1">
                                {canWrite && (
                                    <button onClick={() => { setEditingTaskId(taskId); setTaskFormData({taskName: selectedTask.taskName || selectedTask.title, description: selectedTask.description, priority: selectedTask.priority, workplace: selectedTask.workplace, status: selectedTask.status, dueDate: formatDateForInput(selectedTask.dueDate)}); setViewState('editTask'); }} className="action-icon flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all p-1.5 rounded-lg border border-slate-600/50" title="Edit Task">
                                        <Edit2 size={14} strokeWidth={2} />
                                    </button>
                                )}
                                {isOwner && (
                                    <button onClick={() => handleAction('deleteTask', taskId)} className="delete-icon flex items-center justify-center bg-slate-800/80 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all p-1.5 rounded-lg border border-slate-600/50" title="Delete Task">
                                        <Trash2 size={14} strokeWidth={2} />
                                    </button>
                                )}
                            </div>
                            <span className="text-emerald-400 text-[13px] font-bold uppercase tracking-widest text-right">{selectedTask.status?.replace(" ", "")}</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center mb-12">
                        <h4 className="text-emerald-400 text-[11px] mb-2 font-bold uppercase tracking-widest">Description</h4>
                        <div className="border-t border-slate-600/50 w-full max-w-[500px] pt-4 text-center">
                            <p className="text-slate-300 text-[14px] leading-relaxed font-medium">{selectedTask.description || <span className="italic text-slate-500">No description provided.</span>}</p>
                        </div>
                    </div>

                    <div className="flex justify-around items-start w-full px-4 gap-4">
                        {[
                            { label: 'Priority', val: selectedTask.priority },
                            { label: 'Date', val: formatDate(selectedTask.dueDate) }
                        ].map(item => (
                            <div key={item.label} className="flex flex-col items-center w-1/4">
                                <h4 className="text-emerald-400 text-[11px] mb-2 font-bold uppercase tracking-widest">{item.label}</h4>
                                <div className="border-t border-slate-600/50 w-full pt-3 text-center">
                                    <span className="text-white text-[14px] font-semibold">{item.val}</span>
                                </div>
                            </div>
                        ))}
                        <div className="flex flex-col items-center w-1/3">
                            <h4 className="text-emerald-400 text-[11px] mb-2 font-bold uppercase tracking-widest">Assignee</h4>
                            <div className="border-t border-slate-600/50 w-full pt-2.5 text-center">
                                {renderAssigneeSelect(selectedTask, "text-[14px] w-full text-center")}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CHAT/COMMENTS BOX */}
                <div className="collab-detail-card border border-slate-600/50 rounded-2xl p-8 bg-[#1e293b]/40 shadow-xl flex flex-col h-[400px]">
                    <div className="border-b border-slate-600/50 pb-2 w-[180px] mb-8">
                        <h3 className="text-[16px] text-white font-bold tracking-wide">Comment Details</h3>
                    </div>

                    {/* SCROLLABLE COMMENTS AREA */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center gap-5 mb-6 px-4 max-h-[220px]">
                        {selectedTask.comments?.map((c, i) => {
                            const isCommentOwner = c.userId === currentUser?._id;
                            const commentTime = c.date ? new Date(c.date).getTime() : 0;
                            const canEditComment = isCommentOwner && (Date.now() - commentTime <= 15 * 60 * 1000);
                            const isEditingThis = editingComment.index === i;

                            return (
                                <div key={i} className="text-center group relative w-full md:w-3/4 lg:w-2/3 border-b border-slate-700/50 pb-3">
                                    {isEditingThis ? (
                                        <div className="flex flex-col gap-2 w-full px-2 pt-1">
                                            <input 
                                                type="text" 
                                                className="collab-input w-full p-2 rounded bg-[#0f172a] text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-slate-600 transition-colors"
                                                value={editingComment.text}
                                                onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleComment('edit', taskId, i, editingComment.text);
                                                        setEditingComment({ index: null, text: '' });
                                                    } else if (e.key === 'Escape') {
                                                        setEditingComment({ index: null, text: '' });
                                                    }
                                                }}
                                                autoFocus
                                            />
                                            <div className="flex justify-end gap-3 pr-1 mt-1">
                                                <button onClick={() => setEditingComment({ index: null, text: '' })} className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">Cancel</button>
                                                <button onClick={() => { handleComment('edit', taskId, i, editingComment.text); setEditingComment({ index: null, text: '' }); }} className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider">Save</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-white text-[13px] block mb-1.5 break-words leading-relaxed font-medium">{c.text}</span>
                                            <span className="text-slate-500 text-[11px] font-medium tracking-wide">- {currentTeamMembers.find(m => (m._id || m.id) === c.userId)?.name || 'Unknown User'}</span>
                                            
                                            <div className="absolute -right-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                                                {canEditComment && (
                                                    <button onClick={() => setEditingComment({ index: i, text: c.text })} className="action-icon text-slate-500 hover:text-blue-400 p-1.5 rounded transition-colors" title="Edit Comment (within 15 mins)">
                                                        <Edit2 size={14} strokeWidth={2} />
                                                    </button>
                                                )}
                                                {(isCommentOwner || isOwner) && (
                                                    <button onClick={() => handleComment('delete', taskId, i)} className="delete-icon text-slate-500 hover:text-red-500 p-1.5 rounded transition-colors" title="Delete Comment">
                                                        <Trash2 size={14} strokeWidth={2} />
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                        {(!selectedTask.comments?.length) && <span className="text-slate-500 text-[13px] italic mt-6">No comments yet.</span>}
                        
                        {/* Invisible div to target auto-scroll to bottom */}
                        <div ref={commentsEndRef} />
                    </div>

                    <div className="flex items-end gap-4 border-b border-slate-600 pb-2 w-full md:w-5/6 lg:w-3/4 mx-auto mt-auto shrink-0">
                        <input type="text" id="details-comment-input" placeholder="Type your message or comment..." className="flex-1 bg-transparent text-[13px] text-white focus:outline-none placeholder-slate-500 px-3 py-1 font-medium" onKeyDown={e => { if(e.key === 'Enter'){ e.preventDefault(); handleComment('add', taskId, e.target.value); e.target.value=''; } }} />
                        <button onClick={() => { const inp = document.getElementById('details-comment-input'); handleComment('add', taskId, inp.value); inp.value=''; }} className="text-white font-bold tracking-wider hover:text-emerald-400 transition-colors px-4 pb-0.5 text-[14px]">Post</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full w-full overflow-hidden collab-page-container font-sans bg-[#0f172a]">
            <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={onSignOut} />
            <main className="flex-1 flex flex-col overflow-hidden relative bg-[#0f172a]">
                
                {/* PASS NOTIFICATIONS & HANDLERS TO HEADER */}
                <Header 
                  userName={userName} 
                  userAvatar={userAvatar}    
                  setActiveMenu={setActiveMenu} 
                  notifications={notifications}
                  onDismissNotification={onDismissNotification}
                  onClearAll={onClearAll}
                />
                
                <div className="flex-1 flex overflow-hidden relative">
                    {/* LEFT PANEL: TEAMS */}
                    <div className="collab-side-panel w-64 p-5 flex flex-col h-full bg-[#1e293b] border-r border-white/5 flex-shrink-0 z-10 transition-colors">
                        <h3 className="text-base font-bold text-white mb-5 tracking-wide">Teams</h3>
                        <nav className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-1.5">
                            {safeTeams.map(t => (
                                <button key={t._id || t.id} onClick={() => { setSelectedTeamId(t._id || t.id); setViewState('board'); setSelectedTask(null); }} className={`w-full text-left px-4 py-2.5 rounded-[10px] transition-all text-[13px] font-semibold ${(t._id || t.id) === selectedTeamId && viewState !== 'createTeam' ? 'bg-red-600 text-white shadow-md shadow-red-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white team-btn-unselected'}`}>{t.name}</button>
                            ))}
                        </nav>
                        <div className="pt-4 mt-2 border-t border-white/5">
                            <CustomButton onClick={openCreateTeam} className="w-full !bg-indigo-600 hover:!bg-indigo-700 text-[13px] font-semibold py-2.5 flex items-center justify-center gap-2 rounded-[10px]"><Plus size={15} strokeWidth={2.5} /> Create Team</CustomButton>
                        </div>
                    </div>

                    {/* CENTER PANEL */}
                    <div className={`collab-center-panel flex-1 flex flex-col overflow-hidden relative z-0 transition-colors ${viewState === 'taskDetails' ? 'bg-[#0a0f1c]' : 'bg-[#0f172a]'}`}>
                         <div className="flex-grow p-6 lg:p-8 overflow-y-auto custom-scrollbar relative">
                             <div className="flex justify-between items-center mb-8">
                                <div className='flex items-center gap-4'>
                                    <h2 className="text-[24px] font-extrabold text-white tracking-tight">{viewState === 'createTeam' ? 'Start a New Team' : (currentTeam ? currentTeam.name : 'Select a Team')}</h2>
                                    {currentTeam && isOwner && (viewState === 'board' || viewState === 'taskDetails') && (
                                        <button onClick={() => { setTeamFormData({ name: currentTeam.name, description: currentTeam.description || '' }); setViewState('editTeam'); }} className="ml-2 p-2 bg-[#1e293b] hover:bg-slate-700 rounded-[10px] text-slate-400 hover:text-white transition-colors border border-slate-700/60 shadow-sm collab-side-panel" title="Edit Team"><Edit2 size={13} /></button>
                                    )}
                                </div>
                                {canWrite && (viewState === 'board' || viewState === 'taskDetails') && currentTeam && (
                                    <CustomButton onClick={openCreateTask} className="!bg-red-600 hover:!bg-red-700 text-[13px] font-bold px-5 py-2.5 flex items-center gap-2 rounded-[10px] shadow-md shadow-red-500/20"><Plus size={16} strokeWidth={2.5} /> Add Shared Task</CustomButton>
                                )}
                             </div>

                             {/* TEAM FORM */}
                             {(viewState === 'createTeam' || viewState === 'editTeam') && (
                                 <Card className="collab-task-card max-w-2xl mx-auto !bg-[#1e293b] shadow-2xl border border-white/5">
                                     <h3 className="text-[16px] font-bold mb-5 text-white border-b border-white/10 pb-3">{viewState === 'createTeam' ? "Team Details & Members" : "Edit Team & Members"}</h3>
                                     <div className="space-y-5">
                                         <div className="space-y-4">
                                             <InputGrp label="Team Name">
                                                <div className="flex items-center gap-3">
                                                    <input type="text" value={teamFormData.name} onChange={e => setTeamFormData({...teamFormData, name: e.target.value})} className="collab-input flex-grow p-2.5 rounded-[10px] bg-[#0f172a] text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-red-500 border border-white/5" />
                                                    <button onClick={() => handleVoiceInput('teamName')} type="button" className={`p-2.5 rounded-[10px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-md ${isListening && activeMicField === 'teamName' ? 'bg-red-600 animate-pulse' : ''}`}><Mic size={16} /></button>
                                                </div>
                                             </InputGrp>
                                             <InputGrp label="Description">
                                                <div className="flex items-start gap-3">
                                                    <textarea value={teamFormData.description} onChange={e => setTeamFormData({...teamFormData, description: e.target.value})} className="collab-input flex-grow w-full p-2.5 rounded-[10px] bg-[#0f172a] text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-red-500 border border-white/5 resize-none no-scrollbar" rows="2" />
                                                    <button onClick={() => handleVoiceInput('teamDesc')} type="button" className={`p-2.5 rounded-[10px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-md mt-0.5 ${isListening && activeMicField === 'teamDesc' ? 'bg-red-600 animate-pulse' : ''}`}><Mic size={16} /></button>
                                                </div>
                                             </InputGrp>
                                         </div>
                                         <div className="pt-4 border-t border-white/5">
                                             <h4 className="text-[13px] font-bold text-white mb-3 flex items-center gap-1.5"><Users size={14}/> Manage Members</h4>
                                             <div className="flex gap-2 mb-5 items-end">
                                                 <InputGrp label="Member Email *"><input type="email" placeholder="peer@nexusai.com" value={newMemberEmail} onChange={e => setNewMemberEmail(e.target.value)} className="collab-input w-full p-2 rounded-lg bg-[#0f172a] text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-white/5"/></InputGrp>
                                                 <div className="w-28"><InputGrp label="Role"><select value={newMemberRole} onChange={e => setNewMemberRole(e.target.value)} className="collab-input w-full p-2 rounded-lg bg-[#0f172a] text-[13px] text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-white/5 appearance-none cursor-pointer"><option value="Viewer">Viewer</option><option value="Editor">Editor</option><option value="Owner">Owner</option></select></InputGrp></div>
                                                 <CustomButton onClick={handleAddMember} className="!bg-indigo-600 hover:!bg-indigo-700 !py-2 px-3 text-[13px] h-[36px] font-semibold flex items-center gap-1.5"><UserPlus size={14}/> Add</CustomButton>
                                             </div>
                                             <ul className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                                 {(viewState === 'createTeam' ? stagedMembers : currentTeamMembers).map(m => (
                                                     <li key={m._id || m.id} className="collab-input flex items-center justify-between bg-[#0f172a] p-2.5 rounded-[10px] border border-white/5">
                                                         <div className="flex items-center gap-3"><div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[11px] overflow-hidden">{m.avatar && m.avatar.length > 5 ? <img src={m.avatar} alt="Profile" className="w-full h-full object-cover" /> : (m.name?.[0] || '👤')}</div><div className="flex flex-col"><span className="text-[13px] font-medium text-white">{m.name}</span><span className="text-[10px] text-slate-400">{m.email}</span></div></div>
                                                         <div className="flex items-center gap-2">
                                                             <select value={m.role || 'Viewer'} onChange={e => handleChangeMemberRole(m._id || m.id, e.target.value)} disabled={(m._id || m.id) === currentUser?._id} className="bg-transparent text-[11px] font-medium text-slate-300 p-1 rounded border border-white/10 focus:outline-none cursor-pointer appearance-none px-1.5"><option value="Viewer">Viewer</option><option value="Editor">Editor</option><option value="Owner">Owner</option></select>
                                                             {(m._id || m.id) !== currentUser?._id && <button onClick={() => handleRemoveMember(m._id || m.id)} className="delete-icon p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"><Trash2 size={13}/></button>}
                                                         </div>
                                                     </li>
                                                 ))}
                                                 {viewState === 'createTeam' && !stagedMembers.length && <li className="text-center text-[12px] italic text-slate-500 py-2">Add team members via email.</li>}
                                             </ul>
                                             {viewState === 'editTeam' && isOwner && <div className="pt-6 mt-6 border-t border-red-500/20"><CustomButton onClick={handleDeleteTeam} className="!bg-red-600/10 hover:!bg-red-600/20 !text-red-500 border border-red-500/30 w-full py-2.5 text-[13px] font-semibold flex justify-center gap-2"><Trash2 size={14} /> Delete Team</CustomButton></div>}
                                         </div>
                                         <div className="flex justify-end gap-3 pt-5 mt-3 border-t border-white/5">
                                             <CustomButton onClick={() => setViewState(selectedTask ? 'taskDetails' : 'board')} type="button" className="!bg-slate-700 hover:!bg-slate-600 px-5 py-2 text-[13px]">Cancel</CustomButton>
                                             <CustomButton onClick={viewState === 'createTeam' ? handleCreateTeam : handleUpdateTeam} className="!bg-green-600 hover:!bg-green-700 px-6 py-2 text-[13px] font-semibold">{viewState === 'createTeam' ? 'Create Team' : 'Save'}</CustomButton>
                                         </div>
                                     </div>
                                 </Card>
                             )}

                             {/* TASK FORM */}
                             {(viewState === 'createTask' || viewState === 'editTask') && (
                                 <Card className="collab-task-card max-w-3xl mx-auto !bg-[#1e293b] shadow-2xl border border-white/5 mb-8">
                                     <h3 className="text-[16px] font-bold mb-5 text-white border-b border-white/10 pb-3">{viewState === 'createTask' ? "Add Shared Task" : "Edit Shared Task"}</h3>
                                     <form onSubmit={handleSaveTask} className="space-y-4">
                                         <div className="flex items-center gap-3">
                                             <input type="text" value={taskFormData.taskName} onChange={e => { setTaskFormData({...taskFormData, taskName: e.target.value}); }} placeholder={isListening && activeMicField === 'taskName' ? "Listening..." : "Task Name*"} required className={`collab-input flex-grow p-3 rounded-[10px] bg-[#0f172a] text-[13px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 border border-white/5 transition-all ${isListening && activeMicField === 'taskName' ? 'ring-1 ring-red-500/50 bg-red-500/5' : ''}`} />
                                             <button onClick={() => handleVoiceInput('taskName')} type="button" className={`p-3 rounded-[10px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-md ${isListening && activeMicField === 'taskName' ? 'bg-red-600 animate-pulse' : ''}`}><Mic size={18} /></button>
                                         </div>
                                         <div className="flex items-start gap-3">
                                             <textarea value={taskFormData.description} onChange={e => { setTaskFormData({...taskFormData, description: e.target.value}); }} placeholder={isListening && activeMicField === 'taskDesc' ? "Listening..." : "Description (Optional)"} rows="2" className={`collab-input flex-grow p-3 rounded-[10px] bg-[#0f172a] text-[13px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 border border-white/5 resize-none transition-all no-scrollbar ${isListening && activeMicField === 'taskDesc' ? 'ring-1 ring-red-500/50 bg-red-500/5' : ''}`} />
                                             <button onClick={() => handleVoiceInput('taskDesc')} type="button" className={`p-3 rounded-[10px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-md mt-0.5 ${isListening && activeMicField === 'taskDesc' ? 'bg-red-600 animate-pulse' : ''}`}><Mic size={18} /></button>
                                         </div>
                                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                                             <InputGrp label="Due Date"><input type="date" value={taskFormData.dueDate} onChange={e => { setTaskFormData({...taskFormData, dueDate: e.target.value}); }} className="collab-input w-full p-2.5 rounded-lg bg-[#0f172a] text-[13px] text-white/90 appearance-none focus:outline-none focus:ring-1 focus:ring-red-500 border border-white/5" /></InputGrp>
                                             <InputGrp label="Priority"><select value={taskFormData.priority} onChange={e => { setTaskFormData({...taskFormData, priority: e.target.value}); }} className="collab-input w-full p-2.5 rounded-lg bg-[#0f172a] text-[13px] text-white/90 appearance-none cursor-pointer"><option>Low</option><option>Medium</option><option>High</option></select></InputGrp>
                                             <InputGrp label="Status"><select value={taskFormData.status} onChange={e => { setTaskFormData({...taskFormData, status: e.target.value}); }} className="collab-input w-full p-2.5 rounded-lg bg-[#0f172a] text-[13px] text-white/90 appearance-none cursor-pointer"><option>Not Started</option><option>In Progress</option><option>Completed</option></select></InputGrp>
                                             <InputGrp label="Workplace"><input type="text" value={taskFormData.workplace} onChange={e => { setTaskFormData({...taskFormData, workplace: e.target.value}); }} placeholder="Office" className="collab-input w-full p-2.5 rounded-lg bg-[#0f172a] text-[13px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 border border-white/5" /></InputGrp>
                                         </div>
                                         <div className="flex justify-end gap-3 pt-5 mt-3 border-t border-white/5">
                                             <CustomButton onClick={() => setViewState(selectedTask ? 'taskDetails' : 'board')} type="button" className="!bg-slate-700 hover:!bg-slate-600 px-5 py-2 text-[13px]">Cancel</CustomButton>
                                             <CustomButton type="submit" className="!bg-green-600 hover:!bg-green-700 px-6 py-2 text-[13px] font-semibold">{viewState === 'createTask' ? 'Add Task' : 'Save'}</CustomButton>
                                         </div>
                                     </form>
                                 </Card>
                             )}

                             {/* TASK BOARD */}
                             {viewState === 'board' && (
                                 <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
                                     {!currentTeam ? (
                                         <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 rounded-[14px]"><Users size={48} strokeWidth={1.5} className="mb-3 opacity-30" /><p className="text-[16px] font-bold text-slate-400">No Team Selected</p></div>
                                     ) : currentTeamTasks.length ? (
                                         currentTeamTasks.map(renderTaskCard)
                                     ) : (
                                         <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700/50 rounded-[16px]"><Calendar size={40} strokeWidth={1.5} className="mb-3 opacity-50" /><p className="text-[15px] font-bold">No tasks found.</p></div>
                                     )}
                                 </div>
                             )}
                             {viewState === 'taskDetails' && selectedTask && renderTaskDetails()}
                         </div>
                    </div>

                    {/* RIGHT PANEL: MEMBERS */}
                    <div className={`collab-side-panel w-72 p-5 flex flex-col h-full bg-[#1e293b] border-l border-white/5 flex-shrink-0 transition-transform absolute right-0 top-0 z-20 xl:static ${selectedTask ? 'translate-x-full hidden xl:flex xl:translate-x-0' : 'translate-x-0'}`}>
                        <div className="flex items-center justify-between mb-5"><h3 className="text-[15px] font-bold text-white tracking-wide">Team Members</h3></div>
                        <div className="mb-5"><p className="text-[11px] text-slate-400 font-medium">You are: <span className="text-red-400 font-bold ml-1">{userRole}</span></p></div>
                        <ul className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
                            {currentTeamMembers.map(m => (
                                <li key={m._id || m.id} className="flex items-center gap-3 text-[13px] group"><div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-[14px] border border-slate-700 group-hover:border-slate-500 transition-colors overflow-hidden">{m.avatar && m.avatar.length > 5 ? <img src={m.avatar} alt="Profile" className="w-full h-full object-cover" /> : (m.name?.[0] || '👤')}</div><div className="flex-grow"><div className="font-semibold text-white/90 group-hover:text-white transition-colors">{m.name}</div><div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">{m.role}</div></div></li>
                            ))}
                        </ul>
                    </div>
                </div>
            </main>
            <div className="fixed bottom-6 right-6 z-50"><IconButton icon={<span className="text-xl">🤖</span>} className="w-14 h-14 !bg-red-600 hover:!bg-red-700 !text-white !shadow-lg !shadow-red-500/50" onClick={() => alert("Nexus AI!")} /></div>
            
            <style>{`
                .text-center-last { text-align-last: center; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};
export default CollaborationPage;