S = {
    t: {},
    g: {},
    c: 0,
    o: 0,
    i: 0,
    d: {
        get "false"() {
            let a = S.t[S.c];
            do {
                let b = S.i * 3;
                [a[b], z => z][+(a[b + 2] < S.g[a[b + 1]])]();
            } while (++S.i < a.length / 3);
            delete S.t[S.c];
            S.i = 0;
        }
    },
    run(f, l, n) {
        let k = S.c - ~l - 1,
            a = S.t[k] = [S.t[k], []][+!S.t[k]],
            i = a.length;
        a[i] = f;
        a[i + 1] = [n, "0"][+!n];
        a[i + 2] = S.o++;
    },
    stop(n) { S.g[n] = S.o++ }
};

tick = () => {
    S.d[!S.t[S.c]]; S.c++;
};