import { useState, useRef, useMemo } from "react";

// ═══ QUESTIONS ═══
const Q_DATA=[
{id:"group",q:"Tu voyages avec qui?",options:[
{l:"Solo",i:"🧑",v:"solo"},{l:"En couple",i:"💑",v:"couple"},{l:"Famille (jeunes enfants)",i:"👶",v:"famille-jeune"},
{l:"Famille (ados+)",i:"👨‍👩‍👧‍👦",v:"famille-ado"},{l:"Entre amis",i:"👯",v:"amis"},{l:"Groupe",i:"🚌",v:"groupe"}]},
{id:"groupSize",q:"Vous êtes combien?",options:[
{l:"Juste moi",i:"1️⃣",v:"1"},{l:"2",i:"2️⃣",v:"2"},{l:"3-4",i:"3️⃣",v:"3-4"},{l:"5-6",i:"5️⃣",v:"5-6"},{l:"7+",i:"🎉",v:"7+"}]},
{id:"vibe",q:"T'es plus quel vibe?",options:[
{l:"100% nature",i:"🌲",v:"nature"},{l:"Ville & culture",i:"🏙️",v:"ville"},{l:"Mix des deux",i:"⚡",v:"mix"},
{l:"Zen & bien-être",i:"🧘",v:"zen"},{l:"Road trip",i:"🛣️",v:"roadtrip"}]},
{id:"energy",q:"Ton niveau d'énergie?",options:[
{l:"Aventure extrême",i:"🧗",v:"extreme"},{l:"Actif le jour, relax le soir",i:"🚴",v:"actif"},
{l:"Tranquille",i:"😌",v:"relax"},{l:"Repos & spa",i:"♨️",v:"repos"}]},
{id:"pace",q:"Combien d'activités par jour?",options:[
{l:"Le maximum!",i:"🚀",v:"intense"},{l:"2-3, bien dosé",i:"⚖️",v:"modere"},
{l:"1 truc, chill",i:"🐢",v:"lent"},{l:"On improvise",i:"🎲",v:"impro"}]},
{id:"interests",q:"Qu'est-ce qui t'attire?",multi:true,options:[
{l:"Musées & histoire",i:"🏛️",v:"musees"},{l:"Gastronomie",i:"🍽️",v:"gastro"},{l:"Festivals",i:"🎵",v:"festivals"},
{l:"Art & galeries",i:"🎨",v:"art"},{l:"Sports & sensations",i:"🎢",v:"sports"},{l:"Photo",i:"📸",v:"photo"},
{l:"Faune",i:"🐋",v:"faune"},{l:"Marchés locaux",i:"🧶",v:"artisanat"}]},
{id:"budget",q:"Budget/personne pour la semaine?",sub:"(sans transport aller-retour)",options:[
{l:"Économe — -500$",i:"💵",v:"econome"},{l:"Confortable — 500-1000$",i:"💰",v:"confortable"},
{l:"On se gâte — 1000-2000$",i:"💎",v:"luxe"},{l:"Pas de limite!",i:"👑",v:"premium"}]},
{id:"season",q:"Tu pars quand?",options:[
{l:"Été (juin-août)",i:"☀️",v:"ete"},{l:"Automne (sept-oct)",i:"🍂",v:"automne"},
{l:"Hiver (déc-mars)",i:"❄️",v:"hiver"},{l:"Printemps (avr-mai)",i:"🌸",v:"printemps"},{l:"Flexible",i:"🤷",v:"flexible"}]},
{id:"transport",q:"Transport?",options:[
{l:"Auto",i:"🚗",v:"auto"},{l:"Van / VR",i:"🚐",v:"van"},{l:"Base fixe",i:"🏨",v:"fixe"},
{l:"Transport en commun",i:"🚌",v:"commun"},{l:"Vélo",i:"🚲",v:"velo"}]},
{id:"landscape",q:"Tu veux voir quoi?",multi:true,options:[
{l:"Océan & fleuve",i:"🌊",v:"mer"},{l:"Montagnes",i:"⛰️",v:"montagne"},{l:"Lacs",i:"🏞️",v:"lacs"},
{l:"Forêts",i:"🌲",v:"forets"},{l:"Villages",i:"🏘️",v:"villages"},{l:"Fjords",i:"🗻",v:"fjords"}]},
{id:"activities",q:"Quelles activités?",multi:true,options:[
{l:"Randonnée",i:"🥾",v:"rando"},{l:"Kayak",i:"🛶",v:"kayak"},{l:"Vélo",i:"🚲",v:"velo"},
{l:"Baleines",i:"🐳",v:"baleines"},{l:"Ski",i:"⛷️",v:"ski"},{l:"Baignade",i:"🏖️",v:"baignade"},
{l:"Escalade",i:"🧗",v:"escalade"},{l:"Spa",i:"♨️",v:"spa"},{l:"Pêche",i:"🎣",v:"peche"},{l:"Motoneige",i:"🏎️",v:"motorise"}]},
{id:"food",q:"Côté bouffe?",options:[
{l:"Restos locaux",i:"🥘",v:"local"},{l:"Gastronomique",i:"🥂",v:"fine"},{l:"Street food",i:"🍟",v:"street"},
{l:"Je cuisine",i:"🏕️",v:"cuisine"},{l:"Microbrasseries",i:"🍺",v:"boire"},{l:"Végé",i:"🥗",v:"vege"}]},
{id:"accommodation",q:"Tu dors où?",options:[
{l:"Hôtel",i:"🏨",v:"hotel"},{l:"Airbnb/chalet",i:"🏠",v:"airbnb"},{l:"Camping/glamping",i:"⛺",v:"camping"},
{l:"Auberge",i:"🛏️",v:"auberge"},{l:"Insolite",i:"🪵",v:"insolite"},{l:"Resort",i:"🏖️",v:"resort"}]},
{id:"knowledge",q:"Tu connais le Québec?",options:[
{l:"Première visite!",i:"🆕",v:"nouveau"},{l:"Les classiques",i:"👍",v:"classique"},
{l:"Je veux du nouveau",i:"🗿",v:"expert"},{l:"Je suis Québécois",i:"⚜️",v:"local"}]},
{id:"priorities",q:"Le plus important?",multi:true,sub:"Choisis jusqu'à 3",options:[
{l:"Photos",i:"📷",v:"photos"},{l:"Souvenirs famille",i:"❤️",v:"souvenirs"},{l:"Culture",i:"📚",v:"culture"},
{l:"Me dépasser",i:"💪",v:"defi"},{l:"Déconnecter",i:"🧘",v:"deconnexion"},{l:"Manger++",i:"👨‍🍳",v:"gastro"}]},
{id:"special",q:"Un dernier souhait?",options:[
{l:"Coucher de soleil magique",i:"🌅",v:"sunset"},{l:"Expérience autochtone",i:"🪶",v:"autochtone"},
{l:"Spot secret",i:"🔮",v:"secret"},{l:"Activité folle",i:"🤪",v:"folle"},{l:"Surprenez-moi!",i:"🎁",v:"surprise"}]}
];

const REGIONS=[
{name:"Charlevoix",icon:"⛰️",desc:"Montagne, fleuve, terroir",tags:["nature","mix","montagne","gastro","photo","forets","villages","rando","couple","luxe","automne","sunset"]},
{name:"Gaspésie",icon:"🌊",desc:"Percé, mer, road trip",tags:["nature","roadtrip","mer","photo","rando","fjords","faune","auto","van","extreme","actif","defi"]},
{name:"Saguenay–Lac-St-Jean",icon:"🐋",desc:"Fjord, baleines",tags:["nature","fjords","faune","baleines","kayak","rando","photo","extreme","actif","deconnexion"]},
{name:"Québec City",icon:"🏰",desc:"Patrimoine, charme",tags:["ville","mix","culture","musees","gastro","fine","villages","nouveau","couple","famille-jeune","photos"]},
{name:"Montréal",icon:"🏙️",desc:"Culture, gastro, nightlife",tags:["ville","festivals","art","gastro","boire","street","amis","culture","nouveau"]},
{name:"Laurentides",icon:"🌲",desc:"Lacs, ski, nature",tags:["nature","mix","lacs","ski","velo","spa","forets","famille-ado","amis","rando","hiver"]},
{name:"Cantons-de-l'Est",icon:"🍷",desc:"Vignobles, spas",tags:["mix","zen","gastro","boire","fine","villages","spa","couple","relax","automne","repos"]},
{name:"Îles-de-la-Madeleine",icon:"🏖️",desc:"Plages, dépaysement",tags:["mer","baignade","photo","deconnexion","secret","gastro","local","couple","ete","kayak"]},
{name:"Bas-Saint-Laurent",icon:"🦌",desc:"Couchers de soleil, quiétude",tags:["nature","mer","villages","sunset","photo","relax","velo","deconnexion","secret","lent"]},
{name:"Côte-Nord",icon:"🐺",desc:"Sauvage, phares, baleines",tags:["nature","extreme","faune","baleines","mer","photo","roadtrip","secret","defi","van"]},
{name:"Mauricie",icon:"🏕️",desc:"Forêts, canot",tags:["nature","forets","lacs","kayak","camping","peche","rando","famille-ado","deconnexion"]},
{name:"Outaouais",icon:"🛶",desc:"Parcs, musées",tags:["mix","musees","culture","lacs","rando","velo","famille-jeune","nouveau"]}
];

const ACCS={"Charlevoix":{
econome:[{name:"HI Charlevoix",type:"Auberge de jeunesse",cost:35,g:"4.2★"},{name:"Camping du Gouffre",type:"Camping",cost:30,g:"4.0★"},{name:"Motel Charlevoix",type:"Motel",cost:65,g:"3.8★"}],
confortable:[{name:"Auberge La Muse",type:"Auberge",cost:130,g:"4.5★"},{name:"Le Germain Charlevoix",type:"Boutique",cost:180,g:"4.6★"},{name:"Le Genévrier",type:"Éco-lodge",cost:110,g:"4.4★"}],
luxe:[{name:"Fairmont Manoir Richelieu",type:"5★ historique",cost:280,g:"4.7★"},{name:"Le Germain Suite",type:"Suite spa",cost:250,g:"4.6★"},{name:"Chalet privé luxe",type:"Chalet",cost:300,g:"4.8★"}],
premium:[{name:"Fairmont Suite Gold",type:"Prestige",cost:450,g:"4.7★"},{name:"Chalet bord du fleuve",type:"Exclusif",cost:500,g:"4.9★"}]
}};

const HIKES=[
{n:"Mont-du-Lac-des-Cygnes",r:"Charlevoix",d:"Intermédiaire",km:"5.6 km",el:"480m",t:"3-4h",s:4.7,desc:"Vue 360° fleuve et Charlevoix",cost:9},
{n:"L'Acropole des Draveurs",r:"Saguenay",d:"Difficile",km:"10.4 km",el:"800m",t:"5-7h",s:4.9,desc:"Rando #1 au Québec, vue fjord",cost:9},
{n:"Mont Albert",r:"Gaspésie",d:"Difficile",km:"17 km",el:"870m",t:"7-9h",s:4.8,desc:"Plateau lunaire au-dessus des nuages",cost:9},
{n:"Mont Jacques-Cartier",r:"Gaspésie",d:"Difficile",km:"8.4 km",el:"625m",t:"4-6h",s:4.9,desc:"Plus haut sommet du sud, caribous",cost:9},
{n:"La Chouenne",r:"Charlevoix",d:"Facile",km:"4.4 km",el:"300m",t:"2h",s:4.4,desc:"Vue spectaculaire, peu d'effort",cost:9},
{n:"Sentier des Caps",r:"Charlevoix",d:"Intermédiaire",km:"12 km",el:"500m",t:"5-6h",s:4.6,desc:"Le long du fleuve",cost:6},
{n:"Mont Tremblant",r:"Laurentides",d:"Intermédiaire",km:"7.4 km",el:"440m",t:"3-5h",s:4.5,desc:"Classique des Laurentides",cost:12},
{n:"Mont Pinacle",r:"Cantons-de-l'Est",d:"Facile",km:"3.6 km",el:"230m",t:"1.5-2h",s:4.3,desc:"Familial, belle vue",cost:0},
{n:"Parc du Bic",r:"Bas-Saint-Laurent",d:"Facile",km:"5-12 km",el:"200m",t:"2-5h",s:4.7,desc:"Côtier, phoques, couchers de soleil",cost:9},
{n:"Sentier du Fjord",r:"Saguenay",d:"Expert",km:"42 km",el:"1200m+",t:"3-4 jours",s:4.8,desc:"Trek ultime, camping sauvage",cost:27},
{n:"Les Loups",r:"Mauricie",d:"Intermédiaire",km:"11 km",el:"350m",t:"4-5h",s:4.5,desc:"Forêt boréale, lacs",cost:9},
{n:"Mont Xalibu",r:"Gaspésie",d:"Difficile",km:"11 km",el:"650m",t:"5-7h",s:4.7,desc:"Toundra alpine, 360°",cost:9},
{n:"Vallée Bras-du-Nord",r:"Québec City",d:"Intermédiaire",km:"8-20 km",el:"400m",t:"4-8h",s:4.6,desc:"Canyon, cascades, via ferrata",cost:12},
{n:"Mont Gosford",r:"Cantons-de-l'Est",d:"Intermédiaire",km:"8 km",el:"490m",t:"3-4h",s:4.4,desc:"1193m, vue sur 3 pays",cost:5},
{n:"Mont Ham",r:"Cantons-de-l'Est",d:"Facile",km:"4 km",el:"280m",t:"2h",s:4.2,desc:"Familial + via ferrata",cost:8},
];

const DC={"Facile":"#059669","Intermédiaire":"#F5A623","Difficile":"#E84855","Expert":"#7C3AED"};
const DCOL=["#2E7DDB","#0E9AA7","#F5A623","#E84855","#7C3AED","#059669","#DB2777"];
const SWAP_R=[{l:"Trop cher",i:"💸",v:"trop_cher"},{l:"Pas mon genre",i:"🙅",v:"pas_genre"},{l:"Déjà fait",i:"✅",v:"deja_fait"},{l:"Pas accessible",i:"♿",v:"access"},{l:"Plus intense",i:"🔥",v:"intense"},{l:"Plus calme",i:"🌿",v:"calme"}];

function gen(region,ans,gs,acc){
const b=ans.budget||"confortable";
const cm=b==="econome"?.6:b==="confortable"?1:b==="luxe"?1.5:2;
const ac=acc?.cost||Math.round(100*cm);
const hk=HIKES.filter(h=>h.r.includes(region.split("–")[0])||h.r.includes(region.split(" ")[0]));
const DB={"Charlevoix":[
{t:"Arrivée & Baie-Saint-Paul",m:{activity:"Visite du centre de Baie-Saint-Paul",location:"Rue Saint-Jean-Baptiste",tip:"Galeries d'art gratuites",cost:0,duration:"2h"},a:{activity:"Randonnée La Chouenne",location:"Parc des Grands-Jardins",tip:"Vue spectaculaire",cost:9,duration:"2.5h"},e:{activity:"Coucher de soleil au quai",location:"Quai de Baie-Saint-Paul",tip:"Apportez du vin local",cost:0,duration:"1.5h"},bk:{name:"Café des Artistes",type:"Café bistro",cost:Math.round(14*cm),g:"4.4★",mt:"Crêpes aux bleuets"},lu:{name:"Le Diapason",type:"Bistro terroir",cost:Math.round(22*cm),g:"4.5★",mt:"Burger de cerf"},di:{name:"Le Mouton Noir",type:"Gastronomie",cost:Math.round(55*cm),g:"4.7★",mt:"Cerf de Boileau"}},
{t:"Grands-Jardins & taïga",m:{activity:"Randonnée Mont-du-Lac-des-Cygnes",location:"Parc des Grands-Jardins",tip:"Arrivez avant 8h",cost:9,duration:"4h"},a:{activity:"Laiterie Charlevoix",location:"Baie-Saint-Paul",tip:"Goûtez le 1608",cost:12,duration:"1.5h"},e:{activity:"Microbrasserie Charlevoix",location:"Baie-Saint-Paul",tip:"Dominus Vobiscum Double",cost:25,duration:"2h"},bk:{name:"Pains d'exclamation!",type:"Boulangerie",cost:Math.round(12*cm),g:"4.6★",mt:"Croissant au beurre"},lu:{name:"Pique-nique au sommet",type:"Lunch pack",cost:Math.round(10*cm),g:"—",mt:"Préparez la veille"},di:{name:"Le Saint-Pub",type:"Pub & terroir",cost:Math.round(35*cm),g:"4.3★",mt:"Poutine au canard"}},
{t:"Hautes-Gorges & aventure",m:{activity:"Via Ferrata",location:"Parc des Hautes-Gorges",tip:"Réservation obligatoire",cost:45,duration:"3h"},a:{activity:"Croisière sur la Malbaie",location:"Hautes-Gorges",tip:"Falaises spectaculaires",cost:30,duration:"2h"},e:{activity:"Spa & bains nordiques",location:"Le Germain Spa",tip:"Forfait coucher de soleil",cost:Math.round(60*cm),duration:"2.5h"},bk:{name:"Buffet de l'hôtel",type:"Inclus",cost:0,g:"—",mt:"Inclus hébergement"},lu:{name:"Casse-croûte du parc",type:"Cantine",cost:Math.round(15*cm),g:"3.8★",mt:"Hot-dog steamé"},di:{name:"Chez Truchon",type:"Fine cuisine",cost:Math.round(60*cm),g:"4.6★",mt:"Tartare de wapiti"}},
{t:"Train & Île-aux-Coudres",m:{activity:"Train de Charlevoix",location:"Gare de Baie-Saint-Paul",tip:"Côté fleuve = photos",cost:55,duration:"3h"},a:{activity:"Île-aux-Coudres à vélo",location:"Île-aux-Coudres",tip:"Traversier gratuit!",cost:20,duration:"3h"},e:{activity:"Souper fruits de mer",location:"Île-aux-Coudres",tip:"Homard du jour",cost:0,duration:"2h"},bk:{name:"La Boulange du Fleuve",type:"Boulangerie",cost:Math.round(13*cm),g:"4.3★",mt:"Pain aux noix"},lu:{name:"Resto du quai",type:"Fruits de mer",cost:Math.round(20*cm),g:"4.1★",mt:"Guédille homard"},di:{name:"La Mer Veille",type:"Fruits de mer",cost:Math.round(45*cm),g:"4.5★",mt:"Plateau royal"}},
{t:"Route du Fleuve & La Malbaie",m:{activity:"Route du Fleuve",location:"Petite-Rivière → La Malbaie",tip:"Chaque belvédère vaut l'arrêt",cost:0,duration:"3h"},a:{activity:"Casino & jardins",location:"La Malbaie",tip:"Jardins gratuits",cost:Math.round(30*cm),duration:"2.5h"},e:{activity:"Concert Domaine Forget",location:"Saint-Irénée",tip:"Musique + vue sur fleuve",cost:Math.round(35*cm),duration:"2h"},bk:{name:"Café Chez-Nous",type:"Café",cost:Math.round(12*cm),g:"4.2★",mt:"Oeufs bénédictine"},lu:{name:"Le Patriarche",type:"Bistro",cost:Math.round(25*cm),g:"4.4★",mt:"Joue de bœuf"},di:{name:"Les Labours (Fairmont)",type:"Gastro",cost:Math.round(75*cm),g:"4.7★",mt:"Menu 7 services"}},
{t:"Sentier des Caps & art",m:{activity:"Sentier des Caps — panoramique",location:"Saint-Tite-des-Caps",tip:"Section Cap Tourmente",cost:6,duration:"4h"},a:{activity:"Atelier peinture plein-air",location:"Baie-Saint-Paul",tip:"Réservez chez Artistes en résidence",cost:35,duration:"2h"},e:{activity:"Feu de camp au fleuve",location:"Camping du Gouffre",tip:"Bois fourni",cost:0,duration:"2h"},bk:{name:"Pains d'exclamation!",type:"Boulangerie",cost:Math.round(12*cm),g:"4.6★",mt:"Chocolatine"},lu:{name:"Pique-nique sentier",type:"Préparé",cost:Math.round(10*cm),g:"—",mt:"Fromages Charlevoix"},di:{name:"Les Faux Bergers",type:"Fromages",cost:Math.round(40*cm),g:"4.5★",mt:"Raclette québécoise"}},
{t:"Saveurs & souvenirs",m:{activity:"Marché de Baie-Saint-Paul",location:"Centre-ville",tip:"Samedi matin = le meilleur",cost:20,duration:"2h"},a:{activity:"Route des Saveurs",location:"Plusieurs arrêts",tip:"Chocolaterie, cidrerie, fromagerie",cost:Math.round(25*cm),duration:"3h"},e:{activity:"Table du chef — dernier souper",location:"Baie-Saint-Paul",tip:"Menu dégustation",cost:0,duration:"2.5h"},bk:{name:"Le Café du Clocher",type:"Café",cost:Math.round(14*cm),g:"4.3★",mt:"Gaufres maison"},lu:{name:"Maison Maurice Dufour",type:"Fromagerie",cost:Math.round(18*cm),g:"4.7★",mt:"Migneron + pain"},di:{name:"Chez Boulay — bistro boréal",type:"Boréal",cost:Math.round(65*cm),g:"4.6★",mt:"Menu boréal"}}
]};
const fb=(n)=>({t:`Jour ${n} — Exploration de ${region}`,m:{activity:"Exploration matinale",location:region,tip:"Partez tôt",cost:Math.round(15*cm),duration:"3h"},a:{activity:"Activité phare",location:region,tip:"Vérifiez la météo",cost:Math.round(30*cm),duration:"3h"},e:{activity:"Coucher de soleil & détente",location:region,tip:"Réservez en haute saison",cost:0,duration:"2h"},bk:{name:"Café local",type:"Café",cost:Math.round(12*cm),g:"4.0★",mt:"Déjeuner classique"},lu:{name:"Resto du terroir",type:"Terroir",cost:Math.round(20*cm),g:"4.2★",mt:"Spécialité régionale"},di:{name:"Restaurant recommandé",type:"Locale",cost:Math.round(40*cm),g:"4.3★",mt:"Plat du jour"}});
const raw=DB[region]||Array.from({length:7},(_,i)=>fb(i+1));
const days=raw.map((d,i)=>{
const tot=(d.m?.cost||0)+(d.a?.cost||0)+(d.e?.cost||0)+(d.bk?.cost||0)+(d.lu?.cost||0)+(d.di?.cost||0)+ac;
return{day:i+1,title:d.t,morning:d.m,afternoon:d.a,evening:d.e,breakfast:d.bk,lunch:d.lu,dinner:d.di,daily_cost_per_person:tot,accommodation:acc||{name:"Hébergement",type:"—",cost:ac},dayOff:false};
});
return{title:`7 jours magiques en ${region}`,subtitle:REGIONS.find(r=>r.name===region)?.desc||"",
region_tips:"Prévoyez des vêtements en couches. Réservez à l'avance en haute saison.",
days,total_cost_per_person:days.reduce((s,d)=>s+d.daily_cost_per_person,0),hikes:hk,
packing_list:["Chaussures de rando","Couches de vêtements","Crème solaire","Anti-moustiques","Gourde","Appareil photo","Jumelles"]};
}

function scoreR(ans){const tags=[];Object.values(ans).forEach(v=>{if(Array.isArray(v))tags.push(...v);else tags.push(v)});
return REGIONS.map(r=>{const m=r.tags.filter(t=>tags.includes(t)).length;return{...r,score:Math.min(98,Math.round((m/Math.max(r.tags.length,1))*100)+Math.round(Math.random()*4))};}).sort((a,b)=>b.score-a.score);}

// ═══ COMPONENT ═══
export default function QuebecPlanner({ onClose }){
const[step,setStep]=useState("quiz");
const[qIdx,setQIdx]=useState(0);
const[ans,setAns]=useState({});
const[mSel,setMSel]=useState([]);
const[region,setRegion]=useState(null);
const[acc,setAcc]=useState(null);
const[itin,setItin]=useState(null);
const[aDir,setADir]=useState("in");
const[exDay,setExDay]=useState(0);
const[swap,setSwap]=useState(null);
const[showH,setShowH]=useState(false);
const[fb,setFb]=useState({});
const[gs,setGs]=useState(1);
const[notes,setNotes]=useState({});
const[showJ,setShowJ]=useState(false);
const sr=useRef(null);

const CQ=Q_DATA[qIdx];
const prog=((qIdx+1)/Q_DATA.length)*100;
const ranked=useMemo(()=>scoreR(ans),[ans]);
const budget=ans.budget||"confortable";
const accList=ACCS[region]?.[budget]||ACCS[region]?.confortable||[];

const doSingle=(v)=>{setAns(p=>({...p,[CQ.id]:v}));if(CQ.id==="groupSize"){setGs(v==="1"?1:v==="2"?2:v==="3-4"?4:v==="5-6"?6:8)}setADir("out");setTimeout(()=>{if(qIdx<Q_DATA.length-1){setQIdx(i=>i+1);setMSel([]);setADir("in")}else setStep("ranking")},250)};
const togM=(v)=>setMSel(p=>p.includes(v)?p.filter(x=>x!==v):[...p,v]);
const confM=()=>{if(!mSel.length)return;setAns(p=>({...p,[CQ.id]:mSel}));setADir("out");setTimeout(()=>{if(qIdx<Q_DATA.length-1){setQIdx(i=>i+1);setMSel([]);setADir("in")}else setStep("ranking")},250)};
const goBack=()=>{if(qIdx>0){setADir("out");setTimeout(()=>{setQIdx(i=>i-1);setMSel([]);setADir("in")},200)}};
const pickR=(n)=>{setRegion(n);setStep("accommodation")};
const pickA=(a)=>{setAcc(a);setItin(gen(region,ans,gs,a));setStep("result");setExDay(0);if(sr.current)sr.current.scrollTop=0};
const togOff=(i)=>{setItin(p=>{const u=JSON.parse(JSON.stringify(p));u.days[i].dayOff=!u.days[i].dayOff;return u})};
const doSwap=(di,sl,reason)=>{const cur=itin.days[di][sl];const c=reason==="trop_cher"?.4:reason==="calme"?.7:1.1;
setSwap(p=>({...p,alts:[
{activity:`Alternative ${reason==="trop_cher"?"économique":"locale"}`,location:region,tip:"Populaire",cost:Math.round((cur?.cost||20)*c),duration:cur?.duration||"2h",g:"4.3★"},
{activity:`Découverte ${reason==="calme"?"zen":"active"}`,location:region,tip:"Bien noté",cost:Math.round((cur?.cost||20)*(reason==="trop_cher"?.2:.8)),duration:"2h",g:"4.1★"},
{activity:`Visite guidée ${region}`,location:region,tip:"Guide local inclus",cost:Math.round(22*c),duration:"2.5h",g:"4.5★"}]}))};
const confSwap=(di,sl,alt)=>{setItin(p=>{const u=JSON.parse(JSON.stringify(p));u.days[di][sl]=alt;const d=u.days[di];
d.daily_cost_per_person=(d.morning?.cost||0)+(d.afternoon?.cost||0)+(d.evening?.cost||0)+(d.breakfast?.cost||0)+(d.lunch?.cost||0)+(d.dinner?.cost||0)+(typeof d.accommodation==="object"?d.accommodation.cost:0);
u.total_cost_per_person=u.days.reduce((s,dd)=>s+(dd.daily_cost_per_person||0),0);return u});setSwap(null)};

const exportJ=()=>{const j={region,answers:ans,itinerary:itin,feedback:fb,notes,groupSize:gs,exportDate:new Date().toISOString(),version:"GeaiMonVol-v4"};
const b=new Blob([JSON.stringify(j,null,2)],{type:"application/json"});const u=URL.createObjectURL(b);const a=document.createElement("a");
a.href=u;a.download=`cahier-voyage-${region?.replace(/\s/g,"-").toLowerCase()}-${Date.now()}.json`;a.click();URL.revokeObjectURL(u)};

const reset=()=>{setStep("quiz");setQIdx(0);setAns({});setMSel([]);setRegion(null);setAcc(null);setItin(null);setExDay(0);setFb({});setNotes({});setShowH(false);setShowJ(false)};

const css=`@import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700;800&display=swap');
@keyframes qB{0%{background-position:0%}50%{background-position:100%}100%{background-position:0%}}
@keyframes qI{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
@keyframes qO{from{opacity:1}to{opacity:0;transform:translateX(-20px)}}
@keyframes qF{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes qS{to{transform:rotate(360deg)}}@keyframes qFl{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes qP{0%{transform:scale(.9);opacity:0}100%{transform:scale(1);opacity:1}}
@keyframes qG{0%,100%{box-shadow:0 0 8px rgba(46,125,219,.15)}50%{box-shadow:0 0 24px rgba(46,125,219,.3)}}
.qS::-webkit-scrollbar{width:3px}.qS::-webkit-scrollbar-thumb{background:rgba(46,125,219,.1);border-radius:3px}`;

// Meal card sub-component
const Meal=({data,label,icon,color,di,sl})=>{if(!data)return null;return(
<div style={{padding:"9px 12px",borderRadius:12,background:`${color}04`,border:`1px solid ${color}10`,marginBottom:4}}>
<div style={{display:"flex",gap:8}}>
<div style={{width:32,height:32,borderRadius:8,flexShrink:0,background:`${color}08`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>{icon}</div>
<div style={{flex:1}}>
<div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:9,fontWeight:700,color,textTransform:"uppercase",letterSpacing:.5}}>{label} · {data.g||""}</span><span style={{fontSize:11,fontWeight:700,color:"#0F1D2F"}}>{data.cost}$</span></div>
<div style={{fontSize:12.5,fontWeight:700,color:"#0F1D2F"}}>{data.name}</div>
{data.mt&&<div style={{fontSize:10,color,marginTop:1}}>⭐ {data.mt}</div>}
</div></div>
<div style={{display:"flex",justifyContent:"flex-end",marginTop:4}}>
<button onClick={()=>setSwap({dayIdx:di,slot:sl,step:"reason"})} style={{padding:"2px 7px",borderRadius:100,border:`1px solid ${color}15`,background:"transparent",color,fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>🔄</button>
</div></div>)};

return(
<div onClick={e=>{if(e.target===e.currentTarget&&onClose)onClose()}} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.45)",backdropFilter:"blur(14px)",display:"flex",alignItems:"center",justifyContent:"center",padding:12,fontFamily:"'Fredoka',sans-serif"}}>
<style>{css}</style>
<div className="qS" ref={sr} style={{width:"100%",maxWidth:step==="result"?780:step==="ranking"?600:step==="accommodation"?560:step==="journal"?650:520,maxHeight:"94vh",overflow:"auto",background:"linear-gradient(175deg,#F8FAFF,#EDF2FB,#E4EAF6)",borderRadius:28,border:"1px solid rgba(46,125,219,.08)",boxShadow:"0 32px 80px rgba(0,0,0,.2),inset 0 0 0 1px rgba(255,255,255,.5)",transition:"max-width .5s cubic-bezier(.25,.46,.45,.94)",position:"relative"}}>
<div style={{height:3,borderRadius:"28px 28px 0 0",background:"linear-gradient(90deg,#2E7DDB,#60A5FA,#2E5A9E,#1A3A6B,#2E5A9E,#60A5FA,#2E7DDB)",backgroundSize:"300%",animation:"qB 5s ease infinite"}}/>
{onClose&&<button onClick={onClose} style={{position:"absolute",top:14,right:14,zIndex:10,width:32,height:32,borderRadius:"50%",border:"none",background:"rgba(26,58,107,.06)",color:"rgba(26,58,107,.4)",fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .25s",fontFamily:"'Fredoka',sans-serif"}}
onMouseEnter={e=>{e.currentTarget.style.background="rgba(26,58,107,.12)";e.currentTarget.style.color="#1A3A6B";e.currentTarget.style.transform="rotate(90deg)"}}
onMouseLeave={e=>{e.currentTarget.style.background="rgba(26,58,107,.06)";e.currentTarget.style.color="rgba(26,58,107,.4)";e.currentTarget.style.transform="rotate(0deg)"}}>✕</button>}

{/* ═══ QUIZ ═══ */}
{step==="quiz"&&<div style={{padding:"26px 26px 32px"}}>
<div style={{textAlign:"center",marginBottom:20}}>
<div style={{fontSize:32,animation:"qFl 3s ease-in-out infinite"}}>⚜️</div>
<h2 style={{fontSize:21,fontWeight:800,color:"#0F1D2F",margin:"2px 0"}}>Planifie ton voyage au Québec</h2>
<p style={{fontSize:12,color:"#5A6B80",margin:"3px 0 14px"}}>On bâtit ta semaine parfaite</p>
<div style={{width:"100%",height:7,borderRadius:4,background:"rgba(46,125,219,.06)"}}>
<div style={{width:`${prog}%`,height:"100%",borderRadius:4,background:"linear-gradient(90deg,#2E7DDB,#60A5FA)",transition:"width .4s"}}/></div>
<div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
<span style={{fontSize:10,color:"#8A9AB5",fontWeight:600,textTransform:"uppercase"}}>{CQ.id}</span>
<span style={{fontSize:11,color:"#2E7DDB",fontWeight:700}}>{qIdx+1}/{Q_DATA.length}</span></div></div>
<div key={qIdx} style={{animation:aDir==="in"?"qI .3s ease":"qO .2s ease"}}>
<h3 style={{fontSize:17,fontWeight:700,color:"#0F1D2F",textAlign:"center",marginBottom:3}}>{CQ.q}</h3>
{CQ.sub&&<p style={{fontSize:11,color:"#8A9AB5",textAlign:"center",marginBottom:8}}>{CQ.sub}</p>}
{CQ.multi&&<p style={{fontSize:10.5,color:"#2E7DDB",textAlign:"center",fontWeight:600,marginBottom:8}}>✨ Choisis-en plusieurs</p>}
<div style={{display:"grid",gridTemplateColumns:CQ.options.length<=4?"1fr":"1fr 1fr",gap:7}}>
{CQ.options.map(o=>{const s=CQ.multi?mSel.includes(o.v):ans[CQ.id]===o.v;return(
<button key={o.v} onClick={()=>CQ.multi?togM(o.v):doSingle(o.v)} style={{display:"flex",alignItems:"center",gap:9,padding:"11px 12px",borderRadius:13,border:s?"2px solid #2E7DDB":"1.5px solid rgba(46,125,219,.04)",background:s?"rgba(46,125,219,.04)":"white",cursor:"pointer",textAlign:"left",fontFamily:"'Fredoka',sans-serif",transition:"all .2s"}}>
<span style={{fontSize:20,flexShrink:0}}>{o.i}</span><span style={{fontSize:12.5,fontWeight:600,color:"#0F1D2F"}}>{o.l}</span>
{s&&CQ.multi&&<span style={{marginLeft:"auto",color:"#2E7DDB",fontWeight:800}}>✓</span>}
</button>)})}</div>
{CQ.multi&&<button onClick={confM} disabled={!mSel.length} style={{display:"block",margin:"14px auto 0",padding:"10px 24px",borderRadius:100,border:"none",background:mSel.length?"linear-gradient(135deg,#2E7DDB,#1A3A6B)":"rgba(46,125,219,.06)",color:mSel.length?"white":"#8A9AB5",fontSize:13,fontWeight:700,cursor:mSel.length?"pointer":"default",fontFamily:"'Fredoka',sans-serif"}}>Confirmer ({mSel.length}) →</button>}
</div>
{qIdx>0&&<button onClick={goBack} style={{display:"block",margin:"10px auto 0",padding:"5px 14px",borderRadius:100,border:"none",background:"rgba(46,125,219,.04)",color:"#2E7DDB",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>← Retour</button>}
</div>}

{/* ═══ RANKING ═══ */}
{step==="ranking"&&<div style={{padding:"26px 24px 32px",animation:"qF .4s ease"}}>
<div style={{textAlign:"center",marginBottom:18}}>
<div style={{fontSize:24}}>🏆</div>
<h2 style={{fontSize:20,fontWeight:800,color:"#0F1D2F",margin:0}}>Tes destinations parfaites</h2>
<p style={{fontSize:12,color:"#5A6B80",margin:"3px 0"}}>Classées par compatibilité</p></div>
<div onClick={()=>pickR(ranked[0].name)} style={{marginBottom:12,padding:"15px 16px",borderRadius:18,background:"linear-gradient(135deg,rgba(46,125,219,.05),rgba(96,165,250,.02))",border:"2px solid rgba(46,125,219,.12)",animation:"qG 3s ease-in-out infinite",cursor:"pointer",position:"relative"}}>
<div style={{position:"absolute",top:9,right:11,background:"linear-gradient(135deg,#2E7DDB,#1A3A6B)",color:"white",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:100}}>🥇 RECOMMANDÉ</div>
<div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
<span style={{fontSize:28}}>{ranked[0].icon}</span>
<div><div style={{fontSize:16,fontWeight:800,color:"#0F1D2F"}}>{ranked[0].name}</div><div style={{fontSize:11,color:"#5A6B80"}}>{ranked[0].desc}</div></div></div>
<div style={{display:"flex",alignItems:"center",gap:8,marginTop:5}}>
<div style={{flex:1,height:7,borderRadius:4,background:"rgba(46,125,219,.06)",overflow:"hidden"}}><div style={{width:`${ranked[0].score}%`,height:"100%",borderRadius:4,background:"linear-gradient(90deg,#2E7DDB,#60A5FA)"}}/></div>
<span style={{fontSize:14,fontWeight:800,color:"#2E7DDB"}}>{ranked[0].score}%</span></div></div>
<div style={{display:"flex",flexDirection:"column",gap:5}}>
{ranked.slice(1).map((r,i)=><div key={r.name} onClick={()=>pickR(r.name)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:12,background:"white",border:"1px solid rgba(46,125,219,.03)",cursor:"pointer",transition:"all .2s",animation:`qP .3s ease ${i*.04}s both`}}
onMouseEnter={e=>{e.currentTarget.style.transform="translateX(4px)"}} onMouseLeave={e=>{e.currentTarget.style.transform=""}}>
<span style={{fontSize:10,fontWeight:800,color:"#8A9AB5",width:16}}>#{i+2}</span><span style={{fontSize:17}}>{r.icon}</span>
<div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"#0F1D2F"}}>{r.name}</div></div>
<span style={{fontSize:11,fontWeight:700,color:r.score>70?"#2E7DDB":"#8A9AB5"}}>{r.score}%</span></div>)}
</div></div>}

{/* ═══ ACCOMMODATION ═══ */}
{step==="accommodation"&&<div style={{padding:"26px 24px 32px",animation:"qF .4s ease"}}>
<div style={{textAlign:"center",marginBottom:18}}>
<div style={{fontSize:24}}>🏨</div>
<h2 style={{fontSize:19,fontWeight:800,color:"#0F1D2F",margin:0}}>Hébergement en {region}</h2>
<p style={{fontSize:12,color:"#5A6B80",margin:"3px 0"}}>Prix/nuit · Budget: {budget}</p></div>
{accList.length>0?<div style={{display:"flex",flexDirection:"column",gap:8}}>
{accList.map((a,i)=><div key={i} onClick={()=>pickA(a)} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 15px",borderRadius:15,background:"white",border:"1.5px solid rgba(46,125,219,.04)",cursor:"pointer",transition:"all .25s"}}
onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(46,125,219,.2)";e.currentTarget.style.boxShadow="0 6px 18px rgba(46,125,219,.08)"}}
onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(46,125,219,.04)";e.currentTarget.style.boxShadow="none"}}>
<div style={{width:42,height:42,borderRadius:11,background:"rgba(46,125,219,.04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🏨</div>
<div style={{flex:1}}>
<div style={{fontSize:13,fontWeight:700,color:"#0F1D2F"}}>{a.name}</div>
<div style={{fontSize:11,color:"#5A6B80"}}>{a.type} · {a.g}</div></div>
<div style={{textAlign:"right"}}><div style={{fontSize:16,fontWeight:800,color:"#2E7DDB"}}>{a.cost}$</div><div style={{fontSize:9,color:"#8A9AB5"}}>/nuit</div></div>
</div>)}
</div>:<div style={{textAlign:"center",padding:20}}>
<p style={{color:"#5A6B80",fontSize:13}}>Pas d'hébergements pré-sélectionnés pour cette région.</p>
<button onClick={()=>pickA({name:"Hébergement à déterminer",type:"Flexible",cost:Math.round(100*(budget==="econome"?.6:budget==="luxe"?1.5:1))})} style={{marginTop:10,padding:"10px 20px",borderRadius:100,border:"none",background:"linear-gradient(135deg,#2E7DDB,#1A3A6B)",color:"white",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>Continuer quand même →</button></div>}
<button onClick={()=>setStep("ranking")} style={{display:"block",margin:"14px auto 0",padding:"6px 14px",borderRadius:100,border:"none",background:"rgba(46,125,219,.04)",color:"#2E7DDB",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>← Changer de région</button>
</div>}

{/* ═══ RESULT ═══ */}
{step==="result"&&itin&&<div style={{animation:"qF .4s ease"}}>
{/* Header */}
<div style={{padding:"22px 22px 16px",textAlign:"center",background:"linear-gradient(170deg,rgba(46,125,219,.04),transparent)",borderBottom:"1px solid rgba(46,125,219,.05)"}}>
<div style={{fontSize:12,fontWeight:700,color:"#2E7DDB",marginBottom:3}}>⚜️ {region}</div>
<h2 style={{fontSize:20,fontWeight:800,color:"#0F1D2F",margin:"0 0 2px"}}>{itin.title}</h2>
<p style={{fontSize:12,color:"#5A6B80",margin:"0 0 10px"}}>{itin.subtitle}</p>
<div style={{display:"inline-flex",gap:12,padding:"9px 18px",borderRadius:14,background:"white",border:"1px solid rgba(46,125,219,.08)"}}>
<div><div style={{fontSize:9,color:"#8A9AB5",fontWeight:700}}>PAR PERS.</div><div style={{fontSize:18,fontWeight:800,color:"#2E7DDB"}}>{itin.total_cost_per_person}$</div></div>
{gs>1&&<div style={{borderLeft:"1px solid rgba(46,125,219,.08)",paddingLeft:12}}><div style={{fontSize:9,color:"#8A9AB5",fontWeight:700}}>TOTAL ({gs} pers.)</div><div style={{fontSize:18,fontWeight:800,color:"#0F1D2F"}}>{itin.total_cost_per_person*gs}$</div></div>}
</div>
{acc&&<div style={{marginTop:8,fontSize:11,color:"#5A6B80"}}>🏨 {acc.name} · {acc.cost}$/nuit</div>}
</div>

{/* Hikes */}
{itin.hikes?.length>0&&<div style={{padding:"0 16px"}}>
<button onClick={()=>setShowH(!showH)} style={{width:"100%",margin:"10px 0",padding:"10px 14px",borderRadius:12,border:"1px solid rgba(5,150,105,.08)",background:"rgba(5,150,105,.02)",cursor:"pointer",fontFamily:"'Fredoka',sans-serif",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<span style={{fontSize:12,fontWeight:700,color:"#059669"}}>🥾 Randonnées ({itin.hikes.length})</span><span style={{fontSize:11,color:"#059669"}}>{showH?"▲":"▼"}</span></button>
{showH&&<div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10,animation:"qF .3s ease"}}>
{itin.hikes.map((h,j)=><div key={j} style={{padding:"10px 12px",borderRadius:12,background:"white",border:"1px solid rgba(46,125,219,.04)"}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
<span style={{fontSize:13,fontWeight:700,color:"#0F1D2F"}}>{h.n}</span>
<span style={{fontSize:9.5,fontWeight:700,color:DC[h.d],padding:"1px 7px",borderRadius:100,background:`${DC[h.d]}12`}}>{h.d}</span></div>
<div style={{fontSize:11,color:"#5A6B80",marginBottom:3}}>{h.desc}</div>
<div style={{display:"flex",gap:10,fontSize:10,color:"#8A9AB5",fontWeight:600}}>
<span>📏{h.km}</span><span>⬆️{h.el}</span><span>⏱️{h.t}</span><span>💰{h.cost}$</span><span>⭐{h.s}</span></div>
</div>)}</div>}</div>}

{/* Day tabs */}
<div style={{display:"flex",gap:0,padding:"0 6px",overflowX:"auto",borderBottom:"1px solid rgba(46,125,219,.04)"}}>
{itin.days.map((d,i)=><button key={i} onClick={()=>setExDay(i)} style={{flex:"0 0 auto",padding:"9px 9px",border:"none",borderBottom:exDay===i?`3px solid ${DCOL[i]}`:"3px solid transparent",background:"transparent",color:d.dayOff?"#ccc":exDay===i?DCOL[i]:"#8A9AB5",fontSize:11,fontWeight:exDay===i?700:600,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",textDecoration:d.dayOff?"line-through":"none"}}>
<div>J{d.day}</div><div style={{fontSize:8.5}}>{d.dayOff?"OFF":`${d.daily_cost_per_person}$`}</div></button>)}
</div>

{/* Day content */}
{itin.days.map((d,i)=>exDay===i?<div key={i} style={{padding:"14px 16px 18px",animation:"qF .25s ease"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
<h3 style={{fontSize:15,fontWeight:700,color:d.dayOff?"#aaa":DCOL[i],margin:0,textDecoration:d.dayOff?"line-through":"none"}}>{d.title}</h3>
<div style={{display:"flex",gap:6,alignItems:"center"}}>
<span style={{fontSize:10,fontWeight:700,color:DCOL[i],padding:"2px 8px",borderRadius:100,background:`${DCOL[i]}10`}}>{d.daily_cost_per_person}$/pers</span>
<button onClick={()=>togOff(i)} style={{padding:"3px 8px",borderRadius:100,border:"1px solid rgba(0,0,0,.06)",background:d.dayOff?"rgba(5,150,105,.06)":"rgba(232,72,85,.04)",color:d.dayOff?"#059669":"#E84855",fontSize:9.5,fontWeight:700,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>{d.dayOff?"✅ Réactiver":"😴 Journée off"}</button>
</div></div>

{d.dayOff?<div style={{textAlign:"center",padding:"30px 0",color:"#8A9AB5"}}>
<div style={{fontSize:36,marginBottom:8}}>😴</div>
<p style={{fontSize:14,fontWeight:600}}>Journée de repos</p>
<p style={{fontSize:12}}>Les activités sont sauvegardées — réactive quand tu veux!</p>
</div>:<>
{/* Breakfast */}
<Meal data={d.breakfast} label="Déjeuner" icon="🥐" color="#F5A623" di={i} sl="breakfast"/>
{/* Morning */}
<div style={{padding:"10px 12px",borderRadius:12,background:"white",border:"1px solid rgba(46,125,219,.04)",marginBottom:4}}>
<div style={{display:"flex",gap:8}}>
<div style={{width:34,height:34,borderRadius:9,flexShrink:0,background:`${DCOL[i]}08`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🌅</div>
<div style={{flex:1}}>
<div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:9,fontWeight:700,color:DCOL[i],textTransform:"uppercase"}}>Matin · {d.morning?.duration}</span><span style={{fontSize:11,fontWeight:700}}>{d.morning?.cost}$</span></div>
<div style={{fontSize:13,fontWeight:700,color:"#0F1D2F"}}>{d.morning?.activity}</div>
<div style={{fontSize:11,color:"#5A6B80"}}>📍 {d.morning?.location}</div>
{d.morning?.tip&&<div style={{fontSize:10,color:"#8A9AB5",fontStyle:"italic"}}>💡 {d.morning.tip}</div>}</div></div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6,paddingTop:6,borderTop:"1px solid rgba(0,0,0,.03)",marginLeft:42}}>
<div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(s=><button key={s} onClick={()=>setFb(p=>({...p,[`${i}-morning`]:s}))} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,opacity:fb[`${i}-morning`]>=s?1:.2}}>⭐</button>)}</div>
<button onClick={()=>setSwap({dayIdx:i,slot:"morning",step:"reason"})} style={{padding:"2px 7px",borderRadius:100,border:`1px solid ${DCOL[i]}15`,background:"transparent",color:DCOL[i],fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>🔄</button></div></div>
{/* Lunch */}
<Meal data={d.lunch} label="Dîner (midi)" icon="🥗" color="#0E9AA7" di={i} sl="lunch"/>
{/* Afternoon */}
<div style={{padding:"10px 12px",borderRadius:12,background:"white",border:"1px solid rgba(46,125,219,.04)",marginBottom:4}}>
<div style={{display:"flex",gap:8}}>
<div style={{width:34,height:34,borderRadius:9,flexShrink:0,background:`${DCOL[i]}08`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>☀️</div>
<div style={{flex:1}}>
<div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:9,fontWeight:700,color:DCOL[i],textTransform:"uppercase"}}>Après-midi · {d.afternoon?.duration}</span><span style={{fontSize:11,fontWeight:700}}>{d.afternoon?.cost}$</span></div>
<div style={{fontSize:13,fontWeight:700,color:"#0F1D2F"}}>{d.afternoon?.activity}</div>
<div style={{fontSize:11,color:"#5A6B80"}}>📍 {d.afternoon?.location}</div>
{d.afternoon?.tip&&<div style={{fontSize:10,color:"#8A9AB5",fontStyle:"italic"}}>💡 {d.afternoon.tip}</div>}</div></div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6,paddingTop:6,borderTop:"1px solid rgba(0,0,0,.03)",marginLeft:42}}>
<div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(s=><button key={s} onClick={()=>setFb(p=>({...p,[`${i}-afternoon`]:s}))} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,opacity:fb[`${i}-afternoon`]>=s?1:.2}}>⭐</button>)}</div>
<button onClick={()=>setSwap({dayIdx:i,slot:"afternoon",step:"reason"})} style={{padding:"2px 7px",borderRadius:100,border:`1px solid ${DCOL[i]}15`,background:"transparent",color:DCOL[i],fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>🔄</button></div></div>
{/* Dinner */}
<Meal data={d.dinner} label="Souper" icon="🍽️" color="#7C3AED" di={i} sl="dinner"/>
{/* Evening */}
<div style={{padding:"10px 12px",borderRadius:12,background:"white",border:"1px solid rgba(46,125,219,.04)",marginBottom:4}}>
<div style={{display:"flex",gap:8}}>
<div style={{width:34,height:34,borderRadius:9,flexShrink:0,background:`${DCOL[i]}08`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🌙</div>
<div style={{flex:1}}>
<div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:9,fontWeight:700,color:DCOL[i],textTransform:"uppercase"}}>Soirée · {d.evening?.duration}</span><span style={{fontSize:11,fontWeight:700}}>{d.evening?.cost}$</span></div>
<div style={{fontSize:13,fontWeight:700,color:"#0F1D2F"}}>{d.evening?.activity}</div>
<div style={{fontSize:11,color:"#5A6B80"}}>📍 {d.evening?.location}</div></div></div>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6,paddingTop:6,borderTop:"1px solid rgba(0,0,0,.03)",marginLeft:42}}>
<div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(s=><button key={s} onClick={()=>setFb(p=>({...p,[`${i}-evening`]:s}))} style={{background:"none",border:"none",cursor:"pointer",fontSize:12,opacity:fb[`${i}-evening`]>=s?1:.2}}>⭐</button>)}</div>
<button onClick={()=>setSwap({dayIdx:i,slot:"evening",step:"reason"})} style={{padding:"2px 7px",borderRadius:100,border:`1px solid ${DCOL[i]}15`,background:"transparent",color:DCOL[i],fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>🔄</button></div></div>
{/* Accommodation */}
{d.accommodation&&<div style={{padding:"9px 12px",borderRadius:12,background:"rgba(46,125,219,.02)",border:"1px solid rgba(46,125,219,.04)"}}>
<div style={{display:"flex",gap:8,alignItems:"center"}}>
<span style={{fontSize:15}}>🏨</span>
<div style={{flex:1}}><span style={{fontSize:10,fontWeight:700,color:"#2E7DDB"}}>HÉBERGEMENT</span>
<div style={{fontSize:12,fontWeight:600,color:"#0F1D2F"}}>{typeof d.accommodation==="object"?d.accommodation.name:d.accommodation}</div></div>
<span style={{fontSize:11,fontWeight:700}}>{typeof d.accommodation==="object"?d.accommodation.cost:0}$/nuit</span></div></div>}
{/* Note */}
<div style={{marginTop:6}}>
<textarea placeholder="📝 Notes personnelles pour ce jour..." value={notes[`day-${i}`]||""} onChange={e=>setNotes(p=>({...p,[`day-${i}`]:e.target.value}))}
style={{width:"100%",padding:"8px 10px",borderRadius:10,border:"1px solid rgba(46,125,219,.06)",background:"rgba(46,125,219,.02)",fontSize:11,fontFamily:"'Fredoka',sans-serif",color:"#0F1D2F",resize:"vertical",minHeight:32,outline:"none"}}/>
</div>
</>}
</div>:null)}

{/* Packing */}
{itin.packing_list&&<div style={{padding:"0 16px 8px"}}><div style={{padding:"10px 12px",borderRadius:12,background:"rgba(5,150,105,.02)",border:"1px solid rgba(5,150,105,.06)"}}>
<div style={{fontSize:11,fontWeight:700,color:"#059669",marginBottom:4}}>🎒 À ne pas oublier</div>
<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{itin.packing_list.map((it,j)=><span key={j} style={{padding:"2px 8px",borderRadius:100,background:"rgba(5,150,105,.05)",fontSize:10,fontWeight:600,color:"#059669"}}>{it}</span>)}</div>
</div></div>}

{/* Footer */}
<div style={{padding:"12px 18px 22px",display:"flex",gap:7,justifyContent:"center",flexWrap:"wrap",borderTop:"1px solid rgba(46,125,219,.04)"}}>
<button onClick={()=>setStep("ranking")} style={{padding:"9px 16px",borderRadius:100,border:"1px solid rgba(46,125,219,.1)",background:"white",color:"#2E7DDB",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>🗺️ Autre région</button>
<button onClick={exportJ} style={{padding:"9px 16px",borderRadius:100,border:"none",background:"linear-gradient(135deg,#059669,#047857)",color:"white",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",boxShadow:"0 3px 8px rgba(5,150,105,.2)"}}>📥 Cahier de voyage</button>
<button onClick={reset} style={{padding:"9px 16px",borderRadius:100,border:"none",background:"linear-gradient(135deg,#2E7DDB,#1A3A6B)",color:"white",fontSize:11.5,fontWeight:600,cursor:"pointer",fontFamily:"'Fredoka',sans-serif",boxShadow:"0 3px 8px rgba(46,125,219,.2)"}}>⚜️ Recommencer</button>
</div></div>}

{/* ═══ SWAP MODAL ═══ */}
{swap&&<div style={{position:"fixed",inset:0,zIndex:1100,background:"rgba(0,0,0,.5)",backdropFilter:"blur(6px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>{if(e.target===e.currentTarget)setSwap(null)}}>
<div style={{width:"100%",maxWidth:370,background:"#F8FAFF",borderRadius:18,padding:20,boxShadow:"0 20px 50px rgba(0,0,0,.2)",animation:"qF .3s ease"}}>
{swap.step==="reason"&&<>
<h3 style={{fontSize:15,fontWeight:700,color:"#0F1D2F",textAlign:"center",marginBottom:12}}>Pourquoi changer?</h3>
<div style={{display:"flex",flexDirection:"column",gap:6}}>
{SWAP_R.map(r=><button key={r.v} onClick={()=>{setSwap(p=>({...p,reason:r.v,step:"loading"}));doSwap(swap.dayIdx,swap.slot,r.v)}} style={{display:"flex",alignItems:"center",gap:9,padding:"9px 12px",borderRadius:11,border:"1px solid rgba(46,125,219,.05)",background:"white",cursor:"pointer",fontFamily:"'Fredoka',sans-serif",fontSize:12.5,fontWeight:600,color:"#0F1D2F"}}>
<span style={{fontSize:16}}>{r.i}</span>{r.l}</button>)}</div>
<button onClick={()=>setSwap(null)} style={{display:"block",margin:"10px auto 0",padding:"4px 12px",borderRadius:100,border:"none",background:"rgba(0,0,0,.03)",color:"#5A6B80",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>Annuler</button></>}
{swap.alts&&<>
<h3 style={{fontSize:14,fontWeight:700,color:"#0F1D2F",textAlign:"center",marginBottom:10}}>3 alternatives</h3>
<div style={{display:"flex",flexDirection:"column",gap:7}}>
{swap.alts.map((a,j)=><button key={j} onClick={()=>confSwap(swap.dayIdx,swap.slot,a)} style={{padding:"11px",borderRadius:13,border:"1.5px solid rgba(46,125,219,.04)",background:"white",cursor:"pointer",textAlign:"left",fontFamily:"'Fredoka',sans-serif",transition:"all .2s"}}
onMouseEnter={e=>e.currentTarget.style.borderColor="#2E7DDB"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(46,125,219,.04)"}>
<div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:12.5,fontWeight:700,color:"#0F1D2F"}}>{a.activity}</span><span style={{fontSize:12,fontWeight:700,color:"#2E7DDB"}}>{a.cost}$</span></div>
<div style={{fontSize:10.5,color:"#5A6B80"}}>📍 {a.location} · {a.duration} · {a.g||""}</div>
</button>)}</div>
<button onClick={()=>setSwap(null)} style={{display:"block",margin:"10px auto 0",padding:"4px 12px",borderRadius:100,border:"none",background:"rgba(0,0,0,.03)",color:"#5A6B80",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'Fredoka',sans-serif"}}>Garder l'original</button></>}
</div></div>}

</div></div>);
}
