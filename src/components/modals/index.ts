// Named exports
export { Modal } from './Modal';
export { ConfirmModal } from './ConfirmModal';
export { LoadingModal } from './LoadingModal';

// Default exports (re-exported as named)
export { default as WelcomeModal } from './WelcomeModal';
export { default as AnnouncementDetailsModal } from './AnnouncementDetailsModal';

// Dashboard-coupled modals live in src/features/dashboard/components/
// because they have deep dependencies on dashboard sibling components.

