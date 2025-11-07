
Paste this code at the top of your world code (455 characters):
```js
S={n:S=>S,q:{},t:{},c:1,o:0,a:0,d:{},D:{get 1(){let t=S.q[S.c],e=t[S.a++],c=S.t[e[1]],q=[S.d,c][+!!c];[e[0],S.n][+!!c&(e[3]<q[0]|e[3]==q[0]&e[2]<q[1])](),S.D[+(S.a<t.length)]}},run(t,e,c){let q=S.c+[1,e][+!!e],l=[t,["_default_",c][+!!c],S.o++,S.c],n=S.q[q]=[[],S.q[q]][+!!S.q[q]];n[n.length]=l,{get 1(){t(),l[0]=S.n}}[+(0==e)]},del(t){S.t[t]=[S.c,S.o++]}},tick=()=>{let t=S.q[S.c]=[[],S.q[S.c]][+!!S.q[S.c]];S.D[+(t.length>0)],delete S.q[S.c++],S.a=S.o=0}
```

### `S` Object Properties

*   `S.n`: `no_op` (No-operation function)
*   `S.q`: `tasks` (Queue of tasks, object keyed by tick)
*   `S.t`: `tags` (Tags object for invalidation)
*   `S.c`: `current` (Current tick number)
*   `S.o`: `opCounter` (Operation counter for tie-breaking)
*   `S.a`: `activeIndex` (Index for iterating tasks in the current tick)
*   `S.d`: `dummy` (Dummy object for invalidation logic)
*   `S.D`: `dispatcher` (The dispatcher object that processes the queue)

### Method Names

*   `S.run`: `run` (Schedules a new task)
*   `S.del`: `invalidate` (Invalidates a tag, was 'cancel' previously)

### Local Variables & Function Parameters by Context

*   **In `S.D` (dispatcher):**
    *   `t`: `tasks_for_current_tick`
    *   `e`: `node` (the task array being processed)
    *   `c`: `p` (the tag's invalidation point data)
    *   `q`: `point` (the chosen invalidation point: dummy or real)

*   **In `S.run(t, e, c)`:**
    *   `t`: `task` (the function to execute)
    *   `e`: `delay`
    *   `c`: `tag`
    *   `q`: `tick` (the calculated tick index for scheduling)
    *   `l`: `node` (the new task array being created)
    *   `n`: `tasks_for_tick` (the array of tasks for that tick)

*   **In `S.del(t)`:**
    *   `t`: `tag`

*   **In `tick()`:**
    *   `t`: `tasks_for_tick` (the array of tasks for the current tick)