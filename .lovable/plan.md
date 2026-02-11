

## Correção do acesso mobile

### Problema identificado

O arquivo `src/App.css` contém estilos padrão do template Vite que estão quebrando o layout no celular:

```css
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}
```

Esse `padding: 2rem` empurra o conteúdo para dentro, o `max-width` limita a largura, e o `text-align: center` desalinha elementos. Nenhuma dessas regras é usada pelo app (o Tailwind cuida de tudo).

### Solução

Limpar completamente o `src/App.css`, removendo todo o conteúdo residual do template Vite. As classes `.logo`, `.card`, `.read-the-docs` também não são usadas em nenhum lugar do projeto.

### Arquivo modificado

- `src/App.css` - Remover todo o conteúdo (o arquivo fica vazio ou com um comentário mínimo)

### Resultado esperado

O site vai funcionar normalmente no celular, sem padding extra ou largura máxima forçada no elemento raiz.

