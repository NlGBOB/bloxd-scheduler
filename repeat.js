S.run(
    function repeat() {
        const step = 20;
        const tag = 'nfe-repeat';
        console.log(`tick: ${S.current}`);
        S.run(repeat, step, tag);
    }
);