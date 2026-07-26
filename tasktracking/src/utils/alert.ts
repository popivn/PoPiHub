import Swal from 'sweetalert2';

// Toast Notification setup
export const toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  background: '#1e293b',
  color: '#f8fafc',
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

// Custom Confirm Alert for Delete
export const confirmDelete = async (title: string, text: string) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#475569',
    confirmButtonText: 'Xóa ngay',
    cancelButtonText: 'Hủy bỏ',
    background: '#0f172a',
    color: '#f8fafc',
    customClass: {
      popup: 'rounded-2xl border border-slate-800 shadow-2xl',
    },
  });

  return result.isConfirmed;
};

// Warning alert
export const showAlert = (title: string, text: string, icon: 'info' | 'warning' | 'error' | 'success' = 'info') => {
  Swal.fire({
    title,
    text,
    icon,
    confirmButtonColor: '#6366f1',
    background: '#0f172a',
    color: '#f8fafc',
    customClass: {
      popup: 'rounded-2xl border border-slate-800 shadow-2xl',
    },
  });
};
