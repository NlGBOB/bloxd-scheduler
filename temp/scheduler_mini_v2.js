S={t:{},g:{},c:0,o:0,i:0,d:{get false(){let t=S.t[S.c];do{let e=3*S.i;[t[e],S=>S][+(t[e+2]<S.g[t[e+1]])]()}while(++S.i<t.length/3);delete S.t[S.c],S.i=0}},run(t,e,l){let c=S.c-~e-1,g=S.t[c]=[S.t[c],[]][+!S.t[c]],i=g.length;g[i]=t,g[i+1]=[l,"0"][+!l],g[i+2]=S.o++},stop(t){S.g[t]=S.o++}};

tick=()=>{
    S.d[!S.t[S.c]],S.c++;
    /* Add code here only if it should run every single tick without exception
    otherwise, use the S.run repeater pattern */
};