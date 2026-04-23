(() => {
  window.SantuarioSomPausado = true;

  function mutarElemento(mid) {
    if (!mid) return;
    try {
      mid.muted = true;
      mid.defaultMuted = true;
      mid.volume = 0;
      mid.setAttribute('muted', '');
    } catch (_) {}
  }

  function mutarTodosOsElementosDeMidia() {
    document.querySelectorAll('audio, video').forEach(mutarElemento);
  }

  // 1) Muta tudo que já existir
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mutarTodosOsElementosDeMidia, { once: true });
  } else {
    mutarTodosOsElementosDeMidia();
  }

  // 2) Muta tudo que nascer depois
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;

        if (node.matches && node.matches('audio, video')) {
          mutarElemento(node);
        }

        if (node.querySelectorAll) {
          node.querySelectorAll('audio, video').forEach(mutarElemento);
        }
      }
    }
  });

  try {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  } catch (_) {}

  // 3) Intercepta play() de qualquer audio/video
  const originalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...args) {
    mutarElemento(this);
    try {
      return originalPlay.apply(this, args);
    } catch (_) {
      return Promise.resolve();
    }
  };

  // 4) Intercepta pause só para manter compatibilidade
  const originalPause = HTMLMediaElement.prototype.pause;
  HTMLMediaElement.prototype.pause = function (...args) {
    try {
      return originalPause.apply(this, args);
    } catch (_) {}
  };

  // 5) Intercepta new Audio(...)
  const OriginalAudio = window.Audio;
  if (typeof OriginalAudio === 'function') {
    window.Audio = function (...args) {
      const audio = new OriginalAudio(...args);
      mutarElemento(audio);
      return audio;
    };
    window.Audio.prototype = OriginalAudio.prototype;
  }

  // 6) Web Audio API: mantém contexto sempre silencioso
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (AudioContextCtor && AudioContextCtor.prototype) {
    const proto = AudioContextCtor.prototype;

    if (proto.resume) {
      proto.resume = function () {
        try { return this.suspend(); } catch (_) { return Promise.resolve(); }
      };
    }

    if (proto.createGain) {
      const originalCreateGain = proto.createGain;
      proto.createGain = function (...args) {
        const gainNode = originalCreateGain.apply(this, args);
        try {
          if (gainNode && gainNode.gain) {
            gainNode.gain.value = 0;
          }
        } catch (_) {}
        return gainNode;
      };
    }
  }

  // 7) Speech synthesis: bloqueia qualquer fala
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak = function () {};
    } catch (_) {}
  }

  // 8) Segurança extra: força mute periódico em mídias ativas
  setInterval(() => {
    document.querySelectorAll('audio, video').forEach(mutarElemento);
  }, 1000);
})();