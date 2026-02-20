
# Parte 0 — Servidor Comum + Troca de Logo

## O que será feito

Quatro mudanças independentes, todas apenas no frontend (sem migration SQL, sem novas dependências):

1. **Esconder sidebar para cargo "servidor"** — layout em tela cheia
2. **Esconder card TOP Real-Time no Dashboard para cargo "servidor"**
3. **Bloquear rotas para cargo "servidor"** — redireciona para `/dashboard`
4. **Trocar logos** — sidebar e tela Servidores (Diretoria)

---

## Ponto importante sobre o campo de cargo

No banco, o cargo do user_profile usa valores lowercase (`servidor`, `coordenacao`, `sombra`), mas o campo `cargo` dentro da tabela `servidores` (cargo dentro da área) usa valores como `"Servidor"`, `"Coordenador 01"`, etc.

A verificação de "servidor comum" deve usar o campo `role` / `profile.cargo` do `useAuth()`, que contém os valores do `user_profiles` — especificamente `cargo === "servidor"` (lowercase). O `getVisibleMenuItems` já tem o caso `"servidor"` mapeado para apenas os itens `[1, 8, 14]` (Início, Artes & Docs, Mapa da Trilha).

**Nova regra:** Para cargo `"servidor"`, não renderizamos a sidebar nem o trigger, e bloqueamos rotas além de `/dashboard` e `/areas/:nome` (somente a área do próprio usuário).

---

## Arquivos a modificar

| Arquivo | O que muda |
|---|---|
| `src/components/AppLayout.tsx` | Esconder sidebar + SidebarTrigger para servidor; guardar provider mas esconder sidebar |
| `src/components/AppSidebar.tsx` | Trocar logo no rodapé |
| `src/pages/Dashboard.tsx` | Esconder `TopRealTimeCard` para servidor |
| `src/pages/Servidores.tsx` | Trocar logo da Diretoria (`Logo%20Legendarios.png` → `logo.png`) |
| `src/lib/auth.ts` | Adicionar função utilitária `isServidorComum` |

---

## Detalhes técnicos por arquivo

### 1. `src/lib/auth.ts` — Utilitário
Adicionar função exportada:
```typescript
export function isServidorComum(cargo: string | null): boolean {
  return cargo === "servidor";
}
```
Isso centraliza a verificação e evita strings repetidas.

---

### 2. `src/components/AppLayout.tsx` — Esconder sidebar + proteger rotas

**Sidebar oculta:** Usar o `cargo` (do `useAuth`) para decidir se renderiza `<AppSidebar>` e o `<SidebarTrigger>`. Para `"servidor"`, o `SidebarProvider` ainda envolve o layout, mas a sidebar não é renderizada e o conteúdo principal ocupa 100% da largura (sem `<SidebarInset>`, que cria o gap lateral).

**Proteção de rotas:** Adicionar um `useEffect` que observa `location.pathname`. Se o cargo for `"servidor"` e a rota atual não for `/dashboard` e não corresponder a `/areas/`, faz `navigate("/dashboard", { replace: true })`.

```typescript
// Dentro do AppLayout, após o profile estar carregado:
const isServidor = isServidorComum(role || profile?.cargo);

useEffect(() => {
  if (!isServidor) return;
  const allowed = pathname === "/dashboard" || pathname.startsWith("/areas/");
  if (!allowed) navigate("/dashboard", { replace: true });
}, [isServidor, pathname, navigate]);
```

**Layout condicional:**
```tsx
// Para servidor: sem sidebar, sem trigger, main em 100% da largura
if (isServidor) {
  return (
    <div className="min-h-svh w-full">
      <header>...</header> {/* sem SidebarTrigger */}
      <main className="flex-1 p-2 md:p-6"><Outlet /></main>
    </div>
  );
}
// Para os demais: layout normal com SidebarProvider + AppSidebar
```

---

### 3. `src/components/AppSidebar.tsx` — Trocar logo

Rodapé da sidebar: trocar `Logo%20Legendarios.png` → `logo.png` e ajustar o tamanho para `h-20 w-20` (maior que o atual `h-16`):

```tsx
// Antes
src="https://.../Logo%20Legendarios.png"
className="h-16 w-auto mx-auto opacity-60 ..."

// Depois
src="https://.../logo.png"
className="h-20 w-20 object-contain mx-auto opacity-70 ..."
```

---

### 4. `src/pages/Dashboard.tsx` — Esconder card TOP Real-Time

Adicionar verificação no componente `Dashboard`:

```tsx
const { profile, role } = useAuth();
const isServidor = isServidorComum(role || profile?.cargo);

// Grid de 3 colunas para os demais, 2 colunas para servidor
<div className={`grid grid-cols-1 ${isServidor ? "md:grid-cols-2" : "md:grid-cols-3"} gap-4`}>
  <CountdownSection />
  <QuickActions userEmail={profile?.email ?? null} />
  {!isServidor && <TopRealTimeCard />}
</div>
```

---

### 5. `src/pages/Servidores.tsx` — Trocar logo da Diretoria

No mapa `LOGOS_EQUIPES`, a Diretoria aponta para `"Logo%20Legendarios.png"`. Trocar para `"logo.png"`:

```typescript
// Antes
"Diretoria": "Logo%20Legendarios.png",

// Depois
"Diretoria": "logo.png",
```

O tamanho do card da Diretoria já segue a mesma lógica dos outros cards (`h-24 w-24`), então a proporção ficará consistente automaticamente.

---

## Comportamento esperado por cargo

| Cargo | Sidebar | TOP Real-Time card | Rotas protegidas |
|---|---|---|---|
| `diretoria` | ✅ Visível | ✅ Visível | ❌ Sem bloqueio |
| `coordenacao`, `coord02`, `coord03` | ✅ Visível | ✅ Visível | ❌ Sem bloqueio |
| `sombra` | ✅ Visível | ✅ Visível | ❌ Sem bloqueio |
| **`servidor`** | ❌ **Oculta** | ❌ **Oculto** | ✅ **Redireciona para /dashboard** |

---

## Ordem de implementação

1. `src/lib/auth.ts` — adicionar `isServidorComum()`
2. `src/components/AppLayout.tsx` — layout condicional + proteção de rota
3. `src/components/AppSidebar.tsx` — trocar logo do rodapé
4. `src/pages/Dashboard.tsx` — ocultar `TopRealTimeCard`
5. `src/pages/Servidores.tsx` — trocar logo da Diretoria
