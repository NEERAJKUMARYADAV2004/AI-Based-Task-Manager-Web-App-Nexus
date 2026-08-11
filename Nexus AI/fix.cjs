const fs = require('fs');
const path = require('path');
const componentsDir = path.join(__dirname, 'src', 'components');
const files = ['DashboardView.jsx', 'TodoPage.jsx', 'CalendarPage.jsx', 'MyProjectsPage.jsx', 'MyNotesPage.jsx', 'StatsPage.jsx', 'ContactUsPage.jsx', 'HelpCenterPage.jsx', 'CollaborationPage.jsx', 'ProfilePage.jsx'];

files.forEach(file => {
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  content = content.replace(/onNotifAction\s*,\s*onNotifAction/g, 'onNotifAction');
  content = content.replace(/onNotifAction\s+onNotifAction/g, 'onNotifAction');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed signature in ' + file);
});
