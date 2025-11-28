import React, { useState, useMemo } from 'react';
import { Card, CustomButton, IconButton } from './UI'; // Assuming UI.jsx exists
import Sidebar from './Sidebar'; // Assuming Sidebar.jsx exists
import Header from './Header'; // Assuming Header.jsx exists

// --- Mock Help Data ---
// In a real app, fetch this from an API or CMS
const helpCategories = [
  { id: 'cat1', title: 'Getting Started', description: 'Basics of Nexus AI', icon: '🚀' },
  { id: 'cat2', title: 'Managing Tasks', description: 'Adding, editing, and completing tasks', icon: '✔️' },
  { id: 'cat3', title: 'Projects', description: 'Creating and tracking projects', icon: '📂' },
  { id: 'cat4', title: 'Account Settings', description: 'Profile, password, and preferences', icon: '⚙️' },
  { id: 'cat5', title: 'Calendar', description: 'Using the calendar view', icon: '🗓️' },
  { id: 'cat6', title: 'Troubleshooting', description: 'Common issues and solutions', icon: '❓' },
];

const helpArticles = [
  // Getting Started
  { id: 'gs1', categoryId: 'cat1', title: 'Welcome to Nexus AI!', content: 'Nexus AI helps you manage your tasks and projects efficiently...\n\n- Use the dashboard for an overview.\n- Navigate sections via the sidebar.' },
  { id: 'gs2', categoryId: 'cat1', title: 'Understanding the Dashboard', content: 'The dashboard shows key metrics like overall tasks done, daily stats...\n\nLearn about each widget...' },
  // Managing Tasks
  { id: 'mt1', categoryId: 'cat2', title: 'How to Add a Task', content: 'Navigate to the To-Do page. Use the input field at the top...\n\nEnter details like name, due date, priority...' },
  { id: 'mt2', categoryId: 'cat2', title: 'Editing and Deleting Tasks', content: 'On the To-Do page, find the task you want to modify. Click the pencil icon to edit or the trash icon to delete.' },
  { id: 'mt3', categoryId: 'cat2', title: 'Using Task Priorities', content: 'Priorities (High, Medium, Low) help you organize. They are color-coded in the list...' },
  // Projects
  { id: 'p1', categoryId: 'cat3', title: 'Creating a New Project', content: 'Go to the My Projects page and click the "+ Add Project" button...' },
  // Account
  { id: 'as1', categoryId: 'cat4', title: 'Changing Your Password', content: 'Currently, password changes are not supported directly in the app. Please contact support...' }, // Example
  // Calendar
  { id: 'c1', categoryId: 'cat5', title: 'Navigating the Calendar', content: 'Use the arrows and view buttons (Month, Week, Day) in the toolbar...' },
  { id: 'c2', categoryId: 'cat5', title: 'Adding Events via Calendar', content: 'Click and drag on a time slot in the Week or Day view, or click a date in the Month view...' },
];

const faqs = [ // Frequently Asked Questions
    { id: 'faq1', q: 'How do I reset my password?', aId: 'as1'}, // Link to an article ID
    { id: 'faq2', q: 'Can I use Nexus AI offline?', content: 'Nexus AI currently requires an internet connection to sync your data.'},
    { id: 'faq3', q: 'How is my data stored?', content: 'Your task and project data are stored securely. (Details would depend on the actual backend).'},
];


const HelpCenterPage = ({ activeMenu, setActiveMenu, onSignOut, userName }) => {
  // --- State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('categories'); // 'categories', 'searchResults', 'article'
  const [selectedCategory, setSelectedCategory] = useState(null); // { id, title }
  const [selectedArticle, setSelectedArticle] = useState(null); // { id, title, content }

  // --- Filtering Logic ---
  const filteredArticles = useMemo(() => {
    if (viewMode === 'searchResults') {
      if (!searchTerm.trim()) return [];
      const lowerSearch = searchTerm.toLowerCase();
      return helpArticles.filter(
        article => article.title.toLowerCase().includes(lowerSearch) ||
                   article.content.toLowerCase().includes(lowerSearch)
      );
    }
    if (viewMode === 'categoryArticles' && selectedCategory) {
      return helpArticles.filter(article => article.categoryId === selectedCategory.id);
    }
    return []; // No articles needed for 'categories' view
  }, [searchTerm, viewMode, selectedCategory]);

  // --- Handlers ---
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Optionally trigger search immediately or wait for submit/blur
    // For simplicity, let's search immediately
     if(e.target.value.trim()){
         setViewMode('searchResults');
         setSelectedCategory(null);
         setSelectedArticle(null);
     } else {
         // Go back to categories if search is cleared
         setViewMode('categories');
     }
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setViewMode('categoryArticles');
    setSearchTerm(''); // Clear search when category is clicked
    setSelectedArticle(null);
  };

  const handleArticleClick = (article) => {
    setSelectedArticle(article);
    setViewMode('article');
  };

   const handleFaqClick = (faq) => {
        if(faq.aId) { // If FAQ links to an article
            const article = helpArticles.find(a => a.id === faq.aId);
            if(article) handleArticleClick(article);
        } else if (faq.content) { // If FAQ has direct content
             handleArticleClick({id: faq.id, title: faq.q, content: faq.content});
        }
    };


  const handleGoBack = () => {
    if (viewMode === 'article') {
        // Go back to previous list (search results or category)
        setViewMode(selectedCategory ? 'categoryArticles' : (searchTerm ? 'searchResults' : 'categories'));
        setSelectedArticle(null);
    } else if (viewMode === 'searchResults' || viewMode === 'categoryArticles') {
        // Go back to main categories view
        setViewMode('categories');
        setSelectedCategory(null);
        setSearchTerm(''); // Clear search term when going back fully
    }
  };


  return (
    <div className="flex h-full w-full overflow-hidden">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onSignOut={onSignOut} />

      <main className="flex-1 overflow-y-scroll custom-scrollbar relative">
        <Header userName={userName} />

        <div className="p-6 max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6">Help Center</h2>

           {/* Back Button (conditional) */}
           {(viewMode === 'article' || viewMode === 'searchResults' || viewMode === 'categoryArticles') && (
               <button onClick={handleGoBack} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                   Back
               </button>
           )}

          {/* Search Bar (always visible when not viewing specific article?) */}
           {viewMode !== 'article' && (
              <div className="mb-8 relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search help articles..."
                  className="w-full p-4 pl-12 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-400 border border-transparent text-lg"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-xl">🔍</span>
              </div>
           )}


          {/* --- Conditional Content --- */}

          {/* Main View: Categories & FAQs */}
          {viewMode === 'categories' && (
            <div className='space-y-8'>
                {/* Categories */}
                <Card title="Browse by Topic" className="!bg-slate-800/60 !border-none !shadow-none !p-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
                        {helpCategories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryClick(cat)}
                                className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 text-center h-full min-h-[150px]" // Added min-h
                            >
                                <span className="text-3xl">{cat.icon}</span>
                                <h4 className="font-semibold text-white">{cat.title}</h4>
                                <p className="text-xs text-white/70">{cat.description}</p>
                            </button>
                        ))}
                    </div>
                </Card>

                {/* FAQs */}
                <Card title="Frequently Asked Questions" className="!bg-slate-800/60">
                     <ul className="space-y-3 mt-4">
                         {faqs.map(faq => (
                             <li key={faq.id}>
                                 <button
                                     onClick={() => handleFaqClick(faq)}
                                     className="text-left text-indigo-300 hover:text-red-400 hover:underline transition-colors duration-200"
                                 >
                                     {faq.q}
                                 </button>
                             </li>
                         ))}
                     </ul>
                </Card>
            </div>
          )}

          {/* Search Results or Category Articles View */}
          {(viewMode === 'searchResults' || viewMode === 'categoryArticles') && (
            <Card
                title={viewMode === 'searchResults' ? `Search Results for "${searchTerm}"` : selectedCategory?.title || 'Articles'}
                className="!bg-slate-800/60"
            >
              {filteredArticles.length > 0 ? (
                <ul className="space-y-3 mt-4">
                  {filteredArticles.map(article => (
                    <li key={article.id}>
                      <button
                        onClick={() => handleArticleClick(article)}
                        className="text-left text-lg text-white hover:text-red-400 transition-colors duration-200 font-medium"
                      >
                        {article.title}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-white/50 mt-6">
                  {viewMode === 'searchResults' ? 'No articles found matching your search.' : 'No articles found in this category.'}
                </p>
              )}
            </Card>
          )}

          {/* Article View */}
          {viewMode === 'article' && selectedArticle && (
            <Card title={selectedArticle.title} className="!bg-slate-800/60">
              {/* Render article content - using whitespace-pre-wrap to respect newlines */}
              <div className="prose prose-invert prose-sm md:prose-base max-w-none mt-4 text-white/90 whitespace-pre-wrap leading-relaxed">
                 {selectedArticle.content}
              </div>
            </Card>
          )}

        </div>

        {/* Floating AI Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <IconButton icon={<span className="text-2xl">🤖</span>} className="w-16 h-16 !bg-red-600 hover:!bg-red-700 !text-white !shadow-lg !shadow-red-500/50" onClick={() => alert("Nexus AI Clicked!")} />
        </div>
      </main>
    </div>
  );
};

export default HelpCenterPage;