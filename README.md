# Bloxd Task Scheduler (BTS): Interruption-Safe

This task scheduler is engineered for maximum performance and controlIt's interruption-safe and provides a powerful, low-level foundation for building complex game logic. By composing its two core functions, `S.run` and `S.del`, you can create sequences, conditional loops, and repeating tasks with minimal overhead.

## Setup

Paste this code at the top of your world code (132 characters):
```js
S={t:{},g:{},c:0,o:0,a:0,d:{get 1(){let t=S.t[S.c],e=t[S.a],c=S.g[e[1]];[e[0],S=>S][+(e[2]<c)](),S.d[+(++S.a<t.length)]}},run(t,e,c){let d=S.c-~e-1,g=[t,["_def_",c][+!!c],S.o++],l=S.t[d]=[[],S.t[d]][+!!S.t[d]];l[l.length]=g},del(t){S.g[t]=S.o++}},tick=()=>{S.d[+!!S.t[S.c]],delete S.t[S.c++],S.a=0}
```

## API At a Glance

The scheduler's API is intentionally minimal to ensure peak performance.

| Function | Signature | Description |
| :--- | :--- | :--- |
| `run` | `S.run(task, delay, tag)` | Schedules a function to run once after a `delay` of ticks. |
| `invalidate` | `S.del(tag)` | Invalidates all pending tasks with a given `tag`, preventing them from running. |

---
## Core Concepts

### Guaranteed Execution: The Core of `S.run`
In the Bloxd engine, code execution can be interrupted. If you call a function directly (`myFunction()`) and an interruption occurs, that function will not complete and will not be retried.

**`S.run` solves this problem.** When you schedule a task with `S.run(myFunction)`, you are telling the scheduler: "Run this on the current tick, but make sure it runs."
-   The scheduler atomically adds the task to the queue for the current tick. This scheduling operation itself is uninterruptible.
-   During the `tick()` execution, your task is run in a controlled loop.
-   This guarantees safe execution and is the best way to initiate any important logic. A task with a delay of `0` or no delay specified is queued for the *current* tick. A delay of `1` queues it for the *next* tick and so on.

### Unmatched Performance
This scheduler is engineered to be as efficient as possible within the Bloxd engine.

1.  **Zero-Cost Idle Ticks:** The scheduler is driven by a `tick()` function, called by the game ~20 times per second. The game engine unavoidably adds a base interrupt cost for calling any `tick` function. However, on ticks where no tasks are scheduled to run, this scheduler adds **zero additional work** on top of that base cost. It is incredibly cheap when idle.

2.  **Atomic Scheduling:** The primary scheduling function, `S.run()`, is nearly **atomic**. It simply adds a task to a map, an uninterruptible operation. The only cost is the function call itself.

### The `del(tag)` System
When you call `S.del(tag)`, it does not iterate through and delete tasks. Instead, it performs a single, atomic operation that effectively "invalidates" them. Any future task that tries to run with that tag will see that the tag is invalid and will simply do nothing.

This is an **O(1) operation**. It doesn't matter if you have one or one thousand tasks scheduled with the tag `'my_tag'`; calling `S.del('my_tag')` is a single, instantaneous operation, making it extremely efficient for cancelling multiple tag-sharing tasks.

---
## API Reference & Basic Examples

**Note:** The following examples are intended to be used in a creative world where you are the owner and can edit world code or code blocks.

### `S.run(task, delay, tag)`
Schedules a task to be executed once.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `task` | `Function` | The function to execute. **This function cannot take any arguments directly.** |
| `delay` | `Number` | (Optional) The number of ticks to wait. `0` means execute on the current tick. Defaults to `0` if not provided. |
| `tag` | `String` | (Optional) A tag for cancellation. If not provided, it defaults to `"_def_"`. It is **highly recommended** to provide a specific tag for any task you might need to cancel. |

**Example: A Delayed Sound Effect**
```javascript
// This is a complete, copy-pastable example for a code block.
const DELAY_TICKS = 60; // 3 seconds
const SOUND_TAG = 'delayed_sound_1';
const SOUND_POSITION = thisPos;

const playSoundEffect = () => {
    api.broadcastMessage("BOOM!");
    api.broadcastSound('cannonFire1', 1, 1, { playerIdOrPos: SOUND_POSITION });
};

api.log(`Sound will play in ${DELAY_TICKS / 20} seconds.`);
S.run(playSoundEffect, DELAY_TICKS, SOUND_TAG);
```

### `S.del(tag)`
Immediately invalidates all scheduled tasks associated with a given tag.

**Example: Countdown Cancellation**
```javascript
// This is a complete, copy-pastable example for your world code.
const COUNTDOWN_TAG = 'game_start_countdown';

playerCommand = (playerId, command) => {
    if (command === "start") {
        api.broadcastMessage("Game starting in 10 seconds! Type /cancel to stop.");
        S.run(() => api.broadcastMessage("Game started!"), 200, COUNTDOWN_TAG); // 10 seconds
        return false; // Command handled
    }
    
    if (command === "cancel") {
        S.del(COUNTDOWN_TAG); // this is the actual line that cancels the task/tasks
        api.broadcastMessage("Game start canceled.");
        return false; // Command handled
    }
};
```
#### How to Test This:
1.  Place this code in your World Code (F8).
2.  Type `/start` in chat. A 10-second timer will begin.
3.  Type `/cancel` in chat before 10 seconds are up to cancel the "Game started!" message.

---
## Building Complex Patterns

The key to creating loops and sequences is to have a function call `S.run` on itself to reschedule its own execution.

### Pattern 1: The Simplest Infinite Loop
This is the most basic repeating task. It will run forever until it is explicitly stopped with `S.del(tag)`.

**Example: A Repeating "Tick" Message**
```javascript
// This is a complete, copy-pastable example for your world code.
const REPEATING_TICK_TAG = 'simple_tick_loop';

S.run(function repeat() {
    const TICK_INTERVAL = 20; // 1 second

    // The action: broadcast a simple message.
    api.broadcastMessage("Tick!");

    // Reschedule this exact function to run again.
    S.run(repeat, TICK_INTERVAL, REPEATING_TICK_TAG);
}, 0, REPEATING_TICK_TAG);
```
#### How to Stop This Loop:
This loop will spam the chat every second. To stop it, you can add a command to your world code:
```javascript
playerCommand = (playerId, command) => {
    if (command === "stop") {
        S.del('simple_tick_loop'); // This is the important line.
        api.broadcastMessage("Simple tick loop stopped.");
        return false;
    }
};
```

### Pattern 2: Infinite Loop with Logic (`setInterval` equivalent)
Use this for tasks that should run indefinitely at a fixed interval and contain more complex logic.

**Example: Repeating Server Tip**
```javascript
// This is a complete, copy-pastable example for your world code.
const ANNOUNCEMENT_TAG = 'server_tip_announcer';

// We safely start the loop once when the world loads.
S.run(function broadcastServerTip() {
    // Define constants inside the function. They are set once and reused.
    const ANNOUNCEMENT_INTERVAL = 600; // 30 seconds
    const TIPS = [
        "Tip: You can use /help to see available commands!",
        "Tip: Breaking blocks gives you resources.",
        "Tip: Have fun and be respectful to other players!"
    ];
    const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];

    // The action
    api.broadcastMessage(randomTip, { color: "yellow" });

    // Reschedule this exact function to run again, creating the loop.
    S.run(broadcastServerTip, ANNOUNCEMENT_INTERVAL, ANNOUNCEMENT_TAG);
});
```

### Pattern 3: Self-Canceling Loop (A repeating task that stops itself)
Use this for temporary effects that last for a specific duration. The task stops by simply *not rescheduling itself* when its condition is met.

**To pass an argument to a scheduled task, you must wrap it in an anonymous function:** `() => myFunction(myArgument)`.

**Example: Player Countdown**
```javascript
// This is a complete, copy-pastable example for your world code.
const startCountdownForPlayer = (playerId) => {
    const COUNTDOWN_TAG = 'player_countdown_' + playerId;
    const COUNTDOWN_FROM = 5;
    const TICK_INTERVAL = 20; // 1 second

    const doCountdown = (ticksLeft) => {
        if (ticksLeft > 0) {
            api.sendMessage(playerId, `... ${ticksLeft}`);
            S.run(() => doCountdown(ticksLeft - 1), TICK_INTERVAL, COUNTDOWN_TAG);
        } else {
            api.sendMessage(playerId, "Lift off!");
            // Notice it doesn't reschedule itself. The countdown is finished.
        }
    };

    S.run(() => doCountdown(COUNTDOWN_FROM), 0, COUNTDOWN_TAG);
};

onPlayerJoin = (playerId) => {
    // Safely schedule the countdown to start.
    S.run(() => startCountdownForPlayer(playerId));
};
```

### Pattern 4: Conditional Action Loop (`setInterval` with a condition)
Use this for tasks that run forever but only perform an action if a condition is met.

**Example: Healing Zone Factory**
```javascript
// This is a complete, copy-pastable example for your world code.
const createHealingZone = (pos1, pos2, tag) => {
    const HEAL_AMOUNT = 5;
    const CHECK_INTERVAL_TICKS = 20; // Check once per second

    S.run(function healingZoneCheck() {
        for (const id of api.getPlayerIds()) {
            if (api.isAlive(id)) {
                const playerPos = api.getPosition(id);
                if (api.isInsideRect(playerPos, pos1, pos2)) {
                    api.applyHealthChange(id, HEAL_AMOUNT);
                }
            }
        }
        S.run(healingZoneCheck, CHECK_INTERVAL_TICKS, tag);
    }, 0, tag);
};

// Safely schedule the creation of the healing zones when the world loads.
S.run(() => createHealingZone([10, 5, 10], [15, 10, 15], 'healing_zone_1'));
S.run(() => createHealingZone([-10, 5, -10], [-15, 10, -15], 'healing_zone_2'));
```

### Pattern 5: Task Sequence (`chain` equivalent)
Use this pattern to execute a series of different tasks in a specific order, with a delay between each step.

**Example: Multi-Stage Teleport Effect**
```javascript
// This is a complete, copy-pastable example for a code block.
const TELEPORT_TAG = 'teleport_effect';
const TARGET_POSITION = [thisPos[0], thisPos[1] + 20, thisPos[2]];

const teleportSequence = [
    () => api.sendMessage(myId, "Charging teleport...", { color: "aqua" }),
    () => api.sendMessage(myId, "Locking coordinates...", { color: "yellow" }),
    () => {
        api.sendMessage(myId, "Engage!", { color: "lime" });
        api.setPosition(myId, TARGET_POSITION);
    }
];

const runNextTeleportStep = (stepIndex) => {
    const STEP_DELAY_TICKS = 30; // 1.5 seconds between steps
    teleportSequence[stepIndex]();
    const nextStepIndex = stepIndex + 1;
    if (nextStepIndex < teleportSequence.length) {
        S.run(() => runNextTeleportStep(nextStepIndex), STEP_DELAY_TICKS, TELEPORT_TAG);
    }
};

S.run(() => runNextTeleportStep(0), 0, TELEPORT_TAG);
```

### Pattern 6: Task Sequence (Alternative Structure)
This is another way to create a sequence, which can be useful when the delay between each step varies. Each function in the sequence is responsible for scheduling the next one.

**Example: Story Sequence with Varied Pacing**
```javascript
// This is a complete, copy-pastable example for a code block.
const STORY_TAG = 'story_sequence';

const storySequence = [
    () => {
        api.sendMessage(myId, "A strange energy hums from the code block...");
        S.run(storySequence[1], 40, STORY_TAG); // 2 second delay
    },
    () => {
        api.sendMessage(myId, "The ground begins to shake!");
        S.run(storySequence[2], 60, STORY_TAG); // 3 second delay
    },
    () => {
        api.sendMessage(myId, "Suddenly, everything goes quiet.");
        // This is the last step, so it doesn't schedule another.
    }
];

// Start the sequence by running the first task.
S.run(storySequence[0], 0, STORY_TAG);
```

### Pattern 7: Conditional Loop with Self-Invalidation
Use this for a repeating task that monitors a game state and stops itself permanently once a condition is met. This is perfect for game loops that should end.

**Example: "First to 5 Kills" Game Announcer**
```javascript
// This is a complete, copy-pastable example for your world code.
let scores = {};
let gameIsOver = false;
const KILLS_TO_WIN = 5;
const ANNOUNCER_TAG = 'game_announcer';

// This function runs every 5 seconds to announce the score.
S.run(function gameAnnouncerLoop() {
    const ANNOUNCE_INTERVAL = 100; // 5 seconds

    // First, check if the game-over condition has been met.
    if (gameIsOver) {
        // If the game is over, invalidate the tag to stop this loop permanently.
        return S.del(ANNOUNCER_TAG);
    }

    // The action: broadcast the current scores.
    let scoreMessage = "Current Scores: ";
    for (const id in scores) {
        scoreMessage += `${api.getEntityName(id)}: ${scores[id]} | `;
    }
    api.broadcastMessage(scoreMessage);

    // Reschedule this announcer to run again.
    S.run(gameAnnouncerLoop, ANNOUNCE_INTERVAL, ANNOUNCER_TAG);
}, 0, ANNOUNCER_TAG);

// This part handles the game logic that changes the state.
onPlayerKilledOtherPlayer = (killerId, killedId) => {
    if (gameIsOver) return; // Don't track kills after the game has ended.

    scores[killerId] = (scores[killerId] || 0) + 1;
    api.broadcastMessage(`${api.getEntityName(killerId)} now has ${scores[killerId]} kills!`);

    if (scores[killerId] >= KILLS_TO_WIN) {
        api.broadcastMessage(`${api.getEntityName(killerId)} wins the game!`, { color: "gold" });
        gameIsOver = true; // Set the flag that the announcer loop will see.
    }
};
```
#### How to Test This:
1.  Place this code in your World Code (F8).
2.  Have at least two players join the server.
3.  Every 5 seconds, a score update will be broadcast.
4.  Have one player get 5 kills on another player.
5.  Observe that a winner is announced, and the 5-second score announcements will stop.

---
## CRITICAL: Error Handling & Infinite Loops

The scheduler is resilient but not psychic. If a task throws an error, the `tick()` function will fail. The game engine, by design, will likely attempt to run `tick()` again on the very next opportunity, causing the game to get **stuck in an infinite error loop**.

**The Solution: Write safe code.** For any operation that *might* fail (e.g., accessing a player that might have left), wrap it in a `try...catch` block.

### Emergency Failsafe: Player-Triggered Resets
Writing safe code is always the best practice. However, if you are concerned that a bug might still cause an infinite loop, you can implement an emergency failsafe. This gives players a way to vote to reset the game if it becomes frozen. To prevent abuse, this example requires a majority of players (51% or more) to vote.

**Example using `playerCommand`:**
```javascript
// Add this to your world code.
let resetVotes = new Set(); // Use a Set to automatically handle duplicate votes.

playerCommand = (playerId, command) => {
    if (command === "fixgame") {
        resetVotes.add(playerId); // Add the player's vote.
        
        const numPlayers = api.getNumPlayers();
        const requiredVotes = Math.ceil(numPlayers / 2); // Calculate 51% majority
        const currentVotes = resetVotes.size;

        if (currentVotes >= requiredVotes) {
            api.broadcastMessage("The vote to reset the game has passed!");
            // The actual reset logic: kick all players to force a clean world reload.
            // Or call a function that resets your game.
            for (const id of api.getPlayerIds()) {
                api.kickPlayer(id, "Emergency world reset due to game error.");
            }
        } else {
            api.broadcastMessage(`${api.getEntityName(playerId)} has voted to reset. ${requiredVotes - currentVotes} more votes needed.`);
        }
        return false; // Command was handled
    }
};
```



It's time to build your own custom game.