// Exemplo de como usar o LoadingWrapper em qualquer página
import LoadingWrapper from "@/components/LoadingWrapper";

const MyPage = () => {
  return (
    <LoadingWrapper duration={2000}>
      {/* Seu conteúdo da página aqui */}
      <div>
        <h1>Minha Página</h1>
        <p>Este conteúdo será exibido após 2 segundos de carregamento.</p>
      </div>
    </LoadingWrapper>
  );
};

export default MyPage;
