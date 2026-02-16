

## Cadastro Rapido de Lideranca

### Resumo
Criar sistema de cadastro rapido de membros da lideranca (Diretores, Coordenadores, Sombras) com login temporario, acessivel via botao na tela de Aprovacoes. Inclui tela de primeiro acesso para o usuario atualizar credenciais e completar perfil.

### Arquivos

**1. Alteracao: `supabase/functions/manage-users/index.ts`**

Adicionar nova action `"create_temp_user"` que:
- Recebe: `{ action: "create_temp_user", nome, equipe, cargo_area }`
- Gera email temporario a partir do nome (slug: remover acentos, lowercase, espacos viram pontos, sufixo `@top1575.temp`)
- Se email ja existir, adicionar numero incremental (joao.silva2@top1575.temp)
- Senha padrao: `"TOP2026!"`
- Cria usuario via `supabase.auth.admin.createUser({ email, password, email_confirm: true })`
- Determina role: se cargo_area in ["Diretor", "Sub-Diretor", "Diretor Espiritual"] -> role = "diretoria", senao -> role = "coordenacao"
- Insere em `user_profiles`: id, nome, email, status "aprovado", cargo = role, area_preferencia = equipe, login_temporario = true, primeiro_acesso = true
- Insere em `user_roles`: user_id, role
- Insere em `servidores`: nome, area_servico = equipe, cargo_area, status = "ativo", origem = "convite", dados_completos = false
- Retorna: `{ user_id, email, senha: "TOP2026!" }`

Verificacao de email duplicado: antes de criar, consultar auth users por email. Se existir, tentar com sufixo numerico ate encontrar disponivel.

**2. Novo: `src/components/CadastroRapidoDialog.tsx`**

Dialog com 3 estados internos: "form", "sucesso"

**Estado "form"**:
- Campo Nome Completo (input text, required)
- Campo Equipe (Select): ADM, Eventos, Seguranca, Logistica, Hakuna, Voz, Comunicacao, Midia, Intercessao, DOC, Louvor, Diretoria
- Campo Cargo (Select dinamico):
  - Se equipe === "Diretoria": Diretor, Sub-Diretor, Diretor Espiritual
  - Senao: Coordenador 01, Coordenador 02, Coordenador 03, Sombra 01, Sombra 02, Sombra 03
- Botao "Cadastrar" (chama edge function manage-users com action create_temp_user)

**Estado "sucesso"**:
- Icone de sucesso verde
- "Servidor cadastrado com sucesso!"
- "Envie essas credenciais para {nome}:"
- Card com borda laranja exibindo Login e Senha
- Botao "Copiar Credenciais" (clipboard API)
- Botao "Cadastrar Outro" (volta ao estado form, limpa campos)
- Botao "Fechar"

**3. Alteracao: `src/pages/Aprovacoes.tsx`**

- Import CadastroRapidoDialog
- Adicionar estado `showCadastroRapido` (boolean)
- Extrair `role` do useAuth
- No header (linha 240-244), adicionar botao "Cadastro Rapido Lideranca" com cor laranja, visivel apenas se `role === "diretoria"`
- Renderizar `<CadastroRapidoDialog open={showCadastroRapido} onOpenChange={setShowCadastroRapido} />`

**4. Novo: `src/pages/PrimeiroAcesso.tsx`**

Pagina standalone (sem AppLayout/sidebar).

**Etapa 1 - Atualizar Credenciais**:
- Titulo: "Bem-vindo ao TOP Manager!"
- Subtitulo: "Atualize seus dados de acesso"
- Indicador visual: "Etapa 1 de 2"
- Campo Novo Email (required, formato email valido)
- Campo Nova Senha (required, minimo 6 chars)
- Campo Confirmar Senha (must match)
- Botao "Atualizar Acesso"
- Ao salvar: `supabase.auth.updateUser({ email: novoEmail, password: novaSenha })`
- Atualizar `user_profiles`: email = novoEmail, login_temporario = false
- Avancar para Etapa 2

**Etapa 2 - Completar Perfil**:
- Titulo: "Complete seu perfil"
- Indicador: "Etapa 2 de 2"
- Campos: CPF, Telefone, Data de Nascimento, Igreja, Cidade, Estado, Endereco, CEP, Numero Legendario, Tamanho da Farda, Contato de Emergencia (nome, telefone, email), Habilidades, Experiencia
- Botao "Salvar e Entrar"
- Ao salvar: atualizar `servidores` (buscar pelo nome + origem = "convite" + dados_completos = false), marcar dados_completos = true
- Atualizar `user_profiles`: primeiro_acesso = false
- Redirecionar para /dashboard

Design: tema escuro, centralizado, sem sidebar, max-w-2xl, steps visuais com badges numeradas

**5. Alteracao: `src/App.tsx`**

- Import PrimeiroAcesso
- Adicionar rota FORA do AppLayout: `<Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />`

**6. Alteracao: `src/pages/Login.tsx`**

- Apos login bem-sucedido (no onAuthStateChange), antes de redirecionar para /dashboard:
- Buscar `user_profiles` do usuario logado
- Se `primeiro_acesso === true`, redirecionar para `/primeiro-acesso` em vez de `/dashboard`

**7. Alteracao: `src/components/AppLayout.tsx`**

- Apos carregar profile (linha 99), verificar `profile.primeiro_acesso === true`
- Se sim, redirecionar para `/primeiro-acesso` (impede acesso ao sistema sem completar o fluxo)

### Geracao de Email Temporario (logica no edge function)

```text
function gerarEmailTemp(nome: string): string {
  1. Remover acentos (normalize NFD, replace diacritics)
  2. Lowercase
  3. Trim, replace espacos por pontos
  4. Remover caracteres especiais (manter apenas a-z, 0-9, pontos)
  5. Adicionar sufixo @top1575.temp
  Exemplo: "João Maria da Silva" -> "joao.maria.da.silva@top1575.temp"
}
```

### Detalhes Tecnicos

- Nenhuma migration necessaria (campos login_temporario e primeiro_acesso ja existem)
- Nenhuma dependencia nova
- A edge function `manage-users` ja tem a infraestrutura de autenticacao e verificacao de role "diretoria"
- O trigger `handle_new_user` nao sera disparado porque `admin.createUser` ja insere direto; a edge function faz o insert manual em user_profiles (upsert ou verificar conflito com o trigger)
- IMPORTANTE: Como o trigger `handle_new_user` automaticamente cria um registro em user_profiles ao criar usuario via admin API, a edge function deve usar UPSERT ou fazer o insert com ON CONFLICT para atualizar os campos adicionais (login_temporario, primeiro_acesso, status aprovado)
- A Etapa 2 do primeiro acesso busca o servidor pelo user profile email linkado, ou pelo nome + origem convite
- `updateUser` do Supabase Auth para troca de email pode enviar confirmacao; para evitar isso, o edge function pode usar `admin.updateUserById` com `email_confirm: true` — mas isso requer que a Etapa 1 chame uma edge function em vez do client-side updateUser

### Fluxo de Redirecionamento

```text
Login -> verificar primeiro_acesso
  |-- true  -> /primeiro-acesso (Etapa 1 -> Etapa 2 -> /dashboard)
  |-- false -> /dashboard (fluxo normal)

AppLayout -> verificar primeiro_acesso
  |-- true  -> redirect /primeiro-acesso (seguranca)
  |-- false -> renderizar normalmente
```

### Consideracao sobre updateUser no Primeiro Acesso

A troca de email via `supabase.auth.updateUser({ email })` envia email de confirmacao por padrao. Para evitar isso e manter a experiencia fluida, a Etapa 1 deve chamar a edge function `manage-users` com uma nova action `"update_credentials"`:
- Recebe: `{ action: "update_credentials", user_id, new_email, new_password }`
- Usa `supabase.auth.admin.updateUserById(user_id, { email: new_email, password: new_password, email_confirm: true })`
- Atualiza user_profiles: email, login_temporario = false
- Retorna sucesso
- O front-end entao re-autentica com as novas credenciais: `supabase.auth.signInWithPassword({ email: new_email, password: new_password })`

