# The Bloxd Task Scheduler: High-Performance, Low-Level Control

This task scheduler is engineered for maximum performance and control within the Bloxd engine. It's short, interruption-safe, and provides a powerful, low-level foundation for building complex game logic. By composing its two core functions, `S.run` and `S.del`, you can create sequences, conditional loops, and repeating tasks with minimal overhead.

## Setup

Paste this code at the top of your world code (455 characters):
```js
S={n:S=>S,q:{},t:{},c:1,o:0,a:0,d:{},D:{get 1(){let t=S.q[S.c],e=t[S.a++],c=S.t[e[1]],q=[S.d,c][+!!c];[e[0],S.n][+!!c&(e[3]<q[0]|e[3]==q[0]&e[2]<q[1])](),S.D[+(S.a<t.length)]}},run(t,e,c){let q=S.c+[1,e][+!!e],l=[t,["_default_",c][+!!c],S.o++,S.c],n=S.q[q]=[[],S.q[q]][+!!S.q[q]];n[n.length]=l,{get 1(){t(),l[0]=S.n}}[+(0==e)]},del(t){S.t[t]=[S.c,S.o++]}},tick=()=>{let t=S.q[S.c]=[[],S.q[S.c]][+!!S.q[S.c]];S.D[+(t.length>0)],delete S.q[S.c++],S.a=S.o=0}
```
If you want to see the full implementation code, you can find it in `temp` folder.

## API At a Glance

The scheduler's API is intentionally minimal to ensure peak performance.

| Function | Signature | Description |
| :--- | :--- | :--- |
| `run` | `S.run(task, delay, tag)` | Schedules a function to run once after a `delay` of ticks. |
| `del` | `S.del(tag)` | "Neuters" (cancels) all pending tasks with a given `tag`. |

---
## Core Concepts

### Interruption Safety: Why Use `S.run(task, 0)`?
In the Bloxd engine, code execution can be interrupted. If you call a function directly (`myFunction()`) and an interruption occurs, that function will not complete and will not be retried.

**`S.run` solves this problem.** When you schedule a task with `S.run(myFunction, 0)`, you are telling the scheduler: "Run this immediately, but make sure it runs."
-   The scheduler will attempt to execute the task on the current tick.
-   If an interruption happens, the scheduler automatically retries the task on the very next tick.
-   Once the task executes successfully, it is removed and will not run again.

This guarantees execution and is the safest way to initiate any important logic.

### Unmatched Performance
This scheduler is engineered to be as efficient as possible within the Bloxd engine.

1.  **Zero-Cost Idle Ticks:** The scheduler is driven by a `tick()` function, called by the game ~20 times per second. The game engine unavoidably adds a base interrupt cost for calling any `tick` function. However, on ticks where no tasks are scheduled to run, this scheduler adds **zero additional interrupts** on top of that base cost. It is incredibly cheap when idle.

2.  **Atomic Scheduling:** The primary scheduling function, `S.run()`, is nearly **atomic**. It simply adds a task to a map, an uninterruptible operation. The only cost is the function call itself.

### The `del(tag)` Neutering System
The `del` function is more than a simple cancellation. When you call `S.del(tag)`, it does not iterate through and delete tasks. Instead, it performs a single, atomic operation that effectively "neuters" them by replacing their function with an empty, do-nothing function.

This is an **O(1) operation**. It doesn't matter if you have one or one thousand tasks scheduled with the tag `'my_tag'`; calling `S.del('my_tag')` is a single, instantaneous operation, making it extremely performant for cancelling large groups of events.

---
## API Reference & Basic Examples

**Note:** The following examples are intended to be used in a creative world where you are the owner and can edit world code or code blocks.

### `S.run(task, delay, tag)`
Schedules a task to be executed once.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `task` | `Function` | The function to execute. **This function cannot take any arguments directly.** |
| `delay` | `Number` | (Optional) The number of ticks to wait. `0` means execute immediately (but safely). Defaults to `1` if not provided. |
| `tag` | `String` | (Optional) A tag for cancellation. If not provided, it defaults to `"_chmod_"` (yes). It is **highly recommended** to provide a specific tag for any task you might need to cancel. |

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
Immediately neuters all scheduled tasks associated with a given tag.

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
        S.del('simple_tick_loop'); // This is the important line. It could be called from anywhere, not from playerCommand necessarily
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

// We safely (notice 0 delay) start the loop once when the world loads.
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
}, 0, ANNOUNCEMENT_TAG);
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
            // Notice that doesn't reschedule itself. Countdown finished.
        }
    };

    S.run(() => doCountdown(COUNTDOWN_FROM), 0, COUNTDOWN_TAG);
};

onPlayerJoin = (playerId) => {
    // Safely schedule the countdown to start, protecting it from interruptions.
    S.run(() => startCountdownForPlayer(playerId), 0);
};
```
#### How to Test This:
1.  Place this code in your World Code (F8).
2.  Join the world (or leave and rejoin).
3.  You will see a countdown from 5 to 1 in your chat, followed by "Lift off!".

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
S.run(() => createHealingZone([10, 5, 10], [15, 10, 15], 'healing_zone_1'), 0);
S.run(() => createHealingZone([-10, 5, -10], [-15, 10, -15], 'healing_zone_2'), 0);
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
#### How to Test This:
1.  Place this code in a code block and right-click it.
2.  Observe the chat messages appearing in order every 1.5 seconds.
3.  After the final message, you will be teleported 20 blocks into the air.

### Pattern 6: Task Sequence (Alternative Structure)
This is another way to create a sequence, which can be useful when the delay between each step varies. Each function in the sequence is responsible for scheduling the next one.

**Example: Story Sequence with Varied Pacing**
```javascript
// This is a complete, copy-pastable example for a code block.
const STORY_TAG = 'story_sequence';

// Define an array of functions, where each function schedules the next.
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

---
## CRITICAL: Error Handling & Infinite Loops

The scheduler is resilient but not psychic. If a task throws an error, it will fail. The scheduler, by design, will not discard the failing task and will attempt to run it again on the next tick, causing the game to get **stuck in an infinite loop**.

**The Solution: Write safe code.** For any operation that *might* fail, wrap it in a `try...catch` block.

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

It's time to build your custom game.