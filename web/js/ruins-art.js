import { RUINS_CHAPTERS } from './ruins-data.js';

export function ruinsArt(id='roots') {
  const c=RUINS_CHAPTERS.find(c=>c.id===id)||RUINS_CHAPTERS[0];
  const prefix=`ruins-${id}`;
  return `<svg class="ruins-art" viewBox="0 0 700 420" role="img" aria-label="Phế tích cổ trên đảo nổi, cổng đá phát sáng, rễ cây và những ngọn đèn dẫn lối"><defs>
    <linearGradient id="${prefix}-sky" x2="0" y2="1"><stop stop-color="${c.pale}"/><stop offset="1" stop-color="#e4eadf"/></linearGradient>
    <linearGradient id="${prefix}-stone" x2="0.8" y2="1"><stop stop-color="#d7dbc4"/><stop offset="1" stop-color="#a8b49b"/></linearGradient>
    <linearGradient id="${prefix}-gate" x2="0" y2="1"><stop stop-color="#e6da99"/><stop offset="1" stop-color="${c.color}"/></linearGradient>
    <radialGradient id="${prefix}-light"><stop stop-color="#f9edbd" stop-opacity=".8"/><stop offset="1" stop-color="#f9edbd" stop-opacity="0"/></radialGradient>
  </defs>
  <path fill="url(#${prefix}-sky)" d="M0 0h700v420H0z"/>
  <circle cx="504" cy="75" r="45" fill="#fffcee" opacity=".7"/>
  <path d="M0 232 89 180l65 34 89-58 95 71 85-59 94 50 111-44 72 44v202H0Z" fill="${c.color}" opacity=".11"/>
  <path d="m0 286 140-71 97 68 113-34 117 16 123-36 110 68v123H0Z" fill="${c.color}" opacity=".09"/>
  <ellipse cx="357" cy="374" rx="203" ry="16" fill="#627d6b" opacity=".1"/>
  <g class="ruins-floating-isle">
  <path d="m135 278 80 52 90 21 54 34 63-39 83-11 69-61-75-37-168-21Z" fill="#a2af93"/>
  <path d="m135 278 80 52 90 21 54 34-20-82Z" fill="#869e81"/>
  <path d="m359 385 63-39 83-11 69-61-193 25Z" fill="#738e76"/>
  <path d="m135 278 83-53 137-34 144 46 75 37-116 56-161 6Z" fill="#c7d1b0"/>
  <path d="m176 277 94-41 93-23 130 40 37 19-92 43-141 3Z" fill="#d8dec3"/>
  <path d="m325 333 32 14 37-13-6 26-27 44-23-26Z" fill="#a4ccbd" opacity=".9"/>
  <path d="m345 344 13 9 15-6-4 36-11 29-8-23Z" fill="#d2e6d7" opacity=".8"/>
  <path d="m287 292 55-28 93 26-62 31Z" fill="#bdc8aa"/>
  <path d="m301 278 48-24 70 18-49 26Z" fill="#e9e7d0"/>
  <path d="m301 278 69 20v9l-69-20Zm69 20 49-26v9l-49 26Z" fill="#b0bba1"/>
  <path d="m314 263 40-21 52 14-41 21Z" fill="#eeecd8"/>
  <path d="m314 263 51 14v9l-51-14Zm51 14 41-21v8l-41 22Z" fill="#b9c2a8"/>
  <path d="m328 249 31-16 33 9-31 17Z" fill="#f1edda"/>
  <path d="m328 249 33 10v8l-33-10Zm33 10 31-17v8l-31 17Z" fill="#b2bda5"/>
  <ellipse cx="359" cy="189" rx="105" ry="105" fill="url(#${prefix}-light)"/>
  <path d="M290 244V141q0-55 61-73l64 22q38 19 38 65v92l-39 20-124-23Z" fill="#879d85"/>
  <path d="M290 244V141q0-55 61-73l37 13q-60 17-60 71v103Z" fill="#c8ceb5"/>
  <path d="M328 255V153q0-49 53-62 48 17 48 65v92l-68 32Z" fill="url(#${prefix}-stone)"/>
  <path d="M348 245v-86q0-35 33-47 29 14 29 47v80l-49 24Z" fill="#526f60"/>
  <path d="M359 246v-82q0-28 23-38 19 13 19 38v69Z" fill="url(#${prefix}-gate)" opacity=".85"/>
  <path d="m370 218 10-14 11 7-10 16Z" fill="#fff1ba"/>
  <path d="m373 180 8-13 8 8-8 14Z" fill="#f7edc2" opacity=".8"/>
  <path d="m287 145 39 12m-37 27 39 12m-38 25 38 10m-22-119 32 10m1-33 29 12m43 11 26-12m-14 43 26-10m-18 42 21-8m-21 44 22-11" fill="none" stroke="#a5b297" stroke-width="3"/>
  <path d="M312 96q-32 26-22 77t-19 74m71-163q-32 32-22 74m96-54q29 39 12 67t8 64" fill="none" stroke="#76916c" stroke-width="7" stroke-linecap="round"/>
  <g fill="#94ad7f"><ellipse cx="291" cy="135" rx="15" ry="6" transform="rotate(-29 291 135)"/><ellipse cx="295" cy="174" rx="13" ry="6" transform="rotate(30 295 174)"/><ellipse cx="282" cy="223" rx="16" ry="6" transform="rotate(-30 282 223)"/><ellipse cx="429" cy="149" rx="17" ry="6" transform="rotate(-28 429 149)"/><ellipse cx="432" cy="219" rx="14" ry="6" transform="rotate(28 432 219)"/></g>
  <g><path d="m221 264 21-11 15 5v-75l-15-6-21 10Z" fill="#b7c3a4"/><path d="m242 177 15 6v75l-15 7Z" fill="#8fa386"/><path d="m217 184 24-13 21 7-25 14Z" fill="#dce0c6"/><path d="m221 183 16 5v15l-16-5Z" fill="#a9b69b"/><path d="m477 280 20-10 15 5v-61l-15-5-20 10Z" fill="#a8b89b"/><path d="m497 209 15 5v61l-15 7Z" fill="#819b83"/><path d="m472 215 24-12 22 6-25 14Z" fill="#d4dbc0"/></g>
  <g fill="#5c7f63"><path d="M189 280q-8-28 11-43-1 23 9 36 3-31 24-35-16 23-13 42Z"/><path d="M458 306q0-21 15-29l-3 21q11-23 29-22-15 13-19 29Z"/><path d="M280 299q-1-19 10-28l2 20q7-15 19-15l-12 23Z"/></g>
  <g fill="#f3df9c" stroke="#b6a477" stroke-width="2"><path d="m246 291 8-5 7 3v11l-8 4-7-3Z"/><path d="m437 294 8-5 7 3v11l-8 4-7-3Z"/></g>
  <g fill="#fff4be" class="ruins-motes"><circle cx="266" cy="146" r="3"/><circle cx="462" cy="186" r="3"/><circle cx="323" cy="63" r="2.5"/><circle cx="386" cy="48" r="3"/><circle cx="409" cy="289" r="2"/><circle cx="211" cy="220" r="2.5"/></g>
  <g fill="#c0cbb0"><path d="m162 173 16-8 21 7-15 9-18 1Z"/><path d="m513 121 24-9 20 8-21 12Z"/></g><g fill="#8da384"><path d="m166 182 18-1-7 15Z"/><path d="m518 122 18 10 21-12-18 27Z"/></g>
  </g><path d="M31 344q35-12 72 1m482-18q39-12 80 0" stroke="#fdfcf0" stroke-width="4" fill="none" opacity=".7"/>
  </svg>`;
}
