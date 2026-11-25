// Mini-quiz helpers: "show all answers" / "hide all answers" buttons.
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.mq-tools').forEach(function (tools) {
    var list = tools.nextElementSibling;
    if (!list) return;
    var show = tools.querySelector('.show'), hide = tools.querySelector('.hide');
    if (show) show.addEventListener('click', function () { list.querySelectorAll('details').forEach(function (d) { d.open = true; }); });
    if (hide) hide.addEventListener('click', function () { list.querySelectorAll('details').forEach(function (d) { d.open = false; }); });
  });
});

// Printing: open every answer (details) before printing, close the ones that were closed afterwards.
(function () {
  var opened = [];
  window.addEventListener('beforeprint', function () {
    opened = [];
    document.querySelectorAll('details').forEach(function (d) { if (!d.open) { d.open = true; opened.push(d); } });
  });
  window.addEventListener('afterprint', function () { opened.forEach(function (d) { d.open = false; }); opened = []; });
})();
