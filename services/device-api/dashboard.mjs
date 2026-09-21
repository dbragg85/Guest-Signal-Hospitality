// Device-sized, read-only projection of the existing Guest Signal schema.
export const clean = (s, n=36) => String(s ?? '').normalize('NFKD').replace(/[^\x20-\x7e]/g,'').trim().slice(0,n);
const row=(label,value,detail='',tone='neutral')=>({label:clean(label,24),value:clean(value,24),detail:clean(detail,36),tone});
const page=(title,rows,status='ok')=>({title,rows,status});
const missing=(title,detail='Source unavailable')=>page(title,[row('NOT AVAILABLE','--',detail,'warning')],'unavailable');

export async function dashboard(db, now=new Date()) {
  const week=new Date(+now-7*86400000).toISOString();
  const month=new Date(+now-30*86400000).toISOString().slice(0,10);
  const requests={
    restaurants:()=>db.count('restaurants',{}),
    reviews30:()=>db.count('review_observations',{review_date:`gte.${month}`}),
    leads7:()=>db.count('sales_opportunities',{is_test:'eq.false',created_at:`gte.${week}`}),
    open:()=>db.count('sales_opportunities',{is_test:'eq.false',stage:'in.(new,qualified,meeting,proposal,nurture)'}),
    revenue:()=>db.rows('retained_revenue_metrics',{select:'active_mrr_cents,churned_mrr_cents,payment_failures,refunds',limit:'1'}),
    reviews:()=>db.rows('review_observations',{select:'rating,review_text,review_date,source,restaurants(name)',order:'review_date.desc.nullslast,id.desc',limit:'3'}),
    opportunities:()=>db.rows('sales_opportunities',{select:'stage,plan_key,updated_at',is_test:'eq.false',stage:'in.(new,qualified,meeting,proposal,nurture)',order:'updated_at.desc,id.desc',limit:'3'}),
    runs:()=>db.rows('automation_runs',{select:'run_kind,status,started_at',order:'started_at.desc,id.desc',limit:'3'})
  };
  const values={};const errors=[];
  await Promise.all(Object.entries(requests).map(async([key,run])=>{try{values[key]=await run();}catch{errors.push(key);}}));
  // A failed query is unknown, never zero. Optional schema gaps remain explicit.
  const count=(key)=>Number.isSafeInteger(values[key])&&values[key]>=0?String(values[key]):'--';
  const money=(c)=>typeof c==='number'&&Number.isFinite(c)&&c>=0?'$'+(c/100).toFixed(2):'--';
  const r=values.revenue?.[0];
  const pages=[
    page('GUEST SIGNAL',[row('INTERNAL DASHBOARD','CONNECTED','Supabase records'),row('CHECKED AT',now.toISOString().slice(11,19)+' UTC')]),
    page("TODAY'S SNAPSHOT",[row('TRACKED RESTAURANTS',count('restaurants'),'Stored directory / not city total'),row('REVIEWS / 30 DAYS',count('reviews30'),'Published dates / stored reviews'),row('NEW LEADS / 7 DAYS',count('leads7'),'Non-test sales opportunities'),row('OPEN OPPORTUNITIES',count('open'),'Non-test active sales pipeline')],errors.length?'partial':'ok'),
    page('CINCINNATI',[row('CITYWIDE COVERAGE','NOT CONNECTED','No verified census or city feed','warning')],'unavailable'),
    values.reviews ? page('RECENT REVIEWS', values.reviews.length?values.reviews.map(v=>row(v.restaurants?.name||'Restaurant',`${v.rating==null?'--':v.rating}/5 ${v.review_date||'Undated'}`,v.review_text||`${v.source} / no review text`)): [row('NO STORED REVIEWS','--')]) : missing('RECENT REVIEWS'),
    missing('INSPECTION ALERTS','Inspection feed not connected'),
    values.runs ? page('PIPELINE STATUS',values.runs.length?values.runs.map(v=>row(v.run_kind,v.status,v.started_at, v.status==='failed'?'warning':'neutral')):[row('NO RUN HISTORY','--')]) : missing('PIPELINE STATUS'),
    values.opportunities ? page('OPPORTUNITIES',values.opportunities.length?values.opportunities.map(v=>row(v.plan_key||'General',v.stage,v.updated_at)):[row('NO OPEN OPPORTUNITIES','0')]) : missing('OPPORTUNITIES'),
    r ? page('GROWTH METRICS',[row('RECORDED ACTIVE MRR',money(r.active_mrr_cents),'From retained_revenue_metrics'),row('RECORDED CHURN MRR',money(r.churned_mrr_cents),'Database view / not Stripe live'),row('PAYMENT FAILURES',r.payment_failures??'--'),row('REFUNDS',r.refunds??'--')]) : missing('GROWTH METRICS'),
    page('SYSTEM / v0.4',[])
  ];
  return {schema_version:1,generated_at:now.toISOString(),status:errors.length===Object.keys(requests).length?'unavailable':errors.length?'partial':'ok',pages};
}
