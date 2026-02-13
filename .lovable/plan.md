

## Problema

O erro "Algo deu errado" aparece **apos o login** no mobile. O ErrorBoundary global captura um crash em algum componente que renderiza depois da autenticacao (Dashboard, Sidebar, ou Charts), mas nao mostra **qual** erro ocorreu, impossibilitando o diagnostico.

## Solucao em 3 Etapas

### 1. Mostrar o erro real na tela do ErrorBoundary

Atualmente o ErrorBoundary so mostra "Algo deu errado" sem detalhes. Vamos adicionar a mensagem de erro real na tela (em texto pequeno), para que voce possa tirar um screenshot e eu saiba exatamente o que esta quebrando.

### 2. ErrorBoundary interno no AppLayout

Adicionar um segundo ErrorBoundary envolvendo apenas o `<Outlet />` (conteudo da pagina). Assim, se o Dashboard crashar, o menu lateral e o botao de logout continuam funcionando - voce nao fica preso.

### 3. Proteger cookie do Sidebar

O componente Sidebar escreve um cookie (`document.cookie = ...`) que pode falhar em alguns navegadores mobile. Vamos proteger isso com try/catch.

---

### Detalhes Tecnicos

**Arquivo: `src/components/ErrorBoundary.tsx`**

Adicionar a mensagem de erro (`this.state.error?.message` e `this.state.error?.stack`) na tela em um bloco colapsavel/texto pequeno para diagnostico.

**Arquivo: `src/components/AppLayout.tsx`**

Envolver `<Outlet />` com um ErrorBoundary local:

```text
<main className="flex-1 p-2 md:p-6">
  <PageErrorBoundary>
    <Outlet />
  </PageErrorBoundary>
</main>
```

O `PageErrorBoundary` mostra o erro da pagina com botao de "Tentar novamente" sem derrubar o layout inteiro.

**Arquivo: `src/components/ui/sidebar.tsx`**

Proteger a escrita de cookie (linha 68) com try/catch:

```text
try {
  document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
} catch {
  // Ignorar falha de cookie em navegadores restritivos
}
```

**Arquivos modificados:**
- `src/components/ErrorBoundary.tsx` - mostrar mensagem de erro real
- `src/components/AppLayout.tsx` - ErrorBoundary interno no Outlet
- `src/components/ui/sidebar.tsx` - proteger escrita de cookie

Apos publicar, quando o erro aparecer novamente no mobile, a tela vai mostrar **exatamente qual componente crashou e por que**, permitindo corrigir a causa raiz de forma definitiva.
