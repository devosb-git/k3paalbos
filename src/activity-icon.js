import kringIcon from './activity-icons/kring.png';
import sinterklaasMijterIcon from './activity-icons/sinterklaas-mijter.png';

const activityIconAssets={
  'asset:kring':kringIcon,
  'asset:sinterklaas-mijter':sinterklaasMijterIcon,
  '🧒⭕':kringIcon,
  '👑':sinterklaasMijterIcon,
};

const legacyActivityIcons={'🍽️╱🍱':'🍽️','🗄️📚':'📚'};

export function activityIconMarkup(icon){
  const source=activityIconAssets[icon];
  return source?`<img class="activity-icon-image" src="${source}" alt="">`:(legacyActivityIcons[icon]||icon);
}
