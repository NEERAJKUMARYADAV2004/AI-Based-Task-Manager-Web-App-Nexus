import React, { useState, useEffect, useRef } from 'react';
import { Card, CustomButton } from './UI';
import Sidebar from './Sidebar';
import Header from './Header';
import { API_URL, getAuthHeaders } from '../utils/api';
import { Camera } from 'lucide-react';

const ProfilePage = ({ activeMenu, setActiveMenu, onSignOut, userName, setUserName, userAvatar, setUserAvatar, notifications, onDismissNotification, onClearAll }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const fileInputRef = useRef(null);
  
  // State for the actual user data from the database
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    role: 'Member',
    phone: '',
    address: '',
    bio: '',
    joinedDate: '',
    avatar: '', 
  });

  const [formData, setFormData] = useState({ ...userData });

  const [userStats, setUserStats] = useState({
    tasksCompleted: 0,
    ongoingProjects: 0,
    teamsJoined: 0
  });

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      try {
        const [userRes, tasksRes, projectsRes, teamsRes] = await Promise.all([
          fetch(`${API_URL}/auth/user`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/tasks`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/projects`, { headers: getAuthHeaders() }),
          fetch(`${API_URL}/teams`, { headers: getAuthHeaders() })
        ]);
        
        if (userRes.ok) {
          const data = await userRes.json();
          const profileData = {
            name: data.name || userName || 'User',
            email: data.email || '',
            role: data.role || 'Member',
            phone: data.phone || '',
            address: data.address || '',
            bio: data.bio || 'Tech enthusiast and task-master. Building the future with Nexus AI.',
            joinedDate: data.date ? new Date(data.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'Recently',
            avatar: data.avatar || '',
          };
          setUserData(profileData);
          setFormData(profileData);

          // Guarantee sync with App.jsx globally
          if (setUserName && data.name) setUserName(data.name);
          if (setUserAvatar && data.avatar) setUserAvatar(data.avatar);
        }

        let completedTasksCount = 0;
        let ongoingProjectsCount = 0;
        let teamsJoinedCount = 0;

        if (tasksRes.ok) {
          const tasks = await tasksRes.json();
          completedTasksCount = tasks.filter(t => t.completed).length;
        }
        
        if (projectsRes.ok) {
          const projects = await projectsRes.json();
          ongoingProjectsCount = projects.filter(p => p.status === 'In Progress' || p.status === 'Not Started').length;
        }

        if (teamsRes.ok) {
          const teams = await teamsRes.json();
          teamsJoinedCount = teams.length;
        }

        setUserStats({
          tasksCompleted: completedTasksCount,
          ongoingProjects: ongoingProjectsCount,
          teamsJoined: teamsJoinedCount
        });

      } catch (err) {
        console.error("Failed to fetch user profile or stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileAndStats();
  }, [userName, setUserName, setUserAvatar]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // FIX: Increased frontend safety limit from 2MB to 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert("Image is too large. Please select an image under 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setUserData(formData); 
        setIsEditing(false);
        
        // Push updates to global App state instantly
        if (setUserName) setUserName(formData.name);
        if (setUserAvatar) setUserAvatar(formData.avatar); 
        
        const storedUser = JSON.parse(localStorage.getItem('nexus-user') || '{}');
        storedUser.name = formData.name;
        if (formData.avatar) storedUser.avatar = formData.avatar;
        localStorage.setItem('nexus-user', JSON.stringify(storedUser));
        
      } else {
        const errData = await res.json();
        alert(`Failed to update: ${errData.msg || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Network error. Could not update profile.");
    }
  };

  const handleCancel = () => {
    setFormData({ ...userData }); 
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex h-full w-full overflow-hidden bg-slate-900">
        <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={onSignOut} />
        <main className="flex-1 flex items-center justify-center text-white">
          <div className="animate-pulse flex flex-col items-center">
             <div className="h-12 w-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             Loading Profile Data...
          </div>
        </main>
      </div>
    );
  }

  const inputClass = `w-full p-3 rounded-lg bg-[#1e293b] text-white/90 border-none focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${
    !isEditing ? 'opacity-80 cursor-not-allowed' : ''
  }`;

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={onSignOut} />
      
      <main className="flex-1 overflow-y-scroll no-scrollbar relative bg-[#0f172a]">
        <Header 
          userName={userData.name} 
          userAvatar={userAvatar}
          setActiveMenu={setActiveMenu}
          notifications={notifications}
          onDismissNotification={onDismissNotification}
          onClearAll={onClearAll}
        />
        
        <div className="p-6 max-w-6xl mx-auto pb-24 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Avatar & Quick Info */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-[#1e293b] rounded-xl flex flex-col items-center text-center pt-8 pb-8 relative overflow-hidden shadow-lg border border-white/5">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-red-600/40 to-transparent"></div>
                
                <div className="relative mb-4 mt-2 z-10">
                  <div className="h-28 w-28 bg-yellow-400 rounded-full flex items-center justify-center text-5xl font-bold text-slate-900 shadow-md overflow-hidden">
                    {formData.avatar ? (
                      <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      userData.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  {isEditing && (
                    <>
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={handleAvatarChange} 
                        className="hidden" 
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg transition-colors border border-indigo-500"
                        title="Upload Profile Picture"
                      >
                        <Camera size={16} strokeWidth={2} />
                      </button>
                    </>
                  )}
                </div>
                
                <h3 className="text-2xl font-bold text-white z-10">{userData.name}</h3>
                <p className="text-red-400 font-medium z-10 mt-1">{userData.role}</p>
                <p className="text-sm text-white/40 mt-3 z-10">Member since {userData.joinedDate}</p>
              </div>

              {/* Account Stats */}
              <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-white/5">
                <h3 className="text-lg font-bold text-white mb-5">Account Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-[#0f172a] p-4 rounded-lg">
                    <span className="text-white/60 text-sm font-medium">Tasks Completed</span>
                    <span className="text-xl font-bold text-green-400">{userStats.tasksCompleted}</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#0f172a] p-4 rounded-lg">
                    <span className="text-white/60 text-sm font-medium">Ongoing Projects</span>
                    <span className="text-xl font-bold text-amber-400">{userStats.ongoingProjects}</span>
                  </div>
                  <div className="flex justify-between items-center bg-[#0f172a] p-4 rounded-lg">
                    <span className="text-white/60 text-sm font-medium">Teams Joined</span>
                    <span className="text-xl font-bold text-indigo-400">{userStats.teamsJoined}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Profile Details Form */}
            <div className="lg:col-span-8">
              <div className="bg-[#1e293b] rounded-xl p-6 md:p-8 shadow-lg border border-white/5 h-full">
                
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">Personal Information</h3>
                  {!isEditing && (
                    <CustomButton onClick={() => setIsEditing(true)} className="!bg-[#0f172a] hover:!bg-indigo-600 !text-sm border border-white/10 text-white/80">
                      Edit Profile
                    </CustomButton>
                  )}
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  
                  {/* First Row: Name and Email */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        disabled={!isEditing}
                        placeholder="John Doe"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        disabled={true} 
                        placeholder="john@nexusai.com"
                        className={`w-full p-3 rounded-lg bg-[#1e293b] text-white/60 border-none cursor-not-allowed`}
                      />
                    </div>
                  </div>

                  {/* Second Row: Role and Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Job Title / Role</label>
                      <input 
                        type="text" 
                        name="role" 
                        value={formData.role} 
                        onChange={handleChange} 
                        disabled={!isEditing}
                        placeholder="Member"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Phone Number</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        value={formData.phone} 
                        onChange={handleChange} 
                        disabled={!isEditing}
                        placeholder="+1 (555) 000-0000"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Address</label>
                    <input 
                      type="text" 
                      name="address" 
                      value={formData.address} 
                      onChange={handleChange} 
                      disabled={!isEditing}
                      placeholder="123 Tech Lane, Silicon Valley, CA"
                      className={inputClass}
                    />
                  </div>

                  {/* Bio / Details */}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Profile Details / Bio</label>
                    <textarea 
                      name="bio" 
                      value={formData.bio} 
                      onChange={handleChange} 
                      disabled={!isEditing}
                      rows="4"
                      placeholder="Tech enthusiast and task-master. Building the future with Nexus AI."
                      className={`${inputClass} resize-none no-scrollbar`}
                    />
                  </div>

                  {/* Form Action Buttons */}
                  {isEditing && (
                    <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                      <CustomButton type="button" onClick={handleCancel} className="!bg-[#0f172a] hover:!bg-red-600 border border-white/10 px-6 transition-colors">
                        Cancel
                      </CustomButton>
                      <CustomButton type="submit" className="!bg-indigo-600 hover:!bg-indigo-700 px-8 transition-colors">
                        Save Changes
                      </CustomButton>
                    </div>
                  )}
                </form>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;