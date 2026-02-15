

## Bug: Painel ADM mostra 0 pedidos

### Causa Raiz

O problema NAO e na query do banco de dados. A query do `AdmPedidosDashboard` esta correta (sem filtros). O que acontece e:

1. Voce abre a area ADM - a aba "Painel" carrega e busca os pedidos (naquele momento, 0)
2. Voce vai pra aba "Pedidos" e cria um novo pedido
3. O componente `AreaPedidos` invalida apenas o cache `["area-pedidos", "ADM"]`
4. O cache `["adm-pedidos-todos"]` do Painel NAO e invalidado, entao continua mostrando 0

### Solucao

**Arquivo: `src/components/area/AreaPedidos.tsx`**

Adicionar invalidacao do cache do painel ADM nas mutacoes de criar e editar pedido:

```text
onSuccess: () => {
  qc.invalidateQueries({ queryKey: ["area-pedidos", areaNome] });
  qc.invalidateQueries({ queryKey: ["adm-pedidos-todos"] });  // <-- ADICIONAR
  setDialogOpen(false);
  ...
}
```

Isso garante que sempre que um pedido for criado ou editado em qualquer area, o painel do ADM tambem atualiza automaticamente.

### Detalhes Tecnicos

- Modificar apenas 1 arquivo: `src/components/area/AreaPedidos.tsx`
- Adicionar `qc.invalidateQueries({ queryKey: ["adm-pedidos-todos"] })` no callback `onSuccess` da mutacao de criar/editar pedido
- Nenhuma alteracao no banco de dados necessaria
