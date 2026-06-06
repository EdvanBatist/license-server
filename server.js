// ============================================================
//  SERVIDOR DE LICENÇAS - Node.js + Express
//  Hospede no Railway.app (gratuito)
// ============================================================

const express = require('express');
const app = express();
app.use(express.json());

// ── CHAVE SECRETA (troque por algo só seu) ──────────────────
const API_SECRET = 'MINHA_CHAVE_SECRETA_123';

// ── BASE DE CLIENTES (substitua por banco de dados depois) ──
// Cada entrada: identificador único do cliente (CNPJ, código, etc.)
// e a licença que seu gerador já produziu para ele.
let clientes = {
  "CLIENTE001": {
    nome: "SISTEMA PMM",
    licenca: "1beff21a32e849688ad0512f0033e55f",   // <-- coloque a licença gerada pelo seu gerador
    status: "bloqueado",      // "ativo" ou "bloqueado"
    validade: "2026-06-30"
  },
  "CLIENTE002": {
    nome: "Barbearia Flash",
    licenca: "AAAA-BBBB-CCCC-5678",
    status: "bloqueado",
    validade: "2025-05-01"
  }
};

// ── ROTA: buscar licença ────────────────────────────────────
// O sistema desktop chama: POST /licenca
// Body: { "cliente_id": "CLIENTE001", "secret": "MINHA_CHAVE_SECRETA_123" }
app.post('/licenca', (req, res) => {
  const { cliente_id, secret } = req.body;

  // Valida a chave secreta (impede acesso externo)
  if (secret !== API_SECRET) {
    return res.status(401).json({ ok: false, motivo: 'Acesso negado.' });
  }

  const cliente = clientes[cliente_id];

  if (!cliente) {
    return res.json({ ok: false, motivo: 'Cliente não encontrado.' });
  }

  if (cliente.status === 'bloqueado') {
    return res.json({
      ok: false,
      motivo: `Sistema bloqueado por falta de pagamento. Entre em contato: (xx) xxxxx-xxxx`
    });
  }

  // Verifica validade
  const hoje = new Date();
  const venc = new Date(cliente.validade);
  if (hoje > venc) {
    clientes[cliente_id].status = 'bloqueado';
    return res.json({
      ok: false,
      motivo: 'Licença vencida. Realize o pagamento para continuar.'
    });
  }

  // Tudo certo — devolve a licença
  return res.json({
    ok: true,
    licenca: cliente.licenca,
    validade: cliente.validade,
    nome: cliente.nome
  });
});

// ── ROTA: painel admin — listar clientes ───────────────────
app.get('/admin/clientes', (req, res) => {
  const { secret } = req.query;
  if (secret !== API_SECRET) return res.status(401).json({ erro: 'Negado' });
  res.json(clientes);
});

// ── ROTA: admin — bloquear/liberar ─────────────────────────
app.post('/admin/status', (req, res) => {
  const { secret, cliente_id, status } = req.body;
  if (secret !== API_SECRET) return res.status(401).json({ erro: 'Negado' });
  if (!clientes[cliente_id]) return res.json({ erro: 'Cliente não encontrado' });
  clientes[cliente_id].status = status; // "ativo" ou "bloqueado"
  res.json({ ok: true, cliente: clientes[cliente_id] });
});

// ── ROTA: admin — atualizar licença e validade ─────────────
app.post('/admin/renovar', (req, res) => {
  const { secret, cliente_id, licenca, validade } = req.body;
  if (secret !== API_SECRET) return res.status(401).json({ erro: 'Negado' });
  if (!clientes[cliente_id]) return res.json({ erro: 'Cliente não encontrado' });
  clientes[cliente_id].licenca = licenca;
  clientes[cliente_id].validade = validade;
  clientes[cliente_id].status = 'ativo';
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
