# 🚀 Teste de Performance do Banco de Dados

## Como Executar

Execute o seguinte comando para testar a performance do banco de dados:

```bash
npm run test:performance
```

## O que o teste faz?

O script executa automaticamente:

### 1. 📊 Estatísticas das Coleções
- Mostra quantos documentos existem em cada coleção
- Mostra o tamanho de cada coleção
- Lista todos os índices criados

### 2. 🔍 Testes de Queries
Testa queries reais em todas as coleções:
- **Vagas (Vacancy)** - 6 queries
- **Candidaturas (Application)** - 4 queries  
- **Usuários (User)** - 3 queries
- **Empresas (Company)** - 2 queries
- **Posts** - 2 queries
- **Outras coleções** - 7 queries

**Total: ~24 queries testadas**

### 3. 📈 Métricas Coletadas
Para cada query, o teste mede:
- ⏱️ Tempo de execução (em milissegundos)
- 📄 Quantos documentos foram retornados
- 🔍 Quantos documentos foram examinados
- 🔑 Qual índice foi usado (ou se fez COLLSCAN)
- 💯 Eficiência da query

### 4. 🎯 Análise e Recomendações
O script analisa os resultados e mostra:
- ✅ Queries que estão otimizadas
- ⚠️ Queries que precisam de índices
- ⚠️ Queries que estão lentas (>100ms)
- 💡 Recomendações de otimização

## Interpretando os Resultados

### ✅ Bom
- Query usa índice específico
- Tempo de execução < 100ms
- Eficiência próxima de 100%

### ⚠️ Atenção
- Query usa COLLSCAN (sem índice)
- Tempo de execução > 100ms
- Muitos documentos examinados vs retornados

### ❌ Crítico
- Query com erro
- Tempo de execução > 1000ms
- P95 muito alto

## Exemplo de Saída

```
📦 Vacancy (Vagas)
   • Documentos: 1,234
   • Tamanho: 2.5 MB
   • Índices: 3 (_id_, createdAt_-1, status_1)

✅ Buscar vagas recentes (ordenadas)
   ⏱️  Tempo: 15ms
   📄 Retornados: 50 docs
   🔍 Examinados: 50 docs
   🔑 Índice: createdAt_-1
   💯 Eficiência: 100.0%

⚠️ Buscar vagas remotas
   ⏱️  Tempo: 125ms
   📄 Retornados: 234 docs
   🔍 Examinados: 1234 docs
   🔑 Índice: COLLSCAN
   💯 Eficiência: 19.0%
   ⚠️ ALERTA: Collection scan em coleção grande!
```

## O que fazer com os resultados?

### Se aparecer "COLLSCAN":
Você precisa criar um índice para essa query. Exemplo:

```javascript
// No modelo Vacancy.ts
VacancySchema.index({ remote: 1, status: 1 });
```

### Se aparecer "Query lenta":
Considere:
1. Criar índices apropriados
2. Usar `.lean()` se não precisar de métodos Mongoose
3. Limitar resultados com `.limit()`
4. Usar projeção para retornar apenas campos necessários

### Se a eficiência estiver baixa:
A query está examinando muitos documentos desnecessariamente. Crie índices compostos que combinem os filtros usados.

## Quando executar?

- ✅ Antes de fazer deploy
- ✅ Depois de adicionar novos índices
- ✅ Depois de mudanças no schema
- ✅ Quando suspeitar de problemas de performance
- ✅ Periodicamente para monitorar a saúde do banco

## Requisitos

- MongoDB rodando e acessível
- Arquivo `.env.local` com `MONGODB_URI` configurado
- Dados no banco (execute os scripts de seed se necessário)

## Troubleshooting

### Erro: "MONGODB_URI não definida"
Verifique se o arquivo `.env.local` existe e contém:
```
MONGODB_URI=mongodb://localhost:27017/seu-banco
```

### Erro: "Não foi possível conectar ao MongoDB"
Verifique se o MongoDB está rodando:
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### Todas as queries retornam 0 documentos
Execute os scripts de seed para popular o banco:
```bash
npm run seed
```

---

**Criado por:** Ramon Santos  
**Última atualização:** 2025-11-27
