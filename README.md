# JobBoard Social

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![React](https://img.shields.io/badge/React-19.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)

Plataforma social completa para profissionais e empresas se conectarem através de vagas e networking.

## 🚀 Visão Geral

JobBoard Social integra funcionalidades de rede social profissional com um sistema robusto de gerenciamento de vagas.

- **Para Profissionais:** Crie seu perfil, conecte-se, publique conteúdo e candidate-se a vagas.
- **Para Empresas:** Gerencie vagas, candidatos e promova sua marca empregadora.

## ✨ Funcionalidades Principais

<details>
<summary>Clique para expandir</summary>

- **Autenticação Segura**: Login social e credenciais com NextAuth.js.
- **Perfis Completos**: Experiência, educação e portfólio.
- **Feed Interativo**: Posts, comentários, reações e compartilhamentos.
- **Vagas & Candidaturas**: Fluxo completo de recrutamento.
- **Dashboard Analítico**: Gráficos e métricas para usuários e empresas.
- **Notificações em Tempo Real**: Fique por dentro de tudo que acontece.

</details>

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 16, React 19, Tailwind CSS, Shadcn/UI
- **Backend:** Next.js API Routes, MongoDB, Mongoose
- **Outros:** NextAuth.js, Cloudinary, Zod, Recharts

> Para detalhes técnicos aprofundados, consulte:
> - [Documentação da API](docs/API.md)
> - [Documentação de Componentes](docs/COMPONENTS.md)

## 🏁 Quick Start

### Pré-requisitos

- Node.js 18+
- MongoDB 6.0+

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/ramonsantos9/jobboard-social.git
    cd jobboard-social
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure o ambiente:**
    ```bash
    cp .env.example .env.local
    ```
    Preencha o `.env.local` com suas chaves (MongoDB, NextAuth, Cloudinary).

4.  **Execute:**
    ```bash
    npm run dev
    ```
    Acesse [http://localhost:3000](http://localhost:3000).

## 🤝 Contribuição

Quer contribuir? Ótimo! Confira nosso [Guia de Contribuição](CONTRIBUTING.md) para começar.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

Desenvolvido com ❤️ por [Ramon Santos](https://github.com/RamonSantos9).
