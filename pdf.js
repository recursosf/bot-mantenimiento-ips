function buildPDF(x){
var d=new x.J({unit:"mm",format:"a4"}),W=210,M=14,y=0,c=x.c,f=x.f,GR=[11,110,79],BL=[0,42,198],RD=[192,57,43],AM=[196,120,0];
function T(s,px,py,o){d.text(String(s),px,py,o)}
function nb(h){if(y+h>276){d.addPage();y=16}}
function H(s){nb(12);d.setFont("helvetica","bold");d.setFontSize(10);d.setTextColor(BL[0],BL[1],BL[2]);T(s,M,y+4);y+=7}
d.setFillColor(BL[0],BL[1],BL[2]);d.rect(0,0,W,26,"F");d.setFillColor(3,188,232);d.rect(0,26,W,1.2,"F");
var tx=M;
if(x.logo){d.setFillColor(255,255,255);d.roundedRect(M-2,2,32,22,2,2,"F");var ls=Math.min(28/x.logo.w,19/x.logo.h),lw=x.logo.w*ls,lh=x.logo.h*ls;d.addImage(x.logo.d,"PNG",M-2+(32-lw)/2,2+(22-lh)/2,lw,lh);tx=M+36}
d.setTextColor(255,255,255);d.setFont("helvetica","bold");d.setFontSize(14);T("INSPECCIÓN PREOPERACIONAL DE VEHÍCULOS",tx,12);
d.setFont("helvetica","normal");d.setFontSize(9);T(x.entidad,tx,19);
y=33;
var rows=[["Fecha y hora",f.fecha,"Placa",f.placa],["Conductor",f.cond,"Tipo de vehículo",f.tipo],["Kilometraje",f.km||"-","Actividad / ruta",f.ruta||"-"]];
rows.forEach(function(r){
d.setFontSize(10);d.setFont("helvetica","normal");
var l1=d.splitTextToSize(String(r[1]),56),l2=d.splitTextToSize(String(r[3]),56),h=Math.max(l1.length,l2.length)*4.6+3.4;
nb(h);d.setDrawColor(200,208,216);d.setLineWidth(.2);d.rect(M,y,W-2*M,h);d.line(M+91,y,M+91,y+h);
d.setFont("helvetica","bold");d.setFontSize(8);d.setTextColor(90,107,122);T(r[0],M+2,y+4.4);T(r[2],M+93,y+4.4);
d.setFont("helvetica","normal");d.setFontSize(10);d.setTextColor(30,30,30);d.text(l1,M+32,y+4.6);d.text(l2,M+123,y+4.6);
y+=h});
y+=5;
var OR=[217,115,13];
var Q=[["APTO PARA INICIAR ACTIVIDADES","Sin fallas reportadas.",GR],["NIVEL 1 - LEVE: SALIDA AUTORIZADA","Reportar las novedades a mantenimiento.",GR],["NIVEL 2 - MAYOR: SALIDA CONDICIONADA","No salir hasta que mantenimiento o persona competente evalúe y autorice.",OR],["NIVEL 3 - CRÍTICA: SALIDA PROHIBIDA","Vehículo inmovilizado preventivamente. Solo sale después de corregir y verificar.",RD]][c.lv];
d.setFillColor(Q[2][0],Q[2][1],Q[2][2]);d.roundedRect(M,y,W-2*M,16,2,2,"F");
d.setTextColor(255,255,255);d.setFont("helvetica","bold");d.setFontSize(12);T(Q[0],W/2,y+6.4,{align:"center"});
d.setFont("helvetica","normal");d.setFontSize(8.5);T(Q[1],W/2,y+12,{align:"center"});
y+=21;
H("Fallas detectadas");
d.setFontSize(9);
if(!c.items.length){d.setFont("helvetica","normal");d.setTextColor(30,30,30);T("Ninguna.",M+1,y+3.5);y+=7}
else c.items.forEach(function(i){
var col=i.l===3?RD:(i.l===2?OR:AM);
var ln=d.splitTextToSize(i.n+" - "+(i.v==="m"?"Mal":"Regular"),148),h=ln.length*4.4+2;nb(h);
d.setFont("helvetica","bold");d.setFontSize(9);d.setTextColor(col[0],col[1],col[2]);T("Nivel "+i.l+" "+["","Leve","Mayor","Crítica"][i.l],M+1,y+3.8);
d.setFont("helvetica","normal");d.setTextColor(30,30,30);d.text(ln,M+34,y+3.8);y+=h});
y+=2;
d.setFont("helvetica","normal");d.setFontSize(8);d.setTextColor(90,107,122);
T("Niveles: 1 Leve = salida autorizada | 2 Mayor = salida condicionada | 3 Crítica = salida prohibida",M,y+2);y+=8;
var cx={b:140,r:155,m:169,n:183},CL={b:GR,r:AM,m:RD,n:[90,107,122]};
x.G.forEach(function(g,gi){
nb(18);
d.setFillColor(228,235,252);d.rect(M,y,W-2*M,6.5,"F");
d.setFont("helvetica","bold");d.setFontSize(9);d.setTextColor(BL[0],BL[1],BL[2]);T((gi+1)+". "+g[0],M+2,y+4.5);
d.setFontSize(8);T("Bien",cx.b,y+4.5,{align:"center"});T("Regular",cx.r,y+4.5,{align:"center"});T("Mal",cx.m,y+4.5,{align:"center"});T("N/A",cx.n,y+4.5,{align:"center"});
y+=6.5;
g[1].forEach(function(it,ii){
var v=x.S[gi+"_"+ii],mal=v==="m";
d.setFontSize(9);d.setFont("helvetica",mal?"bold":"normal");
var lines=d.splitTextToSize(it[0],112),h=Math.max(lines.length*4.2+2.4,7);
nb(h);
if(mal)d.setTextColor(RD[0],RD[1],RD[2]);else if(v==="r")d.setTextColor(150,90,0);else d.setTextColor(30,30,30);
d.text(lines,M+2,y+4.4);
d.setDrawColor(150,160,170);d.setLineWidth(.2);
["b","r","m","n"].forEach(function(k){
if(k==="r"&&it[2])return;
d.rect(cx[k]-2.2,y+(h-4.4)/2,4.4,4.4);
if(v===k){d.setFont("helvetica","bold");d.setFontSize(9);d.setTextColor(CL[k][0],CL[k][1],CL[k][2]);T("X",cx[k],y+(h-4.4)/2+3.5,{align:"center"})}
});
d.setDrawColor(225,230,235);d.line(M,y+h,W-M,y+h);
y+=h});
y+=3});
y+=2;H("Observaciones");
d.setFont("helvetica","normal");d.setFontSize(9);d.setTextColor(30,30,30);
var ol=d.splitTextToSize(f.obs||"Sin observaciones.",W-2*M-2);
ol.forEach(function(l){nb(5);T(l,M+1,y+3.5);y+=4.6});
y+=3;
if(x.P&&x.P.length){
nb(84);H("Evidencia fotográfica");
var px=M;
x.P.forEach(function(p){var s=Math.min(56/p.w,70/p.h),w=p.w*s,h=p.h*s;d.addImage(p.d,"JPEG",px,y,w,h);px+=60});
y+=74}
nb(44);if(x.sig){d.addImage(x.sig,"JPEG",M+8,y+1,60,20);y+=21}else y+=16;
d.setDrawColor(60,60,60);d.setLineWidth(.3);
d.line(M,y,M+80,y);d.line(W-M-80,y,W-M,y);
d.setFont("helvetica","bold");d.setFontSize(9);d.setTextColor(30,30,30);
T("Firma del conductor",M,y+4.5);T("Revisó / Autorizó",W-M-80,y+4.5);
d.setFont("helvetica","normal");d.setFontSize(8);d.setTextColor(90,107,122);
T(f.cond,M,y+8.8);T("Nombre y cargo",W-M-80,y+8.8);
if(c.lv>=2){nb(40);y+=14;d.setDrawColor(150,160,170);d.setLineWidth(.2);d.rect(M,y,W-2*M,22);
d.setFont("helvetica","bold");d.setFontSize(9);d.setTextColor(30,30,30);T("Decisión del responsable de mantenimiento / persona competente",M+2,y+5);
d.setFont("helvetica","normal");d.rect(M+3,y+8,4,4);T("Autoriza la salida",M+9,y+11.3);d.rect(M+55,y+8,4,4);T("No autoriza la salida",M+61,y+11.3);
T("Falla corregida y verificada el: ____ / ____ / ________",M+2,y+18.5)}
var n=d.getNumberOfPages();
for(var i=1;i<=n;i++){d.setPage(i);d.setFont("helvetica","normal");d.setFontSize(8);d.setTextColor(120,130,140);
T(x.entidad+"  |  Placa "+f.placa+"  |  "+f.fecha,M,290);T("Página "+i+" de "+n,W-M,290,{align:"right"})}
return d}
if(typeof module!=="undefined")module.exports=buildPDF;else window.buildPDF=buildPDF;
