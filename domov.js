// Naslovnica: kratko uvajanje s časovno kodo, prižiganje besed v manifestu, pripeta slika s tremi stolpci.
(function () {
  var manjGibanja = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1) uvajanje: samo ob prvem obisku v seji, največ 0,9 s
  var uv = document.getElementById('uvajanje');
  var zeVidel = false;
  try { zeVidel = sessionStorage.getItem('uvajanje') === '1'; sessionStorage.setItem('uvajanje', '1'); } catch (e) {}
  if (!uv || manjGibanja || zeVidel) {
    if (uv) uv.remove();
  } else {
    var crta = document.getElementById('uvajanje-crta');
    var cas = document.getElementById('uvajanje-cas');
    var zacetek = performance.now();
    var TRAJANJE = 900;
    (function korak(t) {
      var p = Math.min(1, (t - zacetek) / TRAJANJE);
      crta.style.transform = 'scaleX(' + p + ')';
      var okvirji = Math.floor(p * 49);
      cas.textContent = '00:00:0' + Math.floor(okvirji / 25) + ':' + String(okvirji % 25).padStart(2, '0');
      if (p < 1) requestAnimationFrame(korak);
      else { uv.classList.add('is-konec'); setTimeout(function () { uv.remove(); }, 500); }
    })(zacetek);
  }

  // 2) manifest: besede se prižgejo, ko gre odsek skozi zaslon
  var besede = Array.prototype.slice.call(document.querySelectorAll('.manifest .b'));
  var manifest = document.getElementById('manifest');
  // 3) rez: pripeta slika in trije stolpci, menjava po tretjinah poti
  var rez = document.getElementById('rez');
  var slike = rez ? rez.querySelectorAll('.rez__slika') : [];
  var stolpci = rez ? rez.querySelectorAll('.rez__stolpec') : [];

  function napredek(el) {
    var r = el.getBoundingClientRect();
    var pot = r.height - innerHeight;
    return pot > 0 ? Math.min(1, Math.max(0, -r.top / pot)) : (r.top < innerHeight / 2 ? 1 : 0);
  }
  function osvezi() {
    if (manifest && besede.length) {
      var p = manjGibanja ? 1 : napredek(manifest) * 1.15;
      var prizgane = Math.round(p * besede.length);
      besede.forEach(function (b, i) { b.classList.toggle('is-on', i < prizgane); });
    }
    if (rez && slike.length) {
      var k = Math.min(slike.length - 1, Math.floor(napredek(rez) * slike.length));
      for (var i = 0; i < slike.length; i++) {
        slike[i].classList.toggle('is-on', i === k);
        stolpci[i].classList.toggle('is-on', i === k);
      }
    }
  }
  var cakam = false;
  addEventListener('scroll', function () {
    if (cakam) return;
    cakam = true;
    requestAnimationFrame(function () { cakam = false; osvezi(); });
  }, { passive: true });
  addEventListener('resize', osvezi);
  osvezi();
})();
