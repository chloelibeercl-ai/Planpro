import{useState,useRef,useEffect,useCallback}from"react";

const FORMES=[
  {id:"rectangle",label:"Rectangle"},
  {id:"L",label:"Forme L"},
  {id:"U",label:"Forme U"},
  {id:"triangle",label:"Triangle"},
];

const CHAMPS_INIT={
  rectangle:[{k:"w",l:"Largeur (m)"},{k:"h",l:"Hauteur (m)"}],
  L:[{k:"l1",l:"Long. bras haut"},{k:"h1",l:"Haut. bras haut"},{k:"l2",l:"Long. bras bas"},{k:"h2",l:"Haut. bras bas"}],
  U:[{k:"lt",l:"Larg. totale"},{k:"ht",l:"Haut. totale"},{k:"ep_g",l:"Épais. gauche"},{k:"ep_d",l:"Épais. droite"},{k:"ep_h",l:"Épais. barre haut"}],
  triangle:[{k:"base",l:"Base"},{k:"haut",l:"Hauteur"},{k:"dec",l:"Décalage sommet"}],
};

// Construit les points en mètres et les arêtes
// Chaque arête a une key UNIQUE pour édition indépendante
function buildShape(f,d){
  const g=k=>Math.max(0.1,Number(d[k]||1));
  if(f==="rectangle"){
    const w=g("w"),h=g("h");
    return{
      pts:[{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}],
      aretes:[
        {p1:0,p2:1,key:"w",label:"Largeur haut"},
        {p1:1,p2:2,key:"h",label:"Hauteur droite"},
        {p1:2,p2:3,key:"w",label:"Largeur bas"},
        {p1:3,p2:0,key:"h",label:"Hauteur gauche"},
      ]
    };
  }
  if(f==="L"){
    // L = bras haut (large) + bras bas (moins large, aligné à gauche)
    const l1=g("l1"),h1=g("h1"),l2=g("l2"),h2=g("h2");
    return{
      pts:[
        {x:0,  y:0},       // 0 haut-gauche
        {x:l1, y:0},       // 1 haut-droite
        {x:l1, y:h1},      // 2 coin rentrant
        {x:l2, y:h1},      // 3 coin rentrant bas
        {x:l2, y:h1+h2},   // 4 bas-droite
        {x:0,  y:h1+h2},   // 5 bas-gauche
      ],
      aretes:[
        {p1:0,p2:1,key:"l1",label:"Long. haut"},
        {p1:1,p2:2,key:"h1",label:"Haut. droite"},
        {p1:2,p2:3,key:"l1",label:"Retrait"},
        {p1:3,p2:4,key:"h2",label:"Haut. bas"},
        {p1:4,p2:5,key:"l2",label:"Long. bas"},
        {p1:5,p2:0,key:"h1",label:"Haut. gauche"},
      ]
    };
  }
  if(f==="U"){
    // U = barre en haut + 2 jambes vers le bas
    // Points dans l'ordre horaire :
    const lt=g("lt"),ht=g("ht"),epg=g("ep_g"),epd=g("ep_d"),eph=g("ep_h");
    const x0=0, x1=epg, x2=lt-epd, x3=lt;
    const y0=0, y1=eph, y2=ht;
    return{
      pts:[
        {x:x0,y:y0}, // 0: haut-gauche ext
        {x:x3,y:y0}, // 1: haut-droite ext
        {x:x3,y:y2}, // 2: bas-droite ext
        {x:x2,y:y2}, // 3: bas-droite int (jambe droite)
        {x:x2,y:y1}, // 4: jonction droite
        {x:x1,y:y1}, // 5: jonction gauche
        {x:x1,y:y2}, // 6: bas-gauche int (jambe gauche)
        {x:x0,y:y2}, // 7: bas-gauche ext
      ],
      aretes:[
        {p1:0,p2:1,key:"lt",  label:"Larg. totale"},
        {p1:1,p2:2,key:"ht",  label:"Jambe droite ext"},
        {p1:2,p2:3,key:"ep_d",label:"Épais. jambe dr."},
        {p1:3,p2:4,key:"ht",  label:"Jambe droite int"},
        {p1:4,p2:5,key:"lt",  label:"Ouverture int."},
        {p1:5,p2:6,key:"ht",  label:"Jambe gauche int"},
        {p1:6,p2:7,key:"ep_g",label:"Épais. jambe ga."},
        {p1:7,p2:0,key:"ht",  label:"Jambe gauche ext"},
      ]
    };
  }
  if(f==="triangle"){
    const b=g("base"),h=g("haut"),dec=Math.min(g("dec"),b);
    return{
      pts:[{x:0,y:h},{x:b,y:h},{x:dec,y:0}],
      aretes:[
        {p1:0,p2:1,key:"base",label:"Base"},
        {p1:1,p2:2,key:"haut",label:"Côté droit"},
        {p1:2,p2:0,key:"haut",label:"Côté gauche"},
      ]
    };
  }
  return{pts:[],aretes:[]};
}

function calcSurf(f,d){
  const{pts}=buildShape(f,d);
  if(pts.length<3)return"—";
  let a=0;
  for(let i=0;i<pts.length;i++){
    const j=(i+1)%pts.length;
    a+=pts[i].x*pts[j].y-pts[j].x*pts[i].y;
  }
  return Math.abs(a/2).toFixed(2);
}

function ptDist(a,b){return Math.hypot(b.x-a.x,b.y-a.y);}

function PlanCanvas({forme,dims,surf,onAreteTap}){
  const cvRef=useRef();
  const zoom=useRef(1);
  const pan=useRef({x:0,y:0});
  const drag=useRef(false);
  const lastT=useRef(null);
  const pinch=useRef(null);
  const hits=useRef([]);

  const draw=useCallback(()=>{
    const cv=cvRef.current;if(!cv)return;
    const CW=cv.width,CH=cv.height;
    const ctx=cv.getContext("2d");
    ctx.clearRect(0,0,CW,CH);
    const z=zoom.current,px=pan.current.x,py=pan.current.y;
    const PAD=80;

    ctx.fillStyle="#f5f0e8";ctx.fillRect(0,0,CW,CH);

    const{pts,aretes}=buildShape(forme,dims);
    if(!pts.length)return;

    const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);
    const minX=Math.min(...xs),maxX=Math.max(...xs);
    const minY=Math.min(...ys),maxY=Math.max(...ys);
    const rw=maxX-minX||1,rh=maxY-minY||1;
    const sc0=Math.min((CW-PAD*2)/rw,(CH-PAD*2)/rh);
    const sc=sc0*z;

    // sc = pixels par mètre → grille 1 carreau = 1m
    const toX=x=>CW/2+(x-minX-rw/2)*sc+px;
    const toY=y=>CH/2+(y-minY-rh/2)*sc+py;

    // Grille solidaire (1 carreau = 1m)
    const gs=sc;
    const gox=((toX(minX)%gs)+gs)%gs;
    const goy=((toY(minY)%gs)+gs)%gs;
    ctx.strokeStyle="#e0dbd0";ctx.lineWidth=0.8;
    for(let x=gox-gs;x<CW+gs;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,CH);ctx.stroke();}
    for(let y=goy-gs;y<CH+gs;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CW,y);ctx.stroke();}
    ctx.strokeStyle="#ccc8bc";ctx.lineWidth=1.2;
    for(let x=gox-gs*5;x<CW+gs*5;x+=gs*5){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,CH);ctx.stroke();}
    for(let y=goy-gs*5;y<CH+gs*5;y+=gs*5){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CW,y);ctx.stroke();}

    // Pièce
    ctx.shadowColor="rgba(0,0,0,0.1)";ctx.shadowBlur=8;ctx.shadowOffsetX=2;ctx.shadowOffsetY=2;
    ctx.beginPath();ctx.moveTo(toX(pts[0].x),toY(pts[0].y));
    pts.slice(1).forEach(p=>ctx.lineTo(toX(p.x),toY(p.y)));
    ctx.closePath();ctx.fillStyle="rgba(255,252,235,0.97)";ctx.fill();
    ctx.shadowColor="transparent";ctx.shadowBlur=0;
    ctx.beginPath();ctx.moveTo(toX(pts[0].x),toY(pts[0].y));
    pts.slice(1).forEach(p=>ctx.lineTo(toX(p.x),toY(p.y)));
    ctx.closePath();ctx.strokeStyle="#c8820a";ctx.lineWidth=3;ctx.setLineDash([]);ctx.stroke();

    // Surface au centre
    const cx=pts.reduce((s,p)=>s+toX(p.x),0)/pts.length;
    const cy=pts.reduce((s,p)=>s+toY(p.y),0)/pts.length;
    ctx.textAlign="center";ctx.font="bold 14px sans-serif";
    const st=surf+" m²";const stw=ctx.measureText(st).width+18;
    ctx.fillStyle="rgba(255,255,255,0.92)";
    if(ctx.roundRect)ctx.roundRect(cx-stw/2,cy-12,stw,22,5);
    else ctx.rect(cx-stw/2,cy-12,stw,22);
    ctx.fill();ctx.fillStyle="#c8820a";ctx.fillText(st,cx,cy+5);

    // Cotes — valeur = distance réelle entre les 2 points
    hits.current=[];
    ctx.font="bold 11px sans-serif";
    aretes.forEach(ar=>{
      const A=pts[ar.p1],B=pts[ar.p2];
      const ax=toX(A.x),ay=toY(A.y),bx=toX(B.x),by=toY(B.y);
      const mx=(ax+bx)/2,my=(ay+by)/2;
      const ddx=bx-ax,ddy=by-ay,len=Math.hypot(ddx,ddy)||1;
      const nx=-ddy/len,ny=ddx/len;
      const lx=mx+nx*30,ly=my+ny*30;
      // Distance réelle en mètres
      const realM=ptDist(A,B);
      const val=realM.toFixed(1).replace(/\.0$/,"")+"m";
      ctx.setLineDash([4,3]);ctx.strokeStyle="#2a7fd4";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(lx,ly);ctx.stroke();ctx.setLineDash([]);
      const tw=Math.max(ctx.measureText(val).width+14,36),th=20;
      ctx.fillStyle="#e8f4ff";ctx.strokeStyle="#2a7fd4";ctx.lineWidth=1.5;
      ctx.beginPath();
      if(ctx.roundRect)ctx.roundRect(lx-tw/2,ly-th/2,tw,th,4);
      else ctx.rect(lx-tw/2,ly-th/2,tw,th);
      ctx.fill();ctx.stroke();
      ctx.fillStyle="#1a5fa8";ctx.textAlign="center";ctx.fillText(val,lx,ly+4);
      hits.current.push({key:ar.key,label:ar.label,val:String(Number(d[ar.key]||realM).toFixed(1)),x:lx-tw/2,y:ly-th/2,w:tw,h:th});
    });

    ctx.textAlign="left";
    // Échelle : 1 carreau = 1m
    ctx.strokeStyle="#999";ctx.lineWidth=1.5;ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(12,CH-16);ctx.lineTo(12+sc,CH-16);ctx.stroke();
    ctx.beginPath();ctx.moveTo(12,CH-22);ctx.lineTo(12,CH-10);ctx.stroke();
    ctx.beginPath();ctx.moveTo(12+sc,CH-22);ctx.lineTo(12+sc,CH-10);ctx.stroke();
    ctx.fillStyle="#999";ctx.font="11px sans-serif";ctx.fillText("1m",12+sc/2-6,CH-20);
    ctx.fillStyle="#b06010";ctx.font="bold 13px sans-serif";ctx.fillText("N↑",CW-30,22);
  },[forme,dims,surf]);

  const d=dims;

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
        const dd=Math.hypot(dx,dy);
        zoom.current=Math.min(10,Math.max(0.1,zoom.current*(dd/pinch.current)));
        pinch.current=dd;draw();
      }
    };
    const te=e=>{drag.current=false;pinch.current=null;
      if(!moved&&e.changedTouches.length===1){
        const r=cv.getBoundingClientRect();
        const tx=(e.changedTouches[0].clientX-r.left)*(cv.width/r.width);
        const ty=(e.changedTouches[0].clientY-r.top)*(cv.height/r.height);
        hits.current.forEach(z=>{
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
  const ch=CHAMPS_INIT[f.id]||[];
  const[d,sd]=useState({});
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
  const[e,se]=useState("choix");
  const[f,sf]=useState(null);
  if(e==="dims")return<Dims f={f} onV={dd=>{sf({...f,dims:dd});se("plan")}} onR={()=>se("choix")}/>;
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
