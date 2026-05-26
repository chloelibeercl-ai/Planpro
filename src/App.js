import{useState,useRef,useEffect,useCallback}from"react";
const F=[{id:"libre",label:"Forme libre"},{id:"U",label:"Forme U"},{id:"L",label:"Forme L"},{id:"triangle",label:"Triangle"}];

const CHAMPS_INIT={
  libre:[{k:"top",l:"Mur haut (m)"},{k:"right",l:"Mur droit (m)"},{k:"bot",l:"Mur bas (m)"},{k:"left",l:"Mur gauche (m)"}],
  triangle:[{k:"base",l:"Base (m)"},{k:"right",l:"Côté droit (m)"},{k:"left",l:"Côté gauche (m)"}],
  L:[{k:"l1",l:"Long.1"},{k:"l2",l:"Long.2"},{k:"w1",l:"Larg.1"},{k:"w2",l:"Larg.2"}],
  U:[{k:"lt",l:"Larg.totale"},{k:"ht",l:"Haut.totale"},{k:"ep",l:"Épaisseur"}],
};

const LABELS={
  top:"Mur haut",right:"Mur droit",bot:"Mur bas",left:"Mur gauche",
  base:"Base",
  r1:"Larg.dr.1",mid:"Retrait",r2:"Larg.dr.2",
  rout:"Haut.dr.",br:"Épais.dr.",rin:"Haut.int.dr.",inner:"Larg.int.",lin:"Haut.int.ga.",bl:"Épais.ga.",lout:"Haut.ga."
};

function initDims(f,r){
  const n=k=>Math.max(0.1,Number(r[k]||1));
  if(f==="libre")return{top:n("top"),right:n("right"),bot:n("bot"),left:n("left")};
  if(f==="triangle")return{base:n("base"),right:n("right"),left:n("left")};
  if(f==="L"){const l1=n("l1"),l2=n("l2"),w1=n("w1"),w2=n("w2");return{top:l1,r1:w1,mid:Math.max(0.1,l1-l2),r2:w2,bot:l2,left:w1+w2};}
  if(f==="U"){const lt=n("lt"),ht=n("ht"),ep=n("ep");return{top:lt,rout:ht,br:ep,rin:Math.max(0.1,ht-ep),inner:Math.max(0.1,lt-2*ep),lin:Math.max(0.1,ht-ep),bl:ep,lout:ht};}
  return{};
}

function v(d,k){return Math.max(0.1,Number(d[k]||1));}

// Dessin forme libre = quadrilatère avec 4 murs indépendants
// top=largeur haut, bot=largeur bas, left=hauteur gauche, right=hauteur droite
function getPts(f,d,ox,oy,sc){
  if(f==="libre"){
    const t=v(d,"top")*sc,b=v(d,"bot")*sc,l=v(d,"left")*sc,r=v(d,"right")*sc;
    // Coin haut-gauche = ox,oy
    // Coin haut-droit = ox+t, oy
    // Coin bas-droit = ox+b, oy+r  (bas aligné à gauche, hauteur droite)
    // Coin bas-gauche = ox, oy+l
    return[[ox,oy],[ox+t,oy],[ox+b,oy+r],[ox,oy+l]];
  }
  if(f==="triangle"){
    const b=v(d,"base")*sc,h=Math.max(v(d,"left"),v(d,"right"))*sc;
    return[[ox+b/2,oy],[ox+b,oy+h],[ox,oy+h]];
  }
  if(f==="L"){
    const t=v(d,"top")*sc,r1=v(d,"r1")*sc,mid=v(d,"mid")*sc,r2=v(d,"r2")*sc,bot=v(d,"bot")*sc;
    return[[ox,oy],[ox+t,oy],[ox+t,oy+r1],[ox+t-mid,oy+r1],[ox+t-mid,oy+r1+r2],[ox,oy+r1+r2]];
  }
  if(f==="U"){
    const t=v(d,"top")*sc,ro=v(d,"rout")*sc,ri=v(d,"rin")*sc,iw=v(d,"inner")*sc;
    const ep=(v(d,"top")-v(d,"inner"))/2*sc;
    return[[ox,oy],[ox+t,oy],[ox+t,oy+ro],[ox+t-ep,oy+ro],[ox+t-ep,oy+ro-ri],[ox+ep,oy+ro-ri],[ox+ep,oy+ro],[ox,oy+ro]];
  }
  return[];
}

function getRealSize(f,d){
  if(f==="libre")return{w:Math.max(v(d,"top"),v(d,"bot")),h:Math.max(v(d,"left"),v(d,"right"))};
  if(f==="triangle")return{w:v(d,"base"),h:Math.max(v(d,"left"),v(d,"right"))};
  if(f==="L")return{w:v(d,"top"),h:v(d,"r1")+v(d,"r2")};
  if(f==="U")return{w:v(d,"top"),h:v(d,"rout")};
  return{w:5,h:5};
}

function getAretePts(f,d,ox,oy,sc){
  const ar=[];
  if(f==="libre"){
    const t=v(d,"top")*sc,b=v(d,"bot")*sc,l=v(d,"left")*sc,r=v(d,"right")*sc;
    const pts=[[ox,oy],[ox+t,oy],[ox+b,oy+r],[ox,oy+l]];
    ar.push({key:"top",   x1:pts[0][0],y1:pts[0][1],x2:pts[1][0],y2:pts[1][1]});
    ar.push({key:"right", x1:pts[1][0],y1:pts[1][1],x2:pts[2][0],y2:pts[2][1]});
    ar.push({key:"bot",   x1:pts[3][0],y1:pts[3][1],x2:pts[2][0],y2:pts[2][1]});
    ar.push({key:"left",  x1:pts[0][0],y1:pts[0][1],x2:pts[3][0],y2:pts[3][1]});
  }else if(f==="triangle"){
    const b=v(d,"base")*sc,h=Math.max(v(d,"left"),v(d,"right"))*sc;
    ar.push({key:"base",  x1:ox,     y1:oy+h, x2:ox+b,   y2:oy+h});
    ar.push({key:"right", x1:ox+b/2, y1:oy,   x2:ox+b,   y2:oy+h});
    ar.push({key:"left",  x1:ox,     y1:oy+h, x2:ox+b/2, y2:oy});
  }else if(f==="L"){
    const t=v(d,"top")*sc,r1=v(d,"r1")*sc,mid=v(d,"mid")*sc,r2=v(d,"r2")*sc,bot=v(d,"bot")*sc;
    ar.push({key:"top",  x1:ox,       y1:oy,       x2:ox+t,     y2:oy});
    ar.push({key:"r1",   x1:ox+t,     y1:oy,       x2:ox+t,     y2:oy+r1});
    ar.push({key:"mid",  x1:ox+t-mid, y1:oy+r1,    x2:ox+t,     y2:oy+r1});
    ar.push({key:"r2",   x1:ox+t-mid, y1:oy+r1,    x2:ox+t-mid, y2:oy+r1+r2});
    ar.push({key:"bot",  x1:ox,       y1:oy+r1+r2, x2:ox+t-mid, y2:oy+r1+r2});
    ar.push({key:"left", x1:ox,       y1:oy,       x2:ox,        y2:oy+r1+r2});
  }else if(f==="U"){
    const t=v(d,"top")*sc,ro=v(d,"rout")*sc,ri=v(d,"rin")*sc;
    const ep=(v(d,"top")-v(d,"inner"))/2*sc;
    ar.push({key:"top",   x1:ox,      y1:oy,       x2:ox+t,    y2:oy});
    ar.push({key:"rout",  x1:ox+t,    y1:oy,       x2:ox+t,    y2:oy+ro});
    ar.push({key:"br",    x1:ox+t-ep, y1:oy+ro,    x2:ox+t,    y2:oy+ro});
    ar.push({key:"rin",   x1:ox+t-ep, y1:oy+ro-ri, x2:ox+t-ep, y2:oy+ro});
    ar.push({key:"inner", x1:ox+ep,   y1:oy+ro-ri, x2:ox+t-ep, y2:oy+ro-ri});
    ar.push({key:"lin",   x1:ox+ep,   y1:oy+ro-ri, x2:ox+ep,   y2:oy+ro});
    ar.push({key:"bl",    x1:ox,      y1:oy+ro,    x2:ox+ep,   y2:oy+ro});
    ar.push({key:"lout",  x1:ox,      y1:oy,       x2:ox,      y2:oy+ro});
  }
  return ar;
}

function calcSurf(f,d){
  if(f==="libre"){
    // Formule du quadrilatère (shoelace)
    const t=v(d,"top"),b=v(d,"bot"),l=v(d,"left"),r=v(d,"right");
    const pts=[[0,0],[t,0],[b,r],[0,l]];
    let area=0;
    for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length;area+=pts[i][0]*pts[j][1]-pts[j][0]*pts[i][1];}
    return Math.abs(area/2).toFixed(2);
  }
  if(f==="triangle")return((v(d,"base")*Math.max(v(d,"left"),v(d,"right")))/2).toFixed(2);
  if(f==="L")return(v(d,"top")*v(d,"r1")+v(d,"bot")*v(d,"r2")).toFixed(2);
  if(f==="U")return(v(d,"top")*v(d,"rout")-v(d,"inner")*v(d,"rin")).toFixed(2);
  return"—";
}

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
    const W=cv.width,H=cv.height;
    const ctx=cv.getContext("2d");
    ctx.clearRect(0,0,W,H);
    const z=zoom.current,px=pan.current.x,py=pan.current.y;
    const PAD=80;

    ctx.fillStyle="#f5f0e8";ctx.fillRect(0,0,W,H);

    const gs=40*z;
    const rs=getRealSize(forme,dims);
    const sc0=Math.min((W-PAD*2)/rs.w,(H-PAD*2)/rs.h);
    const sc=sc0*z;
    const planX=W/2-rs.w*sc/2+px;
    const planY=H/2-rs.h*sc/2+py;
    const gox=((planX%gs)+gs)%gs,goy=((planY%gs)+gs)%gs;

    ctx.strokeStyle="#e0dbd0";ctx.lineWidth=0.8;
    for(let x=gox-gs;x<W+gs;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=goy-gs;y<H+gs;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.strokeStyle="#ccc8bc";ctx.lineWidth=1.2;
    for(let x=gox-gs*5;x<W+gs*5;x+=gs*5){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=goy-gs*5;y<H+gs*5;y+=gs*5){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    const ox=planX,oy=planY;
    const pts=getPts(forme,dims,ox,oy,sc);
    if(!pts.length)return;

    ctx.shadowColor="rgba(0,0,0,0.1)";ctx.shadowBlur=8;ctx.shadowOffsetX=2;ctx.shadowOffsetY=2;
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    pts.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));
    ctx.closePath();ctx.fillStyle="rgba(255,252,235,0.97)";ctx.fill();
    ctx.shadowColor="transparent";ctx.shadowBlur=0;
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    pts.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));
    ctx.closePath();ctx.strokeStyle="#c8820a";ctx.lineWidth=3;ctx.setLineDash([]);ctx.stroke();

    // Surface centre
    const cx=pts.reduce((s,p)=>s+p[0],0)/pts.length;
    const cy=pts.reduce((s,p)=>s+p[1],0)/pts.length;
    ctx.textAlign="center";ctx.font="bold 14px sans-serif";
    const st=surf+" m²";const stw=ctx.measureText(st).width+18;
    ctx.fillStyle="rgba(255,255,255,0.92)";
    if(ctx.roundRect)ctx.roundRect(cx-stw/2,cy-12,stw,22,5);
    else ctx.rect(cx-stw/2,cy-12,stw,22);
    ctx.fill();ctx.fillStyle="#c8820a";ctx.fillText(st,cx,cy+5);

    // Cotes indépendantes
    hitZones.current=[];
    ctx.font="bold 11px sans-serif";
    getAretePts(forme,dims,ox,oy,sc).forEach(ar=>{
      const{key,x1,y1,x2,y2}=ar;
      if(Math.hypot(x2-x1,y2-y1)<4)return;
      const val=Number(dims[key]||1).toFixed(1).replace(/\.0$/,"")+"m";
      const mx=(x1+x2)/2,my=(y1+y2)/2;
      const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy)||1;
      const lx=mx+(-dy/len)*28,ly=my+(dx/len)*28;
      ctx.setLineDash([4,3]);ctx.strokeStyle="#2a7fd4";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(lx,ly);ctx.stroke();ctx.setLineDash([]);
      const tw=Math.max(ctx.measureText(val).width+14,36),th=20;
      ctx.fillStyle="#e8f4ff";ctx.strokeStyle="#2a7fd4";ctx.lineWidth=1.5;
      ctx.beginPath();
      if(ctx.roundRect)ctx.roundRect(lx-tw/2,ly-th/2,tw,th,4);
      else ctx.rect(lx-tw/2,ly-th/2,tw,th);
      ctx.fill();ctx.stroke();
      ctx.fillStyle="#1a5fa8";ctx.textAlign="center";ctx.fillText(val,lx,ly+4);
      hitZones.current.push({key,label:LABELS[key]||key,val:String(dims[key]||1),x:lx-tw/2,y:ly-th/2,w:tw,h:th});
    });

    ctx.textAlign="left";
    const bLen=sc*2;
    ctx.strokeStyle="#999";ctx.lineWidth=1.5;ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(12,H-16);ctx.lineTo(12+bLen,H-16);ctx.stroke();
    ctx.beginPath();ctx.moveTo(12,H-22);ctx.lineTo(12,H-10);ctx.stroke();
    ctx.beginPath();ctx.moveTo(12+bLen,H-22);ctx.lineTo(12+bLen,H-10);ctx.stroke();
    ctx.fillStyle="#999";ctx.font="11px sans-serif";ctx.fillText("2m",12+bLen/2-8,H-20);
    ctx.fillStyle="#b06010";ctx.font="bold 13px sans-serif";ctx.fillText("N↑",W-30,22);
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
        zoom.current=Math.min(8,Math.max(0.2,zoom.current*(d/pinch.current)));
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
  const[v,sv]=useState(String(Number(item.val).toFixed(1)));
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}>
      <div style={{background:"#1c1f2e",borderRadius:16,padding:24,width:"100%",maxWidth:300}}>
        <p style={{color:"#e8a838",fontWeight:700,fontSize:16,margin:"0 0 4px"}}>✏️ {item.label}</p>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
          <button onClick={()=>sv(p=>String(Math.max(0.1,parseFloat(p)-0.5).toFixed(1)))}
            style={{background:"#2a2d3e",border:"1px solid #444",borderRadius:8,color:"#fff",fontSize:22,padding:"6px 14px",cursor:"pointer"}}>−</button>
          <input type="number" value={v} min="0.1" step="0.5" onChange={e=>sv(e.target.value)}
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
          <input type="number" min="0.5" step="0.5" placeholder="ex: 4"
            onChange={e=>sd(p=>({...p,[c.k]:e.target.value}))} style={S.inp}/>
        </div>)}
      </div>
      <button onClick={()=>ok&&onV({...f,dims:initDims(f.id,d)})} style={{...S.cta,opacity:ok?1:0.4}} disabled={!ok}>Créer le plan →</button>
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
        {F.map(x=><button key={x.id} onClick={()=>{sf(x);se("dims")}} style={S.card2}>
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
