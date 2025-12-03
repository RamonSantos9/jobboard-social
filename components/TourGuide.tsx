"use client";

import { useEffect } from "react";
import { useTour } from "@/hooks/useTour";
import { DriveStep } from "driver.js";

export default function TourGuide() {
  const { startTour } = useTour();

  const steps: DriveStep[] = [
    {
      element: "#header-logo",
      popover: {
        title: "Bem-vindo ao JobBoard!",
        description:
          "Este é o seu ponto de partida. Clique aqui para voltar ao feed principal a qualquer momento.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: "#header-search",
      popover: {
        title: "Busca Inteligente",
        description: "Encontre vagas, empresas e pessoas rapidamente.",
        side: "bottom",
      },
    },
    {
      element: "#nav-início",
      popover: {
        title: "Navegação",
        description: "Acesse seu feed, rede, vagas e mensagens por aqui.",
        side: "bottom",
      },
    },
    {
      element: "#create-post-box",
      popover: {
        title: "Compartilhe algo",
        description: "Publique atualizações, artigos ou dúvidas para sua rede.",
        side: "bottom",
      },
    },
    {
      element: "#header-post-job",
      popover: {
        title: "Anuncie uma Vaga",
        description:
          "Está contratando? Crie um anúncio de vaga para encontrar talentos.",
        side: "bottom",
      },
    },
    {
      element: "#header-profile-menu",
      popover: {
        title: "Seu Perfil",
        description: "Gerencie sua conta, veja seu perfil e configurações.",
        side: "left",
      },
    },
  ];

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenMainTour");
    if (!hasSeenTour) {
      // Pequeno delay para garantir que a UI carregou
      setTimeout(() => {
        startTour(steps);
        localStorage.setItem("hasSeenMainTour", "true");
      }, 1000);
    }

    // Listener para iniciar manualmente via evento
    const handleStartTour = () => {
      startTour(steps);
    };

    window.addEventListener("startMainTour", handleStartTour);
    return () => {
      window.removeEventListener("startMainTour", handleStartTour);
    };
  }, []);

  return null; // Este componente não renderiza nada visualmente por enquanto
}
