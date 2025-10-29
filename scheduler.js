taskHeads = {};
currentTick = 0;

run = (task, delay, tag) => {
    const targetTick = currentTick + delay;
    const schedulerNode = { task, tag, next: taskHeads[targetTick] };
    taskHeads[targetTick] = schedulerNode;
};

start = (task) => {
    taskHeads[currentTick] = { task, next: taskHeads[currentTick] };
};

runWhile = (task, conditional, step, tag, onComplete) => {
    const stepRunner = () => {
        if (conditional()) {
            task();
            run(stepRunner, step, tag);
        } else run(onComplete, 1, tag);
    }
    stepRunner();
};

repeat = (task, interval, tag) => {
    const repeater = () => {
        task();
        run(repeater, interval, tag);
    };
    repeater();
};

clearByTag = (tag) => {
    Object.keys(taskHeads).forEach(tick => {
        let node = taskHeads[tick];
        while (node) {
            if (node.tag === tag) node.task = () => { };
            node = node.next;
        }
    });
};

sequence = (tasks, step, tag, onComplete) => {
    let index = 0;
    const runNextJob = () => {
        if (index < tasks.length) {
            tasks[index]();
            if (index + 1 < tasks.length) {
                run(runNextJob, step, tag);
                index++;
            } else run(onComplete, 1, tag);
        }
    }
    runNextJob();
};

waitUntil = (conditional, task, step, tag) => {
    const waiter = () => {
        if (conditional()) task();
        else run(waiter, step, tag);
    };
    waiter();
};

tick = () => {
    const sentinel = { next: taskHeads[currentTick] };
    const fifo = (parent, node) => {
        if (!node) return;
        fifo(node, node.next);
        node.task();
        node.task = () => { }
        parent.next = null;
    };
    fifo(sentinel, sentinel.next);
    delete taskHeads[currentTick];
    currentTick++;
};