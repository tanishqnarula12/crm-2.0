// Internal team roster & role assignments.
//
// TEAM_MEMBERS powers the manager-assignment dropdowns in the client form.
// FIXED_ROLES are role holders that are constant across every client and are
// rendered read-only (Owner, Operation Manager, Internal Manager).

export const TEAM_MEMBERS = [
  'Nitesh Luthra',
  'Manish Sharma',
  'Preksha Jain',
  'Vimla Parmanandani',
  'Mehul Khandelwal',
  'Vaishali Choudhary',
];

export const FIXED_ROLES = {
  owner: 'Nitesh Luthra',
  operationManager: 'Mehul Khandelwal',
  internalManager: 'Vaishali Choudhary',
};

// The editable manager roles, in display order. Each maps a clientDetails key
// to its human label — used by both the form and the profile view.
export const MANAGER_ROLES = [
  { key: 'relationshipManager', label: 'Relationship Manager' },
  { key: 'portfolioManager', label: 'Portfolio Manager' },
  { key: 'insuranceManager', label: 'Insurance Manager' },
  { key: 'serviceManager', label: 'Service Manager' },
];
