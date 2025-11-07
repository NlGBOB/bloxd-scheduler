S = {
    no_op: _ => _,
    tasks: {},
    tags: {},
    current: 1,
    opCounter: 0,
    activeIndex: 0,
    dummy: {},
    dispatcher: {
        get 1() {
            let tasks = S.tasks[S.current],
                node = tasks[S.activeIndex++],
                p = S.tags[node[1]],
                point = [S.dummy, p][+!!p];
            [node[0], S.no_op][+!!p & (node[3] < point[0] | node[3] == point[0] & node[2] < point[1])]();
            S.dispatcher[+(S.activeIndex < tasks.length)];
        }
    },

    run(task, delay, tag) {
        let tick = S.current + [1, delay][+!!delay],
            node = [task, ["_default_", tag][+!!tag], S.opCounter++, S.current],
            tasks = S.tasks[tick] = [[], S.tasks[tick]][+!!S.tasks[tick]];
        tasks[tasks.length] = node;
        ({ get 1() { task(); node[0] = S.no_op; } })[+(delay == 0)];
    },

    invalidate(tag) {
        S.tags[tag] = [S.current, S.opCounter++];
    }

};

tick = () => {
    let t = S.tasks[S.current] = [[], S.tasks[S.current]][+!!S.tasks[S.current]];
    S.dispatcher[+(t.length > 0)];
    delete S.tasks[S.current++];
    S.activeIndex = S.opCounter = 0;
};