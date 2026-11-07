import * as E from '../web/js/engine.js';
import * as H from '../web/js/habitat-engine.js';
import { SPECIES } from '../web/js/data.js';
import { CAMPAIGN_STAGES } from '../web/js/campaign-data.js';
import { FISH_BY_ID } from '../web/js/activities-data.js';
import { seasonalSummary, claimSeasonalMission, claimSeasonalChallenge } from '../web/js/seasonal-engine.js';
export { E };
export const seasonalNow=Date.now()-10000;
export const DAY=86400000;

// A coherent advanced save; reward claims still use the production engine.
export function festivalGame({now=seasonalNow,day=22,claim=false}={}){
  const s=E.newGame(now-(day-1)*DAY);
  s.lastSeen=now;s.level=10;s.settings={motion:false,sound:false};
  s.resources={gold:10000,food:10000,wood:1000,crystals:1000,tickets:30,essence:100};
  s.stats.hatches=28;s.stats.feeds=56;s.stats.expeditions=10;
  s.pets=SPECIES.map(p=>({...E.makePet(p.id,s.created),bond:100}));
  for(const stage of CAMPAIGN_STAGES.slice(0,8))s.campaign.stages[stage.id]={wins:2,stars:3,goals:[true,true,true],bestTurns:6};
  s.tower.best=10;s.tower.bosses=4;s.tower.runs=1;
  s.fishing.total=18;s.fishing.collection.minnow={caught:18,best:FISH_BY_ID.minnow.min};s.fishing.bag.minnow=18;
  for(const p of s.pets.slice(0,10))H.discoverMoment(s,p.id,'shade-nap',now);
  E.refreshSeason(s,now);
  if(claim)claimFestivalTasks(s,now);
  return s;
}
export function claimFestivalTasks(s,now=seasonalNow){
  const view=seasonalSummary(s,now);
  for(const m of view.weeks.flat())if(m.ready)claimSeasonalMission(s,m.claimKey,now);
  for(const c of view.challenges)if(c.ready)claimSeasonalChallenge(s,c.id,now);
  return s;
}
