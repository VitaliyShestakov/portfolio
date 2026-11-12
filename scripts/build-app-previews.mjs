// Editable, presentation-only reconstructions of the published app interfaces.
// Run: node scripts/build-app-previews.mjs. Store originals remain in the gallery.
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const directory = fileURLToPath(new URL('../assets/apps/screens/', import.meta.url));
await mkdir(directory, {recursive: true});
const ink = '#202633', muted = '#8993a2', line = '#edf0f4';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const rect = (x,y,w,h,fill='#fff',r=18,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
const text = (x,y,value,size=15,color=ink,weight=400,extra='') => `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}" ${extra}>${escape(value)}</text>`;
const circle = (x,y,r,fill,extra='') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const path = (d,color=ink,width=2,extra='') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const rule = y => path(`M24 ${y}H390`,line,1);
const label = (x,y,value,fill='#eef5ff',color='#2689f2',w=90) => rect(x,y,w,24,fill,12)+text(x+w/2,y+16,value,10,color,500,'text-anchor="middle"');
const card = (x,y,w,h,fill='#fff') => rect(x,y,w,h,fill,18,`stroke="${line}" stroke-width="1"`);
const lines = (x,y,values,size=14,color=muted,gap=22,weight=400) => values.map((v,i)=>text(x,y+i*gap,v,size,color,weight)).join('');
const icons = {
  back:'M15 5L8 12L15 19', search:'M10 3a7 7 0 1 0 0 14a7 7 0 1 0 0-14M15 15l5 5',
  calendar:'M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2M7 2v5M17 2v5M3 10h18M7 14h2M14 14h2M7 17h2',
  home:'M3 11L12 3L21 11V21H15V15H9V21H3Z', person:'M12 3a4 4 0 1 0 0 8a4 4 0 1 0 0-8M4 21v-3c0-6 16-6 16 0v3',
  bell:'M5 16V10c0-8 14-8 14 0v6l2 2H3ZM9 21h6', clock:'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20M12 6v7l4 2',
  wallet:'M3 6h17v15H3ZM3 6V3H17V6M15 11h7v6h-7ZM18 14h1', arrow:'M5 12H19M13 6L19 12L13 18',
  plus:'M12 4V20M4 12H20', menu:'M4 6H20M4 12H20M4 18H20', check:'M4 12L9 17L20 6',
  grid:'M3 3H9V9H3ZM15 3H21V9H15ZM3 15H9V21H3ZM15 15H21V21H15Z',
  chart:'M4 20V12M10 20V7M16 20V3M22 20H2', pin:'M12 22S4 14 4 9a8 8 0 0 1 16 0c0 5-8 13-8 13ZM12 6a3 3 0 1 0 0 6a3 3 0 1 0 0-6',
  send:'M3 3L22 12L3 21L6 12ZM6 12H22', settings:'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M9 3H15L16 6L20 7L22 12L20 17L16 18L15 21H9L8 18L4 17L2 12L4 7L8 6Z',
};
const icon = (name,x,y,size=22,color=muted) => `<g transform="translate(${x} ${y}) scale(${size/24})">${path(icons[name]??icons.grid,color,1.8)}</g>`;
function status(color=ink) {
  return text(28,29,'9:41',14,color,600)+`<g fill="${color}"><rect x="320" y="22" width="3" height="6" rx="1"/><rect x="325" y="19" width="3" height="9" rx="1"/><rect x="330" y="16" width="3" height="12" rx="1"/></g>`+path('M344 19Q351 12 358 19M347 22Q351 18 355 22M351 26h.1',color,2.4)+rect(367,17,22,11,'none',3,`stroke="${color}" stroke-width="1.5"`)+rect(370,20,16,5,color,1)+rect(391,20,2,5,color,1);
}
function header(title,accent,back=false) {
  return text(back?52:24,87,title,26,ink,650)+icon(back?'back':'grid',back?19:365,65,24,accent)+(!back?rule(116):'');
}
function nav(items,active,accent) {
  const width=414/items.length;
  return rect(0,817,414,83,'#fff',0)+path('M0 817H414',line,1)+items.map(([symbol,label],i)=>icon(symbol,width*(i+.5)-11,834,22,i===active?accent:muted)+text(width*(i+.5),873,label,9,i===active?accent:muted,500,'text-anchor="middle"')).join('')+rect(151,888,112,4,ink,2);
}
const terraNav = active => nav([['home','Главная'],['calendar','Мои события'],['grid','Терра'],['person','Профиль']],active,'#2689f2');
const cryptoNav = active => nav([['wallet','Wallet'],['bell','Notifications'],['chart','Rewards'],['settings','Settings']],active,'#7954ff');
const beautyNav = active => nav([['calendar','Расписание'],['person','Клиенты'],['chart','Статистика'],['bell','Ассистент']],active,'#5278ff');
const otisNav = active => nav([['home','Главная'],['person','Контакты'],['settings','Настройки']],active,'#ff9416');
function svg(title,body,bg='#f7f8fa',lightStatus=false) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="414" height="900" viewBox="0 0 414 900" role="img" aria-labelledby="title"><title id="title">${escape(title)} — адаптированное превью</title><defs><linearGradient id="blue" x2="1" y2="1"><stop stop-color="#168dff"/><stop offset="1" stop-color="#0664ed"/></linearGradient><linearGradient id="violet" x2="1" y2="1"><stop stop-color="#f1edff"/><stop offset="1" stop-color="#e5e8ff"/></linearGradient><linearGradient id="silver" x2="1" y2="1"><stop stop-color="#a9adb4"/><stop offset=".5" stop-color="#646b76"/><stop offset="1" stop-color="#b1b4ba"/></linearGradient><linearGradient id="dark" x2="1" y2="1"><stop stop-color="#303a46"/><stop offset="1" stop-color="#151c27"/></linearGradient></defs><g font-family="Arial,Helvetica,sans-serif">${rect(0,0,414,900,bg,0)}${lightStatus?'':status()}${body}${lightStatus?status('#fff'):''}</g></svg>\n`;
}
const screens = [];
function add(name,title,body,bg,lightStatus) { screens.push([name,svg(title,body,bg,lightStatus)]); }

// Terra: a clean calendar and readable education catalog, with the original blue accent.
{
  let body=header('Моё расписание','#2689f2');
  body+=text(24,150,'Март 2026',14,muted,500)+icon('calendar',365,133,20,'#2689f2');
  ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].forEach((day,i)=>{
    const x=43+i*55;
    if(i===0)body+=rect(x-21,169,42,67,ink,21);
    body+=text(x,188,day,9,i===0?'#fff':muted,500,'text-anchor="middle"')+text(x,215,24+i,18,i===0?'#fff':ink,550,'text-anchor="middle"');
    if([0,2,4].includes(i))body+=circle(x,231,2.5,i===0?'#fff':'#2689f2');
  });
  body+=text(24,278,'24 марта',20,ink,650);
  const events=[['09:00','Мастермайнд','Якименко Ирина','Участник'],['12:00','Школа ассистентов','Наталья Яковлева','Ученик'],['16:30','Школа ассистентов','Наталья Яковлева','Волонтёр']];
  events.forEach(([time,title,host,role],i)=>{
    const y=300+i*159;
    body+=text(24,y+30,time,14,muted,550)+path(`M65 ${y+45}V${y+139}`,line,1)+circle(65,y+29,4,'#2689f2');
    body+=card(85,y,305,142)+label(100,y+15,'Мероприятие','#edf5ff','#2689f2',96)+label(203,y+15,'Офлайн','#f1f7ff','#2689f2',65)+text(100,y+65,title,16,ink,650)+text(100,y+87,host,12,muted)+icon('clock',100,y+107,15,muted)+text(122,y+119,'60 минут',11,muted)+text(373,y+119,role,10,ink,500,'text-anchor="end"');
  });
  add('terra-events','Terra Club · расписание',body+terraNav(1));
  body=header('Школы','#2689f2',true)+icon('search',366,66,23,ink);
  body+=label(24,119,'Направление','#fff',muted,132)+label(167,119,'Формат','#fff',muted,101);
  body+=rect(24,166,366,135,'url(#blue)',20)+text(44,196,'ОТКРЫТА РЕГИСТРАЦИЯ',9,'#cce7ff',600)+lines(44,231,['Запуск 32 Москва','От идеи к своему делу'],22,'#fff',30,650)+path('M305 195L345 185L364 245L324 256Z','#ffffff32',20)+circle(350,177,38,'#ffffff0b');
  body+=text(24,338,'Образовательные программы',19,ink,650);
  [['Школа управления','Для тех, кто хочет выстроить','процессы в своей компании.'],['Школа Wildberries','Практические знания для','развития бизнеса на маркетплейсе.']].forEach(([title,a,b],i)=>{
    const y=359+i*180;
    body+=rect(24,y,366,160,'url(#dark)',18)+label(42,y+17,'Школа','#ffffff18','#fff',68)+label(117,y+17,'Офлайн','#ffffff18','#fff',76)+text(42,y+76,title,21,'#fff',650)+lines(42,y+103,[a,b],13,'#bfc9d5',21)+circle(365,y+145,67,'#ffffff05');
  });
  body+=text(24,755,'Лучшие школы',20,ink,650)+text(390,755,'Все',14,'#2689f2',500,'text-anchor="end"');
  add('terra-schools','Terra Club · школы',body+terraNav(2));
}

// Citadel.one: the original pastel cards, violet token values and reward hierarchy.
{
  const purple='#7954ff';
  let body=header('Staking',purple,true)+icon('menu',365,66,23,purple);
  body+=card(24,128,366,173,'url(#violet)')+text(44,161,'beautifulmouse112',13,ink,600)+label(273,142,'One Seed','#e6dfff',purple,95)+text(44,213,'152 200 000',32,purple,650)+text(354,213,'XCT',17,muted,400,'text-anchor="end"')+text(44,243,'0.000019 BTC  ·  $ 3.19',13,muted)+rect(44,270,326,5,'#cbd2e2',3)+rect(44,270,228,5,'#ff6a39',3)+rect(272,270,66,5,purple,0);
  body+=card(24,322,366,191,'#f0ecff')+circle(61,363,18,'#e2d8ff')+icon('check',50,352,22,purple)+text(91,371,'Great job!',23,ink,650)+lines(44,410,['Your addresses are ready to receive','XCT tokens. Start earning rewards','with Citadel.one.'],14,'#6e72a3',23)+label(44,477,'2 unassigned addresses','#e2eaff','#5476ef',168);
  body+=card(24,532,366,117,'#eaf9ed')+text(44,568,'Earn more with XCT staking',18,ink,650)+text(44,594,'Put your assets to work.',13,'#698a78')+circle(350,591,18,'#12bd88')+icon('arrow',339,580,22,'#fff');
  body+=card(24,669,366,126,'#fff0f7')+text(44,704,'XCT Rewards',18,ink,650)+text(44,731,'Your additional staking rewards',12,'#ac899e')+text(44,775,'457 000.00 XCT',27,purple,650);
  add('citadel-staking','Citadel.one · staking',body+cryptoNav(2));
  body=header('Wallet',purple)+circle(369,77,17,'#eee8ff')+text(369,83,'C',17,purple,650,'text-anchor="middle"');
  body+=card(24,132,366,185,'url(#violet)')+text(44,167,'beautifulmouse112',13,ink,600)+text(44,216,'152 200 000',32,purple,650)+text(354,216,'SCRT',17,muted,400,'text-anchor="end"')+text(44,249,'0.000019 BTC  ·  $ 3.19',13,muted)+rect(44,281,326,5,'#cbd2e2',3)+rect(44,281,218,5,'#ff6a39',3)+rect(262,281,81,5,purple,0);
  body+=card(24,339,366,93,'#ecf5ff')+rect(43,359,48,48,purple,13)+text(67,391,'S',28,'#fff',600,'text-anchor="middle"')+text(108,371,'Current assets',12,'#8e9dc3')+text(108,400,'Secret',21,ink,650)+icon('arrow',345,375,23,purple);
  body+=text(24,476,'Token price',19,ink,650)+text(390,476,'More info',13,purple,500,'text-anchor="end"')+text(24,511,'$ 3.80',25,ink,650)+text(117,509,'+20.0%',13,'#14b98b',600)+path('M24 579L57 565L88 572L119 546L151 554L181 526L214 539L246 516L278 530L312 501L346 510L390 484',purple,3);
  body+=text(24,630,'Citadel apps',19,ink,650);
  [['Staking','#e7fff2','#15b78f','chart'],['Contacts','#eeeaff',purple,'person'],['Rewards','#fff0f7','#dc63a3','grid']].forEach(([name,bg,color,symbol],i)=>{const x=24+i*126;body+=rect(x,651,114,112,bg,18)+icon(symbol,x+43,673,28,color)+text(x+57,740,name,12,ink,600,'text-anchor="middle"');});
  add('citadel-wallet','Citadel.one · wallet',body+cryptoNav(0));
}

// Tayyab: the silver Neo card and the original yellow-accented sadaqah form.
{
  let body=header('Tayyab Neo','#333c49',true);
  body+=rect(24,135,366,221,'url(#silver)',23)+text(46,176,'tayyab',27,'#fff',650)+text(156,175,'neo',15,'#e0e4e9')+text(46,217,'Доступно',12,'#e8ebef')+text(46,255,'10 000 000.00 ₸',31,'#fff',600)+path('M294 156Q330 200 302 243Q278 281 341 332','#ffffff15',20)+text(46,325,'VISA',22,'#fff',700)+text(119,323,'3849',13,'#f2f3f4')+label(257,301,'+ Пополнить','#ffffffdd',ink,113);
  [['send','Перевести'],['wallet','Оплатить'],['chart','Конвертация'],['settings','Настройки']].forEach(([symbol,title],i)=>{const x=60+i*98;body+=circle(x,416,29,'#eef0f4')+icon(symbol,x-12,404,24,ink)+text(x,465,title,10,ink,500,'text-anchor="middle"');});
  body+=text(24,519,'Выписка',23,ink,650)+text(390,518,'Скачать',13,'#507fff',500,'text-anchor="end"')+text(24,550,'Сегодня, 4 марта',13,muted);
  [['Y','Yandex Taxi','Транспорт','−1 240.00 ₸','#ffdc23'],['D','Dropbox','Сервисы','−199.00 $','#e6efff'],['↗','Перевод','Пополнение','+50 000.00 ₸','#e7f6ed']].forEach(([symbol,title,sub,value,color],i)=>{const y=579+i*73;body+=circle(46,y+20,22,color)+text(46,y+27,symbol,19,ink,650,'text-anchor="middle"')+text(82,y+16,title,15,ink,550)+text(82,y+39,sub,12,muted)+text(390,y+18,value,15,i===2?'#20a56c':ink,600,'text-anchor="end"');if(i<2)body+=path(`M82 ${y+58}H390`,line,1);});
  add('tayyab-card','Tayyab · карта Neo',body+nav([['home','Главная'],['wallet','Карты'],['chart','История'],['person','Профиль']],1,ink));
  body=header('Размер садака','#333c49',true)+lines(24,139,['Процент с каждой покупки','для пожертвований'],15,muted,23);
  ['0.2%','0.5%','1%','2%'].forEach((value,i)=>{const y=196+i*79;body+=card(24,y,366,67)+circle(59,y+34,21,'#e4f4ff')+text(59,y+41,'%',22,'#198df2',550,'text-anchor="middle"')+text(99,y+41,value,20,ink,550)+(i===0?circle(358,y+34,10,'#ffda23')+icon('check',351,y+27,14,ink):circle(358,y+34,10,'none',`stroke="#dfe3e9" stroke-width="2"`));});
  body+=card(24,531,366,246)+text(44,566,'Попробуйте пример',21,ink,650)+text(44,602,'Сумма покупки',12,muted);
  ['1 000 ₸','2 000 ₸','3 000 ₸'].forEach((value,i)=>{const x=44+i*111;body+=rect(x,618,102,42,i===0?'#ffda23':'#f4f5f8',12)+text(x+51,644,value,14,ink,550,'text-anchor="middle"');});
  body+=text(44,698,'2 ₸',31,ink,650)+text(110,696,'пойдёт на садака',16,ink,550)+text(44,734,'Это 0.2% от суммы вашей покупки',12,muted);
  add('tayyab-sadaqah','Tayyab · садака',body+nav([['home','Главная'],['wallet','Карты'],['chart','История'],['person','Профиль']],0,ink));
}

// Beauty Agent: aligned native calendar/assistant views, with no promotional overlays.
{
  let body=header('Расписание','#5278ff')+text(24,149,'Сентябрь 2026',16,ink,600)+icon('calendar',368,131,20,'#5278ff');
  ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'].forEach((day,i)=>{const x=42+i*55;body+=text(x,181,day,9,muted,500,'text-anchor="middle"')+circle(x,211,20,i===1?'#5278ff':'#fff',i===1?'':`stroke="${line}" stroke-width="3"`)+text(x,217,8+i,16,i===1?'#fff':ink,550,'text-anchor="middle"');});
  body+=text(24,264,'Время для записи',13,muted)+text(390,264,'Настроить',12,'#5278ff',500,'text-anchor="end"');
  ['12:00','14:00','17:00','18:45'].forEach((v,i)=>{body+=rect(24+i*94,281,84,35,i===3?'#eef2ff':'#fff',10)+text(66+i*94,304,v,13,i===3?'#5278ff':muted,500,'text-anchor="middle"');});
  [['11:00 — 12:30','Аппаратный маникюр','Завершён · 1 200 ₽','Ксения А.','#23b668'],['12:30 — 13:30','Маникюр и педикюр','Подтверждён · 2 500 ₽','Ольга М.','#5278ff'],['16:00 — 19:30','Посещение врача','Перерыв','Личное','#9b5cff'],['20:00 — 20:30','Классический маникюр','Ожидает подтверждения','Ксения А.','#ff9946']].forEach(([time,title,state,client,color],i)=>{const y=339+i*115;body+=card(24,y,366,100)+rect(25,y+15,4,70,color,2)+text(43,y+28,time,14,ink,650)+text(43,y+53,title,16,ink,550)+text(43,y+80,state,12,color,500)+text(372,y+80,client,11,muted,400,'text-anchor="end"');});
  add('beauty-calendar','Beauty Agent · расписание',body+beautyNav(0));
  body=header('Ассистент','#5278ff');
  body+=rect(24,136,366,43,'#eaedf3',12)+rect(28,140,116,35,'#fff',9)+text(86,163,'Клиентам',13,ink,600,'text-anchor="middle"')+text(207,163,'Система',13,muted,500,'text-anchor="middle"')+text(329,163,'Заявки',13,muted,500,'text-anchor="middle"')+text(24,222,'Сегодня',18,ink,650);
  [['М','Марии','28 мая в 16:30','28 мая, 12:20','#f4e7ee'],['О','Ольге','28 мая в 12:00','28 мая, 12:20','#e7eefb'],['К','Ксении','22 мая в 16:30','23 мая, 12:20','#ffeddf']].forEach(([initial,name,date,time,bg],i)=>{const y=245+i*172;body+=card(24,y,366,151)+circle(61,y+40,20,bg)+text(61,y+47,initial,18,'#937a8a',550,'text-anchor="middle"')+circle(366,y+31,3.5,'#5278ff')+text(97,y+35,'Напомните клиенту',14,ink,500)+text(97,y+60,name,17,ink,650)+text(97,y+83,'о записи '+date,12,ink)+text(97,y+120,time,11,muted);});
  add('beauty-assistant','Beauty Agent · ассистент',body+beautyNav(3));
}

// OTIS: public security app screens; these do not depict the internal response app.
{
  const navy='#28394f',orange='#ff9416';
  let body=rect(0,0,414,209,navy,0)+circle(42,82,13,orange)+path('M38 73q16 9 0 18M33 77q8 5 0 10',navy,2.8)+text(67,91,'ОТИС',29,'#fff',750)+icon('bell',364,68,24,'#fff')+circle(384,70,4,'#ff655e')+text(24,156,'Главная',26,'#fff',650)+text(24,187,'Ваша безопасность под контролем',12,'#b7c5d7');
  body+=text(24,247,'Мои объекты',20,ink,650)+text(390,247,'Все объекты',12,'#7b8b9e',500,'text-anchor="end"')+card(24,266,366,132)+icon('home',43,289,34,orange)+label(246,283,'Под охраной','#e4f6e9','#3da568',126)+text(43,345,'БЦ Altstadt',20,ink,650)+text(43,372,'ул. Карасай батыра, 120',13,muted)+icon('arrow',350,348,23,muted);
  [['person','Стать клиентом'],['grid','Заявки'],['pin','Карта'],['wallet','Тарифы']].forEach(([symbol,title],i)=>{const x=61+i*97;body+=circle(x,460,30,navy)+icon(symbol,x-13,447,26,orange)+text(x,511,title,10,ink,500,'text-anchor="middle"');});
  body+=text(24,560,'Новости',22,ink,650);
  [['Приложение','OTIS Security'],['Надёжная охрана','каждый день']].forEach(([a,b],i)=>{const x=24+i*191;body+=rect(x,580,175,135,i===0?navy:'#3e536c',17)+path(`M${x+113} 585L${x+159} 622L${x+124} 668L${x+164} 706`,'#ffffff12',20)+text(x+16,666,a,14,'#fff',600)+text(x+16,689,b,14,'#fff',600);});
  body+=card(24,735,366,56)+text(42,770,'Руководство пользователя',14,ink,500)+icon('arrow',352,752,20,muted);
  add('otis-home','OTIS Security · главная',body+otisNav(0),'#f7f8fa',true);
  body=rect(0,0,414,120,navy,0)+text(53,86,'Мои объекты',25,'#fff',600)+icon('back',19,64,24,'#fff');
  [['БЦ Altstadt','ул. Карасай батыра, 120','Объект № 9999'],['БЦ Altstadt','ул. Карасай батыра, 120','Объект № 9999'],['БЦ Altstadt','ул. Карасай батыра, 120','Объект № 9999']].forEach(([name,address,id],i)=>{const y=145+i*177;body+=card(24,y,366,155)+icon('home',43,y+22,33,orange)+label(246,y+17,'Под охраной','#e4f6e9','#3da568',126)+text(43,y+85,name,20,ink,650)+text(43,y+111,address,13,muted)+text(43,y+134,id,11,muted)+icon('arrow',349,y+108,24,muted);});
  body+=rect(24,706,366,64,navy,18)+icon('pin',49,726,24,orange)+text(88,746,'Показать на карте',16,'#fff',600)+icon('arrow',348,727,23,'#fff');
  add('otis-objects','OTIS Security · объекты',body+otisNav(0),'#f7f8fa',true);
}

for (const [name,content] of screens) await writeFile(`${directory}${name}.svg`,content);
console.log(`Built ${screens.length} editable app previews at 414 × 900.`);
