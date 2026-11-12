// Step-by-step build-up figures ("steppers").
// Markup: <div class="stepper" id="ID"> <svg> ...groups with data-step="N" [data-until="M"]... </svg> </div>
//   - a group with data-step="N" is shown from step N on; with data-until="M" it is hidden again from step M on;
//   - <text class="lbl ..."> inside a group is shown only while its own step is the current one.
// Call: Stepper.init('ID', steps, 'hashkey')  with steps = [{t: title, en: text, nl: text}, ...]
//   The controls (Back / Next, step counter, text panel) are generated. Debug: open the page with #hashkey=N.
window.Stepper = {
  init: function (id, steps, key) {
    var box = document.getElementById(id);
    if (!box) return;
    var groups = box.querySelectorAll('[data-step]');
    var max = steps.length, cur = 1;
    var bar = document.createElement('div'); bar.className = 'stepbar';
    bar.innerHTML = '<button type="button" class="stepbtn" data-dir="-1">← Back</button>' +
      '<span class="stepnum"></span>' +
      '<button type="button" class="stepbtn" data-dir="1">Next →</button>';
    var txt = document.createElement('div'); txt.className = 'steptext';
    txt.innerHTML = '<p class="steptitle"></p><p class="stepen"></p><p class="stepnl"></p>';
    box.appendChild(bar); box.appendChild(txt);
    var num = bar.querySelector('.stepnum'), btns = bar.querySelectorAll('.stepbtn');
    var pt = txt.querySelector('.steptitle'), pe = txt.querySelector('.stepen'), pn = txt.querySelector('.stepnl');
    function show(n) {
      cur = Math.max(1, Math.min(max, n));
      for (var i = 0; i < groups.length; i++) {
        var g = groups[i], s = +g.getAttribute('data-step'), u = g.getAttribute('data-until');
        var on = s <= cur && (!u || cur < +u);
        g.style.display = on ? '' : 'none';
        g.classList.toggle('fresh', s === cur);
        var ls = g.querySelectorAll('.lbl');
        for (var j = 0; j < ls.length; j++) ls[j].style.display = s === cur ? '' : 'none';
      }
      num.textContent = 'Step ' + cur + ' of ' + max;
      pt.textContent = steps[cur - 1].t; pe.textContent = steps[cur - 1].en; pn.textContent = steps[cur - 1].nl || '';
      btns[0].disabled = cur === 1; btns[1].disabled = cur === max;
    }
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('.stepbtn'); if (b) show(cur + (+b.getAttribute('data-dir')));
    });
    box.setAttribute('tabindex', '0');
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { show(cur + 1); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { show(cur - 1); e.preventDefault(); }
    });
    var m = key && location.hash.match(new RegExp(key + '=(\\d+)'));
    show(m ? +m[1] : 1);
  }
};
