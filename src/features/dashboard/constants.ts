import { Variants } from 'framer-motion';
import { ActivityEvent } from '@src/features/dashboard/components/ActivityCard';
import { Portal } from '@src/features/dashboard/components/DashboardHero';

export const emptyActivityForm: Omit<ActivityEvent, 'id'> = {
  title: '',
  type: 'Client Meeting',
  date: '',
  time: '',
  location: '',
  notes: '',
  status: 'Scheduled'
};

export const initialActivities: ActivityEvent[] = [];

export const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
};

export const itemVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
};

export const defaultPortals: Portal[] = [
  { name: 'Sun Life Portal', logo: '/images/logos/sunlife.svg', width: 26, url: 'https://www.sunlife.com.ph/en/', manage: '/admin/portals/sun-life' },
  { name: 'Advisor Office', logo: '/images/logos/advisor_office.svg', width: 26, url: 'https://advisorhomeoffice.sunlife.com.ph/aho/index.html#/:', manage: '/admin/portals/advisor-office' },
  { name: 'Google Sheets', logo: '/images/logos/google_sheets.svg', width: 22, url: 'https://bit.ly/4f2fpLK', manage: '/admin/portals/google-sheets' },
  { name: 'Task Tracker', logo: '/images/logos/task_tracker.svg', width: 22, url: 'https://teampaduatracker.vercel.app/tasktracker', manage: '/admin/portals/task-tracker' },
  { name: 'Jot Form', logo: '/images/logos/jotform.svg', width: 22, url: 'https://www.jotform.com/', manage: '/admin/portals/jotform' },
  { name: 'Jot Form Intern', logo: '/images/logos/jotform_intern.svg', width: 24, url: 'https://form.jotform.com/261829362405055', manage: '/admin/portals/jotform' },
  { name: 'Microsoft Teams', logo: '/images/logos/microsoft_teams.svg', width: 22, url: 'https://teams.microsoft.com/', manage: '/admin/portals/microsoft-teams' },
  { name: 'Canva', logo: '/images/logos/canva.svg', width: 26, url: 'https://www.canva.com/', manage: '/admin/portals/canva' },
  { name: 'Zoom', logo: '/images/logos/zoom.svg', width: 24, url: 'https://bit.ly/4wrEVBg', manage: '/admin/portals/zoom' },
  { name: 'G-Drive', logo: '/images/logos/google_drive.svg', width: 24, url: 'https://drive.google.com/drive/folders/1ZLNJHFUFYDkVG9pQwMF2hio89j7vp04x?usp=sharing', manage: '/admin/portals/google-drive' },
  { name: 'Client Policy Card', logo: '/images/logos/client_policy_card.svg', width: 24, url: 'https://team-padua-client-policy-card.vercel.app/', manage: '/admin/portals/client-policy-card' },
  { name: 'Daniel Padua Portfolio', logo: '/images/logos/daniel_padua_portfolio.svg', width: 24, url: 'https://danielpadua.vercel.app/', manage: '/admin/portals/daniel-padua-portfolio' },
];
