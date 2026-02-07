
## Corrigir Conexao do Login ao Supabase Correto

### Problema
O arquivo `src/pages/Login.tsx` importa o cliente Supabase de `@/lib/supabase.ts`, que aponta para um projeto Supabase **diferente** (URL: `pxvhrsxcyfmdvisulbbu`). O projeto correto "Sistema Legendarios" (URL: `ilknzgupnswyeynwpovj`) ja esta configurado em `src/integrations/supabase/client.ts`.

### Solucao

1. **Atualizar o import no Login.tsx** (linha 4):
   - De: `import { supabase } from "@/lib/supabase"`
   - Para: `import { supabase } from "@/integrations/supabase/client"`

2. **Remover o arquivo antigo** `src/lib/supabase.ts` — ele aponta para o projeto errado e nao deve ser usado.

Nenhuma outra alteracao necessaria. A query, comparacao de senha e toda a logica do login ja estao corretas.
