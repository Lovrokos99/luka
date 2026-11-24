// Faze v glavi utripajo po vrsti (Ogled → Ponudba → Izvedba), kot REC/EDIT/PLAY.
(function () {
  var faze = document.querySelectorAll('.faza');
  if (!faze.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var i = 0;
  setInterval(function () {
    faze[i].classList.remove('is-on');
    i = (i + 1) % faze.length;
    faze[i].classList.add('is-on');
  }, 1400);
})();

// Drsnik pred/po: vrednost drsnika premakne mejo med slikama.
(function () {
  var p = document.getElementById('primerjava');
  if (!p) return;
  var d = p.querySelector('.primerjava__drsnik');
  d.addEventListener('input', function () { p.style.setProperty('--poz', d.value + '%'); });
})();

// Postopno pojavljanje ob drsenju: napisi se odprejo od spodaj navzgor, ostalo pride rahlo od spodaj, po vrsti.
(function () {
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var NASLOVI = 'h1, h2, .t-h5, .stevilka__vrednost, .site-footer__big';
  var VSE = 'main h1, main h2, main h3, main p, main li, main figure, main dl > div, main .btn, main .foto, main .primerjava, ' +
    'main .stevilka, main .izbira, main .ocena__foto, main .vnos, main .faq__item, main .contact__actions, main .dela__nadzor, ' +
    '.site-footer__top > *, .site-footer__big';
  // ti razdelki imajo svojo animacijo, zato jih pustimo pri miru
  var SVOJE = '.uvod, .manifest, .rez, .ocena__rezultat';
  var kandidati = Array.prototype.filter.call(document.querySelectorAll(VSE), function (el) { return !el.closest(SVOJE); });
  var mnozica = new Set(kandidati);
  // brez gnezdenja: če se razkrije že starš, otroka ne animiramo posebej
  var elementi = kandidati.filter(function (el) {
    for (var s = el.parentElement; s; s = s.parentElement) if (mnozica.has(s)) return false;
    return true;
  });
  var opazovalec = new IntersectionObserver(function (vnosi) {
    var vidni = vnosi.filter(function (v) { return v.isIntersecting; }).map(function (v) { return v.target; });
    vidni.forEach(function (el, i) {
      el.style.setProperty('--zamik', Math.min(i, 6) * 0.08 + 's');
      el.classList.add('is-vidno');
      opazovalec.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  elementi.forEach(function (el) {
    if (el.matches(NASLOVI)) {
      // clip-path gre na notranji ovoj: opazovalec bi odrezan element štel za nevidnega
      var ovoj = document.createElement('span');
      ovoj.className = 'razkrij-naslov__v';
      while (el.firstChild) ovoj.appendChild(el.firstChild);
      el.appendChild(ovoj);
      el.classList.add('razkrij-naslov');
    } else {
      el.classList.add('razkrij');
    }
    opazovalec.observe(el);
  });
})();
