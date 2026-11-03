import assert from 'node:assert/strict';
import { SINIR, temizle, rakamlar, gercek, eldeZinciri, cizgi, kafes, rus, uygunluk, kesisimSayisi } from './core.mjs';

let checks = 0;
const ok = fn => { fn(); checks++; };

// 1. Girdi
ok(() => assert.equal(temizle('0042'), '42'));
ok(() => assert.equal(temizle(' 1.234 '), '1234'));
ok(() => assert.equal(temizle('0'), '0'));
ok(() => assert.equal(temizle('000'), '0'));
ok(() => assert.equal(temizle('-5'), null));
ok(() => assert.equal(temizle('3,5'), null));
ok(() => assert.equal(temizle('12a'), null));
ok(() => assert.equal(temizle('1234567890123'), null));       // 13 basamak çok
ok(() => assert.deepEqual(rakamlar('305'), [3, 0, 5]));
ok(() => assert.equal(gercek('99999999', '99999999'), '9999999800000001'));   // Number ile kaybolurdu

// 2. Elde zinciri
const e = eldeZinciri([2, 5, 8, 3]);
ok(() => assert.equal(e.sonuc, '2583'));
const e2 = eldeZinciri([6, 13, 23, 12]);             // 6·1000 + 13·100 + 23·10 + 12
ok(() => assert.equal(e2.sonuc, String(6000 + 1300 + 230 + 12)));
ok(() => assert.deepEqual(e2.adimlar.map(a => a.eldeGiden), [0, 1, 2, 1]));
ok(() => assert.equal(eldeZinciri([81]).sonuc, '81'));            // 9 × 9: tek grup, elde başa geçiyor
ok(() => assert.equal(eldeZinciri([0, 0]).sonuc, '0'));

// 3. Çizgi yöntemi: elle bildiğim örnekler
const c = cizgi('123', '21');
ok(() => assert.deepEqual(c.gruplar, [2, 5, 8, 3]));
ok(() => assert.equal(c.sonuc, '2583'));
ok(() => assert.equal(c.noktalar.length, (1 + 2 + 3) * (2 + 1)));
ok(() => assert.equal(c.yatay.length, 6));
ok(() => assert.equal(c.dikey.length, 3));
const s = cizgi('305', '20');
ok(() => assert.equal(s.sonuc, '6100'));
ok(() => assert.equal(s.yatay.filter(x => x.kesik).length, 1));    // 0 rakamı kesik tek çizgi
ok(() => assert.equal(s.dikey.filter(x => x.kesik).length, 1));
ok(() => assert.ok(s.noktalar.every(p => p.grup !== 1 && p.grup !== 3)));  // sıfır çizgileri kesişim saymıyor
ok(() => assert.equal(cizgi('0', '7').sonuc, '0'));
ok(() => assert.equal(cizgi('9', '9').sonuc, '81'));
// Her nokta gerçekten kendi grubunun demet kesişiminde
ok(() => assert.ok(c.noktalar.every(p => Math.round(p.y / c.demet) + Math.round(p.x / c.demet) === p.grup)));

// Büyük rakamlarda da demetler üst üste binmiyor
const dokuz = cizgi('99', '98');
ok(() => assert.ok(dokuz.noktalar.every(p => Math.round(p.y / dokuz.demet) + Math.round(p.x / dokuz.demet) === p.grup)));
ok(() => assert.ok(dokuz.demet > 8 * dokuz.aralik));

// 4. Kafes yöntemi
const k = kafes('47', '38');
ok(() => assert.equal(k.sonuc, '1786'));
ok(() => assert.deepEqual(k.hucreler[0].map(h => h.carpim), [12, 32]));
ok(() => assert.deepEqual(k.caprazlar.map(p => p.reduce((x, y) => x + y, 0)), [1, 7, 8, 6]));
ok(() => assert.equal(kafes('0', '0').sonuc, '0'));

// 5. Rus köylü yöntemi
const r = rus('47', '38');
ok(() => assert.equal(r.sonuc, '1786'));
ok(() => assert.deepEqual(r.satirlar.map(x => x.sol), ['47', '23', '11', '5', '2', '1']));
ok(() => assert.deepEqual(r.satirlar.map(x => x.tek), [true, true, true, true, false, true]));
ok(() => assert.equal(rus('0', '5').sonuc, '0'));
ok(() => assert.equal(rus('1', '5').satirlar.length, 1));
// Satır sayısı = sayının ikili gösterimindeki basamak sayısı; tek satırlar = ikilideki 1'ler
ok(() => assert.equal(rus('1000', '3').satirlar.length, (1000).toString(2).length));
ok(() => assert.equal(rus('1000', '3').satirlar.filter(x => x.tek).length, [...(1000).toString(2)].filter(b => b === '1').length));

// 6. Rastgele binlerce çarpmayı BigInt ile karşılaştır (sabit tohum)
let tohum = 11; const rnd = () => (tohum = (tohum * 48271) % 2147483647) / 2147483647;
const sayi = l => { let s = String(1 + Math.floor(rnd() * 9)); for (let i = 1; i < l; i++) s += Math.floor(rnd() * 10); return rnd() < 0.1 ? s.replace(/\d$/, '0') : s; };
let hepsi = { cizgi: true, kafes: true, rus: true }, sayac = 0;
for (let t = 0; t < 3000; t++) {
  const a = sayi(1 + Math.floor(rnd() * 12)), b = sayi(1 + Math.floor(rnd() * 12));
  const g = gercek(a, b);
  if (a.length <= SINIR.cizgi && b.length <= SINIR.cizgi && cizgi(a, b).sonuc !== g) hepsi.cizgi = false;
  if (a.length <= SINIR.kafes && b.length <= SINIR.kafes && kafes(a, b).sonuc !== g) hepsi.kafes = false;
  if (rus(a, b).sonuc !== g) hepsi.rus = false;
  sayac++;
}
ok(() => assert.ok(hepsi.cizgi, 'çizgi yöntemi yanlış'));
ok(() => assert.ok(hepsi.kafes, 'kafes yöntemi yanlış'));
ok(() => assert.ok(hepsi.rus, 'rus yöntemi yanlış'));
// Bütün 2 basamaklı çarpımlar çizgiyle
let ikiBasamak = true;
for (let a = 0; a < 100; a++) for (let b = 0; b < 100; b++) if (cizgi(String(a), String(b)).sonuc !== String(a * b)) ikiBasamak = false;
ok(() => assert.ok(ikiBasamak));

// 7. Uygunluk
ok(() => assert.deepEqual(uygunluk('123', '21'), { cizgi: true, kafes: true, rus: true }));
ok(() => assert.equal(uygunluk('99999', '1').cizgi, false));
ok(() => assert.equal(uygunluk('9999', '9999').cizgi, true));
ok(() => assert.equal(uygunluk('123456789', '1').kafes, false));
ok(() => assert.equal(kesisimSayisi('123', '21'), 18));

console.log(`${checks} kontrol geçti.`);
