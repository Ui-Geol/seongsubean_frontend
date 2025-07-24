export function showBoardModal({
  type = null,
  icon,
  title,
  message,
  confirmColor,
  onConfirm = null
}) {
  const modal = document.getElementById('board-modal');
  const iconEl = document.getElementById('modal-icon');
  const titleEl = document.getElementById('modal-title');
  const descEl = document.getElementById('modal-description');
  const confirmBtn = document.getElementById('modal-confirm-btn');

  if (!modal || !iconEl || !titleEl || !descEl || !confirmBtn) {
    console.warn("Modal DOM 요소를 찾을 수 없습니다.");
    return;
  }

  const presetMap = {
    'comment-create': {
      icon: '✅',
      title: '댓글 등록 완료',
      message: '댓글이 등록되었습니다.',
      confirmColor: 'blue'
    },
    'comment-delete': {
      icon: '🗑️',
      title: '댓글 삭제',
      message: '댓글을 삭제하시겠습니까?',
      confirmColor: 'red'
    },
    'post-delete': {
      icon: '🗑️',
      title: '게시글 삭제',
      message: '게시글을 삭제하시겠습니까?',
      confirmColor: 'red'
    },
    'post-edit': {
      icon: '✏️',
      title: '게시글 수정 완료',
      message: '게시글이 성공적으로 수정되었습니다.',
      confirmColor: 'blue'
    },
    'post-create': {
      icon: '✅',
      title: '게시글 등록 완료',
      message: '게시글이 등록되었습니다.',
      confirmColor: 'blue'
    }
  };

  const preset = type ? presetMap[type] : {};

  iconEl.textContent = icon || preset.icon || '✅';
  titleEl.textContent = title || preset.title || '완료';
  descEl.textContent = message || preset.message || '작업이 완료되었습니다.';

  const finalColor = confirmColor || preset.confirmColor || 'blue';
  confirmBtn.style.backgroundColor = finalColor === 'red' ? '#dc3545' : '#0d6efd';
  confirmBtn.style.color = 'white';

  modal.classList.add('active');

  const handleConfirm = () => {
    modal.classList.remove('active');
    if (onConfirm) onConfirm();
    confirmBtn.removeEventListener('click', handleConfirm);
  };

  confirmBtn.addEventListener('click', handleConfirm);
}
