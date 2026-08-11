const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'components', 'CollaborationPage.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add Icons to Lucide Import
content = content.replace(
  /import \{ Calendar, MessageSquare, Edit2, Trash2, Plus, Users, UserPlus, Mic, X, User, Clock, Check \} from 'lucide-react';/,
  "import { Calendar, MessageSquare, Edit2, Trash2, Plus, Users, UserPlus, Mic, X, User, Clock, Check, ChevronLeft, ChevronRight, AlertTriangle, Menu } from 'lucide-react';"
);

// 2. Add new states inside the component
const stateHookPos = content.indexOf('const [currentUser, setCurrentUser] = useState(null);');
const statesToAdd = `
    const [isTeamsListVisible, setIsTeamsListVisible] = useState(true);
    const [isMembersListVisible, setIsMembersListVisible] = useState(true);
    const [dialogConfig, setDialogConfig] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: null, onCancel: null });

    const showAlert = (message, title = "Notice") => {
        setDialogConfig({ isOpen: true, type: 'alert', title, message, onConfirm: () => setDialogConfig(prev => ({ ...prev, isOpen: false })) });
    };

    const showConfirm = (message, title = "Confirm", onConfirmCallback) => {
        setDialogConfig({ 
            isOpen: true, 
            type: 'confirm', 
            title,
            message, 
            onConfirm: () => {
                if (onConfirmCallback) onConfirmCallback();
                setDialogConfig(prev => ({ ...prev, isOpen: false }));
            },
            onCancel: () => {
                setDialogConfig(prev => ({ ...prev, isOpen: false }));
            }
        });
    };
`;
content = content.slice(0, stateHookPos) + statesToAdd + content.slice(stateHookPos);

// 3. Replace all alerts and confirms
// "return alert(...)" => "showAlert(...); return;"
content = content.replace(/return alert\("Voice input not supported\."\);/g, 'showAlert("Voice input not supported."); return;');
content = content.replace(/return alert\("Team name required\."\);/g, 'showAlert("Team name required."); return;');
content = content.replace(/else alert\("Failed to create team\."\);/g, 'else showAlert("Failed to create team.");');
content = content.replace(/else alert\("Failed to update team details\."\);/g, 'else showAlert("Failed to update team details.");');
content = content.replace(/return alert\("Valid email required\."\);/g, 'showAlert("Valid email required."); return;');
content = content.replace(/else alert\("Failed to delete team\."\);/g, 'else showAlert("Failed to delete team.");');
content = content.replace(/else alert\("Failed to save task to database\."\);/g, 'else showAlert("Failed to save task to database.");');
content = content.replace(/else alert\("Failed to update task\."\);/g, 'else showAlert("Failed to update task.");');
content = content.replace(/alert\("Failed to sync comment with database\."\);/g, 'showAlert("Failed to sync comment with database.");');
content = content.replace(/alert\("Nexus AI!"\)/g, 'showAlert("Nexus AI!")');

// Handle window.confirm for delete team
content = content.replace(
  /if \(!isOwner \|\| !window\.confirm\(\`Delete "\$\{currentTeam\?\.name\}" entirely\?\`\)\) return;/g,
  `if (!isOwner) return;
        showConfirm(\`Delete "\${currentTeam?.name}" entirely?\`, "Delete Team", async () => {
`
);
// Need to close the block for delete team
content = content.replace(
  /\} catch\(e\) \{ console\.error\(e\); \}\n    \};/,
  `} catch(e) { console.error(e); }
        });
    };`
);

// Handle window.confirm for remove member
content = content.replace(
  /else if \(isOwner && window\.confirm\('Remove member\?'\)\) \{/,
  `else if (isOwner) {
            showConfirm('Remove member?', "Remove Member", async () => {`
);
// Need to close block for remove member
content = content.replace(
  /\} else alert\("Failed to remove member\."\);\n            \} catch \(e\) \{ console\.error\(e\); \}\n        \}/,
  `} else showAlert("Failed to remove member.");
            } catch (e) { console.error(e); }
            });
        }`
);

// Handle window.confirm for delete shared task
content = content.replace(
  /if \(action === 'deleteTask' && isOwner && window\.confirm\("Delete shared task\?"\)\) \{/g,
  `if (action === 'deleteTask' && isOwner) { 
            showConfirm("Delete shared task?", "Delete Task", async () => {`
);
// Need to close block for delete task
content = content.replace(
  /\} else showAlert\("Failed to delete task\."\);\n            \} catch \(e\) \{ console\.error\(e\); \}\n        \}/g,
  `} else showAlert("Failed to delete task.");
            } catch (e) { console.error(e); }
            });
        }`
);

// Handle window.confirm for delete comment
content = content.replace(
  /\} else if \(action === 'delete' && window\.confirm\("Delete comment\?"\)\) \{/,
  `} else if (action === 'delete') {
            showConfirm("Delete comment?", "Delete Comment", async () => {`
);
content = content.replace(
  /\} catch \(e\) \{ console\.error\("Error deleting comment:", e\); \}\n        \}/,
  `} catch (e) { console.error("Error deleting comment:", e); }
            });
        }`
);

// 4. Update the layout for Teams Panel (Left)
content = content.replace(
  /className="collab-side-panel w-64 p-5 flex flex-col h-full bg-\[#1e293b\] border-r border-white\/5 flex-shrink-0 z-10 transition-colors"/,
  'className={`collab-side-panel flex flex-col h-full bg-[#1e293b] border-r border-white/5 flex-shrink-0 z-10 transition-all duration-300 ease-in-out ${isTeamsListVisible ? "w-64 p-5 opacity-100" : "w-0 p-0 opacity-0 overflow-hidden border-r-0"}`}'
);
content = content.replace(
  /<h3 className="text-base font-bold text-white mb-5 tracking-wide">Teams<\/h3>/,
  `<div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-bold text-white tracking-wide whitespace-nowrap">Teams</h3>
                            <button onClick={() => setIsTeamsListVisible(false)} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors" title="Hide Teams"><ChevronLeft size={18} /></button>
                        </div>`
);

// Add the expand button if teams list is hidden
content = content.replace(
  /{currentTeam && isOwner && \(viewState === 'board' \|\| viewState === 'taskDetails'\) && \(/,
  `{!isTeamsListVisible && (
                                        <button onClick={() => setIsTeamsListVisible(true)} className="mr-3 p-2 bg-[#1e293b] hover:bg-slate-700 rounded-[10px] text-slate-400 hover:text-white transition-colors border border-slate-700/60 shadow-sm" title="Show Teams"><Menu size={16} /></button>
                                    )}
                                    {currentTeam && isOwner && (viewState === 'board' || viewState === 'taskDetails') && (`
);

// 5. Update the layout for Members Panel (Right)
content = content.replace(
  /className=\{\`collab-side-panel w-72 p-5 flex flex-col h-full bg-\[#1e293b\] border-l border-white\/5 flex-shrink-0 transition-transform absolute right-0 top-0 z-20 xl:static \$\{selectedTask \? 'translate-x-full hidden xl:flex xl:translate-x-0' : 'translate-x-0'\}\`\}/,
  'className={`collab-side-panel flex flex-col h-full bg-[#1e293b] border-l border-white/5 flex-shrink-0 z-20 transition-all duration-300 ease-in-out absolute right-0 top-0 xl:static ${selectedTask && !isMembersListVisible ? "hidden" : ""} ${isMembersListVisible ? "w-72 p-5 opacity-100" : "w-0 p-0 opacity-0 overflow-hidden border-l-0"}`}'
);

content = content.replace(
  /<h3 className="text-\[15px\] font-bold text-white tracking-wide">Team Members<\/h3>/,
  `<h3 className="text-[15px] font-bold text-white tracking-wide whitespace-nowrap">Team Members</h3>
                            <button onClick={() => setIsMembersListVisible(false)} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors" title="Hide Members"><ChevronRight size={18} /></button>`
);

content = content.replace(
  /\{canWrite && \(viewState === 'board' \|\| viewState === 'taskDetails'\) && currentTeam && \(/,
  `{!isMembersListVisible && (
                                    <button onClick={() => setIsMembersListVisible(true)} className="ml-3 p-2 bg-[#1e293b] hover:bg-slate-700 rounded-[10px] text-slate-400 hover:text-white transition-colors border border-slate-700/60 shadow-sm mr-4" title="Show Members"><Menu size={16} /></button>
                                )}
                                {canWrite && (viewState === 'board' || viewState === 'taskDetails') && currentTeam && (`
);

// 6. Add Custom Dialog Modal to end of file
const endPos = content.lastIndexOf('</main>');
const modalMarkup = `
            {/* CUSTOM DIALOG (Alert/Confirm) */}
            {dialogConfig.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#1e293b] border border-slate-600/50 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-fadeIn">
                        <div className="flex items-center gap-3 mb-2">
                            {dialogConfig.type === 'alert' ? <AlertTriangle className="text-amber-400" size={20} /> : <MessageSquare className="text-blue-400" size={20} />}
                            <h3 className="text-[18px] font-bold text-white tracking-wide">{dialogConfig.title}</h3>
                        </div>
                        <p className="text-[14px] text-slate-300 mb-6 leading-relaxed mt-2">{dialogConfig.message}</p>
                        <div className="flex justify-end gap-3">
                            {dialogConfig.type === 'confirm' && (
                                <CustomButton onClick={dialogConfig.onCancel} className="!bg-slate-700 hover:!bg-slate-600 px-4 py-2 text-[13px]">Cancel</CustomButton>
                            )}
                            <CustomButton onClick={dialogConfig.onConfirm} className="!bg-indigo-600 hover:!bg-indigo-700 px-4 py-2 text-[13px]">{dialogConfig.type === 'confirm' ? 'Confirm' : 'OK'}</CustomButton>
                        </div>
                    </div>
                </div>
            )}
`;
content = content.slice(0, endPos) + modalMarkup + content.slice(endPos);

fs.writeFileSync(file, content, 'utf8');
console.log('Processed CollaborationPage.jsx');
