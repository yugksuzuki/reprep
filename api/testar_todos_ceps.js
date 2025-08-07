const fetch = require('node-fetch');


// Lista de CEPs que você forneceu (limpa)
const ceps = `
60510-138
60135-041
60710-830
29122-030
74863-050
38120-000
35570-000
38240-000
37570-000
38140-000
35179-000
38480-000
38073-000
79780-000
79950-000
85955-000
85904-270
85950-009
85950-035
86700-075
86800-007
86082-000
86870-000
86935-000
86865-000
87300-005
87010-440
86380-000
28900-001
28020-740
28010-076
28893-812
28909-490
59611-140
90030-143
96750-000
95590-000
96400-000
95700-000
94900-000
98975-000
99500-000
98005-000
99700-000
98400-000
98200-000
98700-000
95900-000
98300-000
99010-000
96200-000
96800-000
97010-000
98780-000
97760-000
98800-000
98960-000
97670-000
97850-000
97980-000
99560-000
99300-000
98910-000
93210-000
98900-000
96200-600
93800-140
92480-000
95250-000
92708-070
95300-000
95585-000
95577-000
95748-000
95535-000
95560-000
88303-301
88309-650
88304-101
88370-232
89801-000
89930-000
89640-000
89910-000
89950-000
89840-000
89600-000
89820-000
89850-000
88704-410
88210-000
88900-000
88955-000
88820-000
95480-000
88845-000
88801-000
88850-000
88950-000
88920-000
88980-000
88990-000
88965-000
88960-000
88940-000
88930-000
19360-081
14780-536
14403-430
14790-000
15700-000
15371-176
14750-000
15045-334
15500-006
11688-602
06454-070
18272-078
`.split('\n').map(c => c.trim()).filter(c => c.length >= 8);

const ENDPOINT = 'https://reprep-roan.vercel.app/api/representante';

// Delay entre requisições (em milissegundos)
const DELAY_MS = 1000;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log(`🧪 Iniciando teste de ${ceps.length} CEPs...\n`);

  for (const cep of ceps) {
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep })
      });

      const json = await res.json();

      if (res.ok) {
        console.log(`✅ ${cep} → ${json.representante} (${json.cidade} - ${json.estado})`);
      } else {
        console.warn(`❌ ${cep} → ${json.erro}`);
      }

    } catch (err) {
      console.error(`🔥 Erro em ${cep}:`, err.message);
    }

    // Delay de segurança entre chamadas
    await delay(DELAY_MS);
  }

  console.log("\n✅ Teste finalizado.");
})();
