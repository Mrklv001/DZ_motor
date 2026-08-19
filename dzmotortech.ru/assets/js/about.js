/* Страница «О компании»: три независимых модуля.
   1. Разрез двигателя — список слева и SVG синхронно подсвечивают один узел.
   2. Калькулятор класса энергоэффективности.
   3. Счётчики в первом экране, которые досчитываются при появлении.
   Каждый модуль молча выходит, если своей разметки на странице нет. */
(function () {
  'use strict';

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1. разрез двигателя ---------------------------------------- */

  function initCut() {
    var cut = document.querySelector('[data-dza-cut]');
    if (!cut) return;

    var items = Array.prototype.slice.call(cut.querySelectorAll('[data-dza-item]'));
    var parts = Array.prototype.slice.call(cut.querySelectorAll('[data-dza-part]'));
    if (!items.length || !parts.length) return;

    function select(id) {
      items.forEach(function (item) {
        var on = item.getAttribute('data-dza-item') === id;
        item.classList.toggle('is-lit', on);
        item.querySelector('[data-dza-btn]').setAttribute('aria-expanded', on ? 'true' : 'false');
      });
      parts.forEach(function (part) {
        part.classList.toggle('is-lit', part.getAttribute('data-dza-part') === id);
      });
    }

    items.forEach(function (item) {
      var id = item.getAttribute('data-dza-item');
      item.querySelector('[data-dza-btn]').addEventListener('click', function () { select(id); });
    });

    parts.forEach(function (part) {
      var id = part.getAttribute('data-dza-part');
      part.addEventListener('click', function () { select(id); });
      part.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          select(id);
        }
      });
      /* Наведение на разрез подсвечивает узел, но не раскрывает карточку —
         иначе список дёргается под курсором. */
      part.addEventListener('mouseenter', function () {
        parts.forEach(function (node) { node.classList.toggle('is-lit', node === part); });
      });
    });

    cut.querySelector('.dza-cut__stage').addEventListener('mouseleave', function () {
      var active = cut.querySelector('.dza-cut__item.is-lit');
      if (active) select(active.getAttribute('data-dza-item'));
    });

    select('01');
  }

  /* ---------- 2. история компании ---------------------------------------- */

  function initStory() {
    var story = document.querySelector('[data-dza-story]');
    if (!story) return;

    var steps = Array.prototype.slice.call(story.querySelectorAll('[data-dza-step]'));
    var chapters = Array.prototype.slice.call(story.querySelectorAll('[data-dza-chapter]'));
    if (!steps.length || !chapters.length) return;

    function mark(id) {
      steps.forEach(function (step) {
        step.classList.toggle('is-active', step.getAttribute('data-dza-step') === id);
      });
    }

    steps.forEach(function (step) {
      var id = step.getAttribute('data-dza-step');
      step.querySelector('[data-dza-goto]').addEventListener('click', function () {
        var target = document.getElementById('dza-chapter-' + id);
        if (!target) return;
        target.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'start' });
        mark(id);
      });
    });

    /* Активную главу считаем прямо по прокрутке: та, чей заголовок последним
       прошёл линию под шапкой. IntersectionObserver здесь дал бы то же самое,
       но зависел бы от порядка доставки событий на границах глав. */
    var LINE = 140;

    /* Шесть замеров на событие прокрутки — дешевле, чем кажется, и не зависит
       от кадров анимации: во вкладке без отрисовки rAF не приходит вовсе. */
    function spy() {
      var current = chapters[0].getAttribute('data-dza-chapter');
      for (var i = 0; i < chapters.length; i++) {
        if (chapters[i].getBoundingClientRect().top <= LINE) {
          current = chapters[i].getAttribute('data-dza-chapter');
        }
      }
      mark(current);
    }

    window.addEventListener('scroll', spy, { passive: true });
    window.addEventListener('resize', spy);
    spy();
  }

  /* ---------- 3. счётчики -------------------------------------------------- */

  function initCounters() {
    var host = document.querySelector('[data-dza-counters]');
    if (!host) return;

    var nodes = Array.prototype.slice.call(host.querySelectorAll('[data-dza-count]'));
    if (!nodes.length) return;

    function run(node) {
      var target = parseInt(node.getAttribute('data-dza-count'), 10);
      var prefix = node.getAttribute('data-dza-prefix') || '';
      var suffix = node.getAttribute('data-dza-suffix') || '';
      if (REDUCED || !isFinite(target)) {
        node.textContent = prefix + target + suffix;
        return;
      }
      /* Время берём по часам, а не по метке rAF: в фоновой вкладке кадры
         не приходят, и счётчик иначе застыл бы на случайном числе. */
      var started = Date.now();
      var duration = 1100;
      function step() {
        var progress = Math.min((Date.now() - started) / duration, 1);
        /* easeOutCubic: быстрый старт, мягкая остановка на нужном числе */
        var eased = 1 - Math.pow(1 - progress, 3);
        node.textContent = prefix + Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      nodes.forEach(run);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        run(entry.target);
      });
    }, { threshold: 0.4 });

    nodes.forEach(function (node) { observer.observe(node); });
  }

  function init() {
    initCut();
    initStory();
    initCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
