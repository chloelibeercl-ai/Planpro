import{useState,useRef,useEffect,useCallback}from"react";

// =============================================
// FORMES : définies par leurs points en mètres
// Chaque forme retourne {points, aretes}
// points = [{x,y}] coordonnées réelles en mètres
// aretes = [{p1, p2, key, label}] relient 2 points
// =============================================

function buildForme(f,d){
  const n=k=>Math.max(0.1,Number(d[k]||1));
  if(f==="rectangle"){
    const w=n("w"),h=n("h");
    const pts=[{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}];
    return{pts,aretes:[
      {p1:0,p2:1,key:"w_top",  label:"Haut"},
      {p1:1,p2:2,key:"h_right",label:"Droite"},
      {p1:3,p2:2,key:"w_bot",  label:"Bas"},
      {p1:0,p2:3,key:"h_left", label:"Gauche"},
    ]};
  }
  if(f==="triangle"){
    const b=n("base"),h=n("haut"),dec=n("decalage");
    const pts=[{x:0,y:h},{x:b,y:h},{x:dec,y:0}];
    return{pts,aretes:[
      {p1:0,p2:1,key:"base",  label:"Base"},
      {p1:1,p2:2,key:"cote_r",label:"Côté dr."},
      {p1:0,p2:2,key:"cote_l",label:"Côté ga."},
    ]};
  }
  if(f==="L"){
    const l1=n("l1"),l2=n("l2"),h1=n("h1"),h2=n("h2");
    const pts=[
      {x:0,  y:0},
      {x:l1, y:0},
      {x:l1, y:h1},
      {x:l2, y:h1},
      {x:l2, y:h1+h2},
      {x:0,  y:h1+h2},
    ];
    return{pts,aretes:[
      {p1:0,p2:1,key:"l1",   label:"Long.1"},
      {p1:1,p2:2,key:"h1",   label:"Haut.1"},
      {p1:2,p2:3,key:"ret",  label:"Retrait"},
      {p1:3,p2:4,key:"h2",   label:"Haut.2"},
      {p1:4,p2:5,key:"l2",   label:"Long.2"},
      {p1:5,p2:0,key:"htot", label:"Haut.tot"},
    ]};
  }
  if(f==="U"){
    const lt=n("lt"),ht=n("ht"),ep_g=n("ep_g"),ep_d=n("ep_d"),ep_h=n("ep_h");
    const iw=Math.max(0.1,lt-ep_g-ep_d);
    const ih=Math.max(0.1,ht-ep_h);
    const pts=[
      {x:0,    y:0},
      {x:lt,   y:0},
      {x:lt,   y:ht},
      {x:lt-ep_d, y:ht},
      {x:lt-ep_d, y:ep_h},
      {x:ep_g, y:ep_h},
      {x:ep_g, y:ht},
      {x:0,    y:ht},
    ];
    return{pts,aretes:[
      {p1:0,p2:1,key:"lt",   label:"Larg.ext"},
      {p1:1,p2:2,key:"ht",   label:"Haut.dr.ext"},
      {p1:2,p2:3,key:"ep_d", label:"Épais.dr."},
      {p1:3,p2:4,key:"ih",   label:"Haut.int.dr."},
      {p1:4,p2:5,key:"iw",   label:"Larg.int."},
      {p1:5,p2:6,key:"ih2",  label:"Haut.int.ga."},
      {p1:6,p2:7,key:"ep_g", label:"Épais.ga."},
      {p1:7,p2:0,key:"ht2",  label:"Haut.ga.ext"},
    ]};
  }
  return{pts:[],aretes:[]};
}

// Clés éditables pour chaque arête
function getKeyValue(f,d,key){
  const n=k=>Math.max(0.1,Number(d[k]||1));
  if(f==="U"){
    if(key==="lt")return{k:"lt",v:n("lt")};
    if(key==="ht"||key==="ht2")return{k:"ht",v:n("ht")};
    if(key==="ep_d")return{k:"ep_d",v:n("ep_d")};
    if(key==="ep_g")return{k:"ep_g",v:n("ep_g")};
    if(key==="ep_h")return{k:"ep_h",v:n("ep_h")};
    if(key==="ih"||key==="ih2")return{k:"ht",v:n("ht")-n("ep_h")};
    if(key==="iw")return{k:"lt",v:n("lt")-n("ep_g")-n("ep_d")};
  }
  if(key==="ret")return{k:"l1",v:n("l1")-n("l2")};
  if(key==="htot")return{k:"h1",v:n("h1")+n("h2")};
  return{k:key,v:n(key)};
}

const CHAMPS_INIT={
  rectangle:[{k:"w",l:"Largeur (m)"},{k:"h",l:"Hauteur (m)"}],
  triangle:[{k:"base",l:"Base (m)"},{k:"haut",l:"Hauteur (m)"},{k:"decalage",l:"Décalage sommet (m)"}],
  L:[{k:"l1",l:"Long.1"},{k:"l2",l:"Long.2"},{k:"h1",l:"Haut.1"},{k:"h2",l:"Haut.2"}],
  U:[{k:"lt",l:"Larg.totale"},{k:"ht",l:"Haut.totale"},{k:"ep_g",l:"Épais.gauche"},{k:"ep_d",l:"Épais.droite"},{k:"ep_h",l:"Épais.haut"}],
};

const FORMES=[
  {id:"rectangle",label:"Rectangle"},
  {id:"triangle",label:"Triangle"},
  {id:"L",label:"Forme L"},
  {id:"U",label:"Forme U"},
];

function calcSurf(f,d){
  const{pts}=buildForme(f,d);
  if(!pts.length)return"—";
  let a=0;
  for(let i=0;i<pts.length;i++){
    const j=(i+1)%pts.length;
    a+=pts[i].x*pts[j].y-pts[j].x*pts[i].y;
  }
  return Math.abs(a/2).toFixed(2);
}

function dist(p1,p2){return Math.hypot(p2.x-p1.x,p2.y-p1.y);}

function PlanCanvas({forme,dims,surf,onAreteTap}){
  const cvRef=useRef();
  const zoom=useRef(1);
  const pan=useRef({x:0,y:0});
  const drag=useRef(false);
  const lastT=useRef(null);
  const pinch=useRef(null);
  const hitZones=useRef([]);

  const draw=useCallback(()=>{
    const cv=cvRef.current;if(!cv)return;
    const CW=cv.width,CH=cv.height;
    const ctx=cv.getContext("2d");
    ctx.clearRect(0,0,CW,CH);
    const z=zoom.current,px=pan.current.x,py=pan.current.y;
    const PAD=80;

    ctx.fillStyle="#f5f0e8";ctx.fillRect(0,0,CW,CH);

    const{pts,aretes}=buildForme(forme,dims);
    if(!pts.length)return;

    // Bounding box réelle
    const minX=Math.min(...pts.map(p=>p.x));
    const maxX=Math.max(...pts.map(p=>p.x));
    const minY=Math.min(...pts.map(p=>p.y));
    const maxY=Math.max(...pts.map(p=>p.y));
    const rw=maxX-minX,rh=maxY-minY;
    const sc0=Math.min((CW-PAD*2)/rw,(CH-PAD*2)/rh);
    const sc=sc0*z;

    // Origine : centre de l'écran
    const originX=CW/2-rw*sc/2+px;
    const originY=CH/2-rh*sc/2+py;

    // Convertit un point réel → pixel
    const toScreen=p=>({
      x:originX+(p.x-minX)*sc,
      y:originY+(p.y-minY)*sc,
    });

    // Grille solidaire
    const gs=sc; // 1 carreau = 1 mètre
    const gox=((originX%gs)+gs)%gs;
    const goy=((originY%gs)+gs)%gs;
    ctx.strokeStyle="#e0dbd0";ctx.lineWidth=0.8;
    for(let x=gox-gs;x<CW+gs;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,CH);ctx.stroke();}
    for(let y=goy-gs;y<CH+gs;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CW,y);ctx.stroke();}
    ctx.strokeStyle="#ccc8bc";ctx.lineWidth=1.2;
    for(let x=gox-gs*5;x<CW+gs*5;x+=gs*5){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,CH);ctx.stroke();}
    for(let y=goy-gs*5;y<CH+gs*5;y+=gs*5){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CW,y);ctx.stroke();}

    // Pièce
    const sPts=pts.map(toScreen);
    ctx.shadowColor="rgba(0,0,0,0.1)";ctx.shadowBlur=8;ctx.shadowOffsetX=2;ctx.shadowOffsetY=2;
    ctx.beginPath();ctx.moveTo(sPts[0].x,sPts[0].y);
    sPts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.closePath();ctx.fillStyle="rgba(255,252,235,0.97)";ctx.fill();
    ctx.shadowColor="transparent";ctx.shadowBlur=0;
    ctx.beginPath();ctx.moveTo(sPts[0].x,sPts[0].y);
    sPts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.closePath();ctx.strokeStyle="#c8820a";ctx.lineWidth=3;ctx.setLineDash([]);ctx.stroke();

    // Surface au centre
    const cx=sPts.reduce((s,p)=>s+p.x,0)/sPts.length;
    const cy=sPts.reduce((s,p)=>s+p.y,0)/sPts.length;
    ctx.textAlign="center";ctx.font="bold 14px sans-serif";
    const st=surf+" m²";const stw=ctx.measureText(st).width+18;
    ctx.fillStyle="rgba(255,255,255,0.92)";
    if(ctx.roundRect)ctx.roundRect(cx-stw/2,cy-12,stw,22,5);
    else ctx.rect(cx-stw/2,cy-12,stw,22);
    ctx.fill();ctx.fillStyle="#c8820a";ctx.fillText(st,cx,cy+5);

    // Cotes sur chaque arête
    hitZones.current=[];
    ctx.font="bold 11px sans-serif";
    aretes.forEach(ar=>{
      const A=sPts[ar.p1],B=sPts[ar.p2];
      const mx=(A.x+B.x)/2,my=(A.y+B.y)/2;
      const ddx=B.x-A.x,ddy=B.y-A.y,len=Math.hypot(ddx,ddy)||1;
      // Normale vers l'extérieur
      const nx=-ddy/len,ny=ddx/len;
      const OFF=28;
      const lx=mx+nx*OFF,ly=my+ny*OFF;

      // Valeur réelle = distance entre les 2 points en mètres
      const realDist=dist(pts[ar.p1],pts[ar.p2]).toFixed(2).replace(/\.00$/,"").replace(/(\.\d)0$/,"$1");
      const val=realDist+"m";

      ctx.setLineDash([4,3]);ctx.strokeStyle="#2a7fd4";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(lx,ly);ctx.stroke();ctx.setLineDash([]);
      const tw=Math.max(ctx.measureText(val).width+14,36),th=20;
      ctx.fillStyle="#e8f4ff";ctx.strokeStyle="#2a7fd4";ctx.lineWidth=1.5;
      ctx.beginPath();
      if(ctx.roundRect)ctx.roundRect(lx-tw/2,ly-th/2,tw,th,4);
      else ctx.rect(lx-tw/2,ly-th/2,tw,th);
      ctx.fill();ctx.stroke();
      ctx.fillStyle="#1a5fa8";ctx.textAlign="center";ctx.fillText(val,lx,ly+4);

      const kv=getKeyValue(forme,dims,ar.key);
      hitZones.current.push({key:kv.k,label:ar.label,val:String(kv.v),x:lx-tw/2,y:ly-th/2,w:tw,h:th});
    });

    ctx.textAlign="left";
    // Échelle = 1 carreau = 1m
    ctx.strokeStyle="#999";ctx.lineWidth=1.5;ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(12,CH-16);ctx.lineTo(12+sc,CH-16);ctx.stroke();
    ctx.beginPath();ctx.moveTo(12,CH-22);ctx.lineTo(12,CH-10);ctx.stroke();
    ctx.beginPath();ctx.moveTo(12+sc,CH-22);ctx.lineTo(12+sc,CH-10);ctx.stroke();
    ctx.fillStyle="#999";ctx.font="11px sans-serif";ctx.fillText("1m",12+sc/2-6,CH-20);
    ctx.fillStyle="#b06010";ctx.font="bold 13px sans-serif";ctx.fillText("N↑",CW-30,22);
  },[forme,dims,surf]);

  useEffect(()=>{
    const cv=cvRef.current;if(!cv)return;
    const resize=()=>{cv.width=window.innerWidth;cv.height=window.innerHeight;draw();};
    resize();window.addEventListener("resize",resize);
    return()=>window.removeEventListener("resize",resize);
  },[draw]);
  useEffect(()=>{draw();},[draw]);

  useEffect(()=>{
    const cv=cvRef.current;if(!cv)return;
    let moved=false;
    const ts=e=>{e.preventDefault();moved=false;
      if(e.touches.length===1){drag.current=true;lastT.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}
      if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;pinch.current=Math.hypot(dx,dy);}
    };
    const tm=e=>{e.preventDefault();moved=true;
      if(e.touches.length===1&&drag.current&&lastT.current){
        pan.current.x+=e.touches[0].clientX-lastT.current.x;
        pan.current.y+=e.touches[0].clientY-lastT.current.y;
        lastT.current={x:e.touches[0].clientX,y:e.touches[0].clientY};draw();
      }
      if(e.touches.length===2&&pinch.current){
        const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
        const d=Math.hypot(dx,dy);
        zoom.current=Math.min(10,Math.max(0.1,zoom.current*(d/pinch.current)));
        pinch.current=d;draw();
      }
    };
    const te=e=>{drag.current=false;pinch.current=null;
      if(!moved&&e.changedTouches.length===1){
        const r=cv.getBoundingClientRect();
        const tx=(e.changedTouches[0].clientX-r.left)*(cv.width/r.width);
        const ty=(e.changedTouches[0].clientY-r.top)*(cv.height/r.height);
        hitZones.current.forEach(z=>{
          if(tx>=z.x&&tx<=z.x+z.w&&ty>=z.y&&ty<=z.y+z.h)onAreteTap(z);
        });
      }
    };
    cv.addEventListener("touchstart",ts,{passive:false});
    cv.addEventListener("touchmove",tm,{passive:false});
    cv.addEventListener("touchend",te);
    return()=>{cv.removeEventListener("touchstart",ts);cv.removeEventListener("touchmove",tm);cv.removeEventListener("touchend",te);};
  },[draw,onAreteTap]);

  return <canvas ref={cvRef} style={{position:"fixed",top:0,left:0,width:"100%",height:"100%",touchAction:"none"}}/>;
}

function EditModal({item,onSave,onClose}){
  const[v,sv]=useState(String(Number(item.val).toFixed(2).replace(/\.00$/,"").replace(/(\.\d)0$/,"$1")));
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}>
      <div style={{background:"#1c1f2e",borderRadius:16,padding:24,width:"100%",maxWidth:300}}>
        <p style={{color:"#e8a838",fontWeight:700,fontSize:16,margin:"0 0 4px"}}>✏️ {item.label}</p>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
          <button onClick={()=>sv(p=>String(Math.max(0.1,parseFloat(p)-0.5).toFixed(1)))}
            style={{background:"#2a2d3e",border:"1px solid #444",borderRadius:8,color:"#fff",fontSize:22,padding:"6px 14px",cursor:"pointer"}}>−</button>
          <input type="number" value={v} min="0.1" step="0.1" onChange={e=>sv(e.target.value)}
            style={{flex:1,background:"#12151f",border:"2px solid #e8a838",borderRadius:8,color:"#fff",fontSize:24,padding:"8px",textAlign:"center"}}/>
          <button onClick={()=>sv(p=>String((parseFloat(p)+0.5).toFixed(1)))}
            style={{background:"#2a2d3e",border:"1px solid #444",borderRadius:8,color:"#fff",fontSize:22,padding:"6px 14px",cursor:"pointer"}}>＋</button>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:12,background:"#2a2d3e",border:"none",borderRadius:10,color:"#aaa",fontWeight:700,cursor:"pointer"}}>Annuler</button>
          <button onClick={()=>onSave(item.key,v)} style={{flex:1,padding:12,background:"#e8a838",border:"none",borderRadius:10,color:"#0f1117",fontWeight:800,cursor:"pointer"}}>✓ OK</button>
        </div>
      </div>
    </div>
  );
}

function Plan({data,onR}){
  const[dims,setDims]=useState(data.dims);
  const[editing,setEditing]=useState(null);
  const surf=calcSurf(data.id,dims);
  return(
    <div style={{position:"fixed",inset:0,overflow:"hidden"}}>
      {editing&&<EditModal item={editing}
        onSave={(key,val)=>{setDims(d=>({...d,[key]:val}));setEditing(null);}}
        onClose={()=>setEditing(null)}/>}
      <div style={{position:"fixed",top:0,left:0,right:0,zIndex:100,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",background:"rgba(15,17,23,0.85)",backdropFilter:"blur(8px)"}}>
        <button onClick={onR} style={{background:"none",border:"none",color:"#e8a838",fontSize:15,cursor:"pointer",fontWeight:700}}>← Retour</button>
        <span style={{color:"#fff",fontWeight:700,fontSize:15}}>{data.label}</span>
        <button style={{background:"#e8a838",border:"none",borderRadius:8,color:"#0f1117",fontWeight:800,fontSize:13,padding:"6px 12px",cursor:"pointer"}}>+ Éléments</button>
      </div>
      <PlanCanvas forme={data.id} dims={dims} surf={surf} onAreteTap={setEditing}/>
    </div>
  );
}

function Dims({f,onV,onR}){
  const ch=CHAMPS_INIT[f.id]||[];const[d,sd]=useState({});
  const ok=ch.every(c=>d[c.k]&&Number(d[c.k])>0);
  return(
    <div style={S.screen}>
      <button onClick={onR} style={S.back}>← Retour</button>
      <h2 style={S.h2}>{f.label}</h2>
      <p style={S.sub}>Dimensions de départ</p>
      <div style={{marginTop:16}}>
        {ch.map(c=><div key={c.k} style={{marginBottom:12}}>
          <label style={S.lbl}>{c.l}</label>
          <input type="number" min="0.1" step="0.5" placeholder="ex: 4"
            onChange={e=>sd(p=>({...p,[c.k]:e.target.value}))} style={S.inp}/>
        </div>)}
      </div>
      <button onClick={()=>ok&&onV({...f,dims:d})} style={{...S.cta,opacity:ok?1:0.4}} disabled={!ok}>Créer le plan →</button>
    </div>
  );
}

export default function App(){
  const[e,se]=useState("choix");const[f,sf]=useState(null);
  if(e==="dims")return<Dims f={f} onV={d=>{sf(d);se("plan")}} onR={()=>se("choix")}/>;
  if(e==="plan"&&f)return<Plan data={f} onR={()=>se("choix")}/>;
  return(
    <div style={S.screen}>
      <h1 style={{textAlign:"center",color:"#e8a838",fontSize:26,marginBottom:4}}>📐 PlanPro</h1>
      <p style={S.sub}>Choisissez la forme de la pièce</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:20}}>
        {FORMES.map(x=><button key={x.id} onClick={()=>{sf(x);se("dims")}} style={S.card2}>
          <div style={{fontWeight:700,fontSize:18}}>{x.label}</div>
        </button>)}
      </div>
    </div>
  );
}

const S={
  screen:{background:"#0f1117",minHeight:"100vh",padding:"20px 16px 40px",fontFamily:"sans-serif",color:"#fff",maxWidth:480,margin:"0 auto",boxSizing:"border-box"},
  back:{background:"none",border:"none",color:"#e8a838",fontSize:16,cursor:"pointer",padding:"4px 0",marginBottom:8},
  h2:{fontSize:20,fontWeight:700,margin:"8px 0 0"},
  sub:{color:"#aaa",fontSize:14,margin:"4px 0 0",textAlign:"center"},
  lbl:{color:"#aaa",fontSize:13,fontWeight:600,display:"block",marginBottom:4},
  inp:{width:"100%",padding:12,background:"#1c1f2e",border:"1px solid #333",borderRadius:10,color:"#fff",fontSize:18,boxSizing:"border-box"},
  cta:{width:"100%",padding:16,background:"#e8a838",border:"none",borderRadius:12,fontWeight:800,fontSize:17,cursor:"pointer",color:"#0f1117"},
  card2:{background:"#1c1f2e",border:"2px solid #2e3248",borderRadius:14,padding:20,color:"#fff",cursor:"pointer",textAlign:"center",width:"100%"}
};
