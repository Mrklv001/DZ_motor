/* Каталог продукции: живой поиск по моделям и подсветка активной категории.
   Ванильный JS, без зависимостей — jQuery на странице есть, но здесь не нужен. */
(function () {
  'use strict';

  var root = document.querySelector('[data-dzc-catalog]');
  if (!root) return;

  var sections = Array.prototype.slice.call(root.querySelectorAll('[data-dzc-section]'));
  var tiles = Array.prototype.slice.call(root.querySelectorAll('[data-dzc-tile]'));
  var chips = Array.prototype.slice.call(root.querySelectorAll('[data-dzc-chip]'));
  var input = root.querySelector('[data-dzc-search]');
  var clearButton = root.querySelector('[data-dzc-search-clear]');
  var empty = root.querySelector('[data-dzc-empty]');
  var tilesSection = root.querySelector('#dzc-categories');
  var emptyQuery = root.querySelector('[data-dzc-empty-query]');
  var counter = root.querySelector('[data-dzc-count]');
  var counterLine = root.querySelector('[data-dzc-count-line]');
  var totalModels = Number(root.getAttribute('data-dzc-total')) || 0;

  /* --- поиск ------------------------------------------------------------ */

  function normalise(value) {
    return (value || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  }

  function applySearch(rawQuery) {
    var query = normalise(rawQuery);
    var terms = query ? query.split(' ') : [];
    var visibleModels = 0;
    var visibleSections = 0;

    sections.forEach(function (section) {
      var items = section.querySelectorAll('[data-dzc-item]');
      var shown = 0;

      Array.prototype.forEach.call(items, function (item) {
        var haystack = item.getAttribute('data-dzc-item') || '';
        var hit = terms.every(function (term) { return haystack.indexOf(term) !== -1; });
        item.classList.toggle('is-hidden', !hit);
        if (hit) shown++;
      });

      section.classList.toggle('is-hidden', shown === 0);
      if (shown) {
        visibleSections++;
        visibleModels += shown;
      }

      var id = section.id;
      chips.forEach(function (chip) {
        if (chip.getAttribute('href') === '#' + id) {
          chip.classList.toggle('is-hidden', shown === 0);
        }
      });
      tiles.forEach(function (tile) {
        if (tile.getAttribute('href') === '#' + id) {
          tile.classList.toggle('is-hidden', shown === 0);
        }
      });
    });

    // Заголовок «Выберите тип оборудования» без единой плитки выглядит поломкой.
    if (tilesSection) {
      tilesSection.classList.toggle('is-hidden', visibleSections === 0);
    }
    if (empty) {
      empty.classList.toggle('is-visible', visibleSections === 0);
      if (emptyQuery) emptyQuery.textContent = rawQuery;
    }
    root.classList.toggle('is-searching', terms.length > 0);
    if (counter) {
      counter.textContent = String(terms.length ? visibleModels : totalModels);
    }
    if (counterLine) {
      counterLine.hidden = terms.length === 0;
    }
    if (clearButton) {
      clearButton.classList.toggle('is-visible', terms.length > 0);
    }
  }

  if (input) {
    var pending = null;
    input.addEventListener('input', function () {
      window.clearTimeout(pending);
      var value = input.value;
      pending = window.setTimeout(function () { applySearch(value); }, 90);
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        input.value = '';
        applySearch('');
      }
    });
  }

  if (clearButton) {
    clearButton.addEventListener('click', function () {
      if (!input) return;
      input.value = '';
      applySearch('');
      input.focus();
    });
  }

  /* --- «Показать ещё» в списках категорий -------------------------------- */

  Array.prototype.forEach.call(root.querySelectorAll('[data-dzc-more]'), function (button) {
    button.addEventListener('click', function () {
      var section = button.closest('[data-dzc-section]');
      if (!section) return;

      var expanded = section.classList.toggle('is-expanded');
      button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      button.textContent = expanded
        ? button.getAttribute('data-dzc-less-label')
        : button.getAttribute('data-dzc-more-label');

      // Сворачивая длинный список, возвращаем пользователя к началу раздела,
      // иначе он окажется где-то посреди следующей категории.
      if (!expanded) {
        var top = section.getBoundingClientRect().top;
        if (top < 0) section.scrollIntoView({ block: 'start' });
      }
    });
  });

  /* --- подсветка активной категории ------------------------------------- */

  var chipStrip = root.querySelector('[data-dzc-chips]');
  var activeId = null;

  function setActive(id) {
    if (id === activeId) return;
    activeId = id;

    chips.forEach(function (chip) {
      var isActive = chip.getAttribute('href') === '#' + id;
      chip.classList.toggle('is-active', isActive);

      // Активный чип подтягиваем внутри самой ленты, не трогая прокрутку страницы.
      if (isActive && chipStrip) {
        var chipBox = chip.getBoundingClientRect();
        var stripBox = chipStrip.getBoundingClientRect();
        if (chipBox.left < stripBox.left) {
          chipStrip.scrollLeft -= stripBox.left - chipBox.left + 16;
        } else if (chipBox.right > stripBox.right) {
          chipStrip.scrollLeft += chipBox.right - stripBox.right + 16;
        }
      }
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var visible = Object.create(null);

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          visible[entry.target.id] = entry.boundingClientRect.top;
        } else {
          delete visible[entry.target.id];
        }
      });

      var ids = Object.keys(visible);
      if (!ids.length) return;
      ids.sort(function (a, b) { return visible[a] - visible[b]; });
      setActive(ids[0]);
    }, { rootMargin: '-96px 0px -55% 0px', threshold: 0 });

    sections.forEach(function (section) { observer.observe(section); });
  }
}());
