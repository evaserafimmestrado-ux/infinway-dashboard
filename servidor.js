const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Serve os ficheiros estáticos da pasta atual
app.use(express.static(__dirname));

// Acede ao seu ficheiro HTML principal quando abre no navegador
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'infinway_project_management_saas (2 tentativa).html'));
});

// Estado partilhado em memória
let globalState = { tasks: null, deliverables: null };

io.on('connection', (socket) => {
  // Envia os dados atuais a quem se acabou de ligar
  if (globalState.tasks !== null) {
    socket.emit('init_state', globalState);
  }

  // Quando alguém altera algo, envia para todos os outros
  socket.on('sync_data', (data) => {
    globalState = data;
    socket.broadcast.emit('update_data', data);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});