
Paste this code at the top of your world code (132 characters):
```js
S={t:{},g:{},c:0,o:0,a:0,d:{get 1(){let t=S.t[S.c],e=t[S.a],c=S.g[e[1]];[e[0],S=>S][+(e[2]<c)](),S.d[+(++S.a<t.length)]}},run(t,e,c){let d=S.c-~e-1,g=[t,["_def_",c][+!!c],S.o++],l=S.t[d]=[[],S.t[d]][+!!S.t[d]];l[l.length]=g},del(t){S.g[t]=S.o++}},tick=()=>{S.d[+!!S.t[S.c]],delete S.t[S.c++],S.a=0}
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
| **`del` function** | | |
| `t`      | `tag`         | Parameter for the `del` function             |