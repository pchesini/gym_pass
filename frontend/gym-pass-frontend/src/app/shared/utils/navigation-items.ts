import { NavItem } from '../../core/models/nav-item.model';

export const navigationItems: NavItem[] = [
  { label: 'Dashboard', route: '/dashboard', roles: ['ADMIN'] },
  { label: 'Socios', route: '/socios', roles: ['ADMIN', 'STAFF'] },
  { label: 'Asistencias', route: '/asistencias', roles: ['ADMIN', 'STAFF'] },
  { label: 'Membresias', route: '/membresias', roles: ['ADMIN', 'STAFF'] },
  { label: 'Pagos', route: '/pagos', roles: ['ADMIN'] }
];
