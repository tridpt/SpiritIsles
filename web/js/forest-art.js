let serial=0;

// One local vector landscape stays mounted for the whole expedition.
export function forestArt(){
  const id=`forest-path-${++serial}`;
  const fern=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 55Q-4 15-25-15M0 55Q8 8 36-13M0 55Q25 22 55 25" fill="none" stroke="#70ac82" stroke-width="4"/><path d="M-6 37Q-38 27-34 4Q-10 9-6 37M-14 14Q-42 4-38-15Q-15-9-14 14M7 34Q7 3 28 0Q31 25 7 34M20 15Q27-12 47-13Q44 9 20 15M22 45Q38 24 60 35Q46 53 22 45" fill="#3e8c73"/><path d="M0 55Q-4 15-25-15M0 55Q8 8 36-13" fill="none" stroke="#a5c98e" stroke-width="2"/></g>`;
  const tree=(x,y,s=1,light=false)=>`<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="8" cy="326" rx="66" ry="14" fill="#103d3b" opacity=".22"/><path d="M-24 320Q-7 223-14 100L27 97Q13 221 41 320L17 305 5 326-6 306Z" fill="${light?'#5e7560':'#335b50'}"/><path d="M0 306Q6 184 4 110" fill="none" stroke="#a3ac78" stroke-width="7" opacity=".55"/><path d="M2 194-48 146M11 156 61 106" stroke="#3b6252" stroke-width="13" fill="none"/><path d="M-115 137Q-167 96-117 64Q-137 15-74 2Q-64-38-12-22Q34-55 65-15Q126-29 126 19Q177 42 138 88Q151 137 92 143Q42 183 3 145Q-66 184-115 137Z" fill="${light?'#458e76':'#24675d'}"/><path d="M-122 61Q-105 15-66 20Q-45-17-8 2Q20-23 50 2Q94-2 108 31Q68 14 40 31Q1 7-24 31Q-64 18-85 52Z" fill="${light?'#79b38a':'#49957a'}"/><path d="M-73 43  -51 37M-24 18-3 22M58 23 76 29M104 56 117 65" stroke="#b6d49a" stroke-width="7" stroke-linecap="round" opacity=".6"/></g>`;
  const stones=Array.from({length:14},(_,i)=>`<path d="M${70+i*57} ${528+(i%3)*42}l17-8 17 5 6 11-26 5-17-4Z" fill="${i%2?'#879b74':'#668b74'}" opacity=".5"/>`).join('');
  return `<svg class="forest-backdrop travel-scenery" viewBox="0 0 900 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="${id}-sky" x2="0" y2="1"><stop stop-color="#123e4a"/><stop offset=".62" stop-color="#5e9b87"/><stop offset="1" stop-color="#b6ce92"/></linearGradient>
    <linearGradient id="${id}-floor" x2="0" y2="1"><stop stop-color="#78a67e"/><stop offset=".5" stop-color="#5c966e"/><stop offset="1" stop-color="#245e53"/></linearGradient>
    <linearGradient id="${id}-road" x2=".15" y2="1"><stop stop-color="#c0c58f"/><stop offset=".52" stop-color="#d8c895"/><stop offset="1" stop-color="#8ca373"/></linearGradient>
    <radialGradient id="${id}-sun"><stop stop-color="#fff8ca" stop-opacity=".88"/><stop offset=".4" stop-color="#ffe8a1" stop-opacity=".28"/><stop offset="1" stop-color="#ffe8a1" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}-ray" x2=".4" y2="1"><stop stop-color="#fff5ba" stop-opacity=".33"/><stop offset="1" stop-color="#fff5ba" stop-opacity="0"/></linearGradient>
  </defs>
  <path d="M0 0H900V800H0Z" fill="url(#${id}-sky)"/>
  <circle cx="630" cy="180" r="280" fill="url(#${id}-sun)"/>
  <g fill="#2a6a64" opacity=".65"><path d="M24 500 61 87 83 70 112 502ZM162 477 187 109 206 90 224 480ZM322 480 349 39 374 15 382 489ZM718 503 742 63 769 39 788 502ZM844 495 871 122 900 103V500Z"/></g>
  <g fill="#90b89a" opacity=".48"><path d="m110 477 23-224 15-17 13 240ZM428 469l14-266 17-19 17 292ZM632 485l18-229 17-7 20 232Z"/></g>
  <path d="M0 423Q118 357 239 400Q426 330 550 396Q733 353 900 408V800H0Z" fill="url(#${id}-floor)"/>
  <path d="M538 373Q428 410 469 447Q511 486 386 530Q262 578 308 649Q355 715 177 800H900V700Q746 626 673 570Q608 516 568 478Q500 421 593 382Z" fill="url(#${id}-road)"/>
  <path d="M522 398Q451 429 502 471Q550 514 433 556Q327 598 374 656" fill="none" stroke="#e0d4a3" stroke-width="6" opacity=".5"/>
  <g class="forest-parallax-far">${tree(68,177,.77)}${tree(285,185,.62,true)}${tree(834,191,.8)}${tree(694,234,.48,true)}</g>
  <path d="m599 0 55 0-118 584-141 0Z" fill="url(#${id}-ray)"/><path d="m669 0 23 0 84 641-104 0Z" fill="url(#${id}-ray)"/>
  <g opacity=".86">${stones}<path d="m753 482 35-25 31 6 15 36-29 15-48-7Z" fill="#526f66"/><path d="m758 482 30-15 26 4-12 14Z" fill="#a2bb8c"/><path d="m158 580 25-20 29 8 15 29-47 8-27-10Z" fill="#507865"/><path d="m157 581 28-11 24 3-18 13Z" fill="#a3bc86"/></g>
  <g class="forest-parallax-near">${tree(-16,-17,1.7)}${tree(931,-29,1.75)}</g>
  <g fill="#174c47"><path d="M0 12Q106-48 202 9Q281-22 335 13Q279 74 219 57Q133 112 85 67Q32 104 0 80ZM900 0H550Q554 56 620 39Q653 90 715 63Q799 111 852 55Q888 75 900 56Z"/></g>
  <g fill="#34765e"><path d="M0 13Q104-34 183 13Q124 9 87 47Q31 23 0 54ZM716 0Q811-21 900 4V29Q837 12 787 49Q772 20 716 0Z"/></g>
  <g class="forest-understory">${fern(63,655,1.3)}${fern(804,651,1.5)}${fern(143,746,.9)}${fern(729,758,1.1)}<path d="M0 749Q122 704 234 776L260 800H0ZM900 735Q810 722 682 780L663 800H900Z" fill="#1a5147"/>
  <g fill="#f2d490"><circle cx="109" cy="713" r="5"/><circle cx="117" cy="705" r="4"/><circle cx="772" cy="738" r="5"/><circle cx="782" cy="732" r="4"/></g><g fill="#b4d4ab"><path d="m81 704 9-14 7 17-8 7ZM789 710l10-13 5 19-8 5Z"/></g></g>
  </svg>`;
}
