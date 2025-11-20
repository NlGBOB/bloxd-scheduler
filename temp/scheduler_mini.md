
Paste this code at the top of your world code:
```js
S={t:{},g:{},c:0,o:0,i:0,d:{get false(){let t=S.t[S.c];do{let e=3*S.i;[t[e],S=>S][+(t[e+2]<S.g[t[e+1]])]()}while(++S.i<t.length/3);delete S.t[S.c],S.i=0}},run(t,e,l){let c=S.c-~e-1,g=S.t[c]=[S.t[c],[]][+!S.t[c]],i=g.length;g[i]=t,g[i+1]=[l,"0"][+!l],g[i+2]=S.o++},stop(t){S.g[t]=S.o++}};

tick=()=>{
    S.d[!S.t[S.c]],S.c++;
    /* It only makes sense to add code here if it should run every tick without exception, otherwise, I recommend you use the S.run repeater pattern */
};
```
| Minified | Original      | Context                                      |
| :------- | :------------ | :------------------------------------------- |
| **S Object Properties** | | |
| `t`      | `tasks`       | Property of `S` object                       |
| `g`      | `tags`        | Property of `S` object                       |
| `c`      | `current`     | Property of `S` object                       |
| `o`      | `opCounter`   | Property of `S` object                       |
| `a`      | `activeIndex` | Property of `S` object                       |
| `d`      | `dispatcher`  | Property of `S` object                       |
| **`dispatcher` getter** | | |
| `t`      | `tasks`       | Local variable inside `dispatcher`           |
| `e`      | `node`        | Local variable inside `dispatcher`           |
| `c`      | `p`           | Local variable inside `dispatcher`           |
| **`run` function** | | |
| `t`      | `task`        | Parameter for the `run` function             |
| `e`      | `delay`       | Parameter for the `run` function             |
| `c`      | `tag`         | Parameter for the `run` function             |
| `d`      | `tick`        | Local variable inside the `run` function     |
| `g`      | `node`        | Local variable inside the `run` function     |
| `l`      | `tasks`       | Local variable inside the `run` function     |
| **`stop` function** | | |
| `t`      | `tag`         | Parameter for the `stop` function             |