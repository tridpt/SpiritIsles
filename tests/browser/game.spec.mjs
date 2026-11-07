import { navigateGame, openSettings } from './navigation.mjs';
import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { SPECIES } from '../../web/js/data.js';
const errors=[];
test.beforeEach(async({page})=>{errors.length=0;page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('Đảo Bình Yên');await page.evaluate(()=>document.fonts.ready);});
test.afterEach(()=>expect(errors).toEqual([]));

test('desktop and mobile render without overflow and show real island artwork',async({page})=>{
  await mkdir('dist/screenshots',{recursive:true});
  await expect(page.getByRole('img',{name:'Hòn đảo nổi xanh mát với nhà cây, vườn quả, thác nước và linh thú'})).toBeVisible();
  await page.screenshot({path:'dist/screenshots/desktop.png',fullPage:true});
  for(const width of [360,390,768,1024,1440]){
    await page.setViewportSize({width,height:844});
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth),{message:`layout at ${width}px`}).toBeLessThanOrEqual(width+1);
  }
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByRole('navigation',{name:'Chức năng ngay trên đảo'})).toBeVisible();
  await expect(page.locator('.mobile-nav,.desktop-nav')).toHaveCount(0);
  await page.screenshot({path:'dist/screenshots/mobile.png',fullPage:true});
  await page.screenshot({path:'dist/screenshots/mobile-preview.png'});
});
test('hatching ten eggs gives ten results and survives reloading',async({page})=>{
  await page.getByRole('button',{name:'Ấp trứng',exact:true}).click();
  await page.getByRole('button',{name:'Ấp 10 trứng'}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button',{name:'Mở trứng ngay'}).click();
  await expect(page.locator('.hatch-result')).toHaveCount(10);
  await expect(page.locator('.hatch-result .rarity').filter({hasText:/^S(S)?R$/}).first()).toBeVisible();
  await page.screenshot({path:'dist/screenshots/hatching.png',fullPage:true});
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('spirit-isles-save-v1')).state);
  expect(saved.stats.hatches).toBe(10);
  await page.reload();
  const reloaded=await page.evaluate(()=>JSON.parse(localStorage.getItem('spirit-isles-save-v1')).state);
  expect(reloaded.stats.hatches).toBe(10);expect(reloaded.pets).toEqual(saved.pets);
});
test('feeding, changing team and upgrading buildings update persisted progress',async({page})=>{
  await page.getByRole('button',{name:'Chăm sóc Cáo Mầm'}).click();await page.getByRole('button',{name:'Xem chi tiết Cáo Mầm',exact:true}).click();
  await page.getByRole('button',{name:/Cho ăn/}).click();
  await expect(page.getByRole('dialog')).toContainText('35 / 45 XP');
  await page.getByRole('button',{name:'Rời đội thám hiểm'}).click();
  await expect(page.getByRole('button',{name:'Thêm vào đội'})).toBeVisible();
  await page.getByRole('button',{name:'Thêm vào đội'}).click();
  await page.getByRole('button',{name:'Đóng',exact:true}).click();
  await page.getByRole('button',{name:'Xây dựng',exact:true}).click();
  await page.getByRole('button',{name:'Nâng lên cấp 2'}).first().click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('spirit-isles-save-v1')).state);
  expect(saved.pets.find(p=>p.id==='mossfox').xp).toBe(35);expect(saved.buildings.garden.level).toBe(2);expect(saved.team).toContain('mossfox');
});
test('a full forest expedition can be completed through the visible controls',async({page})=>{
  await page.getByRole('button',{name:'Mở bản đồ thám hiểm',exact:true}).click();
  await page.locator('[data-action="start-expedition"][data-id="forest"]').click();
  let turns=0;
  while(turns++<60){
    if(await page.locator('.journey-result').count())break;
    if(await page.locator('[data-action="route"]').count())await page.locator('[data-action="route"]').first().click();
    else{
      const skill=page.locator('[data-action="battle"][data-id="skill"]');
      if(await skill.isEnabled())await skill.click();
      else if(await page.locator('.attack-forecast.warning').count())await page.locator('[data-action="battle"][data-id="guard"]').click();
      else await page.locator('[data-action="battle"][data-id="attack"]').click();
    }
  }
  await expect(page.getByRole('dialog')).toContainText('Bạn đã làm được rồi!');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('spirit-isles-save-v1')).state);
  expect(saved.stats.expeditions).toBe(1);expect(saved.expedition).toBeNull();
});
test('all six pages and the collection work at phone width',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  for(const id of ['hatch','pets','explore','build','journal','island']){
    await navigateGame(page,`${id}`);
    await expect(page.getByRole('heading',{level:1})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  await navigateGame(page,'pets');
  await page.getByRole('button',{name:'Sổ linh thú',exact:true}).click();
  await expect(page.locator('.pet-grid .pet-card')).toHaveCount(SPECIES.length);
  await page.getByRole('searchbox',{name:'Tìm linh thú'}).fill('Cáo');
  expect(await page.locator('.pet-grid .pet-card').count()).toBeGreaterThan(1);
});

test('backup export and import preserve the island, with confirmation before replacement',async({page})=>{
  await openSettings(page);
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Xuất bản lưu'}).click()]);
  const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);const backup=Buffer.concat(chunks);const data=JSON.parse(backup.toString());expect(data.app).toBe('SpiritIsles');
  data.state.level=4;data.state.resources.gold=7777;
  await page.locator('#import-file').setInputFiles({name:'island.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
  await expect(page.getByRole('dialog')).toContainText('Khôi phục hòn đảo này?');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('spirit-isles-save-v1')).state.level)).toBe(1);
  await page.getByRole('button',{name:'Khôi phục bản lưu',exact:true}).click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('spirit-isles-save-v1')).state.level)).toBe(4);
  await expect(page.locator('.wallet-gold')).toContainText('7.777');
});

test('the installed web game starts, hatches and opens fishing while the network is offline',async({browser})=>{
  const context=await browser.newContext({serviceWorkers:'allow',reducedMotion:'reduce'});const page=await context.newPage();
  await page.goto('http://127.0.0.1:4189/');await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
  await context.setOffline(true);await page.reload();
  await expect(page.getByRole('heading',{level:1})).toContainText('Đảo Bình Yên');
  await page.getByRole('button',{name:'Ấp trứng',exact:true}).click();await page.getByRole('button',{name:'Ấp 1 trứng'}).click();await page.getByRole('button',{name:'Mở trứng ngay'}).click();await expect(page.locator('.hatch-result')).toHaveCount(1);
  await page.getByRole('button',{name:'Ở lại vườn ấp'}).click();await navigateGame(page,'island');
  await page.locator('.fishing-entry').click();await page.locator('[data-action="fish-cast"]').click();await expect(page.locator('.fishing-meter')).toBeVisible();
  await context.close();
});
