import { SINIR, temizle, gercek, cizgi, kafes, rus } from './core.mjs';

const $ = id => document.getElementById(id);
const RENK = ['#ffcf3a', '#5fd7ff', '#ff8a3d', '#5fcf7a', '#ff7eb6', '#b48cff', '#f2f26b', '#7ef0d0'];
const renk = k => RENK[k % RENK.length];
const BASAMAK = ['birler', 'onlar', 'yüzler', 'binler', 'on binler', 'yüz binler', 'milyonlar', 'on milyonlar', 'yüz milyonlar', 'milyarlar'];
const basamakAdi = p => BASAMAK[p] || `10^${p}`;
const ADIMLAR = ['', '1. sayının çizgileri', '2. sayının çizgileri', 'Kesişim noktaları', 'Sütun sütun say', 'Elde taşı, sonucu oku'];
const NS = 'http://www.w3.org/2000/svg';
const sayiYaz = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// ---------- Elde kutuları (çizgi ve kafes ortak) ----------
function eldeCiz(kutu, z) {
  const n = z.adimlar.length;
  kutu.innerHTML = z.adimlar.map((a, k) => `<div class="kutu" style="border-color:${renk(k)}66">
      <div class="ust">${basamakAdi(n - 1 - k)}</div>
      <div class="say" style="color:${renk(k)}">${a.sayi}</div>
      <div class="alt">${a.eldeGelen ? `+${a.eldeGelen} elde = ${a.toplam}` : '&nbsp;'}</div>
      <div class="alt">yaz <span class="rakam">${a.rakam}</span>${a.eldeGiden ? `, ${a.eldeGiden} elde` : ''}</div>
    </div>`).join('') + `<div class="satir">${z.sonEl ? `En soldaki elde (${z.sonEl}) başa yazılır. ` : ''}Sağdan sola okuyunca: <b>${sayiYaz(z.sonuc)}</b></div>`;
}

// ---------- 1. Çizgi ----------
function cizgiCiz(a, b, adim) {
  const svg = $('cizgiSvg');
  const c = cizgi(a, b);
  const r2 = Math.SQRT1_2;
  const don = (x, y) => [(x + y) * r2, (y - x) * r2];   // 45° döndür: aynı basamak aynı sütuna düşer
  const ust = Math.max(...[...a, ...b].map(Number), 1);
  const pay = ust / 2 + 1.2;
  const xMin = -pay, xMax = (b.length - 1) * c.demet + pay;
  const yMin = -pay, yMax = (a.length - 1) * c.demet + pay;
  const kose = [don(xMin, yMin), don(xMax, yMin), don(xMin, yMax), don(xMax, yMax)];
  const uMin = Math.min(...kose.map(k => k[0])), uMax = Math.max(...kose.map(k => k[0]));
  const vMin = Math.min(...kose.map(k => k[1])), vMax = Math.max(...kose.map(k => k[1]));
  const m = 1.2, etiket = 3.2;
  svg.setAttribute('viewBox', `${uMin - m} ${vMin - m} ${uMax - uMin + 2 * m} ${vMax - vMin + 2 * m + etiket}`);
  const kalin = (uMax - uMin) / 260;
  let h = '';
  const cizgiYaz = (x1, y1, x2, y2, kesik, renkli) => {
    const [u1, v1] = don(x1, y1), [u2, v2] = don(x2, y2);
    return `<line x1="${u1}" y1="${v1}" x2="${u2}" y2="${v2}" stroke="${renkli}" stroke-width="${kalin * 2}" stroke-linecap="round"${kesik ? ` stroke-dasharray="${kalin * 6} ${kalin * 5}" opacity="0.6"` : ''}/>`;
  };
  if (adim >= 1) for (const l of c.yatay) h += cizgiYaz(xMin, l.y, xMax, l.y, l.kesik, '#ff8a3d');
  if (adim >= 2) for (const l of c.dikey) h += cizgiYaz(l.x, yMin, l.x, yMax, l.kesik, '#5fd7ff');
  if (adim >= 3) for (const p of c.noktalar) {
    const [u, v] = don(p.x, p.y);
    h += `<circle cx="${u}" cy="${v}" r="${kalin * 3.2}" fill="${adim >= 4 ? renk(p.grup) : '#fff1d2'}" stroke="#0d0709" stroke-width="${kalin * 0.8}"/>`;
  }
  if (adim >= 4) c.gruplar.forEach((say, k) => {
    const u = k * c.demet * r2;
    h += `<text x="${u}" y="${vMax + etiket * 0.75}" fill="${renk(k)}" font-size="${etiket * 0.75}" font-weight="800" text-anchor="middle">${say}</text>`;
  });
  svg.innerHTML = h;
  $('adimYazi').textContent = ADIMLAR[adim];
  if (adim >= 5) eldeCiz($('cizgiElde'), c);
  else $('cizgiElde').innerHTML = adim >= 4 ? `<div class="satir">Soldan sağa sütunlar: ${c.gruplar.join(' · ')}</div>` : '';
}

// ---------- 2. Kafes ----------
function kafesCiz(a, b) {
  const svg = $('kafesSvg');
  const k = kafes(a, b);
  const la = a.length, lb = b.length, n = la + lb;
  const H = 60, sol = 20, ust = 46, sag = 46;
  const W = sol + lb * H + sag, Y = ust + la * H + 16;
  svg.setAttribute('viewBox', `0 0 ${W} ${Y}`);
  let h = '';
  [...b].forEach((d, j) => { h += `<text x="${sol + j * H + H / 2}" y="${ust - 14}" fill="#5fd7ff" font-size="26" font-weight="800" text-anchor="middle">${d}</text>`; });
  [...a].forEach((d, i) => { h += `<text x="${sol + lb * H + sag / 2}" y="${ust + i * H + H / 2 + 9}" fill="#ff8a3d" font-size="26" font-weight="800" text-anchor="middle">${d}</text>`; });
  for (const satir of k.hucreler) for (const c of satir) {
    const x = sol + c.j * H, y = ust + c.i * H;
    const yer = (la - 1 - c.i) + (lb - 1 - c.j);           // birlerin basamağı
    const gB = n - 1 - yer, gO = n - 2 - yer;               // soldan grup sırası
    h += `<rect x="${x}" y="${y}" width="${H}" height="${H}" fill="none" stroke="#3a1a1e" stroke-width="2"/>`;
    h += `<line x1="${x + H}" y1="${y}" x2="${x}" y2="${y + H}" stroke="#3a1a1e" stroke-width="2"/>`;
    h += `<text x="${x + 15}" y="${y + 25}" fill="${renk(gO)}" font-size="20" font-weight="800" text-anchor="middle">${c.onlar}</text>`;
    h += `<text x="${x + H - 15}" y="${y + H - 10}" fill="${renk(gB)}" font-size="20" font-weight="800" text-anchor="middle">${c.birler}</text>`;
  }
  svg.innerHTML = h;
  eldeCiz($('kafesElde'), { ...k, adimlar: k.adimlar.map((x, i) => ({ ...x, sayi: k.caprazlar[i].length ? x.sayi : 0 })) });
  // Her çaprazın parçalarını da yaz
  const parcalar = k.caprazlar.map((p, i) => `<span style="color:${renk(i)}">${p.length ? p.join('+') : '0'}</span>`).join(' · ');
  $('kafesElde').insertAdjacentHTML('afterbegin', `<div class="satir">Çaprazlar (soldan): ${parcalar}</div>`);
}

// ---------- 3. Rus köylü ----------
function rusCiz(a, b) {
  const r = rus(a, b);
  $('rusGovde').innerHTML = r.satirlar.map(s => `<tr class="${s.tek ? 'tek' : 'cift'}"><td>${sayiYaz(s.sol)}</td><td>${sayiYaz(s.sag)}</td><td>${s.tek ? 'tek ✓' : 'çift'}</td></tr>`).join('');
  const tekler = r.satirlar.filter(s => s.tek).map(s => sayiYaz(s.sag));
  $('rusToplam').innerHTML = `${tekler.join(' + ')} = <b>${sayiYaz(r.sonuc)}</b>`;
}

// ---------- Hepsi ----------
function kapat(kart, svgId, yazi) {
  const svg = $(svgId);
  svg.innerHTML = ''; svg.setAttribute('viewBox', '0 0 10 1');
  svg.style.display = 'none';
  let k = kart.querySelector('.kapali');
  if (!k) { k = document.createElement('p'); k.className = 'kapali'; svg.after(k); }
  k.textContent = yazi; k.hidden = false;
}
function ac(kart, svgId) {
  $(svgId).style.display = '';
  const k = kart.querySelector('.kapali'); if (k) k.hidden = true;
}

function hesapla() {
  const a = temizle($('a').value, SINIR.rus), b = temizle($('b').value, SINIR.rus);
  $('a').classList.toggle('hatali', a === null);
  $('b').classList.toggle('hatali', b === null);
  const not = $('girdiNot');
  if (a === null || b === null) {
    not.textContent = 'Sadece 0 ya da pozitif tam sayı yazabilirim, en fazla 12 basamak.';
    not.className = 'not hata';
    return;
  }
  not.textContent = ''; not.className = 'not';
  $('sonuc').textContent = sayiYaz(gercek(a, b));
  const l = Math.max(a.length, b.length);
  const cKart = $('cizgiSvg').closest('.kart'), kKart = $('kafesSvg').closest('.kart'), rKart = $('rusGovde').closest('.kart');
  if (l <= SINIR.cizgi) { ac(cKart, 'cizgiSvg'); cizgiCiz(a, b, +$('adim').value); $('adim').disabled = false; }
  else { kapat(cKart, 'cizgiSvg', `${l} basamakta çizgiler birbirine karışıyor. Çizgi yöntemi için en fazla ${SINIR.cizgi} basamak yazmalıyım.`); $('cizgiElde').innerHTML = ''; $('adim').disabled = true; $('adimYazi').textContent = ''; }
  if (l <= SINIR.kafes) { ac(kKart, 'kafesSvg'); kafesCiz(a, b); }
  else { kapat(kKart, 'kafesSvg', `Kafes yöntemi için en fazla ${SINIR.kafes} basamak.`); $('kafesElde').innerHTML = ''; }
  rKart.hidden = false; rusCiz(a, b);
  try { localStorage.setItem('cizgi-carpimi', JSON.stringify({ a, b })); } catch { /* özel pencere */ }
}

$('a').oninput = hesapla;
$('b').oninput = hesapla;
$('adim').oninput = hesapla;
$('rastgele').onclick = () => {
  const r = (en, ek) => String(Math.floor(en + Math.random() * ek));
  $('a').value = r(11, 989); $('b').value = r(11, 89);
  $('adim').value = 5;
  hesapla();
};

try {
  const s = JSON.parse(localStorage.getItem('cizgi-carpimi'));
  if (s && temizle(s.a) !== null && temizle(s.b) !== null && !new URLSearchParams(location.search).has('ornek')) { $('a').value = s.a; $('b').value = s.b; }
} catch { /* yok */ }
hesapla();
