import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'api', 'representantes_formatado_com_whatsapp.json');
const dados = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// (resto do código permanece igual)

// Função para normalizar
function normalizar(texto) {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

// Exporta função para Vercel (Node.js)
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'Método não permitido. Use POST.' });
    return;
  }

  const body = req.body;
  let { cidade, cep } = body;
  let estado = null;

  console.log("[Webhook] Requisição recebida:", body);

  // Buscar cidade via ViaCEP
  if (cep && !cidade) {
    try {
      console.log(`[CEP] Consultando ViaCEP: ${cep}`);
      const viaCepResp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await viaCepResp.json();
      if (data?.erro || !data?.localidade || !data?.uf) {
        res.status(400).json({ erro: 'CEP inválido ou não encontrado.' });
        return;
      }
      cidade = data.localidade;
      estado = data.uf;
      console.log(`[ViaCEP] Cidade: ${cidade}, Estado: ${estado}`);
    } catch (err) {
      console.error("[ViaCEP] Erro:", err);
      res.status(500).json({ erro: 'Erro ao consultar ViaCEP.' });
      return;
    }
  }

  if (!cidade) {
    res.status(400).json({ erro: 'Cidade não informada.' });
    return;
  }

  const cidade_normalizada = normalizar(cidade);
  const estado_normalizado = estado ? estado.toLowerCase() : null;

  console.log(`[Busca] Cidade: ${cidade_normalizada}, Estado: ${estado_normalizado || 'qualquer'}`);

  const resultado = dados.find(rep =>
    normalizar(rep.cidade_normalizada) === cidade_normalizada &&
    (!estado_normalizado || rep.estado.toLowerCase() === estado_normalizado)
  );

  if (!resultado) {
    console.warn(`[Busca] Representante não encontrado: ${cidade_normalizada}, ${estado_normalizado || 'qualquer'}`);
    res.status(404).json({ erro: 'Representante não encontrado para essa cidade.' });
    return;
  }

  console.log(`[Sucesso] Representante: ${resultado.representante}, ${resultado.cidade} - ${resultado.estado}`);
  res.status(200).json({
    representante: resultado.representante,
    cidade: resultado.cidade,
    estado: resultado.estado,
    celular: resultado.celular,
    whatsapp: resultado.whatsapp
  });
}
