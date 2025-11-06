const sokobanTag = 'SOKOBAN';
const sokobanTasks = [
    () => {
        console.log(`(Sokoban) Tick ${S.current}: Level loaded. Objective: Push box to goal.`);
        S.run(sokobanTasks[1], 1, sokobanTag);
    },
    () => {
        console.log(`(Sokoban) Tick ${S.current}: Player moves into position behind the box.`);
        S.run(sokobanTasks[2], 3, sokobanTag);
    },
    () => {
        console.log(`(Sokoban) Tick ${S.current}: Player pushes the box north.`);
        S.run(sokobanTasks[3], 1, sokobanTag);
    },
    () => {
        console.log(`(Sokoban) Tick ${S.current}: Box slides onto goal square. *DING!*`);
        S.run(sokobanTasks[4], 2, sokobanTag);
    },
    () => {
        console.log(`(Sokoban) Tick ${S.current}: Checking board state...`);
        S.run(sokobanTasks[5], 1, sokobanTag);
    },
    () => {
        console.log(`(Sokoban) Tick ${S.current}: LEVEL COMPLETE! All boxes are on goals.`);
        // This is the last task. It does NOT schedule anything else, so the chain ends.
        // But it can schedule another task or chain.
    }
];

S.run(sokobanTasks[0]);