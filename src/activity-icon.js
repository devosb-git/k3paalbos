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
};

export function activityIconMarkup(icon,label=''){
  const source=activityIconsByLabel[label]||activityIconAssets[icon];
  return source?`<img class="activity-icon-image" src="${source}" alt="">`:(legacyActivityIcons[icon]||icon);
}
