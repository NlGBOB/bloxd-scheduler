S = {
    tasks: {},
    tags: {},
    current: 0,
    opCounter: 0,
    activeIndex: 0,
    dispatcher: {
        get 1() {
            let tasks = S.tasks[S.current],
                node = tasks[S.activeIndex],
                p = S.tags[node[1]];
            [node[0], o => o][+(node[2] < p)]();
            S.dispatcher[+(++S.activeIndex < tasks.length)];
        },
    },
    run(task, delay, tag) {
        let tick = S.current - ~delay - 1,
            node = [task, ["_def_", tag][+!!tag], S.opCounter++],
            tasks = S.tasks[tick] = [[], S.tasks[tick]][+!!S.tasks[tick]];
        tasks[tasks.length] = node;
    },
    del(tag) { S.tags[tag] = S.opCounter++ }
};

tick = () => {
    S.dispatcher[+(!!S.tasks[S.current])];
    delete S.tasks[S.current++];
    S.activeIndex = 0;
};