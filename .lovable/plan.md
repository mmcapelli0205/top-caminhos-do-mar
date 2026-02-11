
## Correção da tela em branco no mobile

### Problema real

O `App.css` nunca era importado (nenhum arquivo faz `import './App.css'`), então a limpeza anterior não teve efeito. O problema real é que no mobile Safari, quando o JavaScript falha ou demora pra carregar, o usuario ve apenas a cor de fundo do body (navy escuro) sem nenhum conteudo.

### Causas identificadas

1. **index.html sem loading fallback**: O `<div id="root"></div>` esta vazio. Se o JS demora no 4G ou falha, o usuario ve tela em branco.
2. **Sem Error Boundary**: Qualquer erro em qualquer componente crasha o app inteiro sem mensagem.
3. **Cache do Safari**: Versoes antigas podem estar cacheadas.

### Solucao

**1. Adicionar loading visual no index.html**

Colocar um spinner/indicador diretamente no `<div id="root">` para que algo apareca imediatamente enquanto o JavaScript carrega. O React substitui esse conteudo automaticamente quando monta.

```html
<div id="root">
  <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a24;">
    <div style="text-align:center;color:#999;">
      <div style="width:40px;height:40px;border:3px solid #333;border-top-color:#E8731A;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;"></div>
      <p>Carregando...</p>
    </div>
  </div>
  <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
</div>
```

**2. Adicionar Error Boundary global no App.tsx**

Envolver todo o app em um componente ErrorBoundary que captura erros de renderizacao e mostra uma tela de fallback ao inves de tela em branco.

**3. Remover o arquivo App.css (ou mante-lo limpo)**

Como nao e usado em lugar nenhum, pode ficar como esta ou ser removido para evitar confusao.

### Arquivos modificados

- `index.html` -- Adicionar spinner de loading no div root
- `src/App.tsx` -- Envolver com ErrorBoundary
- `src/components/ErrorBoundary.tsx` -- Novo componente de error boundary

### Resultado esperado

- O usuario sempre ve algo na tela enquanto o JS carrega (spinner laranja)
- Se o JavaScript falhar, uma mensagem de erro aparece com botao de recarregar
- Funciona em qualquer navegador mobile, mesmo com conexao lenta
