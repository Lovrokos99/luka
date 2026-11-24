// Ocena s fotografije: pošlje v Lukov lead sistem (thebilko.com/lukakos) in izriše okvirno oceno.
(function () {
  var NA_BILKU = /(^|\.)thebilko\.com$/.test(location.hostname);
  // shortcut: s tuje domene brskalnik zahtevo zavrne (CORS), dokler stran ne teče pod www.thebilko.com ali lead sistem ne dovoli te domene
  var API = (NA_BILKU ? '' : 'https://www.thebilko.com') + '/lukakos/api';
  var TELEFON = '040 720 568';
  var BUDZETI = ['do 3.000 €', '3.000–8.000 €', '8.000–15.000 €', 'nad 15.000 €', 'še ne vem'];
  var ROKI = ['nujno (okvara)', 'čim prej', 'v 1–3 mesecih', 'samo zbiram informacije'];

  var obrazec = document.getElementById('ocena-obrazec');
  var rezultat = document.getElementById('ocena-rezultat');
  var napaka = document.getElementById('ocena-napaka');
  var gumb = document.getElementById('ocena-poslji');
  var vnosSlik = document.getElementById('slike');
  var izbire = Array.prototype.slice.call(document.querySelectorAll('.izbira'));
  var slike = [];

  function el(oznaka, razred, besedilo) {
    var e = document.createElement(oznaka);
    if (razred) e.className = razred;
    if (besedilo != null) e.textContent = besedilo;
    return e;
  }
  function eur(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €'; }

  function izberiStoritev(b) {
    izbire.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    document.getElementById('storitev').value = b.dataset.kljuc;
    document.getElementById('foto-namig').textContent = 'Fotografirajte ' + b.dataset.foto + '.';
    document.getElementById('zelja').placeholder = b.dataset.primer;
  }
  izbire.forEach(function (b) { b.addEventListener('click', function () { izberiStoritev(b); }); });
  var izUrl = new URLSearchParams(location.search).get('storitev');
  izbire.forEach(function (b) { if (b.dataset.kljuc === izUrl) izberiStoritev(b); });

  vnosSlik.addEventListener('change', function () {
    slike = Array.prototype.slice.call(vnosSlik.files || []).slice(0, 3);
    var n = slike.length;
    document.getElementById('foto-stanje').textContent = n ? n + (n === 1 ? ' fotografija izbrana' : n === 2 ? ' fotografiji izbrani' : ' fotografije izbrane') : 'Izberi ali posnemi fotografije';
    document.getElementById('foto-imena').textContent = n ? 'Klikni za zamenjavo' : 'Do 3 fotografije';
    var pred = document.getElementById('foto-predogled');
    pred.textContent = '';
    slike.forEach(function (f) {
      var i = el('img');
      i.alt = '';
      i.src = URL.createObjectURL(f);
      pred.appendChild(i);
    });
  });

  // pomanjša v brskalniku (JPEG, največ 1600 px): hitreje, pod 5 MB in deluje tudi za HEIC z iPhona
  function pomanjsaj(f) {
    if (!window.createImageBitmap) return Promise.resolve(f);
    return createImageBitmap(f).then(function (bmp) {
      var k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      var c = document.createElement('canvas');
      c.width = Math.round(bmp.width * k);
      c.height = Math.round(bmp.height * k);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return new Promise(function (res) { c.toBlob(function (b) { res(b || f); }, 'image/jpeg', 0.85); });
    }, function () { return f; });
  }

  function preveri() {
    if (!document.getElementById('storitev').value) return ['Izberite, kaj potrebujete.', izbire[0]];
    if (!slike.length) return ['Dodajte vsaj eno fotografijo.', vnosSlik];
    var obvezna = [['zelja', 'Opišite, kaj želite.'], ['kraj', 'Vpišite kraj.'], ['ime', 'Vpišite ime.'], ['telefon', 'Vpišite telefonsko številko.']];
    for (var i = 0; i < obvezna.length; i++) {
      var p = document.getElementById(obvezna[i][0]);
      if (!p.value.trim()) return [obvezna[i][1], p];
    }
    var soglasje = document.getElementById('soglasje');
    if (!soglasje.checked) return ['Za oceno potrebujemo vaše soglasje za obdelavo podatkov.', soglasje];
    return null;
  }

  obrazec.addEventListener('submit', function (e) {
    e.preventDefault();
    var tezava = preveri();
    if (tezava) {
      napaka.textContent = tezava[0];
      tezava[1].focus();
      return;
    }
    napaka.textContent = '';
    gumb.disabled = true;
    gumb.firstElementChild.textContent = 'Pripravljam oceno …';
    var fd = new FormData(obrazec);
    Promise.all(slike.map(pomanjsaj)).then(function (manjse) {
      manjse.forEach(function (b, i) { fd.append('slike', b, 'slika-' + (i + 1) + '.jpg'); });
      return fetch(API + '/estimate', { method: 'POST', body: fd });
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(j.napaka || 'Pošiljanje ni uspelo.');
        return j;
      });
    }).then(function (j) {
      pokaziRezultat(j.ocena, { id: j.leadId, token: j.token });
    }).catch(function (err) {
      napaka.textContent = (err && err.message && !/fetch|network/i.test(err.message) ? err.message + ' ' : 'Pošiljanje ni uspelo. ') + 'Lahko tudi pokličete ' + TELEFON + '.';
      gumb.disabled = false;
      gumb.firstElementChild.textContent = 'Pošlji in prikaži oceno';
    });
  });

  function shrani(lead, polje, vrednost) {
    if (!lead || !lead.id) return;
    var telo = { token: lead.token };
    telo[polje] = vrednost;
    fetch(API + '/leads/' + lead.id + '/podrobnosti', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(telo),
    }).catch(function () {});
  }

  function vprasanje(stars, besedilo, moznosti, ob) {
    var blok = el('div', 'ocena__vprasanje');
    blok.appendChild(el('p', 't-body-m', besedilo));
    var vrsta = el('div', 'ocena__izbire');
    moznosti.forEach(function (m) {
      var b = el('button', 'izbira');
      b.type = 'button';
      b.innerHTML = '<span class="bracket" aria-hidden="true"><span class="bracket__dot"></span></span>';
      b.appendChild(el('span', null, m));
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(vrsta.children, function (x) { x.disabled = true; x.setAttribute('aria-pressed', String(x === b)); });
        ob(m);
      });
      vrsta.appendChild(b);
    });
    blok.appendChild(vrsta);
    stars.appendChild(blok);
  }

  function pokaziRezultat(ocena, lead) {
    obrazec.hidden = true;
    rezultat.hidden = false;
    rezultat.textContent = '';
    var kartica = el('div', 'ocena__kartica');
    if (!ocena || !ocena.obseg_del || !ocena.obseg_del.length) {
      kartica.appendChild(el('p', 't-accent', '[ Prejeto ]'));
      kartica.appendChild(el('p', 't-h5', 'Hvala, fotografije sem prejel.'));
      kartica.appendChild(el('p', 't-body-s muted', 'Samodejne ocene tokrat ni bilo mogoče pripraviti. Fotografije pogledam osebno in se vam oglasim.'));
    } else {
      kartica.appendChild(el('p', 't-accent ocena__nadnaslov', 'Okvirna ocena (brez DDV)'));
      kartica.appendChild(el('p', 't-h3 ocena__znesek', eur(ocena.ocena_min) + ' – ' + eur(ocena.ocena_max)));
      kartica.appendChild(el('p', 't-body-s', ocena.opis_stanja));
      var seznam = el('ul', 'ocena__seznam t-body-xs');
      ocena.obseg_del.forEach(function (d) { seznam.appendChild(el('li', null, d.naziv)); });
      kartica.appendChild(el('p', 't-accent ocena__podnaslov', '_Kaj je upoštevano'));
      kartica.appendChild(seznam);
      if (ocena.negotovosti && ocena.negotovosti.length) {
        var neg = el('ul', 'ocena__seznam t-body-xs');
        ocena.negotovosti.forEach(function (n) { neg.appendChild(el('li', null, n)); });
        kartica.appendChild(el('p', 't-accent ocena__podnaslov', '_Česa s fotografije ne vidim'));
        kartica.appendChild(neg);
      }
      kartica.appendChild(el('p', 't-accent muted ocena__opomba', 'To je okvirna ocena na podlagi fotografij, ne ponudba. Natančno ceno dobite po kratkem klicu ali ogledu.'));
    }
    rezultat.appendChild(kartica);

    var pogovor = el('div', 'ocena__pogovor');
    rezultat.appendChild(pogovor);
    vprasanje(pogovor, 'Da vam pripravim pravo ponudbo: koliko bi bili pripravljeni vložiti?', BUDZETI, function (b) {
      shrani(lead, 'budzet', b);
      vprasanje(pogovor, 'Kdaj bi to potrebovali?', ROKI, function (r) {
        shrani(lead, 'rok', r);
        pogovor.appendChild(el('p', 't-body-m', 'Hvala! V kratkem dobite SMS s predlogom termina za kratek klic.'));
      });
    });
    var nazaj = el('a', 'btn');
    nazaj.href = 'reference.html';
    nazaj.innerHTML = '<span>Poglejte izbrana dela</span><span class="btn__icon" aria-hidden="true">→</span>';
    rezultat.appendChild(nazaj);
    rezultat.focus();
    rezultat.scrollIntoView({ block: 'start' });
  }

  // samo za ogled oblike brez pošiljanja: ocena.html?primer (izmišljeni zneski, nič ne gre v sistem)
  if (new URLSearchParams(location.search).has('primer')) {
    pokaziRezultat({
      ocena_min: 4200, ocena_max: 6100,
      opis_stanja: 'PRIMER: starejša kopalnica s kadjo, ploščice z borduro, umivalnik na podnožju.',
      obseg_del: [{ naziv: 'Demontaža stare opreme' }, { naziv: 'Nov razvod tople in hladne vode' }, { naziv: 'Tuš v nivoju tal z linijskim odtokom' }, { naziv: 'Podometni WC sistem' }],
      negotovosti: ['Stanje cevi v steni', 'Ali je pod tlemi dovolj padca za odtok'],
    }, null);
  }
})();
