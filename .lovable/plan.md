
## Estoque Hakunas - Plano de Implementacao

Transformar as abas Medicamentos e Equipamentos do modulo Hakunas em sistema de estoque em tempo real, usando as tabelas ja existentes no Supabase.

---

### Arquivos a criar

**1. `src/components/hakunas/MedicamentosEstoqueTab.tsx`**
Substituicao completa do `MedicamentosTab.tsx`. Contera:

- **Cards de resumo** no topo: Total de Itens, Total de Unidades, Alertas de Estoque Baixo (card vermelho pulsante quando ha itens abaixo do minimo)
- **Tabela de inventario** consultando `hakuna_estoque_medicamentos`: Nome, Quantidade, Unidade, Estoque Minimo, Origem, Acoes
  - Linha fica vermelha quando `quantidade <= estoque_minimo`
  - Responsivo: tabela no desktop, cards no mobile
- **Botao "+ Novo Medicamento"** abre modal com campos: nome, quantidade, unidade (dropdown: un/cx/fr/amp/cp), estoque minimo, origem (Doacao ou Manual), nome do doador (se doacao). Ao salvar: insere em `hakuna_estoque_medicamentos` e cria movimentacao de entrada em `hakuna_estoque_movimentacoes`
- **Botao "Dar Baixa"** por item abre modal com: medicamento (readonly), quantidade utilizada, tipo de paciente (Participante ou Servidor), dropdown de nome (consulta `participantes` ou `servidores`), familia/area preenchidos automaticamente, hakuna responsavel (dropdown de `hakunas`), data automatica, observacao. Ao salvar: cria movimentacao de saida e decrementa quantidade
- **Botao "Adicionar Estoque"** por item: quantidade a adicionar, origem (Doacao/Manual), doador. Cria movimentacao de entrada e incrementa quantidade
- **Historico de Movimentacoes**: secao expansivel (Collapsible) abaixo da tabela, listando `hakuna_estoque_movimentacoes` ordenadas por data. Entradas em verde, saidas em vermelho. Colunas: Data, Medicamento, Tipo, Qtd, Paciente/Doador, Responsavel

**2. `src/components/hakunas/EquipamentosEstoqueTab.tsx`**
Substituicao completa do `EquipamentosTab.tsx`. Contera:

- **Tabela de inventario** consultando `hakuna_estoque_equipamentos`: Nome, Quantidade, Estado (badge colorido: Novo=verde, Bom=azul, Regular=amarelo, Ruim=vermelho), Observacao, Acoes
  - Responsivo: tabela no desktop, cards no mobile
- **Botao "+ Novo Equipamento"** abre modal: nome, quantidade, estado (dropdown: Novo/Bom/Regular/Ruim), observacao
- **Edicao**: clicar no item abre modal para editar quantidade, estado e observacao

---

### Arquivos a modificar

**3. `src/pages/Hakunas.tsx`**
- Trocar imports de `MedicamentosTab` e `EquipamentosTab` pelos novos componentes `MedicamentosEstoqueTab` e `EquipamentosEstoqueTab`

**4. `src/components/area/AdmPedidosDashboard.tsx`**
- Na funcao `marcarComprado`, apos criar a despesa, adicionar logica de integracao com estoque:
  - Se a categoria do pedido for "Medicamentos": buscar se ja existe item com mesmo nome em `hakuna_estoque_medicamentos`. Se existir, incrementar quantidade. Se nao, criar novo item. Em ambos os casos, criar movimentacao de entrada com `tipo='entrada'` e `origem_entrada='compra'`
  - Invalidar caches do estoque (`["hk-estoque-medicamentos"]`, `["hk-estoque-movimentacoes"]`)

---

### Detalhes Tecnicos

**Queries principais:**

Inventario de medicamentos:
```text
supabase.from("hakuna_estoque_medicamentos")
  .select("*")
  .order("nome")
```

Movimentacoes:
```text
supabase.from("hakuna_estoque_movimentacoes")
  .select("*")
  .order("data_movimentacao", { ascending: false })
```

Inventario de equipamentos:
```text
supabase.from("hakuna_estoque_equipamentos")
  .select("*")
  .order("nome")
```

Participantes (para dropdown de dar baixa):
```text
supabase.from("participantes")
  .select("id, nome, familia_id")
  .order("nome")
```

Servidores (para dropdown de dar baixa):
```text
supabase.from("servidores")
  .select("id, nome, area_servico")
  .order("nome")
```

Hakunas aprovados (para dropdown de responsavel):
```text
supabase.from("servidores")
  .select("id, nome")
  .eq("area_servico", "Hakuna")
  .eq("status", "aprovado")
  .order("nome")
```

**Integracao Pedidos -> Estoque (em AdmPedidosDashboard):**
```text
// Dentro de marcarComprado, apos criar despesa:
if (selectedPedido.categoria === "Medicamentos") {
  const { data: existing } = await supabase
    .from("hakuna_estoque_medicamentos")
    .select("id, quantidade")
    .eq("nome", selectedPedido.nome_item)
    .maybeSingle();

  if (existing) {
    await supabase.from("hakuna_estoque_medicamentos")
      .update({ quantidade: existing.quantidade + (qtdComprada || selectedPedido.quantidade) })
      .eq("id", existing.id);
  } else {
    await supabase.from("hakuna_estoque_medicamentos")
      .insert({
        nome: selectedPedido.nome_item,
        quantidade: qtdComprada || selectedPedido.quantidade,
        origem: "compra",
        unidade: "un",
        estoque_minimo: 5,
      });
  }

  await supabase.from("hakuna_estoque_movimentacoes").insert({
    medicamento_id: existing?.id || null,
    tipo: "entrada",
    quantidade: qtdComprada || selectedPedido.quantidade,
    origem_entrada: "compra",
  });
}
```

**Tipagem**: As tabelas `hakuna_estoque_medicamentos`, `hakuna_estoque_movimentacoes` e `hakuna_estoque_equipamentos` ja estao no arquivo de tipos gerado. Usar `Tables<"hakuna_estoque_medicamentos">` etc.

**Responsividade**: Desktop usa tabela, mobile usa cards empilhados (padrao consistente com o resto do app).

**Componentes reutilizados**: Collapsible (para historico), Badge (estados/tipos), Dialog (modais), useIsMobile (responsividade).

---

### Resumo

- **Arquivos criados:** 2 (MedicamentosEstoqueTab.tsx, EquipamentosEstoqueTab.tsx)
- **Arquivos modificados:** 2 (Hakunas.tsx, AdmPedidosDashboard.tsx)
- **Nenhuma migration necessaria**
- **Abas Equipe, Ergometricos e Autorizacoes NAO sao alteradas**
