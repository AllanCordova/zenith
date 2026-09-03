# PRD — Product Requirements Document

**Produto:** Zenith — Tracker calórico para treinos híbridos  
**Autores:** Allan Roberto Cordova de Campos

Documento de requisitos: visão, histórias de usuário e regras de negócio.

---

## 1. Visão do produto

O Zenith é uma plataforma SaaS full-cycle de acompanhamento nutricional e esportivo. Atua em dois lados:

1. **App do aluno** — rastreador hiperadaptável, focado em adesão, baixo atrito e clareza sobre o próprio processo.
2. **Painel do treinador** — CRM operacional com white label, visão global da carteira, intervenção ativa e automação de comunicação.

O problema central é o engessamento das dietas tradicionais diante de rotinas híbridas (força + cardio + esportes no mesmo dia). Metas calóricas fixas, registro lento e variação natural de peso geram abandono, pânico e trabalho manual demais para o profissional.

**Promessa:** o aluno gasta o mínimo de tempo no app, entende se está no caminho e não entra em pânico com ruído; o treinador escala atendimento sem perder a marca nem o tom de voz.

---

## 2. Personas

### 2.1 Aluno (cliente)

Pessoa em consultoria com treinos híbridos. Precisa registrar refeições rápido, ver se o dia “fechou” de verdade e manter motivação no longo prazo. Não quer planilha, nem julgamento por um pico de peso no domingo.

### 2.2 Treinador (profissional)

Consultor que atende vários alunos. Precisa imprimir a própria marca, ver quem precisa de atenção agora e disparar correção/incentivo sem viver no WhatsApp pessoal nem monitorar a tela 24h.

---

## 3. Histórias de usuário

### 3.0 Histórias de sistema

**US-AS0 — Autenticação e modelo de usuário**  
**Status:** concluída  
Como visitante, eu quero me cadastrar e entrar com e-mail e senha escolhendo o papel (`CLIENT` ou `TRAINER`), para acessar só a interface do meu papel (`/app` ou `/studio`) com sessão em cookie `httpOnly`.

### 3.1 Histórias do aluno

Foco: adesão, remoção de atrito, motivação e consciência do processo.

**US-A01 — Rastreamento ágil**  
Como usuário, eu quero usar um sistema de autocompletar inteligente para minhas refeições diárias, para que eu gaste o mínimo de tempo possível no aplicativo.

**US-A02 — Gasto híbrido inteligente**  
Como usuário, eu quero que minha meta calórica se ajuste automaticamente nos dias em que empilho treinos, para refletir meu gasto real.

**US-A03 — Gestão de expectativas**  
Como usuário, eu quero que o sistema suavize as variações normais do meu peso semanal, para que eu não entre em pânico com flutuações de retenção de líquido nos finais de semana.

**US-A04 — Gamificação e metas**  
Como usuário, eu quero ver minha meta final, o tempo faltante e ganhar badges pelo meu desempenho, para me manter engajado e motivado no longo prazo.

**US-A05 — Métricas sinceras**  
Como usuário, eu quero um indicador visual binário cruzando meu esforço e minha ingestão, para saber com clareza se estou dentro do meu objetivo e validar o ajuste automático semanal de calorias.

**US-A06 — Alerta de macros**  
Como usuário, eu quero receber alertas caso minhas proporções saiam do controle, para garantir que não estou batendo minhas metas focando em apenas um macronutriente.

**US-A07 — Suporte integrado**  
Como usuário, eu quero receber feedbacks e alertas diretamente no aplicativo, para me sentir acompanhado de perto durante todo o processo.

**US-A08 — Canal direto de dúvidas**  
Como usuário, eu quero poder responder ao treinador no chat do app, para relatar dificuldades específicas do meu dia (ex.: fui a uma festa e não sei como registrar o que comi).

### 3.2 Histórias do profissional

Foco: escala, controle rápido e valorização da marca.

**US-T01 — Identidade visual (white label)**  
Como treinador, eu quero personalizar o aplicativo com minha logomarca e cores, para agregar valor à minha consultoria.

**US-T02 — Controle de parâmetros**  
Como treinador, eu quero definir o objetivo do aluno e configurar uma “margem de erro” oculta nas calorias, para compensar pequenos deslizes ou refeições difíceis de rastrear.

_(Fluxo operacional: US-T09 a US-T13.)_

**US-T03 — Visão global e atalhos**  
Como treinador, eu quero um dashboard com a visão geral de todos os meus clientes, para gerenciar diferentes alunos em uma única tela.

**US-T04 — Monitoramento em tempo real**  
Como treinador, eu quero ver os registros dos meus alunos no momento em que acontecem, para entender seus comportamentos e padrões imediatamente.

**US-T05 — Sistema de intervenção ativa**  
Como treinador, eu quero receber lembretes e alertas vermelhos do sistema (ex.: aluno extrapolou, estagnou ou desbalanceou macros), para que eu saiba exatamente quando preciso mandar uma mensagem de correção ou incentivo.

**US-T06 — Automação de gatilhos**  
Como treinador, eu quero configurar regras automáticas de mensagens (ex.: aluno estagnou, bateu a meta da semana, ou não registrou as refeições), para manter o engajamento sem precisar monitorar a tela 24 horas por dia.

**US-T07 — Centralização da comunicação**  
Como treinador, eu quero um módulo de chat interno no painel, para separar o atendimento aos meus clientes da minha vida pessoal no WhatsApp.

**US-T08 — Personalização de abordagem**  
Como treinador, eu quero poder escrever as mensagens automáticas com o meu próprio tom de voz, para que a comunicação pareça humana e exclusiva.

### 3.3 Fluxo de Configuração Inicial (Onboarding)

Ao adicionar um novo aluno, o treinador percorre este fluxo para o algoritmo ter base antropométrica, rotina, objetivo e teto calórico revisado.

**US-T09 — Dados antropométricos**  
Como treinador, eu quero informar idade, peso atual, altura e sexo biológico do aluno, para o sistema calcular a Taxa Metabólica Basal (TMB) com Mifflin-St Jeor.

**US-T10 — Mapeamento de rotina**  
Como treinador, eu quero selecionar os esportes praticados e a frequência semanal de cada um, para definir o multiplicador de gasto calórico (PAL).

**US-T11 — Definição do objetivo**  
Como treinador, eu quero escolher a meta principal do aluno (Emagrecimento/Déficit, Hipertrofia/Superávit ou Manutenção), para o motor aplicar o ajuste calórico correto.

**US-T12 — Cálculo automático (o motor)**  
Como treinador, eu quero que o sistema cruze antropometria, rotina e objetivo e sugira o teto calórico e a divisão de macronutrientes, para eu partir de um número clínico e não de uma planilha manual.

**US-T13 — Sintonia fina e margem**  
Como treinador, eu quero revisar os números gerados, editá-los se o feeling clínico pedir e só então configurar a margem de erro invisível ao aluno, para o teto oficial ficar sob meu controle e os deslizes pequenos não dispararem falso alarme.

---

## 4. Regras de negócio (motor calórico)

Aplicam-se a US-T09–T13. O aluno nunca vê `errorMarginKcal`.

**TMB (Mifflin-St Jeor)**  
`TMB = 10 × peso(kg) + 6,25 × altura(cm) − 5 × idade + s`, com `s = +5` (masculino) ou `s = −161` (feminino). Resultado em kcal/dia, arredondado para inteiro.

**Multiplicador PAL** — soma das frequências semanais de todos os esportes do plano:

| Sessões/semana | PAL |
| --- | --- |
| 0 | 1,2 |
| 1–3 | 1,375 |
| 4–6 | 1,55 |
| 7–9 | 1,725 |
| 10+ | 1,9 |

**GET (gasto energético total)** — `GET = TMB × PAL`, inteiro.

**Teto sugerido**

| Objetivo | Ajuste |
| --- | --- |
| `FAT_LOSS` | GET × 0,80 (déficit 20%) |
| `HYPERTROPHY` | GET × 1,10 (superávit 10%) |
| `MAINTENANCE` | GET |

**Macros sugeridos** (gramas inteiras): proteína `2,0 g/kg` (`FAT_LOSS`), `2,2 g/kg` (`HYPERTROPHY`) ou `1,6 g/kg` (`MAINTENANCE`); gordura 25% das kcal do teto (`kcal / 9`); carboidrato o restante (`(kcal − proteína×4 − gordura×9) / 4`, mínimo 0).

**Teto vigente** — após US-T13, o aluno vê `caloriesKcal` (valor revisado pelo treinador). A faixa “ainda ok” usada por alertas e pelo medidor sincero é `caloriesKcal + errorMarginKcal`.

**Ordem do wizard** — antropometria → rotina → objetivo (dispara o motor) → revisão + margem. Não há teto vigente enquanto o passo não for `COMPLETE`.
