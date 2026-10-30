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
