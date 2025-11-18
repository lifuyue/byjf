// 通用的轻提示，供管理员页面复用
function showMessage(text, type = 'info') {
  const containerId = 'admin-toast-container';
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.position = 'fixed';
    container.style.top = '1.5rem';
    container.style.right = '1.5rem';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '0.5rem';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.textContent = text;
  toast.style.padding = '0.75rem 1rem';
  toast.style.borderRadius = '999px';
  toast.style.boxShadow = '0 6px 20px rgba(15, 23, 42, 0.15)';
  toast.style.color = '#fff';
  toast.style.fontSize = '0.9rem';
  toast.style.background =
    type === 'error' ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'linear-gradient(135deg, #2563eb, #7c3aed)';
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(-6px)';
  toast.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-6px)';
    toast.addEventListener(
      'transitionend',
      () => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
        if (!container.hasChildNodes()) {
          container.remove();
        }
      },
      { once: true }
    );
  }, 2600);
}
