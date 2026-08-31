import { createClient } from '@supabase/supabase-js';
import puppet1 from './puppets/puppet-1.svg';
import puppet2 from './puppets/puppet-2.svg';
import './puppets.css';

const supabase=createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY);
let students=[],selections=[],loaded=false;
const app=()=>document.querySelector('#app');
const shuffle=a=>a.map(v=>({v,r:Math.random()})).sort((a,b)=>a.r-b.r).map(x=>x.v);
async function loadStudents(){const {data}=await supabase.from('class_students').select('id,name,active').eq('active',true).order('name');students=data||[];loaded=true}
function choose(){selections=students.length<2?students.map(s=>s.id):shuffle(students).slice(0,2).map(s=>s.id)}
function studentName(id){return students.find(s=>s.id===id)?.name||'Nog niemand gekozen'}
export async function showPuppets(navigate,profile){
 if(!loaded)await loadStudents();
 choose();
 const name=profile?.display_name||'Welkom';
 app().innerHTML=`<main class="page puppets-page"><section class="puppets-card"><div class="puppets-title"><h2>Wie mag er vandaag?</h2><p>Elke klaspop kiest een ander kindje.</p></div><div class="puppet-grid"><article class="puppet-card"><img src="${puppet1}" alt="Klaspop 1"><h3>${studentName(selections[0])}</h3></article><article class="puppet-card"><img src="${puppet2}" alt="Klaspop 2"><h3>${studentName(selections[1])}</h3></article></div>${students.length>=2?'<button class="puppet-roll" id="puppet-roll">🎲 Opnieuw kiezen</button>':`<p class="puppet-warning">Voeg minstens twee actieve kinderen toe bij Klastaken om te kunnen kiezen.</p>`}</section></main>`;
 document.querySelector('#puppet-roll')?.addEventListener('click',()=>showPuppets(navigate,profile));
}
