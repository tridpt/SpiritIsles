import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/browser',
  fullyParallel:false,
  workers:1,
  timeout:30000,
  use:{baseURL:'http://127.0.0.1:4189',viewport:{width:1440,height:1000},headless:true,contextOptions:{reducedMotion:'reduce'},serviceWorkers:'block',screenshot:'only-on-failure'},
  reporter:'list',
  webServer:{command:'node scripts/serve.mjs',url:'http://127.0.0.1:4189',reuseExistingServer:true,timeout:15000}
});
