(function () {
  'use strict';
  var KEY = 'cookie_consent';
  var consent = localStorage.getItem(KEY);

  if (consent === 'accepted' || consent === 'declined') return;

  var isEn = window.location.pathname.indexOf('/en/') === 0;
  var privacyUrl = isEn
    ? '/en/pages/privacy-policy-11909901.html'
    : '/pages/privacy-policy.html';

  var banner = document.createElement('div');
  banner.id = 'cookie-consent-banner';
  banner.style.cssText = [
    'position:fixed', 'bottom:0', 'left:0', 'right:0', 'z-index:999999',
    'background:#1a2b4a', 'color:#fff',
    'padding:14px 24px', 'display:flex', 'align-items:center',
    'justify-content:space-between', 'flex-wrap:wrap', 'gap:10px',
    'font-family:Montserrat,Arial,sans-serif', 'font-size:13px', 'line-height:1.5',
    'box-shadow:0 -2px 12px rgba(0,0,0,0.25)'
  ].join(';');

  var msg = isEn
    ? 'We use cookies and Yandex Metrica for traffic analysis. By clicking “Accept” you agree to our <a href="' + privacyUrl + '" style="color:#7db9f8;text-decoration:underline">Privacy Policy</a>.'
    : 'Мы используем файлы cookie и Яндекс.Метрику для анализа трафика. Нажимая «Принять», вы соглашаетесь с <a href="' + privacyUrl + '" style="color:#7db9f8;text-decoration:underline">Политикой конфиденциальности</a>.';

  var btnStyle = 'border:none;padding:8px 18px;border-radius:4px;cursor:pointer;font-size:12px;font-family:Montserrat,Arial,sans-serif;font-weight:600;white-space:nowrap';

  banner.innerHTML =
    '<span>' + msg + '</span>' +
    '<div style="display:flex;gap:8px;flex-shrink:0">' +
    '<button id="_cc_accept" style="' + btnStyle + ';background:#2563b0;color:#fff">' + (isEn ? 'Accept' : 'Принять') + '</button>' +
    '<button id="_cc_decline" style="' + btnStyle + ';background:transparent;color:#bbb;border:1px solid #666">' + (isEn ? 'Decline' : 'Отклонить') + '</button>' +
    '</div>';

  document.body.appendChild(banner);

  document.getElementById('_cc_accept').onclick = function () {
    localStorage.setItem(KEY, 'accepted');
    banner.remove();
    if (typeof window._initMetrika === 'function') window._initMetrika();
  };

  document.getElementById('_cc_decline').onclick = function () {
    localStorage.setItem(KEY, 'declined');
    banner.remove();
  };
})();
