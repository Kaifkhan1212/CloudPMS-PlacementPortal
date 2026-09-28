/** Common helper: extract readable error message from Axios errors */
export const getApiError = (err) => {
  const data = err?.response?.data;
  if (data?.errors && Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors[0].message || data.errors[0].msg || data.message;
  }
  return data?.message || err?.message || 'An unexpected error occurred';
};

/** Format date to readable string */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

/** Format CTC */
export const formatCTC = (ctc) => `₹${ctc} LPA`;

/** Days until deadline */
export const daysUntil = (dateStr) => {
  const diff = new Date(dateStr) - new Date();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Expired';
  if (days === 0) return 'Today';
  return `${days} day${days !== 1 ? 's' : ''} left`;
};

/** Role → home path */
export const rolePath = (role) => {
  if (role === 'student')        return '/student/drives';
  if (role === 'placement_cell') return '/placement/drives';
  if (role === 'admin')          return '/admin/dashboard';
  return '/';
};
