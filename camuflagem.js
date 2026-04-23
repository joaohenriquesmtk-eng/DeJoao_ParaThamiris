(() => {
  function iniciarCamuflagem() {
    const camada = document.getElementById('camuflagem-inicial');
    const frame = document.getElementById('camuflagem-frame');
    if (!camada || !frame) return;

    document.body.classList.add('camuflagem-ativa');

    function desbloquearCamuflagem() {
      camada.classList.add('desbloqueado');
      document.body.classList.remove('camuflagem-ativa');
      window.__camuflagemAtiva = false;

      window.setTimeout(() => {
        if (camada && camada.parentNode) {
          camada.parentNode.removeChild(camada);
        }
      }, 450);
    }

    window.__camuflagemAtiva = true;
    window.desbloquearCamuflagem = desbloquearCamuflagem;

    window.addEventListener('message', (event) => {
      if (event.source !== frame.contentWindow) return;
      if (!event.data || event.data.type !== 'SANTUARIO_UNLOCK') return;
      desbloquearCamuflagem();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarCamuflagem, { once: true });
  } else {
    iniciarCamuflagem();
  }
})();