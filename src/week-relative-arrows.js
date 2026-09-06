const arrowSvg=`<svg class="relative-arrow-image" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="relArrowBlue" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9eaff"/><stop offset="1" stop-color="#8fbbea"/></linearGradient></defs><path d="M27 13c-2.3 0-4.2 1.9-4.2 4.2v9.2H12.5a5.5 5.5 0 0 0-3.9 9.4l19.5 19.1a5.5 5.5 0 0 0 7.8 0l19.5-19.1a5.5 5.5 0 0 0-3.9-9.4H41.2v-9.2A4.2 4.2 0 0 0 37 13H27Z" fill="url(#relArrowBlue)" stroke="#6c5145" stroke-width="4" stroke-linejoin="round"/><path d="M28 19c2-2 5-2.5 7-1" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/></svg>`;
const direction={
  'day-before-yesterday':'left-double',
  yesterday:'left',
  today:'up',
  tomorrow:'right',
  'day-after-tomorrow':'right-double'
};

function arrowMarkup(id){
  const dir=direction[id];
  if(dir==='left-double'||dir==='right-double')return `<span class="relative-arrow-pair ${dir}"><span class="relative-arrow-unit">${arrowSvg}</span><span class="relative-arrow-unit">${arrowSvg}</span></span>`;
  return `<span class="relative-arrow-single ${dir}">${arrowSvg}</span>`;
}

function conceptMarkup(id,label){
  const arrow=arrowMarkup(id);
  if(id==='tomorrow'||id==='day-after-tomorrow')return `<span>${label}</span>${arrow}`;
  return `${arrow}<span>${label}</span>`;
}

function addStyles(){
  if(document.getElementById('week-relative-arrow-styles'))return;
  const style=document.createElement('style');
  style.id='week-relative-arrow-styles';
  style.textContent=`
    .relative-arrow-single,.relative-arrow-pair{display:inline-flex;align-items:center;justify-content:center;height:17px;vertical-align:middle;flex:0 0 auto}
    .relative-arrow-image{width:17px;height:17px;display:block}
    .relative-arrow-single.left{transform:rotate(90deg)}
    .relative-arrow-single.right{transform:rotate(-90deg)}
    .relative-arrow-pair{gap:0;width:34px;flex-direction:row!important}
    .relative-arrow-pair .relative-arrow-unit{width:17px;height:17px;display:inline-flex;align-items:center;justify-content:center;overflow:visible;flex:0 0 17px}
    .relative-arrow-pair .relative-arrow-image{width:15px;height:15px;display:block}
    .relative-arrow-pair.left-double .relative-arrow-unit{transform:rotate(90deg)}
    .relative-arrow-pair.right-double .relative-arrow-unit{transform:rotate(-90deg)}
    .week-picker-relative.filled{gap:2px!important;flex-direction:row!important}
    .week-picker-relative .relative-arrow-single,.week-picker-relative .relative-arrow-pair{display:inline-flex;margin:0!important}
    .week-picker-simple.relative-concept-option{display:flex;align-items:center;justify-content:center;gap:3px;min-height:34px;padding-top:6px;padding-bottom:6px}
    .week-picker-simple.relative-concept-option .relative-arrow-single,.week-picker-simple.relative-concept-option .relative-arrow-pair{margin:0!important}
  `;
  document.head.appendChild(style);
}

function enhanceRelativeButtons(){
  addStyles();
  document.querySelectorAll('.week-picker-relative').forEach(button=>{
    const text=button.textContent.trim();
    const labels={Eergisteren:'day-before-yesterday',Gisteren:'yesterday',Vandaag:'today',Morgen:'tomorrow',Overmorgen:'day-after-tomorrow'};
    const label=Object.keys(labels).find(x=>text.includes(x));
    if(!label||button.dataset.prettyArrow==='1')return;
    button.dataset.prettyArrow='1';
    const id=labels[label];
    const remove=button.querySelector('.week-relative-remove');
    button.innerHTML=conceptMarkup(id,label);
    if(remove)button.appendChild(remove);
  });
  document.querySelectorAll('.week-picker-popover .week-picker-simple').forEach(button=>{
    const id=button.dataset.id;
    if(!direction[id]||button.dataset.prettyArrow==='1')return;
    const label=button.textContent.replace(/[←↑→]/g,'').trim();
    button.dataset.prettyArrow='1';
    button.classList.add('relative-concept-option');
    button.innerHTML=conceptMarkup(id,label);
  });
}

const observer=new MutationObserver(()=>queueMicrotask(enhanceRelativeButtons));
observer.observe(document.body,{childList:true,subtree:true});
enhanceRelativeButtons();
