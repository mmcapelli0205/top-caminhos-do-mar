
## Problema Real Identificado

O erro "Algo deu errado" (ErrorBoundary) no mobile e causado por **duas vulnerabilidades** no `AppLayout.tsx`:

### 1. `localStorage.setItem` executado durante o render (linha 103)

No corpo da funcao de render do `AppLayout`, existe esta chamada direta:

```text
localStorage.setItem("top_user", JSON.stringify(legacyUser));
```

Isso causa dois problemas:
- **Safari iOS em navegacao privada** lanca excecao ao tentar escrever no localStorage, derrubando o componente inteiro
- **E um anti-pattern React** - efeitos colaterais nao devem ocorrer durante o render

Como o `ErrorBoundary` envolve toda a aplicacao, qualquer excecao no render do `AppLayout` mostra a tela "Algo deu errado" sem possibilidade de recuperacao.

### 2. Falta de handler global para rejeicoes nao capturadas

Promises rejeitadas sem tratamento (ex: falha de rede durante fetch de perfil) podem causar crashes silenciosos no React, especialmente em Safari mobile.

## Solucao

### Etapa 1: Mover `localStorage.setItem` para um `useEffect` com `try/catch`

Tirar a chamada do corpo do render e colocar dentro de um `useEffect` que depende de `profile` e `role`. Envolver em `try/catch` para que falhas de storage (Safari privado) nao derrubem o app.

### Etapa 2: Adicionar handler global de `unhandledrejection`

Adicionar um listener em `App.tsx` para capturar promises rejeitadas nao tratadas, evitando crashes silenciosos no mobile. O handler vai logar o erro no console sem mostrar nada ao usuario (o ErrorBoundary ja cobre a UI).

---

### Detalhes Tecnicos

**Arquivo: `src/components/AppLayout.tsx`**

Substituir o bloco de localStorage (linhas 96-103) por um `useEffect`:

```text
useEffect(() => {
  if (!profile) return;
  try {
    const legacyUser = {
      id: profile.id,
      nome: profile.nome,
      papel: role || profile.cargo || "servidor",
      area_servico: profile.area_preferencia || "",
    };
    localStorage.setItem("top_user", JSON.stringify(legacyUser));
  } catch {
    // Safari private browsing - ignorar silenciosamente
  }
}, [profile, role]);
```

Remover o bloco original do corpo do render.

**Arquivo: `src/App.tsx`**

Adicionar handler global de rejeicao no componente App:

```text
useEffect(() => {
  const handler = (event: PromiseRejectionEvent) => {
    console.error("Unhandled rejection:", event.reason);
    event.preventDefault();
  };
  window.addEventListener("unhandledrejection", handler);
  return () => window.removeEventListener("unhandledrejection", handler);
}, []);
```

**Arquivos modificados:**
- `src/components/AppLayout.tsx` - mover localStorage para useEffect com try/catch
- `src/App.tsx` - adicionar handler global de unhandledrejection

Apos implementar, sera necessario **publicar** o projeto para que as correcoes cheguem ao site de producao.
