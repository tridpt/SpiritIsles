import { navigateGame, openSettings } from './navigation.mjs';
import { test, expect } from '@playwright/test';
import { E } from '../legacy-combat.mjs';
import { SPECIES } from '../../web/js/data.js';

const errors=[];
test.beforeEach(async({page})=>{
  errors.length=0;page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&/svg|path|attribute/i.test(m.text()))errors.push(m.text());});
  await page.goto('/');await expect(page.getByRole('heading',{level:1})).toBeVisible();await page.evaluate(()=>document.fonts.ready);
});
test.afterEach(()=>expect(errors).toEqual([]));
const saved=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('spirit-isles-save-v1')).state);
async function book(page){await navigateGame(page,'pets');await page.getByRole('button',{name:'Sổ linh thú',exact:true}).click();}

test('all 58 named drawings render valid SVG with self-contained gradients and fit their view boxes',async({page})=>{
  await book(page);await expect(page.locator('.pet-grid .pet-card')).toHaveCount(58);
  const audit=await page.evaluate(()=>{
    const svg=[...document.querySelectorAll('.pet-grid .creature')];const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
    return {
      invalid:svg.filter(el=>new DOMParser().parseFromString(el.outerHTML,'image/svg+xml').querySelector('parsererror')).map(el=>el.dataset.species),
      escaped:svg.flatMap(el=>{const b=el.querySelector('.pet-body').getBBox();return b.x<0||b.y<0||b.x+b.width>181||b.y+b.height>157?[{id:el.dataset.species,box:[b.x,b.y,b.width,b.height]}]:[];}),
      missing:[...document.querySelectorAll('.creature [fill^="url"],.creature [stroke^="url"],.creature [clip-path^="url"]')].flatMap(el=>['fill','stroke','clip-path'].map(attr=>el.getAttribute(attr)).filter(v=>v?.startsWith('url(')).filter(value=>{const id=value.match(/#([^)]*)/)[1];return !el.closest('svg').querySelector(`[id="${id}"]`);})).length,
      duplicates:ids.filter((id,i)=>ids.indexOf(id)!==i)
    };
  });
  expect(audit).toEqual({invalid:[],escaped:[],missing:0,duplicates:[]});
  await page.screenshot({path:'dist/screenshots/creatures-collection-desktop.png',fullPage:true});
});

test('rarity, element, search, and sorting can be combined without losing creatures',async({page})=>{
  await book(page);await page.getByRole('button',{name:'Lọc SSR',exact:true}).click();await expect(page.locator('.pet-grid .pet-card')).toHaveCount(12);
  await page.locator('[data-action="filter"][data-id="shadow"]').click();await expect(page.locator('.pet-grid .pet-card')).toHaveCount(2);
  await page.getByRole('searchbox',{name:'Tìm linh thú'}).fill('Hư Không');await expect(page.locator('.pet-grid .pet-card')).toHaveCount(1);
  await page.getByRole('button',{name:'Ngắm Long Thần Hư Không',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Long Thần Hư Không');
  await expect(page.getByRole('dialog').locator('.creature-SSR')).toBeVisible();await page.getByRole('button',{name:'Đóng',exact:true}).click();
  await page.getByRole('searchbox',{name:'Tìm linh thú'}).fill('');await page.locator('[data-action="filter"][data-id="all"]').click();
  await page.getByRole('button',{name:'Mọi độ hiếm',exact:true}).click();await page.getByLabel('Sắp xếp linh thú').selectOption('name');
  const names=await page.locator('.pet-grid .pet-card-bottom').evaluateAll(cards=>cards.map(e=>e.querySelector('.pet-name,strong').textContent));
  expect(names).toEqual(SPECIES.map(s=>s.name).sort((a,b)=>a.localeCompare(b,'vi')));
});

test('the legendary shelf previews both new and returning SSR without spending currency',async({page})=>{
  await navigateGame(page,'hatch');const before=(await saved(page)).resources;
  await expect(page.locator('.legend-card')).toHaveCount(12);
  for(const id of ['worldturtle','voiddragon','sunfox']){
    await page.locator(`.legend-card[data-id="${id}"]`).click();
    await expect(page.getByRole('dialog').locator(`.creature[data-species="${id}"]`)).toBeVisible();
    await page.getByRole('button',{name:'Đóng',exact:true}).click();
  }
  expect((await saved(page)).resources).toEqual(before);
  await page.getByRole('button',{name:'Tỷ lệ & bảo hiểm'}).click();await expect(page.getByRole('dialog')).toContainText('55 loài');await expect(page.getByRole('dialog')).toContainText('50 lượt');
});

test('a guaranteed new SSR is revealed, saved, fed and restored using game controls',async({page})=>{
  const s=E.newGame();s.pity=49;
  await page.addInitScript(raw=>{if(!sessionStorage.getItem('creature-seed')){localStorage.setItem('spirit-isles-save-v1',raw);sessionStorage.setItem('creature-seed','1');}Math.random=()=>.999;},E.serialize(s));
  await page.reload();await navigateGame(page,'hatch');await page.getByRole('button',{name:'Ấp 1 trứng'}).click();await page.getByRole('button',{name:'Mở trứng ngay'}).click();
  await expect(page.locator('.hatch-result.tier-SSR')).toContainText('Long Thần Hư Không');await expect(page.locator('.hatch-result .creature')).toHaveAttribute('data-species','voiddragon');
  expect((await saved(page)).pity).toBe(0);await page.screenshot({path:'dist/screenshots/creatures-ssr-reveal.png',fullPage:true});
  await page.getByRole('button',{name:'Gặp các bạn nhỏ'}).click();await page.getByRole('button',{name:'Xem Long Thần Hư Không',exact:true}).click();await page.getByRole('button',{name:/Cho ăn/}).click();
  const pet=(await saved(page)).pets.find(p=>p.id==='voiddragon');expect(pet.xp).toBe(35);await page.reload();expect((await saved(page)).pets.find(p=>p.id==='voiddragon')).toEqual(pet);
});

test('expanded collection and legend shelf fit small phones and respect disabled motion',async({page})=>{
  for(const width of [320,390,768,1440]){
    await page.setViewportSize({width,height:844});await book(page);await page.getByRole('button',{name:'Lọc SSR',exact:true}).click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
    await navigateGame(page,'hatch');
    await expect(page.locator('.legend-card').first()).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
  }
  await openSettings(page);await page.getByRole('switch',{name:'Chuyển động',exact:true}).click();await page.getByRole('button',{name:'Đóng',exact:true}).click();
  expect(await page.locator('.legend-card .pet-sparkles').first().evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
  await page.setViewportSize({width:390,height:844});await page.locator('.legend-gallery').scrollIntoViewIfNeeded();await page.screenshot({path:'dist/screenshots/creatures-gacha-mobile.png'});
  await page.locator('.legend-card[data-id="voiddragon"]').click();await page.screenshot({path:'dist/screenshots/creatures-legend-mobile.png'});
});

test('every new creature remains available in the collection and legendary preview offline',async({browser})=>{
  const context=await browser.newContext({serviceWorkers:'allow',reducedMotion:'reduce'});const page=await context.newPage();
  try{
    await page.goto('http://127.0.0.1:4189/');await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await context.setOffline(true);await page.reload();
    await book(page);await expect(page.locator('.pet-grid .pet-card')).toHaveCount(58);
    await page.getByRole('button',{name:'Lọc SSR',exact:true}).click();await page.getByRole('button',{name:'Ngắm Quy Thần Vạn Diệp',exact:true}).click();
    await expect(page.getByRole('dialog').locator('.creature[data-species="worldturtle"]')).toBeVisible();
    await page.getByRole('button',{name:'Đóng',exact:true}).click();await navigateGame(page,'hatch');await expect(page.locator('.legend-card')).toHaveCount(12);
  }finally{await context.close();}
});
