const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// 1. Ligação à base de dados MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://evaserafimmestrado_db_user:RXeTZbKVBg5VXH7Z@eva.pysgouu.mongodb.net/infinway?retryWrites=true&w=majority";

// 2. Esquema para guardar o estado do Kanban e Entregáveis no MongoDB
const StateSchema = new mongoose.Schema({
  key: { type: String, default: 'main_state', unique: true },
  tasks: Array,
  deliverables: Array,
  updatedAt: { type: Date, default: Date.now }
});
const AppState = mongoose.model('AppState', StateSchema);

// 3. Os seus 9 Itens/Tarefas com Funções e Responsáveis Mapeados
const INITIAL_TASKS = [
  { id: "tsk-1", title: "Conceção do produto", desc: "Design, estrutura, materiais utilizados.", assigneeId: "A118101", status: "todo", priority: "Alta", pc: "PC2", dueDate: "2026-11-04" },
  { id: "tsk-2", title: "Pesquisa de materiais", desc: "De onde provém os materiais, que desperdícios podem ser utilizados, contactar empresas que possuam os materiais.", assigneeId: "A118193", status: "todo", priority: "Urgente", pc: "PC2", dueDate: "2026-11-04" },
  { id: "tsk-3", title: "Processos de produção", desc: "Como utilizamos os desperdícios das indústrias selecionadas para a criação do produto e contactar empresas onde façamos isso.", assigneeId: "A118199", status: "todo", priority: "Alta", pc: "PC2", dueDate: "2026-11-04" },
  { id: "tsk-4", title: "Atualização das nossas páginas", desc: "Manter o blog, o padlet e o instagram sempre atualizados com os desenvolvimentos do nosso projeto.", assigneeId: "A118011", status: "in_progress", priority: "Média", pc: "Geral", dueDate: "2026-11-10" },
  { id: "tsk-5", title: "Preparação de apresentações", desc: "Preparar a estrutura e os powerpoints que vamos apresentar nos pontos de controlo.", assigneeId: "A118109", status: "todo", priority: "Urgente", pc: "PC2", dueDate: "2026-11-04" },
  { id: "tsk-6", title: "Organização de reuniões, prazos e tarefas", desc: "Kanban board, atas de reunião, gráfico de Gantt.", assigneeId: "A118194", status: "in_progress", priority: "Alta", pc: "Geral", dueDate: "2026-11-15" },
  { id: "tsk-7", title: "Pesquisa sobre a tarefa", desc: "Pesquisa e revisão sobre os parâmetros da tarefa e o que nos é pedido para realizar, elaboração de tópicos.", assigneeId: "A118105", status: "done", priority: "Média", pc: "PC1", dueDate: "2026-10-20" },
  { id: "tsk-8", title: "Pesquisa e elaboração de conteúdo", desc: "Recolha do máximo de informação possível para responder aos pontos elaborados previamente.", assigneeId: "A115232", status: "in_progress", priority: "Alta", pc: "PC2", dueDate: "2026-11-02" },
  { id: "tsk-9", title: "Elaboração e estrutura do documento a entregar", desc: "Estruturar e criar o produto final da tarefa seja ele um documento, um vídeo ou uma apresentação.", assigneeId: "A118114", status: "todo", priority: "Urgente", pc: "PC2", dueDate: "2026-11-04" }
];

// Conectar ao MongoDB Atlas e Inicializar
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('✅ Ligado ao MongoDB Atlas com sucesso!');
    // Povoar automaticamente a base de dados no 1º arranque se estiver vazia
    const existingState = await AppState.findOne({ key: 'main_state' });
    if (!existingState) {
      await AppState.create({
        key: 'main_state',
        tasks: INITIAL_TASKS,
        deliverables: []
      });
      console.log('📦 As 9 tarefas com funções e responsáveis foram gravadas no MongoDB Atlas!');
    }
  })
  .catch(err => console.error('❌ Erro no MongoDB:', err));

app.use(express.static(__dirname));

// 4. Gestão de Comunicação em Tempo Real com Socket.io
io.on('connection', async (socket) => {
  console.log('Novo utilizador ligado:', socket.id);

  // Envia os dados guardados no MongoDB assim que o utilizador entra
  try {
    const currentState = await AppState.findOne({ key: 'main_state' });
    if (currentState) {
      socket.emit('init_state', {
        tasks: currentState.tasks,
        deliverables: currentState.deliverables
      });
    }
  } catch (err) {
    console.error('Erro ao ler estado do MongoDB:', err);
  }

  // Recebe sincas/alterações feitas pelos 11 utilizadores e guarda permanentemente
  socket.on('sync_data', async (data) => {
    try {
      await AppState.findOneAndUpdate(
        { key: 'main_state' },
        { tasks: data.tasks, deliverables: data.deliverables, updatedAt: new Date() },
        { upsert: true }
      );
      // Transmite a atualização para todos os outros colegas ligados
      socket.broadcast.emit('update_data', data);
    } catch (err) {
      console.error('Erro ao guardar alterações no MongoDB:', err);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor INFINWAY a rodar na porta ${PORT}`));
