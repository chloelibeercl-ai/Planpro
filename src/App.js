import{useState,useRef,useEffect,useCallback}from"react";
const F=[{id:"carre",label:"Carré",emoji:"⬜"},{id:"rectangle",label:"Rectangle",emoji:"▬"},{id:"triangle",label:"Triangle",emoji:"🔺"},{id:"U",label:"U",emoji:"⊓"},{id:"L",label:"L",emoji:"⌐"}];
const CHAMPS={carre:[{k:"cote",l:"Côté (m)"}],rectangle:[{k:"lon",l:"Longueur"},{k:"lar",l:"Largeur"}],triangle:[{k:"base",l:"Base"},{k:"haut",l:"Hauteur"}],L:[{k:"l1",l:"Long.1"},{k:"l2",l:"Long.2"},{k:"w1",l:"Larg.1"},{k:"w2",l:"Larg.2"}],U:[{k:"lt",l:"Larg.tot"},{k:"ht",l:"Haut.tot"},{k:"ep",l:"Épais."}]};
const BG="#f5f0e8";const WALL="#c8820a";const GRID="#d9d4c8";const DIM="#2a7fd4";

function getRealSize(f,d){const n=k=>Number(d[k]||1);if(f==="carre")return{w:n("cote"),h:n("cote")};if(f==="rectangle")return{w:n("lon"),h:n("lar")};if(f==="triangle")return{w:n("base"),h:n("haut")};if(f==="L")return{w:Math.max(n("l1"),n("l2")),h:n("w1")+n("w2")};if(f==="U")return{w:n("lt"),h:n("ht")};return{w:5,h:5};}
function getPts(f,d,ox,oy,sc){const n=k=>Number(d[k]||1);if(f==="carre"){const s=n("cote")*sc;return[[ox,oy],[ox+s,oy],[ox+s,oy+s],[ox,oy+s]];}if(f==="rectangle"){const w=n("lon")*sc,h=n("lar")*sc;return[[ox,oy],[ox+w,oy],[ox+w,oy+h],[ox,oy+h]];}if(f==="triangle"){const b=n("base")*sc,h=n("haut")*sc;return[[ox+b/2,oy],[ox+b,oy+h],[ox,oy+h]];}if(f==="L"){const a=n("l1")*sc,b=n("l2")*sc,c=n("w1")*sc,e=n("w2")*sc;return[[ox,oy],[ox+a,oy],[ox+a,oy+c],[ox+b,oy+c],[ox+b,oy+c+e],[ox,oy+c+e]];}if(f==="U"){const W=n("lt")*sc,H=n("ht")*sc,E=n("ep")*sc;return[[ox,oy],[ox+W,oy],[ox+W,oy+H],[ox+W-E,oy+H],[ox+W-E,oy+E],[ox+E,oy+E],[ox+E,oy+H],[ox,oy+H]];}return[];}

function PlanCanvas({forme,dims,onDimTap}){
  const cvRef=useRef();
  const zoom=useRef(1);
  const pan=useRef({x:0,y:0});
  const drag=useRef(false);
  const lastT=useRef(null);
  const pinch=useRef(null);
  const hitZones=useRef([]);

  const draw=useCallback(()=>{
    const cv=cvRef.current;if(!cv)return;
    const ctx=cv.getContext("2d");
    const W=cv.width,H=cv.height;
    ctx.clearRect(0,0,W,H);

    // Fond blanc cassé FIXE
    ctx.fillStyle=BG;ctx.fillRect(0,0,W,H);

    // Grille FIXE (ne bouge pas avec le plan)
    const gs=50;
    ctx.strokeStyle=GRID;ctx.lineWidth=0.8;
    for(let x=0;x<W;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.strokeStyle="#c8c3b5";ctx.lineWidth=1.2;
    for(let x=0;x<W;x+=gs*5){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=gs*5){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    // Pièce (elle se déplace avec le pan/zoom)
    const rs=getRealSize(forme,dims);
    const base=Math.min((W-80)/rs.w,(H-80)/rs.h);
    const sc=base*zoom.current;
    const ox=W/2-rs.w*sc/2+pan.current.x;
    const oy=H/2-rs.h*sc/2+pan.current.y;
    const pts=getPts(forme,dims,ox,oy,sc);
    if(!pts.length)return;

    // Ombre douce
    ctx.shadowColor="rgba(0,0,0,0.15)";ctx.shadowBlur=8;ctx.shadowOffsetX=3;ctx.shadowOffsetY=3;
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    pts.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));
    ctx.closePath();
    ctx.fillStyle="rgba(255,248,220,0.95)";ctx.fill();
    ctx.shadowColor="transparent";ctx.shadowBlur=0;

    // Murs
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    pts.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));
    ctx.closePath();
    ctx.strokeStyle=WALL;ctx.lineWidth=3;ctx.setLineDash([]);ctx.stroke();

    // Cotes cliquables
    hitZones.current=[];
    const ch=CHAMPS[forme]||[];
    ctx.font="bold 12px sans-serif";

    if(forme==="carre"||forme==="rectangle"){
      const w=(forme==="carre"?Number(dims.cote):Number(dims.lon))*sc;
      const h=(forme==="carre"?Number(dims.cote):Number(dims.lar))*sc;
      const kw=forme==="carre"?"cote":"lon";
      const kh=forme==="carre"?"cote":"lar";
      // Cote haut
      const lw=forme==="carre"?dims.cote:dims.lon;
      drawCote(ctx,ox,oy-22,ox+w,oy-22,lw+"m",DIM);
      hitZones.current.push({x:ox+w/2-25,y:oy-36,w:50,h:20,key:kw});
      // Cote droite
      const lh=forme==="carre"?dims.cote:dims.lar;
      drawCote(ctx,ox+w+22,oy,ox+w+22,oy+h,lh+"m",DIM,true);
      hitZones.current.push({x:ox+w+10,y:oy+h/2-12,w:44,h:20,key:kh});
    }else if(forme==="triangle"){
      drawCote(ctx,ox,oy+Number(dims.haut)*sc+22,ox+Number(dims.base)*sc,oy+Number(dims.haut)*sc+22,dims.base+"m",DIM);
      hitZones.current.push({x:ox+Number(dims.base)*sc/2-25,y:oy+Number(dims.haut)*sc+10,w:50,h:20,key:"base"});
    }else{
      // Pour L et U — juste les 2 premières cotes
      ch.slice(0,2).forEach((c,i)=>{
        const val=Number(dims[c.k]||1)*sc;
        const tx=ox+val/2-20,ty=oy-(i===0?22:40);
        drawCote(ctx,ox,oy-(i*18+22),ox+val,oy-(i*18+22),dims[c.k]+"m",DIM);
        hitZones.current.push({x:tx,y:ty,w:44,h:18,key:c.k});
      });
    }

    // Barre échelle
    const bLen=sc*2;
    ctx.strokeStyle="#888";ctx.lineWidth=1.5;ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(14,H-18);ctx.lineTo(14+bLen,H-18);ctx.stroke();
    ctx.beginPath();ctx.moveTo(14,H-23);ctx.lineTo(14,H-13);ctx.stroke();
    ctx.beginPath();ctx.moveTo(14+bLen,H-23);ctx.lineTo(14+bLen,H-13);ctx.stroke();
    ctx.fillStyle="#666";ctx.font="11px sans-serif";ctx.fillText("2m",14+bLen/2-8,H-22);

    // Nord
    ctx.fillStyle="#b06010";ctx.font="bold 13px sans-serif";ctx.fillText("N↑",W-28,20);
  },[forme,dims]);

  function drawCote(ctx,x1,y1,x2,y2,label,color,vertical=false){
    ctx.setLineDash([5,3]);ctx.strokeStyle=color;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);
    const mx=(x1+x2)/2,my=(y1+y2)/2;
    const tw=label.length*7+8;
    ctx.fillStyle="#fff";ctx.strokeStyle=DIM;ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect?ctx.roundRect(mx-tw/2,my-10,tw,18,4):ctx.rect(mx-tw/2,my-10,tw,18);
    ctx.fill();ctx.stroke();
    ctx.fillStyle=color;ctx.font="bold 11px sans-serif";ctx.textAlign="center";
    ctx.fillText(label,mx,my+4);ctx.textAlign="left";
  }

  useEffect(()=>{draw();},[draw]);

  useEffect(()=>{
    const cv=cvRef.current;if(!cv)return;
    const rect=()=>cv.getBoundingClientRect();
    const ts=e=>{
      if(e.touches.length===1){drag.current=true;lastT.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}
      if(e.touches.length===2){const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;pinch.current=Math.sqrt(dx*dx+dy*dy);}
    };
    const tm=e=>{
      e.preventDefault();
      if(e.touches.length===1&&drag.current&&lastT.current){
        pan.current.x+=e.touches[0].clientX-lastT.current.x;
        pan.current.y+=e.touches[0].clientY-lastT.current.y;
        lastT.current={x:e.touches[0].clientX,y:e.touches[0].clientY};draw();
      }
      if(e.touches.length===2&&pinch.current){
        const dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;
        const d=Math.sqrt(dx*dx+dy*dy);
        zoom.current=Math.min(5,Math.max(0.2,zoom.current*(d/pinch.current)));
        pinch.current=d;draw();
      }
    };
    const te=e=>{
      drag.current=false;pinch.current=null;
      if(e.changedTouches.length===1){
        const r=rect();
        const tx=e.changedTouches[0].clientX-r.left;
        const ty=e.changedTouches[0].clientY-r.top;
        hitZones.current.forEach(z=>{
          if(tx>=z.x&&tx<=z.x+z.w&&ty>=z.y&&ty<=z.y+z.h){onDimTap(z.key);}
        });
      }
    };
    cv.addEventListener("touchstart",ts,{passive:false});
    cv.addEventListener("touchmove",tm,{passive:false});
    cv.addEventListener("touchend",te);
    return()=>{cv.removeEventListener("touchstart",ts);cv.removeEventListener("touchmove",tm);cv.removeEventListener("touchend",te);};
  },[draw,onDimTap]);

  const reset=()=>{zoom.current=1;pan.current={x:0,y:0};draw();};
  return(<div>
    <canvas ref={cvRef} width={340} height={320} style={{borderRadius:12,display:"block",margin:"0 auto",maxWidth:"100%",touchAction:"none",boxShadow:"0 2px 12px rgba(0,0,0,0.15)"}}/>
    <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:8}}>
      <button onClick={()=>{zoom.current=Math.min(5,zoom.current+0.3);draw();}} style={Sb}>＋ Zoom</button>
      <button onClick={()=>{zoom.current=Math.max(0.2,zoom.current-0.3);draw();}} style={Sb}>－ Zoom</button>
      <button onClick={reset} style={Sb}>⌂ Reset</button>
    </div>
  </div>);
}

const Sb={background:"#2a2d3e",border:"1px solid #3a3d4e",borderRadius:8,color:"#fff",padding:"6px 12px",fontSize:13,cursor:"pointer"};

function EditModal({dimKey,value,label,onSave,onClose}){
  const[v,sv]=useState(value);
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
    <div style={{background:"#1c1f2e",borderRadius:16,padding:24,width:280,boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>
      <p style={{color:"#e8a838",fontWeight:700,fontSize:16,margin:"0 0 16px"}}>✏️ {label}</p>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
        <button onClick={()=>sv(p=>Math.max(0.5,(Number(p)-0.5)).toFixed(1))} style={{...Sb,fontSize:20,padding:"6px 14px"}}>−</button>
        <input type="number" value={v} min="0.5" step="0.5" onChange={e=>sv(e.target.value)}
          style={{flex:1,background:"#12151f",border:"2px solid #e8a838",borderRadius:8,color:"#fff",fontSize:22,padding:"8px",textAlign:"center"}}/>
        <button onClick={()=>sv(p=>(Number(p)+0.5).toFixed(1))} style={{...Sb,fontSize:20,padding:"6px 14px"}}>＋</button>
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={onClose} style={{flex:1,padding:12,background:"#2a2d3e",border:"none",borderRadius:10,color:"#aaa",fontWeight:700,cursor:"pointer"}}>Annuler</button>
        <button onClick={()=>onSave(v)} style={{flex:1,padding:12,background:"#e8a838",border:"none",borderRadius:10,color:"#0f1117",fontWeight:800,cursor:"pointer"}}>✓ OK</button>
      </div>
    </div>
  </div>);}

function Plan({data,onR}){
  const[dims,setDims]=useState(data.dims);
  const[editing,setEditing]=useState(null);
  const ch=CHAMPS[data.id]||[];
  const surf=data.id==="carre"?(Number(dims.cote)**2).toFixed(2):data.id==="rectangle"?(Number(dims.lon)*Number(dims.lar)).toFixed(2):data.id==="triangle"?((Number(dims.base)*Number(dims.haut))/2).toFixed(2):"—";
  const handleTap=key=>{const c=ch.find(x=>x.k===key);if(c)setEditing({key,label:c.l,value:dims[key]||"1"});};
  const handleSave=v=>{setDims(d=>({...d,[editing.key]:v}));setEditing(null);};
  return(<div style={S.screen}>
    {editing&&<EditModal dimKey={editing.key} value={editing.value} label={editing.label} onSave={handleSave} onClose={()=>setEditing(null)}/>}
    <button onClick={onR} style={S.back}>← Retour</button>
    <h2 style={{...S.h2,marginBottom:4}}>{data.emoji} {data.label}</h2>
    <p style={{color:"#888",fontSize:12,marginBottom:8}}>💡 Touche une cote bleue pour la modifier</p>
    <PlanCanvas forme={data.id} dims={dims} onDimTap={handleTap}/>
    <div style={{...S.card,marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <span style={{color:"#aaa",fontSize:14}}>Surface</span>
      <span style={{color:"#e8a838",fontWeight:800,fontSize:22}}>{surf} m²</span>
    </div>
    <button style={{...S.cta,marginTop:12}}>✚ Portes &amp; fenêtres</button>
  </div>);}

function Dims({f,onV,onR}){
  const ch=CHAMPS[f.id]||[];const[d,sd]=useState({});
  const ok=ch.every(c=>d[c.k]&&Number(d[c.k])>0);
  return(<div style={S.screen}>
    <button onClick={onR} style={S.back}>← Retour</button>
    <h2 style={S.h2}>{f.emoji} {f.label}</h2>
    <p style={S.sub}>Dimensions de départ</p>
    <div style={{marginTop:16}}>{ch.map(c=><div key={c.k} style={{marginBottom:12}}>
      <label style={S.lbl}>{c.l}</label>
      <input type="number" min="0.5" step="0.5" placeholder="ex: 4" onChange={e=>sd(p=>({...p,[c.k]:e.target.value}))} style={S.inp}/>
    </div>)}</div>
    <button onClick={()=>ok&&onV({...f,dims:d})} style={{...S.cta,opacity:ok?1:0.4}} disabled={!ok}>Créer le plan →</button>
  </div>);}

export default function App(){
  const[e,se]=useState("choix");const[f,sf]=useState(null);
  if(e==="dims")return<Dims f={f} onV={d=>{sf(d);se("plan")}} onR={()=>se("choix")}/>;
  if(e==="plan"&&f)return<Plan data={f} onR={()=>se("choix")}/>;
  return(<div style={S.screen}>
    <h1 style={{textAlign:"center",color:"#e8a838",fontSize:26,marginBottom:4}}>📐 PlanPro</h1>
    <p style={S.sub}>Choisissez la forme de la pièce</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:20}}>
      {F.map(x=><button key={x.id} onClick={()=>{sf(x);se("dims")}} style={S.card2}>
        <div style={{fontSize:24}}>{x.emoji}</div>
        <div style={{fontWeight:700,marginTop:4}}>{x.label}</div>
      </button>)}
    </div>
  </div>);}

const S={screen:{background:"#0f1117",minHeight:"100vh",padding:"20px 16px 40px",fontFamily:"sans-serif",color:"#fff",maxWidth:480,margin:"0 auto",boxSizing:"border-box"},back:{background:"none",border:"none",color:"#e8a838",fontSize:16,cursor:"pointer",padding:"4px 0",marginBottom:8},h2:{fontSize:20,fontWeight:700,margin:"8px 0 0"},sub:{color:"#aaa",fontSize:14,margin:"4px 0 0",textAlign:"center"},lbl:{color:"#aaa",fontSize:13,fontWeight:600,display:"block",marginBottom:4},inp:{width:"100%",padding:12,background:"#1c1f2e",border:"1px solid #333",borderRadius:10,color:"#fff",fontSize:18,boxSizing:"border-box"},cta:{width:"100%",padding:16,background:"#e8a838",border:"none",borderRadius:12,fontWeight:800,fontSize:17,cursor:"pointer",color:"#0f1117"},card:{background:"#1c1f2e",borderRadius:12,padding:"14px 16px"},card2:{background:"#1c1f2e",border:"2px solid #2e3248",borderRadius:14,padding:20,color:"#fff",cursor:"pointer",textAlign:"center",width:"100%"}};
