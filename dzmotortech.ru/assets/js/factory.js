/* Экскурсия по цехам: список слева переключает плеер и описание справа.
   Видео не грузится, пока его не запустили — на странице семь роликов
   общим весом около 56 МБ, и загружать их разом незачем. */
(function () {
  'use strict';

  function init() {
    var tour = document.querySelector('[data-dzf-tour]');
    if (!tour) return;

    var buttons = Array.prototype.slice.call(tour.querySelectorAll('[data-dzf-shop]'));
    var player = tour.querySelector('[data-dzf-player]');
    var poster = tour.querySelector('[data-dzf-poster]');
    var video = tour.querySelector('[data-dzf-video]');
    var titleEl = tour.querySelector('[data-dzf-title]');
    var textEl = tour.querySelector('[data-dzf-text]');
    var chipsEl = tour.querySelector('[data-dzf-chips]');
    if (!buttons.length || !player || !video) return;

    function stop() {
      video.pause();
      video.removeAttribute('src');
      video.load();
      player.classList.remove('is-playing');
    }

    function show(button) {
      buttons.forEach(function (node) {
        node.setAttribute('aria-selected', node === button ? 'true' : 'false');
      });

      var data = JSON.parse(button.getAttribute('data-dzf-shop'));

      stop();
      poster.src = data.poster;
      poster.alt = data.title;
      video.setAttribute('data-src', data.video);
      titleEl.textContent = data.title;

      textEl.innerHTML = '';
      data.text.forEach(function (paragraph) {
        var p = document.createElement('p');
        p.className = 'dzf-shop__text';
        p.textContent = paragraph;
        textEl.appendChild(p);
      });

      chipsEl.innerHTML = '';
      data.chips.forEach(function (chip) {
        var li = document.createElement('li');
        li.textContent = chip;
        chipsEl.appendChild(li);
      });
    }

    function play() {
      var src = video.getAttribute('data-src');
      if (!src) return;
      video.src = src;
      player.classList.add('is-playing');
      var started = video.play();
      if (started && started.catch) started.catch(function () { /* автозапуск может быть запрещён — плеер останется с кнопками */ });
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function () { show(button); });
    });

    tour.querySelector('[data-dzf-play]').addEventListener('click', play);

    show(buttons[0]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
