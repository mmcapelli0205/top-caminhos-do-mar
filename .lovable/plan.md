

## Correções no Cadastro de Servidores

### Problema 1: Nome com número embutido
O servidor "Marcio Macedo Capelli" está cadastrado no banco com o nome "Marcio Macedo Capelli 3219" - o número foi digitado junto com o nome. Precisamos:
- **Corrigir o dado no banco**: atualizar o registro para separar nome e numero_legendario
- **Melhorar a exibição**: onde o nome do servidor aparece nas listas, mostrar como "Nome - Nº Legendário" usando os campos separados

### Problema 2: Remover campo "Tamanho Farda"
Servidores já possuem farda, não precisam informar tamanho no cadastro.

---

### Alterações

**1. Corrigir dado no banco (SQL direto)**
Atualizar o registro do Marcio para separar nome e numero:
```sql
UPDATE servidores SET nome = 'Marcio Macedo Capelli' WHERE id = '98f7927f-b00a-41f7-b031-75565679b168';
```

**2. `src/pages/ServidorForm.tsx`**
- Remover o campo "Tamanho Farda" do formulário (linhas 292-300)
- Remover `tamanho_farda` do schema zod e dos defaultValues
- Remover do payload de envio

**3. `src/components/ServidorSheet.tsx`**
- Remover a linha "Tamanho Farda" da seção Dados Pessoais

**4. Exibição do nome com Nº Legendário (melhoria opcional)**
Nos selects e listas do AreaHeader e AreaDesignacoes, exibir `{s.nome} - {s.numero_legendario}` ao invés de apenas `{s.nome}`, para facilitar a identificação.

### Resumo técnico

| Arquivo | Ação |
|---|---|
| Banco de dados | UPDATE para corrigir nome do Marcio |
| `src/pages/ServidorForm.tsx` | Remover campo tamanho_farda |
| `src/components/ServidorSheet.tsx` | Remover exibição tamanho_farda |
| `src/components/area/AreaHeader.tsx` | Exibir nome + nº legendário nos selects |
| `src/components/area/AreaDesignacoes.tsx` | Exibir nome + nº legendário nos selects e cards |
