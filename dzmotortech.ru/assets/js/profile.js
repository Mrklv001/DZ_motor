/* Аккордеон на странице «Профиль компании»: панель раскрывается при наведении
   на мыши и по нажатию — на сенсорных экранах и с клавиатуры.
   Без зависимостей; если скрипт не загрузится, первая панель просто останется
   раскрытой, а остальные будут доступны как обычные карточки. */
(function () {
  'use strict';

  function init() {
    var accordion = document.querySelector('[data-dzc-acc]');
    if (!accordion) return;

    var items = Array.prototype.slice.call(accordion.querySelectorAll('[data-dzc-acc-item]'));
    if (!items.length) return;

    var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    var wide = window.matchMedia('(min-width: 901px)');

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    /* Клик по кадру ведёт к развёрнутому разделу под аккордеоном. */
    function goToSection(item) {
      var id = item.getAttribute('data-dzc-acc-target');
      var target = id && document.getElementById(id);
      if (!target) return;

      target.scrollIntoView({
        behavior: reduceMotion.matches ? 'auto' : 'smooth',
        block: 'start'
      });
    }

    function activate(item) {
      items.forEach(function (node) {
        var active = node === item;
        node.classList.toggle('is-active', active);
        node.setAttribute('aria-expanded', active ? 'true' : 'false');
        node.setAttribute('tabindex', active ? '0' : '0');
      });
    }

    activate(items[0]);

    items.forEach(function (item) {
      item.addEventListener('pointerenter', function () {
        if (fine.matches && wide.matches) activate(item);
      });

      item.addEventListener('click', function () {
        // На сенсорном экране первое касание раскрывает кадр, второе — уводит
        // к разделу: иначе текст под пальцем не успеть прочитать.
        var needsOpen = !fine.matches && wide.matches && !item.classList.contains('is-active');
        activate(item);
        if (!needsOpen) goToSection(item);
      });

      item.addEventListener('keydown', function (event) {
        var index = items.indexOf(item);

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activate(item);
          goToSection(item);
          return;
        }

        var next = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = items[index + 1];
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = items[index - 1];

        if (next) {
          event.preventDefault();
          activate(next);
          next.focus();
        }
      });

      item.addEventListener('focus', function () {
        if (wide.matches) activate(item);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
