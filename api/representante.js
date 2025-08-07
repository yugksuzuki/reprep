import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

// === Carrega os dados do JSON ===
const filePath = path.join(process.cwd(), 'data', 'rep_m.json');
const dados = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// === Função para normalizar strings ===
function normalizar(texto) {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

// === Rota principal (POST) ===
export async function POST(request) {
  const body = await request.json();
  let { cidade, cep } = body;
  let estado = null;

  console.log("[Webhook] Requisição recebida:", body);

  // Caso tenha apenas CEP
  if (cep && !cidade) {
    console.log(`[CEP] Buscando cidade via ViaCEP para: ${cep}`);
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await resposta.json();

      if (data?.erro || !data?.localidade || !data?.uf) {
        console.warn("[ViaCEP] CEP inválido ou incompleto:", data);
        return NextResponse.json({ erro: 'CEP inválido ou não encontrado.' }, { status: 400 });
      }

      cidade = data.localidade;
      estado = data.uf;
      console.log(`[ViaCEP] Cidade encontrada: ${cidade}, UF: ${estado}`);
    } catch (err) {
      console.error("[ViaCEP] Erro ao consultar:", err);
      return NextResponse.json({ erro: 'Erro ao consultar o ViaCEP.' }, { status: 500 });
    }
  }

  if (!cidade) {
    console.warn("[Erro] Nenhuma cidade informada.");
    return NextResponse.json({ erro: 'Cidade não informada.' }, { status: 400 });
  }

  const cidade_normalizada = normalizar(cidade);
  const uf_normalizada = estado ? estado.toLowerCase() : null;

  console.log(`[Busca] Procurando por cidade: "${cidade_normalizada}" ${uf_normalizada ? `no estado ${uf_normalizada}` : ''}`);

  const resultado = dados.find(rep =>
    normalizar(rep.cidade_normalizada) === cidade_normalizada &&
    (!uf_normalizada || rep.estado.toLowerCase() === uf_normalizada)
  );

  if (!resultado) {
    console.warn(`[Busca] Representante não encontrado para cidade: "${cidade_normalizada}", estado: "${uf_normalizada || 'qualquer'}"`);
    return NextResponse.json({ erro: 'Representante não encontrado para essa cidade.' }, { status: 404 });
  }

  console.log(`[Sucesso] Representante encontrado: ${resultado.representante}, ${resultado.cidade} - ${resultado.estado}`);

  return NextResponse.json({
    representante: resultado.representante,
    cidade: resultado.cidade,
    estado: resultado.estado,
    celular: resultado.celular,
    whatsapp: resultado.whatsapp
  });
}
