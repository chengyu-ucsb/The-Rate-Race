/** Original vector artwork for The Rate Race. No image requests or dependencies. */
const C = Object.freeze({
  ink: '#202a2b', cream: '#fff9ed', paper: '#f1ede2', red: '#c23848',
  teal: '#267d73', mint: '#dceee3', amber: '#dcad58', sand: '#e4c592',
  paleRed: '#f3dfd9', paleBlue: '#dce9ed', line: '#c5cbbd', white: '#fffef9',
});
const number = (value, fallback, min, max) => Number.isFinite(Number(value))
  ? Math.max(min, Math.min(max, Math.round(Number(value)))) : fallback;
const stroke = `stroke="${C.ink}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;
const svg = (body, size, name) => `<svg class="${name}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${number(size, 48, 16, 640)}" height="${number(size, 48, 16, 640)}" fill="none" ${stroke} aria-hidden="true" focusable="false">${body}</svg>`;
const carton = (x, y, scale = 1, color = C.sand) => `<g transform="translate(${x} ${y}) scale(${scale})"><path d="m0 8 14-7 16 7-15 8Z" fill="${C.cream}"/><path d="M0 8v17l15 8V16Z" fill="${color}"/><path d="m15 16 15-8v17l-15 8Z" fill="${C.amber}"/><path d="m7 4 16 8v8l-5 3v-8L3 7" fill="${C.cream}" stroke="none"/></g>`;

const interfaceIcons = Object.freeze({
  arrowRight: '<path d="M4.5 12h14.5m-5.5-5.5L19 12l-5.5 5.5"/>',
  check: '<path d="m5 12 4.5 4.5L19 7"/>',
  box: '<path d="m12 3 8.5 4.5-8.5 4.5-8.5-4.5Zm-8.5 4.5v9l8.5 4.5 8.5-4.5v-9M12 12v9m-4.25-15.75L16.25 9.75v4"/>',
  scan: '<path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4M8 9v6m4-6v6m4-6v6M3 12h18"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2m1-15a3 3 0 0 1 0 6m2 2.5a5 5 0 0 1 3 4.5v2"/>',
  chart: '<path d="M4 4v16h16M8 15v-4m4 4V7m4 8v-6"/>',
  settings: '<path d="M4 7h7m4 0h5M4 17h3m4 0h9"/><circle cx="13" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  spark: '<path d="m11 3 2.4 6.6L20 12l-6.6 2.4L11 21l-2.4-6.6L2 12l6.6-2.4ZM19 3v4m-2-2h4"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M11 11h1v6m-1 0h2"/><circle cx="12" cy="7.5" r=".6" fill="currentColor" stroke="none"/>',
});

/** Decorative UI marks inherit text color; keep a readable label on the control. */
export function uiIcon(name, size = 20) {
  const key = Object.hasOwn(interfaceIcons, name) ? name : 'info';
  const dimension = number(size, 20, 12, 96);
  return `<svg class="ui-icon ui-icon--${key}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${dimension}" height="${dimension}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${interfaceIcons[key]}</svg>`;
}

const chapterPerson = (x, y, color, skin = '#edbd91') => `<g transform="translate(${x} ${y})"><circle r="19" fill="${C.white}" stroke="${C.line}"/><path d="M-12 14c0-13 24-13 24 0" fill="${color}"/><path d="M-4 2v6l4 3 4-3V2" fill="${skin}"/><path d="M-8-9c0-11 16-11 16 0v7c0 11-16 11-16 0Z" fill="${skin}"/><path d="M-8-7c-4-11 18-15 17-1l-5-3c-4 5-9 2-12 4Z" fill="${C.ink}"/><path d="M-4-1h.1M4-1h.1m-2 4c-1 1-3 1-4 0" stroke-width="1.3"/></g>`;

const chapters = [
  // A tested sequence, several observations, and an allowance beyond the stopwatch.
  `<ellipse cx="119" cy="139" rx="89" ry="9" fill="${C.ink}" opacity=".07" stroke="none"/>
    <g transform="translate(76 20) rotate(7 52 57)"><rect x="3" y="5" width="103" height="113" rx="11" fill="${C.ink}" opacity=".07" stroke="none"/><rect width="103" height="113" rx="11" fill="${C.white}"/><rect x="27" y="-5" width="49" height="15" rx="5" fill="${C.teal}"/><path d="M38 3h27" stroke="${C.mint}" stroke-width="2"/>
      <rect x="16" y="24" width="18" height="18" rx="5" fill="${C.paleRed}" stroke="none"/><path d="m21 33 3 3 6-7" stroke="${C.red}" stroke-width="2"/><path d="M44 30h39m-39 8h27" stroke="${C.line}" stroke-width="3"/>
      <rect x="16" y="52" width="18" height="18" rx="5" fill="${C.mint}" stroke="none"/><path d="m21 61 3 3 6-7" stroke="${C.teal}" stroke-width="2"/><path d="M44 58h39m-39 8h22" stroke="${C.line}" stroke-width="3"/>
      <path d="M17 91h67" stroke="${C.line}"/><path d="M24 91V82m19 9V77m19 14V81m19 10V73" stroke="${C.teal}" stroke-width="7"/></g>
    <g transform="translate(58 92) rotate(-9)"><rect x="-8" y="-42" width="16" height="9" rx="3" fill="${C.teal}"/><path d="M0-33v6m20-23 6 6" stroke-width="4"/><circle r="34" fill="${C.red}"/><circle r="26" fill="${C.cream}"/><path d="M0-20v4m20 4h-4M0 20v-4m-20-4h4" stroke="${C.teal}" stroke-width="2"/><path d="M0-16V0l12 6" stroke="${C.ink}" stroke-width="2.5"/><circle r="3" fill="${C.teal}" stroke="none"/></g>
    <g transform="translate(194 62) rotate(18)"><rect x="-4" y="-17" width="8" height="68" rx="2" fill="${C.red}"/><path d="m-4 51 4 12 4-12Z" fill="${C.sand}"/><path d="m-1 60 1 3 1-3" fill="${C.ink}"/><path d="M-4-6h8" stroke="${C.cream}" stroke-width="4"/></g>
    <path d="m29 34 3 7m-13 0 7 3m174 74 4 6m8-12 5 2" stroke="${C.teal}" stroke-width="2"/>`,
  // Distinct stations contribute to one flow; the three people remain visible.
  `<ellipse cx="120" cy="141" rx="100" ry="8" fill="${C.ink}" opacity=".07" stroke="none"/>
    <path d="M32 63h175" stroke="${C.line}" stroke-width="2" stroke-dasharray="3 6"/>
    ${chapterPerson(48, 36, C.red, '#c88a62')}${chapterPerson(120, 36, C.teal)}${chapterPerson(192, 36, C.amber, '#f5d0b2')}
    <g><rect x="17" y="72" width="62" height="58" rx="9" fill="${C.white}"/><rect x="89" y="72" width="62" height="58" rx="9" fill="${C.white}"/><rect x="161" y="72" width="62" height="58" rx="9" fill="${C.white}"/>
      <path d="M48 55v13m72-13v13m72-13v13" stroke="${C.teal}" stroke-width="2"/><path d="M81 101h6m66 0h6" stroke="${C.teal}" stroke-width="2"/>
      <rect x="29" y="84" width="16" height="15" rx="3" fill="${C.red}"/><rect x="50" y="84" width="16" height="15" rx="3" fill="${C.sand}"/><rect x="29" y="104" width="37" height="13" rx="3" fill="${C.mint}"/>
      ${carton(104, 85, 1.05)}<path d="m111 88 8-7 9 4m-12 8 14 7" stroke="${C.cream}" stroke-width="2"/>
      <rect x="177" y="83" width="31" height="35" rx="5" fill="${C.mint}"/><path d="M186 81h13v6h-13Z" fill="${C.teal}"/><path d="m183 102 6 6 13-14" stroke="${C.teal}" stroke-width="3"/>
    </g><path d="M34 136h170" stroke="${C.teal}" stroke-width="3"/><path d="m199 132 6 4-6 4" stroke="${C.teal}" stroke-width="2"/>`,
  // Formal hierarchy plus an approved lateral connection, not an absent manager.
  `<ellipse cx="120" cy="141" rx="98" ry="8" fill="${C.ink}" opacity=".07" stroke="none"/>
    <path d="M120 49v17H58v18m62-18h62v18" stroke="${C.red}" stroke-width="3"/>
    <circle cx="120" cy="66" r="4" fill="${C.red}" stroke="${C.cream}" stroke-width="2"/>
    <path d="M62 119c22 24 93 24 116 0" stroke="${C.teal}" stroke-width="3" stroke-dasharray="5 6"/><path d="m169 123 9-4-1 10m-106-6-9-4 1 10" stroke="${C.teal}" stroke-width="2"/>
    ${chapterPerson(120, 29, C.teal)}${chapterPerson(58, 101, C.red, '#c88a62')}${chapterPerson(182, 101, C.amber, '#f5d0b2')}
    <circle cx="120" cy="132" r="13" fill="${C.teal}" stroke="${C.cream}" stroke-width="3"/><path d="m114 132 4 4 8-9" stroke="${C.cream}" stroke-width="2.5"/>
    <g transform="translate(22 70) rotate(-13)"><rect width="25" height="18" rx="4" fill="${C.cream}"/><path d="m2 3 10.5 8L23 3" stroke="${C.red}"/></g><g transform="translate(196 72) rotate(12)"><rect width="25" height="18" rx="4" fill="${C.cream}"/><path d="m2 3 10.5 8L23 3" stroke="${C.teal}"/></g>
    <path d="M92 29H80m-3 0h-3m72 0h12m3 0h3" stroke="${C.line}" stroke-width="2"/>`,
  // A published commitment accompanies the target and the pay it promises.
  `<ellipse cx="120" cy="141" rx="97" ry="8" fill="${C.ink}" opacity=".07" stroke="none"/>
    <g transform="translate(27 39) rotate(-8 42 40)"><rect x="2" y="4" width="79" height="84" rx="9" fill="${C.ink}" opacity=".06" stroke="none"/><rect width="79" height="84" rx="9" fill="${C.white}"/><path d="M15 17h47" stroke="${C.teal}" stroke-width="6"/><path d="M15 31h37" stroke="${C.line}" stroke-width="3"/><path d="m17 48 4 4 7-8m-11 23 4 4 7-8" stroke="${C.teal}" stroke-width="2.5"/><path d="M38 48h24M38 67h24" stroke="${C.line}" stroke-width="3"/></g>
    <path d="m139 119-8 20m60-20 8 20" stroke="${C.teal}" stroke-width="4"/>
    <rect x="119" y="21" width="91" height="103" rx="12" fill="${C.teal}"/><rect x="126" y="28" width="77" height="82" rx="8" fill="${C.cream}" stroke="none"/><circle cx="164.5" cy="69" r="29" fill="${C.paleRed}" stroke="${C.red}"/><circle cx="164.5" cy="69" r="19" fill="${C.cream}" stroke="${C.red}"/><circle cx="164.5" cy="69" r="8" fill="${C.red}" stroke="none"/><path d="m164 69 34-30m-10 2 10-2-2 10" stroke="${C.teal}" stroke-width="3"/>
    <g><path d="M53 123v9c0 8 38 8 38 0v-9" fill="${C.amber}"/><ellipse cx="72" cy="123" rx="19" ry="6" fill="${C.cream}"/><path d="M53 114v9c0 8 38 8 38 0v-9" fill="${C.sand}"/><ellipse cx="72" cy="114" rx="19" ry="6" fill="${C.cream}"/><path d="M53 105v9c0 8 38 8 38 0v-9" fill="${C.amber}"/><ellipse cx="72" cy="105" rx="19" ry="6" fill="${C.cream}"/><path d="m68 105 3 2 5-4" stroke="${C.teal}" stroke-width="2"/></g>
    <path d="m217 84 5 3m-6 7 5 2m-112 39 5-3" stroke="${C.red}" stroke-width="2"/>`,
  // Revising a route around a non-routine package while keeping a visible check.
  `<ellipse cx="120" cy="141" rx="98" ry="8" fill="${C.ink}" opacity=".07" stroke="none"/>
    <g transform="translate(28 35) rotate(-7 46 44)"><rect x="3" y="4" width="92" height="88" rx="10" fill="${C.ink}" opacity=".06" stroke="none"/><rect width="92" height="88" rx="10" fill="${C.white}"/><path d="M16 24h59M16 43h59M16 62h59M27 13v62m19-62v62m19-62v62" stroke="${C.paper}" stroke-width="2"/><path d="M16 62V24h59" stroke="${C.line}" stroke-width="2" stroke-dasharray="3 5"/><path d="M16 62h18c11 0 5-29 18-29h23" stroke="${C.teal}" stroke-width="4"/><path d="m69 27 7 6-7 6" stroke="${C.teal}" stroke-width="2.5"/></g>
    <path d="M124 32c35-19 74 4 78 39" stroke="${C.teal}" stroke-width="4"/><path d="m194 65 9 8 5-12" stroke="${C.teal}" stroke-width="3"/>
    <g transform="translate(126 64)">${carton(0, 0, 2.1)}<g transform="translate(24 39) rotate(25)"><rect x="-9" y="-12" width="18" height="26" rx="3" fill="${C.cream}" stroke="${C.red}"/><path d="M-4-7h8l-1 8h-6Zm4 8v8m-4 0h8" stroke="${C.red}" stroke-width="1.5"/></g></g>
    <g transform="translate(144 40) rotate(28)"><path d="M-5-12a10 10 0 0 0-2 18v22a5 5 0 0 0 10 0V6a10 10 0 0 0 3-18L3-4h-7Z" fill="${C.red}"/><circle cx="-2" cy="28" r="1.5" fill="${C.cream}" stroke="none"/></g>
    <circle cx="101" cy="126" r="14" fill="${C.teal}" stroke="${C.cream}" stroke-width="3"/><path d="m95 126 4 4 8-9" stroke="${C.cream}" stroke-width="2.5"/>
    <path d="m212 111 6 1m-8 8 5 3M22 22l4 5m5-11 1 6" stroke="${C.red}" stroke-width="2"/>`,
];

/** Compact decorative chapter illustration; the surrounding heading names the theme. */
export function chapterArt(day = 0) {
  const index = number(day, 0, 0, 4);
  return `<svg class="chapter-art chapter-art--${index}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" width="240" height="160" fill="none" ${stroke} aria-hidden="true" focusable="false"><path d="M29 56C34 15 92 7 128 15c33-8 84 12 89 53 9 39-19 65-61 69-50 12-121 1-129-38-4-16-6-27 2-43Z" fill="${index === 2 ? C.mint : index === 3 ? C.paleRed : C.paper}" stroke="none" opacity=".65"/>${chapters[index]}</svg>`;
}

const products = {
  notebook: `<rect x="14" y="13" width="34" height="42" rx="3" fill="${C.paper}"/><path d="M18 50h30v5H18Z" fill="${C.cream}"/><rect x="11" y="9" width="34" height="41" rx="3" fill="${C.red}"/><path d="M18 10v40"/><rect x="24" y="18" width="14" height="12" rx="1" fill="${C.cream}"/><path d="M27 22h8m-8 4h5" stroke="${C.teal}"/><path d="M14 16h7m-7 8h7m-7 8h7m-7 8h7" stroke="${C.cream}"/><path d="m35 39 4 2v12l-4-3-4 3V41Z" fill="${C.teal}"/>`,
  bottle: `<rect x="25" y="6" width="14" height="8" rx="2" fill="${C.teal}"/><path d="M26 14v7c-7 5-9 9-9 17v13c0 5 30 5 30 0V38c0-8-2-12-9-17v-7Z" fill="${C.paleBlue}"/><path d="M18 34h28v15c0 4-28 4-28 0Z" fill="${C.teal}"/><path d="M23 28c-2 4-3 9-3 16" stroke="${C.white}" stroke-width="3"/><rect x="25" y="32" width="14" height="14" rx="3" fill="${C.cream}"/><path d="M32 35c0 0-4 4-4 6a4 4 0 0 0 8 0c0-2-4-6-4-6Z" fill="${C.red}" stroke="none"/>`,
  tote: `<path d="M15 24h34l4 31H11Z" fill="${C.sand}"/><path d="M22 29V17a10 10 0 0 1 20 0v12" fill="none" stroke="${C.teal}" stroke-width="4"/><path d="M17 25v25m30-25v25" stroke="${C.cream}"/><path d="m24 39 8-6 8 6-8 8Z" fill="${C.red}"/><path d="m29 40 3 2 6-6" stroke="${C.cream}"/>`,
  mug: `<path d="M42 22h5a10 10 0 0 1 0 20h-5v-6h5a4 4 0 0 0 0-8h-5Z" fill="${C.cream}"/><path d="M12 20h32v23c0 12-32 12-32 0Z" fill="${C.red}"/><ellipse cx="28" cy="20" rx="16" ry="5" fill="${C.cream}"/><ellipse cx="28" cy="21" rx="11" ry="2" fill="${C.sand}" stroke="none"/><path d="M17 27v14" stroke="${C.paleRed}" stroke-width="3"/><path d="M22 12c-6-6 6-5 1-11m9 11c-6-6 6-5 1-11" stroke="${C.teal}"/><path d="m26 35 3 3 6-7" stroke="${C.cream}" stroke-width="2.5"/>`,
  cable: `<path d="M19 18v12c0 19 31 19 31 2 0-12-30-12-30 1 0 10 23 10 23 0V16" stroke="${C.teal}" stroke-width="6"/><path d="M19 18v12c0 19 31 19 31 2" stroke="${C.mint}" stroke-width="1.5"/><rect x="12" y="7" width="14" height="16" rx="3" fill="${C.red}"/><path d="M15 7V3h8v4" fill="${C.cream}"/><path d="M16 12h6m-6 4h6" stroke="${C.cream}"/><rect x="37" y="10" width="12" height="13" rx="3" fill="${C.cream}"/><path d="M40 10V6h6v4" fill="${C.amber}"/><path d="M12 55h40" stroke="${C.line}"/>`,
  lamp: `<ellipse cx="32" cy="55" rx="19" ry="4" fill="${C.teal}"/><path d="M22 51 36 32 21 18" fill="none" stroke="${C.teal}" stroke-width="5"/><circle cx="35" cy="32" r="4" fill="${C.cream}"/><circle cx="22" cy="18" r="3" fill="${C.amber}"/><path d="m30 7-12 8 16 19 17-13Z" fill="${C.red}"/><ellipse cx="42" cy="27" rx="11" ry="4.5" transform="rotate(-37 42 27)" fill="${C.cream}"/><path d="m43 35 2 6m5-10 5 4" stroke="${C.amber}" stroke-width="2"/>`,
  pencil: `<path d="m12 29 37-6c4-1 7 3 7 7l-1 17-41 7c-4 1-7-2-7-6V35c0-3 2-5 5-6Z" fill="${C.teal}"/><path d="m10 32 42-7 4 6-46 8Z" fill="${C.mint}"/><path d="m13 33 35-6" stroke-dasharray="1 3"/><path d="m48 27 1 9 5-1" stroke="${C.red}" stroke-width="3"/><path d="m18 27 4-21 5 1-3 19m10-2 2-17 5 1-2 15" fill="${C.amber}"/><path d="m22 6 3-5 2 6m9 0 3-5 2 6" fill="${C.cream}"/><path d="m18 44 11-2" stroke="${C.cream}" stroke-width="2"/>`,
  container: `<path d="M10 25h44l-3 24c-1 6-37 6-38 0Z" fill="${C.paleBlue}"/><path d="M14 36h36l-2 12c-7 4-25 4-32 0Z" fill="${C.mint}"/><path d="M8 23c0-8 48-8 48 0v7c-5 7-43 7-48 0Z" fill="${C.red}"/><ellipse cx="32" cy="22" rx="24" ry="7" fill="${C.paleRed}"/><ellipse cx="32" cy="22" rx="17" ry="3" fill="${C.cream}"/><path d="M18 37v9" stroke="${C.white}" stroke-width="3"/><path d="M27 40h14m-14 5h9" stroke="${C.teal}"/>`,
  socks: `<path d="M12 9h17v24l9 8c8 7-3 17-10 12L11 41V9Z" fill="${C.teal}"/><path d="M34 7h17v23l8 8c7 8-3 17-10 12L33 38V7Z" fill="${C.cream}"/><path d="M12 15h17m-17 5h17m5-7h17m-17 5h17" stroke="${C.red}" stroke-width="3"/><path d="m12 33 7 4-5 7m20-14 7 4-5 7" fill="${C.amber}"/><path d="m27 44 6 6m17-9 6 5" stroke="${C.red}" stroke-width="3"/>`,
  gift: `<path d="M12 25h40v30H12Z" fill="${C.teal}"/><path d="M9 18h46v10H9Z" fill="${C.mint}"/><path d="M28 18h8v37h-8Z" fill="${C.red}"/><path d="M31 18c-21 1-20-19-9-13 6 3 9 13 9 13Zm2 0c21 1 20-19 9-13-6 3-9 13-9 13Z" fill="${C.red}"/><path d="m37 32 9 3-3 10-9-3Z" fill="${C.cream}"/><circle cx="40" cy="35" r="1" fill="${C.ink}" stroke="none"/>`,
  box: carton(12, 12, 1.35),
};

/** Decorative product art; put the product's readable name beside it. */
export function productIcon(kind, size = 48) {
  const requested = kind === 'pouch' ? 'pencil' : kind;
  const key = Object.hasOwn(products, requested) ? requested : 'box';
  return svg(`<circle cx="32" cy="33" r="29" fill="${C.paper}" stroke="none"/>${products[key]}`, size, `product-icon product-icon--${key}`);
}

/** Fictional crew portraits, deliberately distinct without relying on initials. */
export function crewPortrait(workerId, size = 48) {
  const portraits = {
    nia: `<circle cx="32" cy="32" r="31" fill="${C.paleRed}" stroke="none"/><path d="M9 59c1-16 13-20 23-20s22 4 23 20" fill="${C.red}"/><path d="M25 38v9l7 5 7-5v-9" fill="#b87952"/><path d="M19 23c0-18 26-18 26 0v11c0 18-26 18-26 0Z" fill="#c88a62"/><path d="M18 28c-9-5-6-16 0-17-1-8 10-12 15-7 10-5 18 4 15 11 6 7 0 15-4 14V19c-7 4-13 2-17-2-1 6-5 7-9 6Z" fill="#303634"/><path d="M25 30h1m12 0h1m-10 7c2 2 5 2 7 0"/><path d="M20 48v13m24-13v13" stroke="${C.cream}" stroke-width="3"/>`,
    mateo: `<circle cx="32" cy="32" r="31" fill="${C.mint}" stroke="none"/><path d="M8 60c2-17 14-20 24-20s22 3 24 20" fill="${C.teal}"/><path d="M26 37v10c2 4 10 4 12 0V37" fill="#d9a67d"/><path d="M19 21h26v13c0 17-26 17-26 0Z" fill="#edbd91"/><path d="M18 23c-2-19 30-20 28 0" fill="#443b34"/><path d="M15 18c2-18 31-18 34 0v5H15Z" fill="${C.cream}"/><path d="M15 21h36c4 0 5 4 0 4H17" fill="${C.amber}"/><path d="M32 6v12" stroke="${C.line}"/><path d="M25 31h1m12 0h1m-11 7c3 2 6 2 9-1"/><path d="M17 53h10m11 0h9" stroke="${C.mint}" stroke-width="2"/>`,
    jules: `<circle cx="32" cy="32" r="31" fill="#f2e5c9" stroke="none"/><path d="M17 29C12 8 25 2 34 5c14-1 19 14 13 28l-1 15H17Z" fill="#a45c39"/><path d="M8 60c2-15 14-20 24-20s22 5 24 20" fill="${C.amber}"/><path d="M26 37v10l6 5 6-5V37" fill="#edbc9b"/><path d="M20 21c5 2 14-2 18-7l6 9v11c0 15-24 15-24 0Z" fill="#f5d0b2"/><path d="M20 26h10v8H20zm14 0h10v8H34zm-4 3h4" fill="${C.cream}" fill-opacity=".5" stroke="${C.teal}" stroke-width="2"/><path d="M28 39c3 2 5 2 8-1"/><path d="M24 47l8 5-5 6m13-11-8 5 5 6" fill="${C.cream}"/><path d="M32 52v10"/>`,
  };
  const key = Object.hasOwn(portraits, workerId) ? workerId : 'nia';
  return svg(portraits[key], size, `crew-portrait crew-portrait--${key}`);
}

function littleWorker(x, y, color, skin = '#edbd91') {
  return `<g class="floor-worker" transform="translate(${x} ${y})"><ellipse cx="0" cy="25" rx="12" ry="4" fill="${C.ink}" opacity=".12" stroke="none"/><path d="m-4 12-2 13m10-13 3 13" stroke="${C.ink}" stroke-width="5"/><path d="M-8 11v-8c0-9 16-9 16 0v8Z" fill="${color}"/><path d="m-8 0-7 8m23-8 7 7" stroke="${skin}" stroke-width="5"/><circle cy="-13" r="7" fill="${skin}"/><path d="M-7-15c-1-8 15-9 14 0" fill="${C.ink}"/><path d="M-3-4v14m6-14v14" stroke="${C.cream}" stroke-width="2"/></g>`;
}

/** A small illustrated floor. State colors indicate the active workstation. */
export function warehouseScene({ completed = 0, total = 6, active = 'pick', compact = false } = {}) {
  const count = number(total, 6, 1, 12);
  const done = number(completed, 0, 0, count);
  const station = ['pick', 'pack', 'check'].includes(active) ? active : 'pick';
  const stations = ['pick', 'pack', 'check'];
  const colors = { pick: C.red, pack: C.teal, check: '#b07b2c' };
  const bays = stations.map((name, i) => {
    const x = 30 + i * 228;
    const selected = station === name;
    return `<g class="floor-area floor-area--${name}${selected ? ' is-active' : ''}"><rect x="${x + 2}" y="44" width="204" height="194" rx="14" fill="${C.ink}" opacity=".055" stroke="none"/><rect x="${x}" y="39" width="204" height="194" rx="14" fill="${selected ? C.white : C.paper}" stroke="${selected ? colors[name] : C.line}" stroke-width="${selected ? 2 : 1}"/><path d="M${x + 13} 222h178" stroke="${selected ? C.mint : C.line}" stroke-width="4" opacity=".6"/><rect x="${x + 14}" y="51" width="29" height="24" rx="7" fill="${colors[name]}" stroke="none"/><text x="${x + 28.5}" y="69" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="${C.white}" stroke="none">0${i + 1}</text><text x="${x + 53}" y="72" font-family="system-ui,sans-serif" font-size="28" font-weight="700" letter-spacing="1" fill="${C.ink}" stroke="none">${name.toUpperCase()}</text>${selected ? `<circle cx="${x + 183}" cy="63" r="4" fill="${colors[name]}" stroke="none"/>` : ''}</g>`;
  }).join('');
  const shelf = (x, y) => `<g transform="translate(${x} ${y})"><ellipse cx="34" cy="92" rx="37" ry="5" fill="${C.ink}" opacity=".08" stroke="none"/><path d="m61 0 6 4v88l-6-4Z" fill="${C.mint}"/><path d="M0 0h61v88H0Z" fill="${C.cream}"/><path d="M0 30h61M0 60h61M5 0v88m51-88v88" stroke="${C.teal}" stroke-width="3"/><rect x="10" y="9" width="17" height="17" rx="2" fill="${C.red}"/><rect x="32" y="6" width="18" height="20" rx="2" fill="${C.sand}"/><rect x="11" y="36" width="37" height="20" rx="2" fill="${C.teal}"/><path d="M17 42h23m-23 5h15" stroke="${C.mint}"/><rect x="9" y="67" width="18" height="17" rx="2" fill="${C.sand}"/><rect x="32" y="67" width="19" height="17" rx="2" fill="${C.red}"/></g>`;
  const parcels = Array.from({ length: count }, (_, i) => {
    const x = 53 + i * (604 / Math.max(count - 1, 1));
    return `<g class="conveyor-parcel${i < done ? ' is-complete' : ''}" opacity="${i < done ? 1 : .25}">${carton(x, 262, .76, i < done ? C.teal : C.sand)}${i < done ? `<path d="m${x + 7} 280 4 4 7-8" stroke="${C.cream}" stroke-width="2" fill="none"/>` : ''}</g>`;
  }).join('');
  return `<svg class="warehouse-scene${compact ? ' warehouse-scene--compact' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 330" width="720" height="330" fill="none" ${stroke} role="img" aria-label="Warehouse with picking, packing, and inspection stations. ${done} of ${count} orders processed. Active station: ${station}." style="display:block;width:100%;height:auto"><title>Swiftline warehouse floor</title><rect x="1" y="1" width="718" height="328" rx="20" fill="${C.cream}" stroke="${C.line}"/><path d="M21 22h678" stroke="${C.white}" stroke-width="7"/><path d="M20 246h680M20 311h680" stroke="${C.line}" stroke-dasharray="4 7"/><rect x="31" y="272" width="663" height="34" rx="12" fill="${C.ink}" opacity=".1" stroke="none"/>${bays}${shelf(48, 91)}${shelf(122, 91)}${littleWorker(193, 192, C.red, '#c88a62')}
    <g class="packing-desk"><path d="m282 131 106-16 35 23-106 18Z" fill="${C.sand}"/><path d="M282 131v48l35 21v-44m106-18v41l-106 21" fill="${C.paper}"/><path d="M295 144v47m115-43v42" stroke="${C.teal}" stroke-width="4"/>${carton(322, 98, 1.25)}<path d="m316 122-9-7 12-6 10 5m30 1 13-7 8 8-13 7" fill="${C.cream}"/><circle cx="295" cy="132" r="7" fill="${C.red}"/><circle cx="295" cy="132" r="3" fill="${C.cream}"/></g>${littleWorker(420, 197, C.teal)}
    <g class="quality-desk"><path d="M509 139h133v15H509Z" fill="${C.teal}"/><path d="M519 154v43m113-43v43" stroke="${C.ink}" stroke-width="4"/><rect x="558" y="94" width="53" height="38" rx="4" fill="${C.ink}"/><rect x="564" y="100" width="41" height="26" rx="1" fill="${C.mint}" stroke="none"/><path d="m575 113 6 6 13-15" stroke="${C.teal}" stroke-width="3"/><path d="M584 132v7m-11 0h23"/>${carton(516, 112, .65)}<path d="m620 118 10 5-4 14-10-5Z" fill="${C.red}"/></g>${littleWorker(656, 198, C.amber, '#f5d0b2')}
    <g class="floor-conveyor"><rect x="28" y="265" width="663" height="35" rx="12" fill="${C.ink}"/><path d="M40 270h640m-640 25h640" stroke="#71817b"/>${Array.from({ length: 38 }, (_, i) => `<path d="M${43 + i * 17} 271v22" stroke="#4a5c56"/>`).join('')}${parcels}<path d="m695 278 8 5-8 5" stroke="${C.teal}" stroke-width="2"/></g>
    <path d="m238 142 10 0m-4-4 4 4-4 4m222-4h10m-4-4 4 4-4 4" stroke="${C.teal}" stroke-width="2"/><path d="M48 212h111m125 0h95m130 0h101" stroke="${C.line}" stroke-dasharray="4 6"/></svg>`;
}

/** Decorative selected packaging preview; the surrounding control provides its label. */
export function packagePreview({ kind = 'mailer', quantity = 1, fragile = false, packed = false } = {}) {
  const box = kind === 'box' || kind === 'rigid';
  const count = number(quantity, 1, 1, 99);
  const units = Array.from({ length: Math.min(4, count) }, (_, i) => `<rect x="${49 + i * 13}" y="${packed ? 50 : 19 + (i % 2) * 4}" width="17" height="24" rx="3" fill="${i % 2 ? C.teal : C.red}"/><path d="M${53 + i * 13} ${packed ? 57 : 26 + (i % 2) * 4}h8" stroke="${C.cream}"/>`).join('');
  const shell = box
    ? `<path d="m28 49 53-13 51 14-51 15Z" fill="${C.cream}"/><path d="M28 49v39l53 17V65Z" fill="${C.sand}"/><path d="m81 65 51-15v38l-51 17Z" fill="${C.amber}"/>${packed ? `<path d="m58 42 52 15v11l-13 4V61L45 46Z" fill="${C.cream}" stroke="none"/>` : `${units}<path d="m28 49-10-18 51-13 12 18m0 0 12-18 49 16-10 16m-104-1 53 16-13 18-49-17m62-1 51-15 12 18-50 17Z" fill="${C.cream}"/>`}`
    : `<path d="M30 31h100l6 58-103 9Z" fill="${C.paper}"/>${!packed ? units : ''}<path d="m30 31 52 30 48-30v52L33 92Z" fill="${C.sand}"/><path d="m30 31 52 30 48-30" fill="${packed ? C.cream : C.paper}"/><path d="m43 75 72-6" stroke="${C.amber}" stroke-width="5"/>`;
  const sticker = fragile ? `<g transform="translate(108 70) rotate(-8)"><rect x="-10" y="-10" width="20" height="24" rx="2" fill="${C.white}" stroke="${C.red}"/><path d="M-4-6h8l-1 7h-6Zm4 7v8m-4 0h8" stroke="${C.red}"/></g>` : '';
  return `<svg class="package-preview package-preview--${box ? 'box' : 'mailer'}${packed ? ' is-packed' : ''}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 116" width="160" height="116" fill="none" ${stroke} aria-hidden="true" focusable="false"><ellipse cx="81" cy="106" rx="58" ry="6" fill="${C.ink}" opacity=".08" stroke="none"/>${shell}${sticker}<g class="unit-count"><circle cx="136" cy="18" r="15" fill="${C.teal}" stroke="${C.cream}" stroke-width="3"/><text x="136" y="23" text-anchor="middle" font-family="system-ui,sans-serif" font-size="15" font-weight="700" fill="${C.white}" stroke="none">×${count}</text></g></svg>`;
}
