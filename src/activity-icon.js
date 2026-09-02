import kringIcon from './activity-icons/kring.png';
import sinterklaasMijterIcon from './activity-icons/sinterklaas-mijter.png';
import buitenIcon from './activity-icons/buiten.png';
import speeltijdIcon from './activity-icons/speeltijd.png';
import wcIcon from './activity-icons/wc.png';
import middagIcon from './activity-icons/middag.png';
import fruitIcon from './activity-icons/fruit.png';
import wiskundeIcon from './activity-icons/wiskunde.png';
import bibIcon from './activity-icons/bib.png';
import verjaardagIcon from './activity-icons/verjaardag.png';
import bewegenIcon from './activity-icons/bewegen.png';
import turnenIcon from './activity-icons/turnen.png';
import zwemmenIcon from './activity-icons/zwemmen.png';
import yogaIcon from './activity-icons/yoga.png';
import sportdagIcon from './activity-icons/sportdag.png';
import hartjeIcon from './activity-icons/hartje.png';
import zorgIcon from './activity-icons/zorg.png';
import kleineGroepIcon from './activity-icons/kleine-groep.png';
import babbelrondeIcon from './activity-icons/babbelronde.png';
import gespreksmomentIcon from './activity-icons/gespreksmoment.png';
import soepIcon from './activity-icons/soep.png';
import taalIcon from './activity-icons/taal.png';
import lettersIcon from './activity-icons/letters.png';
import schrijvenIcon from './activity-icons/schrijven.png';
import stemIcon from './activity-icons/stem.png';
import verkeerIcon from './activity-icons/verkeer.png';
import fransIcon from './activity-icons/frans.png';
import lezenIcon from './activity-icons/lezen.png';
import knutselenIcon from './activity-icons/knutselen.png';
import muziekIcon from './activity-icons/muziek.png';
import opvoedendeSpelenIcon from './activity-icons/opvoedende-spelen.png';
import puzzelenIcon from './activity-icons/puzzelen.png';
import toneelIcon from './activity-icons/toneel.png';
import filmIcon from './activity-icons/film.png';
import voorlezenIcon from './activity-icons/voorlezen.png';
import kiesbakIcon from './activity-icons/kiesbak.png';
import busIcon from './activity-icons/bus.png';
import opStapIcon from './activity-icons/op-stap.png';
import specialeActiviteitIcon from './activity-icons/speciale-activiteit.png';
import moederdagIcon from './activity-icons/moederdag.png';
import vaderdagIcon from './activity-icons/vaderdag.png';
import feestIcon from './activity-icons/feest.png';
import kerstIcon from './activity-icons/kerst.png';
import pasenIcon from './activity-icons/pasen.png';
import hoekenwerkIcon from './activity-icons/hoekenwerk.png';
import rustIcon from './activity-icons/rust.png';
import winterIcon from './activity-icons/winter.png';
import herfstIcon from './activity-icons/herfst.png';
import lenteIcon from './activity-icons/lente.png';
import zomerIcon from './activity-icons/zomer.png';

const activityIconAssets={
  'asset:kring':kringIcon,
  'asset:sinterklaas-mijter':sinterklaasMijterIcon,
  'asset:buiten':buitenIcon,
  'asset:speeltijd':speeltijdIcon,
  'asset:wc':wcIcon,
  'asset:middag':middagIcon,
  'asset:fruit':fruitIcon,
  'asset:wiskunde':wiskundeIcon,
  'asset:bib':bibIcon,
  'asset:verjaardag':verjaardagIcon,
  '🧒⭕':kringIcon,
  '👑':sinterklaasMijterIcon,
};

const legacyActivityIcons={'🍽️╱🍱':'🍽️','🗄️📚':'📚'};
const activityIconsByLabel={
  Buiten:buitenIcon,
  Speeltijd:speeltijdIcon,
  WC:wcIcon,
  Middag:middagIcon,
  Fruit:fruitIcon,
  Wiskunde:wiskundeIcon,
  Bib:bibIcon,
  Verjaardag:verjaardagIcon,
  Bewegen:bewegenIcon,
  Turnen:turnenIcon,
  Zwemmen:zwemmenIcon,
  Yoga:yogaIcon,
  Sportdag:sportdagIcon,
  Hartje:hartjeIcon,
  Zorg:zorgIcon,
  'Kleine groep':kleineGroepIcon,
  Babbelronde:babbelrondeIcon,
  Gespreksmoment:gespreksmomentIcon,
  Soep:soepIcon,
  Taal:taalIcon,
  Letters:lettersIcon,
  Schrijven:schrijvenIcon,
  STEM:stemIcon,
  Verkeer:verkeerIcon,
  Frans:fransIcon,
  Lezen:lezenIcon,
  Knutselen:knutselenIcon,
  Muziek:muziekIcon,
  'Opvoedende spelen':opvoedendeSpelenIcon,
  Puzzelen:puzzelenIcon,
  Toneel:toneelIcon,
  Film:filmIcon,
  Voorlezen:voorlezenIcon,
  Kiesbak:kiesbakIcon,
  Bus:busIcon,
  'Op stap':opStapIcon,
  'Speciale act.':specialeActiviteitIcon,
  'Speciale activiteit':specialeActiviteitIcon,
  Moederdag:moederdagIcon,
  Vaderdag:vaderdagIcon,
  Feest:feestIcon,
  Kerst:kerstIcon,
  Kerstdag:kerstIcon,
  Pasen:pasenIcon,
  Hoekenwerk:hoekenwerkIcon,
  Rust:rustIcon,
  Winter:winterIcon,
  Herfst:herfstIcon,
  Lente:lenteIcon,
  Zomer:zomerIcon,
};

export function activityIconMarkup(icon,label=''){
  const source=activityIconsByLabel[label]||activityIconAssets[icon];
  return source?`<img class="activity-icon-image" src="${source}" alt="">`:(legacyActivityIcons[icon]||icon);
}
