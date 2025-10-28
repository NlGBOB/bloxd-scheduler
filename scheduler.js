taskHeads = {};
tasksByTag = {};
currentTick = 0;

run = (task, delay, tag) => {
    const targetTick = currentTick + delay;
    const schedulerNode = { task, tag, next: taskHeads[targetTick] };
    taskHeads[targetTick] = schedulerNode;
    tasksByTag[tag] = { handle: schedulerNode, next: tasksByTag[tag] };
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
    stepRunner()
};

repeat = (task, interval, tag) => {
    const handle = { task };
    const repeater = () => {
        if (handle.cancelled) return;
        handle.task();
        run(repeater, interval, tag);
    };
    tasksByTag[tag] = { handle, next: tasksByTag[tag] }
    repeater();
};

clearByTag = (tag) => {
    while (tasksByTag[tag]) {
        const handle = tasksByTag[tag].handle;
        handle.cancelled = true;
        handle.task = () => { };
        tasksByTag[tag] = tasksByTag[tag].next;
    }
    delete tasksByTag[tag];
};

sequence = (tasks, step, tag, onComplete) => {
    let index = 0;
    const runNextJob = () => {
        tasks[index]();
        if (index + 1 < tasks.length) {
            run(runNextJob, step, tag)
            index++;
        } else run(onComplete, 1, tag)
    }
    runNextJob();
};


tick = () => {
    const sentinel = { next: taskHeads[currentTick] };
    const fifo = (parent, node) => {
        if (!node) { return }
        fifo(node, node.next);
        node.task();
        node.executed = true;
        parent.next = null;
    };
    fifo(sentinel, sentinel.next);
    taskHeads[currentTick] = sentinel.next;
    delete taskHeads[currentTick];
    currentTick++;
};

// This should be included. It's a garbage collector that runs every minute. 
start(() => repeat(() => { for (const t in tasksByTag) { let s = { next: null }, l = s; for (let c = tasksByTag[t]; c; c = c.next)c.handle.executed || (l = l.next = c); l.next = null; s.next ? tasksByTag[t] = s.next : delete tasksByTag[t] } }, 1200, '_garbage_collector'))