// Çizgi Çarpımı: üç farklı çarpma yönteminin adımları.
// Büyük sayılarda hata olmasın diye her yerde BigInt ile doğruluyorum.

export const SINIR = { cizgi: 4, kafes: 8, rus: 12 };

// "0042" -> "42", geçersizse null
export function temizle(yazi, enFazla = 12) {
  const s = String(yazi).trim().replace(/[\s.]/g, '');
  if (!/^\d+$/.test(s)) return null;
  const t = s.replace(/^0+(?=\d)/, '');
  return t.length <= enFazla ? t : null;
}

export const rakamlar = s => [...s].map(Number);
export const gercek = (a, b) => (BigInt(a) * BigInt(b)).toString();

// --- Elde zinciri ---
// gruplar: en büyük basamaktan en küçüğe sayılar (ör. [3, 10, 8] => 3·100 + 10·10 + 8)
// En sağdan başlayıp her basamakta 10'u geçeni sola taşıyorum.
export function eldeZinciri(gruplar) {
  const adimlar = [];
  let elde = 0;
  for (let i = gruplar.length - 1; i >= 0; i--) {
    const toplam = gruplar[i] + elde;
    adimlar.unshift({ basamak: gruplar.length - 1 - i, sayi: gruplar[i], eldeGelen: elde, toplam, rakam: toplam % 10, eldeGiden: Math.floor(toplam / 10) });
    elde = Math.floor(toplam / 10);
  }
  let sonuc = adimlar.map(a => a.rakam).join('');
  if (elde > 0) sonuc = String(elde) + sonuc;
  return { adimlar, sonEl: elde, sonuc: sonuc.replace(/^0+(?=\d)/, '') };
}

// --- 1. Çizgi yöntemi (Japon / Maya çarpması) ---
// Önce düz bir ızgara kuruyorum: a'nın rakamları yatay çizgi demetleri, b'ninkiler dikey.
// Ekranda 45° döndürünce aynı basamağın kesişimleri aynı sütuna düşüyor.
// Sıfır rakamı kesik tek çizgi: yer tutuyor ama kesişim saymıyor.
export function cizgi(a, b, aralik = 1, demet = null) {
  const da = rakamlar(a), db = rakamlar(b);
  // Demetler arası mesafe en büyük demetten geniş olmalı, yoksa 9 çizgi yan demete taşar
  demet ??= Math.max(...da, ...db, 1) * aralik + 2 * aralik;
  const n = da.length + db.length - 1;
  const konumlar = (d, merkez) => d === 0 ? [{ v: merkez, kesik: true }] : Array.from({ length: d }, (_, t) => ({ v: merkez + (t - (d - 1) / 2) * aralik, kesik: false }));
  const ust = Math.max(...da, ...db, 1);
  const genislik = (da.length - 1) * demet + ust * aralik;
  const yatay = da.flatMap((d, i) => konumlar(d, i * demet).map(k => ({ i, rakam: d, y: k.v, kesik: k.kesik })));
  const dikey = db.flatMap((d, j) => konumlar(d, j * demet).map(k => ({ j, rakam: d, x: k.v, kesik: k.kesik })));
  const noktalar = [];
  for (const h of yatay) for (const v of dikey) {
    if (h.kesik || v.kesik) continue;
    noktalar.push({ x: v.x, y: h.y, grup: h.i + v.j });
  }
  const gruplar = Array.from({ length: n }, (_, k) => noktalar.filter(p => p.grup === k).length);
  return { yatay, dikey, noktalar, gruplar, demet, aralik, genislik, ...eldeZinciri(gruplar) };
}

// --- 2. Kafes yöntemi (Gelosia) ---
// Her hücrede iki rakamın çarpımı: onlar basamağı sol üstte, birler sağ altta.
// Çaprazlar sağ alttan başlayarak toplanıyor.
export function kafes(a, b) {
  const da = rakamlar(a), db = rakamlar(b);
  const hucreler = da.map((x, i) => db.map((y, j) => ({ i, j, carpim: x * y, onlar: Math.floor(x * y / 10), birler: x * y % 10 })));
  const la = da.length, lb = db.length;
  const n = la + lb;                         // en fazla bu kadar basamak
  const caprazlar = [];
  for (let p = 0; p < n; p++) {              // p = 0: birler basamağı
    const parcalar = [];
    for (const satir of hucreler) for (const h of satir) {
      const yer = (la - 1 - h.i) + (lb - 1 - h.j);
      if (yer === p) parcalar.push(h.birler);
      if (yer + 1 === p) parcalar.push(h.onlar);
    }
    caprazlar.unshift(parcalar);
  }
  const zincir = eldeZinciri(caprazlar.map(p => p.reduce((x, y) => x + y, 0)));
  return { hucreler, caprazlar, ...zincir };
}

// --- 3. Rus köylü yöntemi (ikiye böl, ikiyle çarp) ---
// Soldakini ikiye bölüyorum (kalanı atıyorum), sağdakini ikiyle çarpıyorum.
// Soldaki tek olan satırların sağ tarafını topluyorum.
export function rus(a, b) {
  let x = BigInt(a), y = BigInt(b);
  const satirlar = [];
  if (x === 0n) return { satirlar: [{ sol: '0', sag: y.toString(), tek: false }], sonuc: '0' };
  let toplam = 0n;
  while (x > 0n) {
    const tek = x % 2n === 1n;
    if (tek) toplam += y;
    satirlar.push({ sol: x.toString(), sag: y.toString(), tek });
    x /= 2n; y *= 2n;
  }
  return { satirlar, sonuc: toplam.toString() };
}

// Bu iki sayı hangi yöntemlerle gösterilebilir?
export function uygunluk(a, b) {
  const l = Math.max(a.length, b.length);
  const cizgiSayisi = [...a, ...b].reduce((x, c) => x + Math.max(1, +c), 0);
  return { cizgi: l <= SINIR.cizgi && cizgiSayisi <= 80, kafes: l <= SINIR.kafes, rus: l <= SINIR.rus };
}

// Çizgi yönteminde en çok kaç kesişim olur? (çizim için)
export const kesisimSayisi = (a, b) => rakamlar(a).reduce((x, d) => x + d, 0) * rakamlar(b).reduce((x, d) => x + d, 0);
