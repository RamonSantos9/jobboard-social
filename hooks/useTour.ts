import { useEffect, useRef } from "react";
import { driver, DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

// Singleton para garantir apenas um tour ativo por vez
let activeDriver: ReturnType<typeof driver> | null = null;

export const useTour = () => {
  const driverObj = useRef<ReturnType<typeof driver>>(null);

  useEffect(() => {
    driverObj.current = driver({
      showProgress: true,
      animate: true,
      nextBtnText: "Próximo",
      prevBtnText: "Anterior",
      doneBtnText: "Concluir",
      allowClose: true,
      overlayColor: "rgba(0, 0, 0, 0.6)",
      onPopoverRender: (popover, { config, state }) => {
        const firstButton = popover.footerButtons.firstChild as HTMLElement;
        if (firstButton) {
          firstButton.style.backgroundColor = "#f1f1f1";
          firstButton.style.color = "#333";
        }
      },
      // Adicionar listener de clique no elemento destacado para avançar
      onHighlightStarted: (element, step, options) => {
        if (!element) return;

        // Função para avançar ao clicar
        const clickHandler = () => {
          if (driverObj.current) {
            // Pequeno delay para permitir que a ação do clique (ex: abrir menu) ocorra
            setTimeout(() => {
              // Verificar se o driver ainda está ativo e válido
              if (driverObj.current && driverObj.current.isActive()) {
                if (driverObj.current.hasNextStep()) {
                  driverObj.current.moveNext();
                } else {
                  driverObj.current.destroy();
                }
              }
            }, 300);
          }
        };

        // Adicionar o listener
        element.addEventListener("click", clickHandler, { once: true });
      },
    });
  }, []);

  const startTour = (steps: DriveStep[]) => {
    // Se houver um driver ativo globalmente, destruí-lo antes de iniciar um novo
    if (activeDriver) {
      try {
        activeDriver.destroy();
      } catch (e) {
        console.error("Erro ao destruir driver anterior:", e);
      }
      activeDriver = null;
    }

    if (driverObj.current) {
      activeDriver = driverObj.current;
      driverObj.current.setSteps(steps);
      driverObj.current.drive();
    }
  };

  return { startTour, driverObj };
};
