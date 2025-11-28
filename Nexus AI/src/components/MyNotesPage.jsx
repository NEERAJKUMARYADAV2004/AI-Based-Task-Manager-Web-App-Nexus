import React, { useState, useEffect } from 'react';
import { Card, CustomButton, IconButton } from './UI';
import Sidebar from './Sidebar';
import Header from './Header';
import { API_URL, getAuthHeaders } from '../utils/api';

const formatDate = (date) => { if (!date) return ''; return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };

const MyNotesPage = ({ activeMenu, setActiveMenu, onSignOut, userName }) => {
  const [notes, setNotes] = useState([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // --- FETCH ---
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch(`${API_URL}/notes`, { headers: getAuthHeaders() });
        if (res.ok) setNotes(await res.json());
      } catch (err) { console.error(err); }
    };
    fetchNotes();
  }, []);

  // --- HANDLERS ---
  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim() && !noteContent.trim()) { alert('Note cannot be empty.'); return; };

    const newNoteData = { title: noteTitle || `Note ${new Date().toLocaleDateString()}`, content: noteContent };

    try {
        if (editingNoteId !== null) {
            // Update
            const res = await fetch(`${API_URL}/notes/${editingNoteId}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(newNoteData)
            });
            if (res.ok) {
                const updated = await res.json();
                setNotes(notes.map(n => n._id === editingNoteId ? updated : n));
            }
        } else {
            // Create
            const res = await fetch(`${API_URL}/notes`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(newNoteData)
            });
            if (res.ok) {
                setNotes([await res.json(), ...notes]);
            }
        }
        // Reset
        setEditingNoteId(null); setNoteTitle(''); setNoteContent(''); setIsAdding(false);
    } catch (err) { console.error(err); }
  };

  const handleDeleteNote = async (id) => {
    if (!window.confirm('Delete note?')) return;
    try {
        const res = await fetch(`${API_URL}/notes/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        if (res.ok) {
            setNotes(notes.filter(n => n._id !== id));
            if (editingNoteId === id) { setEditingNoteId(null); setIsAdding(false); }
        }
    } catch (err) { console.error(err); }
  };

  // ... (Rest of Handlers: handleAddNewClick, handleEditClick, handleCancel are mostly UI state changes) ...
  const handleAddNewClick = () => { setEditingNoteId(null); setNoteTitle(''); setNoteContent(''); setIsAdding(true); };
  const handleEditClick = (note) => { setEditingNoteId(note._id); setNoteTitle(note.title); setNoteContent(note.content); setIsAdding(true); };
  const handleCancel = () => { setEditingNoteId(null); setNoteTitle(''); setNoteContent(''); setIsAdding(false); };

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={onSignOut} />
      <main className="flex-1 overflow-y-scroll custom-scrollbar relative">
        <Header userName={userName} />
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-white">My Notes</h2>
             {!isAdding && ( <CustomButton onClick={handleAddNewClick} className="!bg-red-600 hover:!bg-red-700 !shadow-red-500/50"> + Add Note </CustomButton> )}
          </div>
          {isAdding && (
            <Card className="mb-8 !bg-slate-800/80">
              {/* ... (Form Inputs) ... */}
              <h3 className="text-xl font-bold mb-4 text-white">{editingNoteId !== null ? 'Edit Note' : 'Add New Note'}</h3>
              <form onSubmit={handleSaveNote} className="space-y-4">
                <input type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Note Title (Optional)" className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400" />
                <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Start writing your note..." required rows="6" className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400" />
                <div className="flex justify-end gap-3">
                   <CustomButton type="button" onClick={handleCancel} className="!bg-gray-500 hover:!bg-gray-600">Cancel</CustomButton>
                   <CustomButton type="submit" className="!bg-green-600 hover:!bg-green-700">{editingNoteId !== null ? 'Save Changes' : 'Save Note'}</CustomButton>
                </div>
              </form>
            </Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {notes.map((note) => (
              <Card key={note._id} className="flex flex-col !h-auto min-h-[150px]" glass={true}>
                  {/* ... (Display logic using note._id) ... */}
                  <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-white mr-2 flex-grow break-words">{note.title || <span className="text-white/60 italic">Untitled</span>}</h3>
                      <div className="flex gap-1 flex-shrink-0">
                          <IconButton icon={ <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /> </svg> } onClick={() => handleEditClick(note)} className="!p-1.5 !text-blue-400 hover:!bg-blue-500/30 hover:!text-blue-300" />
                          <IconButton icon={ <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /> </svg> } onClick={() => handleDeleteNote(note._id)} className="!p-1.5 !text-red-400 hover:!bg-red-500/30 hover:!text-red-300" />
                      </div>
                  </div>
                  <p className="text-sm text-white/80 mb-3 flex-grow whitespace-pre-wrap break-words">{note.content.length > 150 ? `${note.content.substring(0, 150)}...` : note.content}</p>
                  <div className="mt-auto pt-2 border-t border-white/10 text-xs text-white/50">Last updated: {formatDate(note.updatedAt)}</div>
              </Card>
            ))}
             {notes.length === 0 && !isAdding && ( <p className="text-center text-white/50 col-span-full mt-10">You don't have any notes yet. Click '+ Add Note' to create one.</p> )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyNotesPage;