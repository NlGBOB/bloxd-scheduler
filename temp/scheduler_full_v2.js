S = {
    tasks: {},
    tags: {},
    current: 0,
    opCounter: 0,
    activeIndex: 0,
    dispatcher: {
        get 1() {
            let tasks = S.tasks[S.current];
            do {
                let baseIndex = S.activeIndex * 3,
                    tag = tasks[baseIndex + 1],
                    op = tasks[baseIndex + 2],
                    p = S.tags[tag];
                [tasks[baseIndex], o => o][+(op < p)]();
            } while (++S.activeIndex < tasks.length / 3);
        }
    },
    run(task, delay, tag) {
        let tick = S.current - ~delay - 1,
            tasks = S.tasks[tick] = [[], S.tasks[tick]][+!!S.tasks[tick]];
        tasks[tasks.length] = task;
        tasks[tasks.length] = ["_def_", tag][+!!tag];
        tasks[tasks.length] = S.opCounter++;
    },
    stop(tag) { S.tags[tag] = S.opCounter++ }
};

tick = () => {
    S.dispatcher[+(!!S.tasks[S.current])];
    delete S.tasks[S.current++];
    S.activeIndex = 0;
};