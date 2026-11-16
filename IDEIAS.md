# Ideias e Estratégia de Arquitetura: Privacidade & Modelos de IA (AWY)

Este documento reúne o planejamento e as opções técnicas para o posicionamento de privacidade e execução dos modelos de IA no aplicativo **AWY (Always With You)**.

---

## 🎯 1. Objetivo de Produto e Marketing

Possibilitar o posicionamento de que **"as conversas são privadas, salvas apenas no celular do usuário e nenhum dado pessoal é coletado ou vendido"**.

Para sustentar esse rótulo com credibilidade legal e técnica, é necessário alinhar a arquitetura da IA à promessa de privacidade.

---

## 🔍 2. Análise de Privacidade: Google e OpenAI

Muitos usuários acreditam que qualquer uso de IA alimenta bases de treinamento de Big Techs. A realidade depende do canal e do tipo de contrato:

| Provedor / Tipo | Usa chats para treinar IA? | Retenção de dados | Riscos para a promessa de marketing |
| :--- | :--- | :--- | :--- |
| **OpenAI (API Comercial)** | ❌ **Não treina** por padrão desde março de 2023. | Retido por até 30 dias para moderação e auditoria de abusos. | Trafega pelos servidores da OpenAI; não é "100% offline/local". |
| **Google Gemini (API Gratuita - AI Studio)** | ⚠️ **SIM, pode treinar** e pode passar por revisores humanos. | Logs persistidos pelo Google. | **Incompatível** com a promessa de privacidade total. |
| **Google Gemini (API Paga / Vertex AI)** | ❌ **Não treina**. | Retido apenas para operação e conformidade. | Tráfego em nuvem comercial. |
| **ChatGPT / Gemini Web (consumidor)** | ⚠️ **SIM** (padrão ativo nos apps de consumo). | Histórico em nuvem. | Inaplicável para integração via app. |

> **Conclusão:** Não é permitido legalmente dizer *"não enviamos nenhuma informação para Google/OpenAI"* se o app fizer requisições HTTP para as APIs deles. Se essas APIs forem usadas, a comunicação deve ser: *"Histórico salvo apenas no seu dispositivo; envio efêmero via API segura sem uso para treinamento"*.

---

## 🚀 3. As Três Opções de Arquitetura

### Opção A: IA 100% On-Device (No próprio smartphone)

A IA roda diretamente no processador (CPU / GPU / NPU) do aparelho do usuário. **Nenhuma palavra sai do celular.**

#### Performance Real em Celulares Modernos (Mito da Lentidão Superado)
Graças à quantização em 4 bits (GGUF) e aos modelos SLM (*Small Language Models*), a IA responde em tempo real (1 a 3 segundos para iniciar e fluxo de 15 a 45 palavras por segundo):

| Modelo | Tamanho (Q4_K_M) | RAM Recomendada | Velocidade Média | Perfil para Roleplay |
| :--- | :--- | :--- | :--- | :--- |
| **Llama 3.2 1B** | ~750 MB | 2.5 GB+ | 30 a 45 tokens/s | Ultra-rápido, diálogos diretos e expressivos. |
| **Llama 3.2 3B** | ~1.8 GB | 4 GB+ | 15 a 30 tokens/s | Excelente coerência, memória de contexto e vocabulário. |
| **Qwen 2.5 1.5B / 3B** | ~1.1 GB / 2.0 GB | 3 GB / 4 GB+ | 20 a 35 tokens/s | Altíssimo nível de raciocínio e suporte multilíngue. |
| **SmolLM2 1.7B** | ~1.0 GB | 3 GB+ | 25 a 40 tokens/s | Muito leve e focado em conversação casual. |

#### Vantagens:
- **Privacidade matemática absoluta:** Funciona no modo avião / offline. Zero envio a qualquer servidor externo.
- **Custo operacional zero:** Sem faturas mensais de tokens de API ou servidores de GPU.
- **Independência total:** Nenhuma dependência de estabilidade ou políticas de terceiros.

#### Desafios / Requisitos:
- **Download inicial:** O usuário precisa baixar o arquivo de peso do modelo (~800 MB a 1.8 GB) na primeira execução.
- **Hardware de entrada:** Aparelhos muito antigos (< 3 GB de RAM livre) podem ter desempenho reduzido.
- **Integração Expo:** Necessita de módulo nativo como `llama.rn` ou `react-native-executorch` compilado via EAS Build ou `npx expo run:android / ios`.

---

### Opção B: Servidor Próprio / Open-Source (Self-Hosted Cloud)

O app se conecta a um backend privado mantido pelo AWY (rodando vLLM, Ollama ou TGI em instâncias de GPU dedicadas, ex: RunPod, AWS ou GCP Compute Engine com modelos open-weight como Llama ou Mistral).

#### Vantagens:
- Zero envio de dados para Google ou OpenAI.
- O app do usuário continua leve (sem download de 1 GB no celular).
- O backend pode ser configurado com política estrita de *Zero Logging* (descartando os prompts da memória imediatamente após a geração).

#### Desafios:
- Custos fixos com servidores de GPU dedicados.
- Requer infraestrutura de alta disponibilidade e balanceamento de carga.

---

### Opção C: Posicionamento Híbrido / Transparente com API Paga

Manter as APIs de nuvem comerciais (OpenAI Pay-as-you-go ou Gemini Vertex AI), mas ajustar o discurso e a arquitetura:

- **Armazenamento 100% Local:** Os chats e fichas de personagens nunca saem do banco local do celular (`AsyncStorage`).
- **Processamento Efêmero:** O envio para a API é feito de forma segura e stateless, sob termos comerciais que proíbem o uso dos dados para treinar modelos.
- **Opção BYOK (Bring Your Own Key):** Permitir que usuários avançados insiram sua própria chave de API se desejarem.

---

## 📋 4. Próximos Passos Recomendados

1. **Definição da Prioridade de Negócio:**
   - Se o foco principal for **privacidade total e funcionamento offline como diferencial competitivo número 1**, prototipar a PoC com `llama.rn` e `Llama-3.2-1B-Instruct-Q4_K_M.gguf`.
   - Se o foco for **leveza imediata no download da loja e compatibilidade universal**, adotar a Opção C com termos claros de privacidade.
2. **Atualização da Interface e Termos:**
   - Criar uma tela ou badge no app indicando o status de privacidade das conversas (*"Armazenamento 100% Local"*).
