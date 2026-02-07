

## TOP - Caminhos do Mar — Tela de Login

### Visão Geral
Sistema web "TOP - Caminhos do Mar" começando pela tela de login com design glassmorphism, autenticação via tabela `usuarios` no Supabase existente, e responsividade completa.

### Conexão Supabase
- Configurar cliente Supabase com a URL e Anon Key fornecidas (chaves públicas, seguras no código)
- Usar apenas a tabela `usuarios` existente — sem criar tabelas novas

### Tela de Login
- **Fundo**: Imagem fullscreen da foto "Caminhos do Mar" com overlay escuro (opacity 0.6), `object-fit: cover`
- **Card central**: Efeito glassmorphism (backdrop-blur, fundo semi-transparente preto, borda sutil branca)
- **Logo**: Imagem centralizada no topo do card (~180px desktop, ~120px mobile)
- **Títulos**: "TOP Manager" em branco/bold e subtítulo "Track Caminhos do Mar" em cinza claro
- **Campos**: Usuário (ícone pessoa) e Senha (ícone cadeado + toggle mostrar/esconder), min-height 48px para toque mobile
- **Botão "ENTRAR"**: Fundo laranja (#E8731A), hover escuro, largura total, com spinner durante loading
- **Rodapé**: "Acesso restrito à equipe autorizada" em cinza
- **Animação**: Fade-in suave do card ao carregar

### Lógica de Autenticação
- Consultar tabela `usuarios` pelo `username` digitado
- Comparar `senha_hash` diretamente com a senha digitada (sem hash por enquanto)
- Tratar cenários: usuário desativado, não encontrado, senha incorreta — cada um com toast específico
- Em caso de sucesso: salvar `id`, `nome`, `papel` e `area_servico` no localStorage e redirecionar para `/dashboard`

### Página Dashboard (placeholder)
- Texto "Dashboard em construção"
- Botão de logout que limpa localStorage e volta para o login
- Rota protegida: redirecionar para login se não houver dados no localStorage

### Responsividade
- **Mobile** (< 640px): Card 90% da largura, logo 120px, padding reduzido
- **Tablet** (640px–1024px): Card max-width 420px
- **Desktop** (> 1024px): Card max-width 480px

