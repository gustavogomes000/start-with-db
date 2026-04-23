
## Plano: Aplicação em branco com Supabase conectado

### O que será feito

**1. Limpar a página inicial (`src/routes/index.tsx`)**
- Remover o placeholder padrão do Lovable
- Deixar uma tela em branco simples e neutra (fundo branco, sem conteúdo visível)
- Manter a estrutura de rota TanStack intacta para futuras adições

**2. Manter a conexão Supabase existente**
- Nenhuma alteração nas credenciais, secrets, tabelas ou políticas RLS
- O cliente Supabase em `src/integrations/supabase/client.ts` continua disponível para uso via:
  ```ts
  import { supabase } from "@/integrations/supabase/client";
  ```
- Todas as tabelas, funções e buckets de storage existentes permanecem acessíveis

**3. Não será alterado**
- Estrutura de rotas (`__root.tsx`, `router.tsx`)
- Design system (`styles.css`)
- Componentes UI já instalados
- Qualquer configuração de banco de dados

### Resultado

Você terá uma aplicação totalmente em branco (página inicial vazia) com toda a infraestrutura Supabase pronta para quando quiser começar a construir as features. É só me dizer o que quer adicionar a seguir.
