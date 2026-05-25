import{useState,useRef,useEffect,useCallback}from"react";
const F=[{id:"carre",label:"Carré",emoji:"⬜"},{id:"rectangle",label:"Rectangle",emoji:"▬"},{id:"triangle",label:"Triangle",emoji:"🔺"},{id:"U",label:"U",emoji:"⊓"},{id:"L",label:"L",emoji:"⌐"}];
const CHAMPS={carre:[{k:"cote",l:"Côté (m)"}],rectangle:[{k:"lon",l:"Longueur"},{k:"lar",l:"Largeur"}],triangle:[{k:"base",l:"Base"},{k:"haut",l:"Hauteur"}],L:[{k:"l1",l:"Long.1"},{k:"l2",l:"Long.2"},{k:"w1",l:"Larg.1"},{k:"w2",l:"Larg.2"}],U:[{k:"lt",l:"Larg.tot"},{k:"ht",l:"Haut.tot"},{k:"ep",l:"Épais."}]};

function getRealSize(f,d){
  const n=k=>Number(d[k]||1);
  if(f==="carre")return{w:n("cote"),h:n("cote")};
  if(f==="rectangle")return{w:n("lon"),h:n("lar")};
  if(f==="triangle")return{w:n("base"),h:n("haut")};
  if(f==="L")return{w:Math.max(n("l1"),n("l2")),h:n("w1")+n("w2")};
  if(f==="U")return{w:n("lt"),h:n("ht")};
  return{w:5,h:5};
}

function getPts(f,d,ox,oy,sc){
  const n=k=>Number(d[k]||1);
  if(f==="carre"){const s=n("cote")*sc;return[[ox,oy],[ox+s,oy],[ox+s,oy+s],[ox,oy+s]];}
  if(f==="rectangle"){const w=n("lon")*sc,h=n("lar")*sc;return[[ox,oy],[ox+w,oy],[ox+w,oy+h],[ox,oy+h]];}
  if(f==="triangle"){const b=n("base")*sc,h=n("haut")*sc;return[[ox+b/2,oy],[ox+b,oy+h],[ox,oy+h]];}
  if(f==="L"){const a=n("l1")*sc,b=n("l2")*sc,c=n("w1")*sc,e=n("w2")*sc;return[[ox,oy],[ox+a,oy],[ox+a,oy+c],[ox+b,oy+c],[ox+b,oy+c+e],[ox,oy+c+e]];}
  if(f==="U"){const W=n("lt")*sc,H=n("ht")*sc,E=n("ep")*sc;return[[ox,oy],[ox+W,oy],[ox+W,oy+H],[ox+W-E,oy+H],[ox+W-E,oy+E],[ox+E,oy+E],[ox+E,oy+H],[ox,oy+H]];}
  return[];
}

function PlanCanvas({forme,dims,onDimTap}){
  const cvRef=useRef();
  const hitZones=useRef([]);
  const CW=340,CH=320,PAD=48;

  const draw=useCallback(()=>{
    const cv=cvRef.current;if(!cv)return;
    const ctx=cv.getContext("2d");
    ctx.clearRect(0,0,CW,CH);

    // Fond fixe
    ctx.fillStyle="#f5f0e8";ctx.fillRect(0,0,CW,CH);

    // Grille fixe (toujours pareille)
    const gs=40;
    ctx.strokeStyle="#e0dbd0";ctx.lineWidth=0.8;
    for(let x=0;x<CW;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,CH);ctx.stroke();}
    for(let y=0;y<CH;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CW,y);ctx.stroke();}
    ctx.strokeStyle="#ccc8bc";ctx.lineWidth=1.2;
    for(let x=0;x<CW;x+=gs*5){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,CH);ctx.stroke();}
    for(let y=0;y<CH;y+=gs*5){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CW,y);ctx.stroke();}

    // Calcul échelle AUTO pour que le plan rentre toujours
    const rs=getRealSize(forme,dims);
    const sc=Math.min((CW-PAD*2)/rs.w,(CH-PAD*2)/rs.h);
    const pw=rs.w*sc,ph=rs.h*sc;
    const ox=(CW-pw)/2,oy=(CH-ph)/2;

    const pts=getPts(forme,dims,ox,oy,sc);
    if(!pts.length)return;

    // Ombre
    ctx.shadowColor="rgba(0,0,0,0.12)";ctx.shadowBlur=6;ctx.shadowOffsetX=2;ctx.shadowOffsetY=2;
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    pts.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));
    ctx.closePath();
    ctx.fillStyle="rgba(255,252,235,0.97)";ctx.fill();
    ctx.shadowColor="transparent";ctx.shadowBlur=0;

    // Murs
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
    pts.slice(1).forEach(p=>ctx.lineTo(p[0],p[1]));
    ctx.closePath();
    ctx.strokeStyle="#c8820a";ctx.lineWidth=3;ctx.setLineDash([]);ctx.stroke();

    // Cotes cliquables
    hitZones.current=[];
    ctx.font="bold 11px sans-serif";ctx.textAlign="center";

    const drawCote=(x1,y1,x2,y2,label,key)=>{
      ctx.setLineDash([5,3]);ctx.strokeStyle="#2a7fd4";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);
      const mx=(x1+x2)/2,my=(y1+y2)/2;
      const tw=Math.max(label.length*7+12,36),th=18;
      ctx.fillStyle="#fff";ctx.strokeStyle="#2a7fd4";ctx.lineWidth=1.5;
      ctx.beginPath();ctx.roundRect?ctx.roundRect(mx-tw/2,my-th/2,tw,th,5):ctx.rect(mx-tw/2,my-th/2,tw,th);
      ctx.fill();ctx.stroke();
      ctx.fillStyle="#2a7fd4";ctx.fillText(label,mx,my+4);
      hitZones.current.push({x:mx-tw/2,y:my-th/2,w:tw,h:th,key});
    };

    if(forme==="carre"){
      const s=Number(dims.cote||1)*sc;
      drawCote(ox,oy-20,ox+s,oy-20,dims.cote+"m","cote");
      drawCote(ox+s+20,oy,ox+s+20,oy+s,dims.cote+"m","cote");
    }else if(forme==="rectangle"){
      const w=Number(dims.lon||1)*sc,h=Number(dims.lar||1)*sc;
      drawCote(ox,oy-20,ox+w,oy-20,dims.lon+"m","lon");
      drawCote(ox+w+20,oy,ox+w+20,oy+h,dims.lar+"m","lar");
    }else if(forme==="triangle"){
      const b=Number(dims.base||1)*sc,h=Number(dims.haut||1)*sc;
      drawCote(ox,oy+h+20,ox+b,oy+h+20,dims.base+"m","base");
      drawCote(ox+b+20,oy+h/2,ox+b+20,oy+h,dims.haut+"m","haut");
    }else{
      const ch=CHAMPS[forme]||[];
      ch.forEach((c,i)=>{
        const v=Number(dims[c.k]||1)*sc;
        drawCote(ox+(i%2)*v/2,oy-(20+i*22),ox+v-(i%2)*v/2,oy-(20+i*22),dims[c.k]+"m",c.k);
      });
    }

    ctx.textAlign="left";

    // Barre échelle
    const bLen=sc*2;
    ctx.strokeStyle="#888";ctx.lineWidth=1.5;ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(8,CH-12);ctx.lineTo(8+bLen,CH-12);ctx.stroke();
    ctx.beginPath();ctx.moveTo(8,CH-17);ctx.lineTo(8,CH-7);ctx.stroke();
    ctx.beginPath();ctx.moveTo(8+bLen,CH-17);ctx.lineTo(8+bLen,CH-7);ctx.stroke();
    ctx.fillStyle="#888";ctx.font="10px sans-serif";ctx.fillText("2m",8+bLen/2-8,CH-16);

    // Nord
    ctx.fillStyle="#b06010";ctx.font="bold 12px sans-serif";ctx.fillText("N↑",CW-24,16);
  },[forme,dims]);

  useEffect(()=>{draw();},[draw]);

  useEffect(()=>{
    const cv=cvRef.current;if(!cv)return;
    let moved=false;
    const te=e=>{
      if(moved){moved=false;return;}
      if(e.changedTouches.length===1){
        const r=cv.getBoundingClientRect();
        const tx=(e.changedTouches[0].clientX-r.left)*(CW/r.width);
        const ty=(e.changedTouches[0].clientY-r.top)*(CH/r.height);
        hitZones.current.forEach(z=>{
          if(tx>=z.x&&tx<=z.x+z.w&&ty>=z.y&&ty<=z.y+z.h)onDimTap(z.key);
        });
      }
    };
    const tm=()=>{moved=true;};
    cv.addEventListener("touchmove",tm);
    cv.addEventListener("touchend",te);
    return()=>{cv.removeEventListener("touchmove",tm);cv.removeEventListener("touchend",te);};
  },[onDimTap]);

  return(
    <canvas ref={cvRef} width={CW} height={CH}
      style={{borderRadius:12,display:"block",margin:"0 auto",width:"100%",maxWidth:CW,touchAction:"none",boxShadow:"0 2px 12px rgba(0,0,0,0.15)"}}/>
  );
}

function EditModal({dimKey,value,label,onSave,onClose}){
  const[v,sv]=useState(String(value));
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20}}>
      <div style={{background:"#1c1f2e",borderRadius:16,padding:24,width:"100%",maxWidth:300}}>
        <p style={{color:"#e8a838",fontWeight:700,fontSize:16,margin:"0 0 16px"}}>✏️ {label}</p>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
          <button onClick={()=>sv(p=>String(Math.max(0.5,(parseFloat(p)-0.5).toFixed(1))))}
            style={{background:"#2a2d3e",border:"1px solid #444",borderRadius:8,color:"#fff",fontSize:22,padding:"6px 14px",cursor:"pointer"}}>−</button>
          <input type="number" value={v} min="0.5" step="0.5" onChange={e=>sv(e.target.value)}
            style={{flex:1,background:"#12151f",border:"2px solid #e8a838",borderRadius:8,color:"#fff",fontSize:24,padding:"8px",textAlign:"center"}}/>
          <button onClick={()=>sv(p=>String((parseFloat(p)+0.5).toFixed(1)))}
            style={{background:"#2a2d3e",border:"1px solid #444",borderRadius:8,color:"#fff",fontSize:22,padding:"6px 14px",cursor:"pointer"}}>＋</button>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:12,background:"#2a2d3e",border:"none",borderRadius:10,color:"#aaa",fontWeight:700,cursor:"pointer"}}>Annuler</button>
          <button onClick={()=>onSave(v)} style={{flex:1,padding:12,background:"#e8a838",border:"none",borderRadius:10,color:"#0f1117",fontWeight:800,cursor:"pointer"}}>✓ OK</button>
        </div>
      </div>
    </div>
  );
}

function Plan({data,onR}){
  const[dims,setDims]=useState(data.dims);
  const[editing,setEditing]=useState(null);
  const ch=CHAMPS[data.id]||[];
  const n=k=>Number(dims[k]||1);
  const surf=data.id==="carre"?(n("cote")**2).toFixed(2):data.id==="rectangle"?(n("lon")*n("lar")).toFixed(2):data.id==="triangle"?((n("base")*n("haut"))/2).toFixed(2):"—";
  const handleTap=key=>{const c=ch.find(x=>x.k===key);if(c)setEditing({key,label:c.l,value:dims[key]||"1"});};
  return(
    <div style={S.screen}>
      {editing&&<EditModal dimKey={editing.key} value={editing.value} label={editing.label}
        onSave={v=>{setDims(d=>({...d,[editing.key]:v}));setEditing(null);}}
        onClose={()=>setEditing(null)}/>}
      <button onClick={onR} style={S.back}>← Retour</button>
      <h2 style={{...S.h2,marginBottom:2}}>{data.emoji} {data.label}</h2>
      <p style={{color:"#888",fontSize:12,marginBottom:8}}>💡 Touche une cote bleue pour modifier</p>
      <PlanCanvas forme={data.id} dims={dims} onDimTap={handleTap}/>
      <div style={{...S.card,marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{color:"#aaa",fontSize:14}}>Surface</span>
        <span style={{color:"#e8a838",fontWeight:800,fontSize:22}}>{surf} m²</span>
      </div>
      <button style={{...S.cta,marginTop:12}}>✚ Portes &amp; fenêtres</button>
    </div>
  );
}

function Dims({f,onV,onR}){
  const ch=CHAMPS[f.id]||[];const[d,sd]=useState({});
  const ok=ch.every(c=>d[c.k]&&Number(d[c.k])>0);
  return(
    <div style={S.screen}>
      <button onClick={onR} style={S.back}>← Retour</button>
      <h2 style={S.h2}>{f.emoji} {f.label}</h2>
      <p style={S.sub}>Dimensions de départ</p>
      <div style={{marginTop:16}}>
        {ch.map(c=><div key={c.k} style={{marginBottom:12}}>
          <label style={S.lbl}>{c.l}</label>
          <input type="number" min="0.5" step="0.5" placeholder="ex: 4"
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
        {F.map(x=><button key={x.id} onClick={()=>{sf(x);se("dims")}} style={S.card2}>
          <div style={{fontSize:24}}>{x.emoji}</div>
          <div style={{fontWeight:700,marginTop:4}}>{x.label}</div>
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
  card:{background:"#1c1f2e",borderRadius:12,padding:"14px 16px"},
  card2:{background:"#1c1f2e",border:"2px solid #2e3248",borderRadius:14,padding:20,color:"#fff",cursor:"pointer",textAlign:"center",width:"100%"}
};
