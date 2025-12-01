// Main JavaScript file

document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips, dropdowns, etc.
  initializeUI();
});

function initializeUI() {
  // Auto-hide alerts after 5 seconds
  const alerts = document.querySelectorAll('[data-auto-hide]');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.transition = 'opacity 0.5s';
      alert.style.opacity = '0';
      setTimeout(() => alert.remove(), 500);
    }, 5000);
  });

  // Confirm delete actions
  const deleteButtons = document.querySelectorAll('[data-confirm]');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
      if (!confirm(this.dataset.confirm || '¿Estás seguro?')) {
        e.preventDefault();
      }
    });
  });

  // Format currency inputs
  const currencyInputs = document.querySelectorAll('[data-currency]');
  currencyInputs.forEach(input => {
    input.addEventListener('blur', function() {
      const value = parseFloat(this.value) || 0;
      this.value = value.toFixed(2);
    });
  });

  // Search with debounce
  const searchInputs = document.querySelectorAll('[data-search]');
  searchInputs.forEach(input => {
    let timeout;
    input.addEventListener('input', function() {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const form = this.closest('form');
        if (form) form.submit();
      }, 500);
    });
  });
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function showAlert(message, type = 'info') {
  const colors = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700'
  };

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  const alert = document.createElement('div');
  alert.className = `fixed top-4 right-4 px-4 py-3 rounded-lg border ${colors[type]} animate-fadeIn z-50`;
  alert.innerHTML = `<i class="fas ${icons[type]} mr-2"></i>${message}`;
  document.body.appendChild(alert);

  setTimeout(() => {
    alert.style.transition = 'opacity 0.5s';
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 500);
  }, 4000);
}

// Modal utilities
function openModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
  document.body.style.overflow = '';
}

// Close modal on escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const modals = document.querySelectorAll('[id^="modal"]:not(.hidden)');
    modals.forEach(modal => modal.classList.add('hidden'));
    document.body.style.overflow = '';
  }
});

// Close modal on background click
document.addEventListener('click', function(e) {
  if (e.target.matches('[id^="modal"]')) {
    e.target.classList.add('hidden');
    document.body.style.overflow = '';
  }
});

// Export for use in other scripts
window.utils = {
  formatCurrency,
  formatDate,
  showAlert,
  openModal,
  closeModal
};

