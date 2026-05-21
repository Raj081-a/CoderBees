const User = require('../models/User');
const Problem = require('../models/Problem');

const queue = [];
const activeMatches = new Map();

module.exports = (io) => {
  const matchNS = io.of('/match');

  matchNS.on('connection', (socket) => {
    let currentUser = null;
    let currentMatchId = null;

    socket.on('joinQueue', async ({ userId, username }) => {
      currentUser = { userId, username, socketId: socket.id };

      if (queue.length > 0) {
        const opponent = queue.shift();
        if (opponent.socketId === socket.id) {
          queue.push(currentUser);
          return;
        }

        // Random DSA problem fetch karo
        let problem;
        try {
          const count = await Problem.countDocuments({});
          if (count === 0) {
            socket.emit('matchError', { message: 'No problems available. Admin should add problems first.' });
            queue.push(opponent);
            return;
          }
          const random = Math.floor(Math.random() * count);
          problem = await Problem.findOne({}).skip(random);
        } catch (e) {
          socket.emit('matchError', { message: 'Error loading problem.' });
          return;
        }

        const matchId = `match_${Date.now()}`;
        currentMatchId = matchId;

        // Test cases hidden rakhenge — sirf id aur problem details bhejenge
        const matchState = {
          matchId,
          player1: opponent,
          player2: currentUser,
          problem,
          p1Submitted: false,
          p2Submitted: false,
          p1Passed: null,
          p2Passed: null,
          status: 'active',
          timer: null
        };

        activeMatches.set(matchId, matchState);

        // Entry fee deduct
        try {
          await User.findByIdAndUpdate(opponent.userId, { $inc: { points: -10, gamesPlayed: 1 } });
          await User.findByIdAndUpdate(userId, { $inc: { points: -10, gamesPlayed: 1 } });
        } catch (e) {}

        // Problem data bhejo — test cases hidden
        const problemData = {
          _id: problem._id,
          title: problem.title,
          slug: problem.slug,
          topic: problem.topic,
          difficulty: problem.difficulty,
          description: problem.description,
          constraints: problem.constraints,
          examples: problem.examples,
          hints: problem.hints,
          starterCode: problem.starterCode,
          testCaseCount: problem.testCases.length
        };

        const matchData = {
          matchId,
          problem: problemData,
          player1: opponent.username,
          player2: currentUser.username
        };

        matchNS.to(opponent.socketId).emit('matchStart', matchData);
        socket.emit('matchStart', matchData);

        // 30 minute timer = 1800 seconds
        matchState.timer = setTimeout(async () => {
          const ms = activeMatches.get(matchId);
          if (ms && ms.status === 'active') {
            ms.status = 'completed';
            matchNS.to(opponent.socketId).emit('matchEnd', {
              result: 'timeout',
              pointsChange: 0
            });
            matchNS.to(socket.id).emit('matchEnd', {
              result: 'timeout',
              pointsChange: 0
            });
            activeMatches.delete(matchId);
          }
        }, 1800000);

      } else {
        queue.push(currentUser);
        socket.emit('queueJoined', { message: 'Waiting for opponent...' });
      }
    });

    // Code submit event
    socket.on('submitCode', async ({ matchId, userId, results, allPassed, language }) => {
      const match = activeMatches.get(matchId);
      if (!match || match.status !== 'active') return;

      const isPlayer1 = match.player1.userId === userId;

      if (isPlayer1) {
        if (match.p1Submitted) return;
        match.p1Submitted = true;
        match.p1Passed = allPassed;
        match.p1Results = results;
        match.p1Language = language;
      } else {
        if (match.p2Submitted) return;
        match.p2Submitted = true;
        match.p2Passed = allPassed;
        match.p2Results = results;
        match.p2Language = language;
      }

      // Show results to the player who submitted (without showing to opponent)
      const playerSocket = isPlayer1 ? match.player1.socketId : match.player2.socketId;
      matchNS.to(playerSocket).emit('codeResult', {
        results: results.map(r => ({
          passed: r.passed,
          status: r.status,
          // Input/output hidden from user — sirf pass/fail
          input: '(hidden)',
          expected: '(hidden)',
          actual: r.passed ? '✓ Correct' : '✗ Wrong'
        })),
        allPassed
      });

      // Notify opponent ke baare mein
      const opponentSocket = isPlayer1 ? match.player2.socketId : match.player1.socketId;
      matchNS.to(opponentSocket).emit('opponentSubmitted', {
        passed: allPassed
      });

      // Agar dono submit kar chuke
      if (match.p1Submitted && match.p2Submitted) {
        clearTimeout(match.timer);
        match.status = 'completed';

        let result;
        if (match.p1Passed && !match.p2Passed) {
          // Player 1 wins
          await User.findByIdAndUpdate(match.player1.userId, { $inc: { points: 20, wins: 1 } });
          await User.findByIdAndUpdate(match.player2.userId, { $inc: { losses: 1 } });
          matchNS.to(match.player1.socketId).emit('matchEnd', { result: 'win', pointsChange: 10 });
          matchNS.to(match.player2.socketId).emit('matchEnd', { result: 'loss', pointsChange: -10 });
        } else if (!match.p1Passed && match.p2Passed) {
          // Player 2 wins
          await User.findByIdAndUpdate(match.player2.userId, { $inc: { points: 20, wins: 1 } });
          await User.findByIdAndUpdate(match.player1.userId, { $inc: { losses: 1 } });
          matchNS.to(match.player1.socketId).emit('matchEnd', { result: 'loss', pointsChange: -10 });
          matchNS.to(match.player2.socketId).emit('matchEnd', { result: 'win', pointsChange: 10 });
        } else if (match.p1Passed && match.p2Passed) {
          // Dono sahi — draw
          matchNS.to(match.player1.socketId).emit('matchEnd', { result: 'draw', pointsChange: 0 });
          matchNS.to(match.player2.socketId).emit('matchEnd', { result: 'draw', pointsChange: 0 });
        } else {
          // Dono galat
          matchNS.to(match.player1.socketId).emit('matchEnd', { result: 'both_wrong', pointsChange: 0 });
          matchNS.to(match.player2.socketId).emit('matchEnd', { result: 'both_wrong', pointsChange: 0 });
        }
        activeMatches.delete(matchId);
      } else {
        // Sirf ek ne submit kiya — dusre ka wait karein
        const submitterSocket = isPlayer1 ? match.player1.socketId : match.player2.socketId;
        matchNS.to(submitterSocket).emit('waitingForOpponent');
      }
    });

    socket.on('leaveMatch', async ({ matchId, userId }) => {
      const match = activeMatches.get(matchId);
      if (!match || match.status !== 'active') return;

      match.status = 'abandoned';
      clearTimeout(match.timer);

      const isPlayer1 = match.player1.userId === userId;
      const leaver = isPlayer1 ? match.player1 : match.player2;
      const stayer = isPlayer1 ? match.player2 : match.player1;

      try {
        await User.findByIdAndUpdate(leaver.userId, { $inc: { points: -20, penalties: 1, losses: 1 } });
        await User.findByIdAndUpdate(stayer.userId, { $inc: { points: 15 } });
      } catch (e) {}

      matchNS.to(stayer.socketId).emit('matchAbandoned', {
        result: 'opponent_left',
        pointsChange: 15
      });
      activeMatches.delete(matchId);
    });

    socket.on('cancelQueue', () => {
      const idx = queue.findIndex(u => u.socketId === socket.id);
      if (idx !== -1) queue.splice(idx, 1);
    });

    socket.on('disconnect', () => {
      const idx = queue.findIndex(u => u.socketId === socket.id);
      if (idx !== -1) queue.splice(idx, 1);

      for (const [matchId, match] of activeMatches.entries()) {
        if (match.status !== 'active') continue;
        const isP1 = match.player1.socketId === socket.id;
        const isP2 = match.player2.socketId === socket.id;
        if (isP1 || isP2) {
          const leaver = isP1 ? match.player1 : match.player2;
          const stayer = isP1 ? match.player2 : match.player1;
          match.status = 'abandoned';
          clearTimeout(match.timer);
          User.findByIdAndUpdate(leaver.userId, { $inc: { points: -20, penalties: 1, losses: 1 } }).catch(() => {});
          User.findByIdAndUpdate(stayer.userId, { $inc: { points: 15 } }).catch(() => {});
          matchNS.to(stayer.socketId).emit('matchAbandoned', {
            result: 'opponent_disconnected',
            pointsChange: 15
          });
          activeMatches.delete(matchId);
          break;
        }
      }
    });
  });
};