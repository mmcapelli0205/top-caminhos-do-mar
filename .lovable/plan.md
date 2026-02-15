

## Cronograma do TOP - Planejamento e Visualizacao

### Resumo
Criar sistema de cronograma completo dos 4 dias do TOP com visualizacao por dia, edicao inline, filtros e cores por tipo de atividade. Acessivel em todas as areas como aba "Cronograma".

### Arquivos

**1. Novo: `src/components/cronograma/CronogramaTop.tsx`**

Componente principal que recebe props `{ canEdit: boolean; cronogramaTipo: string }`.

- **Queries**:
  - `cronograma_atividades` filtrado por `dia` e `cronograma_tipo`
  - `cronograma_locais` para combobox
  - `servidores` (id, nome) para dropdown de responsavel
- **Estado**: `diaSelecionado` (D1-D4), filtros (tipo, equipe, busca texto)
- **Header**: Titulo, subtitulo com contagem, botao "+ Nova Atividade" se `canEdit`
- **Seletor de Dia**: 4 botoes com cores (D1=laranja, D2=azul, D3=verde, D4=amarelo), badge com contagem
- **Barra de Filtros**: Selects para tipo e equipe, input busca, botao limpar
- **Timeline**: Lista vertical de cards com:
  - Borda lateral colorida por tipo (Trilha=#B6D7A8, Predica=#FFE599, Instrucao=#A4C2F4, Trajeto=#D9D9D9, Dinamica=#D5A6E6, Refeicao=#F97316, Montagem=#D2B48C, Atividade=default)
  - Layout horizontal (4 colunas) no desktop, empilhado no mobile
  - Coluna horarios (font-mono), coluna principal (tipo badge + titulo + local + cenario + agua), coluna equipe (badge colorido via CORES_EQUIPES), coluna acoes (editar/excluir se canEdit)
  - Separador de intervalo quando gap > 0 entre atividades consecutivas
- **Mapa de cores por tipo**: constante `CORES_TIPO`

**2. Novo: `src/components/cronograma/CronogramaFormDialog.tsx`**

Modal de criar/editar atividade:

- Campos: dia (select D1-D4), ordem (auto-proximo), horario_inicio/fim (time inputs), tempo previsto (calculado auto), tipo (select), titulo, local (combobox com locais existentes + "Adicionar novo" que insere em `cronograma_locais`), equipe_responsavel (select), responsavel_nome (combobox servidores + texto livre), cenario_recursos (textarea), reposicao_agua (select Sim/Nao + campo texto), cronograma_tipo (hidden)
- Insert/Update em `cronograma_atividades`
- Invalida query `["cronograma-atividades"]`

**3. Alteracao: `src/pages/AreaPortal.tsx`**

- Importar `CronogramaTop`
- Adicionar logica de visibilidade da aba:
  - Coordenadores (`isCoord`) e diretoria veem a aba em TODAS as areas
  - Servidores comuns NAO veem
- Aba "Cronograma" no TabsList (condicional: `canEdit || isCoord`)
- TabsContent:
  - Se area "ADM" e usuario ADM/Diretoria: `<CronogramaTop canEdit={true} cronogramaTipo="adm" />`
  - Se area "Logistica" e usuario coord Logistica/Diretoria: renderizar com sub-tabs "Oficial" (readonly, tipo=adm) e "Logistica" (editavel, tipo=logistica)
  - Todas as outras areas: `<CronogramaTop canEdit={false} cronogramaTipo="adm" />`

### Logica de Permissoes

```text
Area ADM + (coord ADM ou diretoria) -> canEdit=true, tipo=adm
Area Logistica + (coord Logistica ou diretoria):
  Sub-tab "Oficial" -> canEdit=false, tipo=adm
  Sub-tab "Logistica" -> canEdit=true, tipo=logistica
Qualquer outra area + coordenador -> canEdit=false, tipo=adm
Servidor comum -> aba nao aparece
```

### Detalhes Tecnicos

- Nenhuma migration (tabelas ja existem com 123 atividades e 39 locais)
- Nenhuma dependencia nova
- Query keys: `["cronograma-atividades", dia, cronogramaTipo]`, `["cronograma-locais"]`
- Usa `CORES_EQUIPES` de `@/lib/coresEquipes` para badges de equipe
- Confirmacao antes de excluir (AlertDialog)
- Responsividade: grid 4 colunas desktop, empilhado mobile; filtros colapsaveis no mobile via Collapsible
- Animacao: `transition-all duration-300` ao trocar de dia (fade)

### Constantes de Cores por Tipo

```text
Trilha = #B6D7A8
Predica = #FFE599
Instrucao = #A4C2F4
Trajeto/Translado = #D9D9D9
Atividade = transparent (borda default)
Dinamica = #D5A6E6
Refeicao = #F97316
Montagem/Desmontagem = #D2B48C
```

### Dados existentes
- D1: 32 atividades, D2: 38, D3: 38, D4: 15 (total 123, todas tipo 'adm')
- 39 locais pre-cadastrados
- Campos relevantes: dia, ordem, horario_inicio, horario_fim, tempo_previsto_min, tipo, titulo, local, equipe_responsavel, responsavel_nome, cenario_recursos, reposicao_agua, cronograma_tipo

