# Zenith (Tracker Calórico para Treinos Híbridos)

**Link em Produção:** [Aguardando Deploy na Nuvem]
**Autores:** Allan Roberto Cordova de Campos

---

## 1. Visão Geral
A aplicação é uma plataforma SaaS Full-Cycle projetada para o acompanhamento nutricional e esportivo. O sistema atua como um CRM avançado para treinadores e nutricionistas, e como um rastreador hiperadaptável para pacientes, resolvendo o problema do engessamento das dietas tradicionais frente a rotinas de treinos híbridos.

A arquitetura do produto é dividida em duas interfaces interativas e interdependentes:

App do Paciente (Adesão e Gestão de Expectativas): Focado em remover o atrito do registro diário. O sistema ajusta a meta calórica dinamicamente conforme o volume de treinos do dia e utiliza autocompletar inteligente para refeições padronizadas. Para manter o engajamento e a saúde mental do aluno, a interface traz um suavizador de flutuação de peso semanal, gamificação por metas, alertas de balanceamento de macronutrientes e um "Medidor Sincero" — um indicador binário que cruza ingestão e gasto para confirmar, sem rodeios, se o déficit ou objetivo real está acontecendo.

Painel do Profissional (Escala, Automação e White Label): Um ambiente customizável onde o profissional imprime sua própria marca. O módulo oferece um dashboard global com sistema de triagem, destacando em tempo real os alunos que estagnaram ou cometeram deslizes. O grande diferencial técnico é o motor de intervenção: o consultor pode embutir "margens de erro" ocultas nos cálculos dos pacientes e configurar gatilhos automáticos no chat interno, disparando mensagens personalizadas de correção ou incentivo sem precisar monitorar a tela 24 horas por dia.

## 📚 2. Documentação Oficial (Docs as Code)
Toda a especificação do sistema e rastreabilidade do método Spec-Driven Development (SDD) estão versionadas na pasta `/docs`:
* **[PRD (Product Requirements Document)](./docs/prd.md):** Visão do produto, User Stories e regras de negócio.
* **[SDD (Software Design Document)](./docs/sdd.md):** Diagrama de banco de dados (Mermaid) e decisões de arquitetura.
* **[Checklist de Avaliação](./docs/checklist.md):** Controle de entrega dos IDs e RAs da disciplina.

*Nota: As especificações e planos de implementação de cada história de usuário (Issue) encontram-se na pasta `/specs/`.*

## 3. Stack Tecnológica
* **Arquitetura:** Monorepo (`/apps/api` e `/apps/web`).
* **Backend (API):** NestJS, TypeScript, JWT (Autenticação e Guards).
* **Banco de Dados:** PostgreSQL em nuvem gerenciado via Prisma ORM.
* **Frontend (Web/PWA):** Next.js (React).
* **Qualidade de Software:** TDD com Jest e integração contínua (CI) via GitHub Actions.
* **Integração Externa:** Gateway de Pagamento (Stripe / Mercado Pago) com confirmação via Webhook.

## 4. Quick Start (Como Executar)

**1. Clone o repositório:**
```bash
git clone https://github.com/AllanCordova/zenith.git
cd zenith
```

**2. Configure as Variáveis de ambiente:**

```bash
cp .env.example .env
```

**3. Subir o banco:**

```bash
docker compose up -d
```

**4. API (NestJS) — http://localhost:3001**

```bash
cd apps/api
npm install
npm run start:dev
```

**5. Client (Next.js) — http://localhost:3000**

```bash
cd apps/web
npm install
npm run dev
```
