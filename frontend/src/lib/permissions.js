/* Shared role/permission constants used by the shell and the role-access editor. */

export const DEFAULT_PERMS = {
  owner: ['dashboard', 'clients', 'client', 'appointments', 'inventory', 'billing', 'staff', 'reports'],
  staff: ['dashboard', 'clients', 'client', 'appointments', 'billing'],
  technician: ['dashboard', 'appointments', 'inventory']
};

export const HOME = { owner: 'dashboard', staff: 'dashboard', technician: 'dashboard' };

export const ROLE_LABEL = { owner: 'Owner / Admin', staff: 'Front Desk', technician: 'Technician' };
