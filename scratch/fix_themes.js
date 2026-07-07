const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  console.log(`Fixing file: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Basic replacements
  const replacements = {
    'bg-[#FAFAFA]': 'bg-background',
    'bg-[#FAFAFA]/50': 'bg-background/50',
    'bg-[#FAFAF8]': 'bg-background',
    'bg-[#FAF9F5]': 'bg-background',
    'bg-[#FAF9F6]': 'bg-background',
    'text-[#111111]': 'text-foreground',
    'text-gray-900': 'text-foreground',
    'text-zinc-900': 'text-foreground',
    'text-gray-800': 'text-foreground',
    'text-zinc-800': 'text-foreground',
    'text-gray-700': 'text-foreground/90',
    'text-zinc-700': 'text-foreground/90',
    'text-gray-600': 'text-foreground/80',
    'text-zinc-600': 'text-foreground/80',
    'text-gray-500': 'text-muted-foreground',
    'text-zinc-500': 'text-muted-foreground',
    'text-gray-400': 'text-muted-foreground',
    'text-zinc-400': 'text-muted-foreground',
    'text-gray-300': 'text-muted-foreground/60',
    'text-zinc-300': 'text-muted-foreground/60',
    'text-gray-200': 'text-border',
    'text-zinc-200': 'text-border',
    'bg-white': 'bg-card',
    'border-[#ECECEC]': 'border-border',
    'border-[#EAEAEA]': 'border-border',
    'border-[#EAE6DF]': 'border-border',
    'bg-gray-50': 'bg-muted',
    'bg-zinc-50': 'bg-muted',
    'bg-gray-50/50': 'bg-muted/30',
    'bg-zinc-50/50': 'bg-muted/30',
    'hover:bg-gray-50': 'hover:bg-muted',
    'hover:bg-zinc-50': 'hover:bg-muted',
    'hover:bg-gray-50/40': 'hover:bg-muted/40',
    'hover:bg-zinc-50/40': 'hover:bg-muted/40',
    'bg-amber-50/60': 'bg-[#FFF7D6] dark:bg-[#2E2818] text-black dark:text-[#F4C542] border border-[#F4C542]/20',
    'bg-[#D4AF37]': 'bg-[#FFF7D6] dark:bg-[#2E2818] text-black dark:text-[#F4C542] border border-[#F4C542]/20',
    'hover:bg-[#c4a030]': 'hover:bg-[#F4C542] dark:hover:bg-[#3d331a]',
    'hover:bg-[#d4af37]': 'hover:bg-[#F4C542] dark:hover:bg-[#3d331a]',
    'text-[#D4AF37]': 'text-[#F4C542]',
    'accent-[#D4AF37]': 'accent-[#F4C542]',
    'bg-amber-50': 'bg-[#FFF7D6] dark:bg-[#2E2818]/40',
    'text-amber-800': 'text-[#A3843B] dark:text-[#F4C542]',
    'border-amber-100': 'border-[#F4C542]/20',
    'border-amber-200/60': 'border-[#F4C542]/30',
    'bg-[#FAF9F5]/30': 'bg-muted/30',
    'bg-slate-50/50': 'bg-background',
    'bg-slate-50': 'bg-muted',
    'border-slate-200': 'border-border',
    'border-slate-100': 'border-border',
    'text-slate-900': 'text-foreground',
    'text-slate-800': 'text-foreground',
    'text-slate-700': 'text-foreground/90',
    'text-slate-600': 'text-foreground/80',
    'text-slate-500': 'text-muted-foreground',
    'text-slate-400': 'text-muted-foreground',
    'text-slate-300': 'text-muted-foreground/60',
    'hover:bg-slate-50': 'hover:bg-muted',
    'hover:bg-slate-50/80': 'hover:bg-muted/80',
    'bg-slate-100': 'bg-muted',
    'border-slate-200/60': 'border-border/60',
    'ring-white': 'ring-card',
  };

  // Apply replacements
  for (const [oldStr, newStr] of Object.entries(replacements)) {
    // Escape special regex chars
    const escaped = oldStr.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    content = content.replace(new RegExp(escaped, 'g'), newStr);
  }

  // Remove comments
  function removeComments(text) {
    const lines = text.split('\n');
    const newLines = [];
    for (const line of lines) {
      const parts = line.split('//');
      if (parts.length > 1) {
        let reconstructed = parts[0];
        let hasComment = false;
        for (let i = 1; i < parts.length; i++) {
          if (reconstructed.endsWith('http:') || reconstructed.endsWith('https:')) {
            reconstructed += '//' + parts[i];
          } else {
            hasComment = true;
            break;
          }
        }
        if (!hasComment) {
          newLines.push(line);
        } else {
          newLines.push(reconstructed.trimEnd());
        }
      } else {
        newLines.push(line);
      }
    }

    let textNoComments = newLines.join('\n');
    // Remove block comments
    textNoComments = textNoComments.replace(/\/\*[\s\S]*?\*\//g, '');
    return textNoComments;
  }

  content = removeComments(content);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully fixed: ${filePath}`);
}

const filesToFix = [
  // Admin pages
  path.join(__dirname, '..', 'app', '(admin)', 'admin', 'teams', 'page.tsx'),
  path.join(__dirname, '..', 'app', '(admin)', 'admin', 'messages', 'AdminMessagesClient.tsx'),
  path.join(__dirname, '..', 'app', '(admin)', 'admin', 'dashboard', 'analytics', 'page.tsx'),
  path.join(__dirname, '..', 'app', '(admin)', 'admin', 'reports', 'page.tsx'),
  path.join(__dirname, '..', 'app', '(admin)', 'admin', 'Design', 'page.tsx'),
  // User pages
  path.join(__dirname, '..', 'app', '(user)', 'teams', 'page.tsx'),
  path.join(__dirname, '..', 'app', '(user)', 'tasks', 'page.tsx'),
  path.join(__dirname, '..', 'app', '(user)', 'messages', 'MessagesClient.tsx'),
  path.join(__dirname, '..', 'app', '(user)', 'attendance', 'page.tsx'),
  path.join(__dirname, '..', 'app', '(user)', 'attendance', 'AttendanceDashboard.tsx'),
  path.join(__dirname, '..', 'app', '(user)', 'attendance', 'AttendanceStats.tsx'),
  path.join(__dirname, '..', 'app', '(user)', 'attendance', 'AttendanceTable.tsx'),
  path.join(__dirname, '..', 'app', '(user)', 'attendance', 'AttendanceCalendar.tsx'),
  path.join(__dirname, '..', 'app', '(user)', 'attendance', 'AttendanceHistory.tsx'),
  path.join(__dirname, '..', 'app', '(user)', 'attendance', 'AttendanceModal.tsx'),
  path.join(__dirname, '..', 'app', '(user)', 'attendance', 'AttendanceTimeline.tsx'),
  path.join(__dirname, '..', 'app', '(user)', 'dashboard', 'all', 'page.tsx'),
];

filesToFix.forEach(fixFile);
