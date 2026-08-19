/* Страница «Области применения»: просмотр фотографий объектов на весь экран.
   Список кадров лежит в JSON рядом с разметкой — подписи в мозаике и в окне
   просмотра берутся из одного источника. Пролистывание идёт сквозь все
   отрасли подряд, поэтому в окне видно, к какой из них относится кадр. */
(function () {
  'use strict';

  function init() {
    var box = document.querySelector('[data-dzu-lb]');
    var data = document.querySelector('[data-dzu-data]');
    if (!box || !data) return;

    var shots;
    try {
      shots = JSON.parse(data.textContent);
    } catch (error) {
      return;
    }
    if (!shots.length) return;

    var image = box.querySelector('[data-dzu-image]');
    var titleEl = box.querySelector('[data-dzu-lb-title]');
    var metaEl = box.querySelector('[data-dzu-lb-meta]');
    var countEl = box.querySelector('[data-dzu-count]');
    var closeButton = box.querySelector('[data-dzu-close]');
    var current = 0;
    var opener = null;

    function show(index) {
      var shot = shots[index];
      if (!shot) return;
      current = index;
      image.src = shot.src;
      image.alt = shot.name;
      titleEl.textContent = shot.name;
      metaEl.textContent = shot.field;
      countEl.textContent = (index + 1) + ' / ' + shots.length;
    }

    function step(delta) {
      show((current + delta + shots.length) % shots.length);
    }

    function open(index, trigger) {
      opener = trigger || null;
      show(index);
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      closeButton.focus();
    }

    function close() {
      box.hidden = true;
      document.body.style.overflow = '';
      image.removeAttribute('src');
      if (opener) opener.focus();
      opener = null;
    }

    Array.prototype.slice.call(document.querySelectorAll('[data-dzu-open]')).forEach(function (button) {
      button.addEventListener('click', function () {
        open(parseInt(button.getAttribute('data-dzu-open'), 10), button);
      });
    });

    closeButton.addEventListener('click', close);
    box.querySelector('[data-dzu-prev]').addEventListener('click', function () { step(-1); });
    box.querySelector('[data-dzu-next]').addEventListener('click', function () { step(1); });

    /* Клик мимо кадра закрывает окно, по самому кадру — нет. */
    box.addEventListener('click', function (event) {
      if (event.target === box || event.target.classList.contains('dzu-lb__stage')) close();
    });

    document.addEventListener('keydown', function (event) {
      if (box.hidden) return;
      if (event.key === 'Escape') { close(); return; }
      if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
