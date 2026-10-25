const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Ligação à base de dados MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://evaserafimmestrado_db_user:RXeTZbKVBg5VXH7Z@eva.pysgouu.mongodb.net/infinway?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Ligado ao MongoDB Atlas!'))
  .catch(err => console.error('❌ Erro no MongoDB:', err));

// Modelo de dados para os entregáveis
const ItemSchema = new mongoose.Schema({
  titulo: String,
  descricao: String,
  estado: String,
  criadoEm: { type: Date, default: Date.now }
});
const Item = mongoose.model('Item', ItemSchema);

app.use(express.static(__dirname));

io.on('connection', async (socket) => {
  // Envia as tarefas guardadas assim que um utilizador entra
  try {
    const todosItens = await Item.find();
    socket.emit('carregar_dados', todosItens);
  } catch (err) {
    console.error(err);
  }

  // Recebe e guarda novas tarefas permanentemente
  socket.on('novo_entregavel', async (dados) => {
    try {
      const novoItem = new Item(dados);
      await novoItem.save();
      io.emit('entregavel_adicionado', novoItem);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('apagar_entregavel', async (id) => {
    try {
      await Item.findByIdAndDelete(id);
      io.emit('entregavel_apagado', id);
    } catch (err) {
      console.error(err);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor ativo na porta ${PORT}`));
