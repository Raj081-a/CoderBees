const QuizQuestion = require('../models/QuizQuestion');

const rooms = new Map();

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

module.exports = (io) => {
  const roomNS = io.of('/room');

  roomNS.on('connection', (socket) => {
    let currentRoomId = null;
    let currentUsername = null;

    socket.on('createRoom', ({ username }) => {
      const roomId = generateRoomId();
      currentRoomId = roomId;
      currentUsername = username;

      rooms.set(roomId, {
        roomId,
        admin: username,
        adminSocketId: socket.id,
        participants: [{ username, socketId: socket.id }],
        status: 'waiting',
        questions: [],
        scores: {},
        answeredFlags: {}
      });

      socket.join(roomId);
      socket.emit('roomCreated', { roomId });
    });

    socket.on('joinRoom', ({ roomId, username }) => {
      const room = rooms.get(roomId);
      if (!room) return socket.emit('roomError', { message: 'Room not found! Check the ID.' });
      if (room.status !== 'waiting') return socket.emit('roomError', { message: 'Quiz already started!' });
      if (room.participants.length >= 60) return socket.emit('roomError', { message: 'Room is full (max 60)' });

      currentRoomId = roomId;
      currentUsername = username;

      room.participants = room.participants.filter(p => p.username !== username);
      room.participants.push({ username, socketId: socket.id });
      room.scores[username] = 0;

      socket.join(roomId);
      socket.emit('roomJoined', { roomId, admin: room.admin });
      roomNS.to(roomId).emit('participantsUpdated', {
        participants: room.participants.map(p => p.username),
        count: room.participants.length
      });
    });

    socket.on('startQuiz', async ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room || room.adminSocketId !== socket.id) return;

      try {
        // Get 20 random questions from DB
        let questions = await QuizQuestion.aggregate([{ $sample: { size: 20 } }]);

        // If less than 20 in DB, use what we have
        if (questions.length === 0) {
          return socket.emit('roomError', { message: 'No quiz questions in database! Add questions first from Admin panel.' });
        }

        room.status = 'active';
        room.questions = questions;
        room.answeredFlags = {};

        roomNS.to(roomId).emit('quizStarted', {
          questions: questions.map(q => ({
            _id: q._id,
            question: q.question,
            options: q.options
          })),
          total: questions.length
        });
      } catch (e) {
        socket.emit('roomError', { message: 'Error loading questions' });
      }
    });

    socket.on('submitRoomAnswer', ({ roomId, username, questionIndex, answer }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'active') return;

      const key = `${username}_${questionIndex}`;
      if (room.answeredFlags[key]) return;
      room.answeredFlags[key] = true;

      const q = room.questions[questionIndex];
      if (q && answer === q.answer) {
        room.scores[username] = (room.scores[username] || 0) + 1;
      }
    });

    socket.on('quizFinished', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const results = Object.entries(room.scores)
        .map(([username, score]) => ({
          username,
          score,
          total: room.questions.length,
          percentage: Math.round((score / room.questions.length) * 100)
        }))
        .sort((a, b) => b.score - a.score);

      room.status = 'finished';
      roomNS.to(roomId).emit('quizResults', { results });

      // Auto cleanup after 5 min
      setTimeout(() => rooms.delete(roomId), 5 * 60 * 1000);
    });

    socket.on('leaveRoom', ({ roomId, username }) => {
      handleLeave(roomId, username, socket);
    });

    socket.on('disconnect', () => {
      if (currentRoomId && currentUsername) {
        handleLeave(currentRoomId, currentUsername, socket);
      }
    });

    function handleLeave(roomId, username, socket) {
      const room = rooms.get(roomId);
      if (!room) return;
      room.participants = room.participants.filter(p => p.username !== username);
      socket.leave(roomId);
      if (room.participants.length === 0) {
        rooms.delete(roomId);
      } else {
        roomNS.to(roomId).emit('participantsUpdated', {
          participants: room.participants.map(p => p.username),
          count: room.participants.length
        });
      }
    }
  });
};