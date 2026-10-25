// Centralized Canonical Engineering Branches for Army Institute of Technology (AIT), Pune

export const AIT_BRANCHES = [
  'Computer Engineering',
  'Information Technology',
  'Electronics & Telecommunication',
  'Mechanical Engineering',
  'Automation & Robotics'
];

export const BRANCH_OPTIONS = [
  'All',
  ...AIT_BRANCHES
];

export const BRANCH_ABBREVIATIONS = {
  'Computer Engineering': 'COMP',
  'Information Technology': 'IT',
  'Electronics & Telecommunication': 'E&TC',
  'Mechanical Engineering': 'MECH',
  'Automation & Robotics': 'A&R',
  'Administration': 'ADMIN'
};

export function getBranchAbbr(branch) {
  if (!branch) return 'GEN';
  return BRANCH_ABBREVIATIONS[branch] || branch.slice(0, 4).toUpperCase();
}

export function getBranchBadgeStyle(branch) {
  switch (branch) {
    case 'Computer Engineering':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Information Technology':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Electronics & Telecommunication':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Mechanical Engineering':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Automation & Robotics':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}
