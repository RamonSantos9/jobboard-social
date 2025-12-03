# Tutorial: Como Apresentar Funcionalidades do Sistema (Feature Tour)

Este tutorial guia você na implementação de um "Tour Guiado" (ou _Walkthrough_) para apresentar as funcionalidades do seu sistema aos usuários. Vamos utilizar a biblioteca **driver.js**, que é leve, moderna e fácil de integrar com React/Next.js.

## 1. O que é um Feature Tour?

Um Feature Tour é uma série de passos que destaca elementos específicos da interface (como botões, menus ou formulários) e exibe um popover com explicações. É ideal para:

- _Onboarding_ de novos usuários.
- Apresentar novas funcionalidades após uma atualização.
- Guiar o usuário em fluxos complexos.

## 2. Instalação

Primeiro, instale a biblioteca `driver.js`:

```bash
npm install driver.js
```

## 3. Criando o Componente de Tour

Vamos criar um hook ou componente reutilizável para gerenciar o tour. Como você está usando Next.js com React, um **Hook customizado** é uma ótima abordagem.

Crie um arquivo `hooks/useTour.ts` (ou onde preferir organizar seus hooks):

```typescript
// hooks/useTour.ts
import { useEffect, useRef } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

export const useTour = () => {
  // A instância do driver precisa ser mantida
  const driverObj = useRef<ReturnType<typeof driver>>(null);

  useEffect(() => {
    // Inicializa o driver
    driverObj.current = driver({
      showProgress: true, // Mostra barra de progresso ou "1 de 3"
      animate: true, // Animação suave entre passos
      // Tradução dos botões (opcional)
      nextBtnText: "Próximo",
      prevBtnText: "Anterior",
      doneBtnText: "Concluir",
      allowClose: true, // Permite fechar clicando fora ou ESC
    });
  }, []);

  const startTour = (steps: DriveStep[]) => {
    if (driverObj.current) {
      driverObj.current.setSteps(steps);
      driverObj.current.drive();
    }
  };

  return { startTour };
};
```

## 4. Definindo os Passos do Tour

Os passos são definidos por um array de objetos, onde cada objeto indica o elemento alvo (pelo ID ou classe) e o conteúdo do popover.

Exemplo de configuração de passos:

```typescript
const tourSteps = [
  {
    element: "#header-logo", // ID do elemento
    popover: {
      title: "Bem-vindo ao JobBoard!",
      description: "Aqui você encontra as melhores oportunidades.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#search-bar",
    popover: {
      title: "Busca Inteligente",
      description: "Filtre vagas por cargo, empresa ou localização.",
      side: "bottom",
    },
  },
  {
    element: "#create-post-btn",
    popover: {
      title: "Publique uma Vaga",
      description: "Clique aqui para criar um novo anúncio de emprego.",
      side: "left",
    },
  },
];
```

## 5. Integrando na sua Aplicação

Agora, vamos usar o hook em um componente (por exemplo, na sua `HomePage` ou `Layout`).

**Importante:** Certifique-se de que os elementos que você quer destacar tenham `id`s únicos (ex: `id="header-logo"`).

```tsx
// app/page.tsx (exemplo)
"use client";

import { useEffect } from "react";
import { useTour } from "@/hooks/useTour";

export default function HomePage() {
  const { startTour } = useTour();

  const handleStartTour = () => {
    startTour([
      {
        element: "#logo",
        popover: {
          title: "Logo",
          description: "Volte ao início clicando aqui.",
        },
      },
      {
        element: "#jobs-feed",
        popover: {
          title: "Feed de Vagas",
          description: "Aqui estão as vagas mais recentes.",
        },
      },
    ]);
  };

  // Opcional: Iniciar automaticamente na primeira visita
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenTour");
    if (!hasSeenTour) {
      handleStartTour();
      localStorage.setItem("hasSeenTour", "true");
    }
  }, []);

  return (
    <main>
      <nav>
        <h1 id="logo">JobBoard</h1>
        <button onClick={handleStartTour}>Iniciar Tutorial</button>
      </nav>

      <div id="jobs-feed">{/* Lista de vagas */}</div>
    </main>
  );
}
```

## 6. Dicas de Design e UX

1.  **Não seja intrusivo:** Permita que o usuário pule o tour facilmente.
2.  **Seja breve:** Mantenha os textos curtos e diretos. Ninguém lê textões em popovers.
3.  **Foco no Valor:** Explique _por que_ aquela funcionalidade é útil, não apenas _o que_ ela é.
4.  **Estilização:** O `driver.js` tem um estilo padrão limpo, mas você pode customizar as cores via CSS se necessário para alinhar com sua marca (usando as classes do driver.js).

## 7. Alternativas

Se você precisar de algo muito mais complexo e específico para React (com componentes customizados dentro dos popovers), a biblioteca **react-joyride** é uma alternativa poderosa, embora mais verbosa para configurar. Para a maioria dos casos de "apresentação de sistema", o **driver.js** é a escolha mais eficiente.
