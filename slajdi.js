// Slajdi izbranih del: seznam levo, fotografija desno, puščice, tipke in poteg s prstom.
(function () {
  var gumbi = Array.prototype.slice.call(document.querySelectorAll('.dela__izbira'));
  if (!gumbi.length) return;
  var slika = document.getElementById('dela-slika');
  var st = document.getElementById('dela-st');
  var vrsta = document.getElementById('dela-vrsta');
  var opis = document.getElementById('dela-opis');
  var zdaj = 0;

  function pokazi(i) {
    zdaj = (i + gumbi.length) % gumbi.length;
    var g = gumbi[zdaj];
    gumbi.forEach(function (b) { b.removeAttribute('aria-current'); });
    g.setAttribute('aria-current', 'true');
    slika.classList.add('is-menjava');
    var nova = new Image();
    nova.onload = nova.onerror = function () {
      slika.src = g.dataset.src;
      slika.alt = g.textContent.trim();
      slika.classList.remove('is-menjava');
    };
    nova.src = g.dataset.src;
    st.textContent = zdaj + 1;
    vrsta.textContent = g.dataset.vrsta;
    opis.textContent = g.dataset.opis;
  }

  gumbi.forEach(function (b, i) { b.addEventListener('click', function () { pokazi(i); }); });
  document.getElementById('dela-nazaj').addEventListener('click', function () { pokazi(zdaj - 1); });
  document.getElementById('dela-naprej').addEventListener('click', function () { pokazi(zdaj + 1); });
  document.addEventListener('keydown', function (e) {
    if (e.target.closest('input, textarea, select')) return;
    if (e.key === 'ArrowLeft') pokazi(zdaj - 1);
    if (e.key === 'ArrowRight') pokazi(zdaj + 1);
  });
  var zacetekX = null;
  slika.parentElement.addEventListener('touchstart', function (e) { zacetekX = e.touches[0].clientX; }, { passive: true });
  slika.parentElement.addEventListener('touchend', function (e) {
    if (zacetekX === null) return;
    var dx = e.changedTouches[0].clientX - zacetekX;
    if (Math.abs(dx) > 40) pokazi(zdaj + (dx < 0 ? 1 : -1));
    zacetekX = null;
  });
  // naslednjo sliko naloži vnaprej, da je menjava takojšnja
  gumbi.forEach(function (b) { new Image().src = b.dataset.src; });
})();
