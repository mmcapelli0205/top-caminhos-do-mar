

## Novas Funcionalidades — Aba Tirolesa

### Estado Atual do Sistema

Após análise completa do código e banco de dados:

- `src/pages/Tirolesa.tsx` — 1351 linhas, com cards, agrupamento, lista de duplas, dialogs de Match Manual e Config Termo
- `src/components/checkin/ConsultaPulseiraTab.tsx` — 703 linhas, com o dialog de Termo atual (checkbox + botões, sem assinatura)
- `tirolesa_termo_aceite` — já possui coluna `assinatura_base64 TEXT` (migration já executada)
- `tirolesa_config.texto_termo` — ainda contém o texto placeholder antigo
- Nenhuma dependência `react-signature-canvas` instalada ainda

---

### Funcionalidade 1 — Atualizar Texto Oficial do Termo no Banco

O texto do termo é lido dinamicamente da tabela `tirolesa_config.texto_termo` (linha 145–146 do `ConsultaPulseiraTab`). O texto padrão no código (`useState` na linha 79) é um fallback, mas o texto real vem do banco.

**Estratégia:** Atualizar o campo `texto_termo` na linha do `tirolesa_config` existente para o TOP atual via SQL direto. Não é uma migration — é atualização de dados.

Também atualizar o `useState` padrão em `Tirolesa.tsx` (linha 97–99) e `ConsultaPulseiraTab.tsx` (linha 79) para usar o texto oficial como fallback quando a config ainda não existe no banco.

---

### Funcionalidade 2 — Assinatura Digital no Dialog de Aceite do Termo

**Biblioteca:** `signature_pad` (instalada via package.json) — mais leve e não tem problemas de tipagem como `react-signature-canvas`. Usaremos um `useRef` para o `<canvas>` e instanciaremos o `SignaturePad` manualmente.

**Alterações em `ConsultaPulseiraTab.tsx`:**

1. Adicionar `import SignaturePad from "signature_pad"` 
2. Novos estados:
   ```typescript
   const [assinaturaPad, setAssinaturaPad] = useState<any | null>(null);
   const [assinaturaVazia, setAssinaturaVazia] = useState(true);
   const canvasRef = useRef<HTMLCanvasElement>(null);
   ```
3. `useEffect` para inicializar o `SignaturePad` quando `termoDialogOpen = true`:
   ```typescript
   useEffect(() => {
     if (!termoDialogOpen || !canvasRef.current) return;
     const sp = new SignaturePad(canvasRef.current, { backgroundColor: "rgb(255,255,255)" });
     sp.addEventListener("afterUpdateStroke", () => setAssinaturaVazia(sp.isEmpty()));
     setAssinaturaPad(sp);
     setAssinaturaVazia(true);
     return () => sp.off();
   }, [termoDialogOpen]);
   ```
4. Inserir no Dialog de Termo (após o checkbox, antes do DialogFooter):
   ```jsx
   {termoCheckbox && (
     <div className="space-y-2">
       <label className="text-sm font-medium">Assinatura do Participante <span className="text-destructive">*</span></label>
       <div className="border rounded-lg overflow-hidden bg-white">
         <canvas ref={canvasRef} className="w-full" height={150} />
       </div>
       <Button size="sm" variant="ghost" onClick={() => { assinaturaPad?.clear(); setAssinaturaVazia(true); }}>
         Limpar Assinatura
       </Button>
       {assinaturaVazia && <p className="text-xs text-destructive">Assinatura obrigatória para confirmar aceite.</p>}
     </div>
   )}
   ```
5. Modificar `handleSalvarTermo` para incluir `assinatura_base64`:
   ```typescript
   const assinaturaBase64 = novoStatus === "aceito" && assinaturaPad && !assinaturaPad.isEmpty()
     ? assinaturaPad.toDataURL("image/png")  // já retorna "data:image/png;base64,..."
     : null;
   
   // no upsert:
   assinatura_base64: assinaturaBase64,
   ```
6. Botão "Confirmar Aceite" habilitado somente quando: `termoCheckbox && !assinaturaVazia`

**Fluxo completo:**
1. Servidor abre o Termo → dialog abre
2. Participante ouve/lê o termo
3. Servidor marca o checkbox → canvas de assinatura aparece
4. Participante assina → botão "Confirmar Aceite" habilita
5. Ao confirmar: salva status, timestamp, servidor, e assinatura base64 no banco

---

### Funcionalidade 3 — Aba "Briefing Prévio"

Será adicionada diretamente em `src/pages/Tirolesa.tsx`, como uma nova seção (Card) entre os cards de resumo e o card de Configurar Agrupamento. Renderizada como um Card colapsável similar ao card de agrupamento.

**O checklist é puramente local (useState), sem persistência no banco.**

```typescript
// Estado local — checklist do briefing (reinicia a cada abertura de sessão)
const BRIEFING_ITEMS = [
  { id: "voo_ind", categoria: "INFORMAÇÕES SOBRE A ATIVIDADE", texto: "Informar sobre voo individual: a partir de 8 anos, peso mínimo 35kg, peso máximo 120kg" },
  { id: "voo_dup", categoria: "INFORMAÇÕES SOBRE A ATIVIDADE", texto: "Informar sobre voo duplo: a partir de 5 anos, acompanhado de maior de 18 anos, peso máximo combinado 170kg" },
  { id: "restrict", categoria: "RESTRIÇÕES DE SAÚDE", texto: "Verificar restrições: hipertensão, fobia de altura, problemas cardíacos, dificuldades respiratórias, desmaios/convulsões, efeito de álcool/entorpecentes, parte do corpo imobilizada, pós-operatório, suspeita de gestação/gestante" },
  { id: "roupas", categoria: "VESTIMENTA E EQUIPAMENTOS", texto: "Orientar sobre roupas confortáveis e calçados fechados (não é permitido sem blusa)" },
  { id: "balanca", categoria: "VESTIMENTA E EQUIPAMENTOS", texto: "Informar sobre pesagem obrigatória em balança antes da atividade (peso total incluindo mochilas, acessórios e vestimentas)" },
  { id: "termo", categoria: "TERMO DE RESPONSABILIDADE", texto: "Garantir que o participante faça o aceite e assine o Termo de forma digital" },
  { id: "proibidos", categoria: "PERTENCES NÃO PERMITIDOS NA DESCIDA", texto: "Orientar sobre itens proibidos: piercing no umbigo, brincos grandes, colares, pulseiras com pingentes, relógio, mochilas grandes, pochetes, bags, bolsas de lado, pertences nos bolsos (mesmo com zíper), celulares e câmeras sem suporte adequado" },
  { id: "sacolinha", categoria: "PERTENCES NÃO PERMITIDOS NA DESCIDA", texto: "Oferecer sacochila para itens pequenos (devolver na desequipagem)" },
  { id: "permitidos", categoria: "PERTENCES PERMITIDOS NA DESCIDA", texto: "Informar itens permitidos: mochilas pequenas, sacochilas, brincos pequenos, óculos de grau/sol (bem presos), celulares e câmeras com suporte adequado" },
];

const [showBriefing, setShowBriefing] = useState(false);
const [briefingChecked, setBriefingChecked] = useState<Set<string>>(new Set());
```

**Visualização:** Um Card colapsável com seções agrupadas por categoria. Cada item tem um Checkbox. Ao marcar todos os itens, aparece um badge "Briefing Completo ✅". O estado é local — reseta ao navegar para outra página.

Posição: Entre o bloco dos 8 cards e o card de "Configurar Agrupamento de Famílias".

---

### Funcionalidade 4 — Exportação CSV dos Termos Aceitos

**Função utilitária reutilizável (preparação para webhook futuro):**

```typescript
// TODO: Substituir exportação CSV por webhook quando API da MSV Aventura estiver disponível
const getTermosAceitosData = async () => {
  const { data: termoRows } = await supabase.from("tirolesa_termo_aceite" as any)
    .select("*")
    .eq("status", "aceito")
    .eq("top_id", topId);

  const { data: partsData } = await supabase.from("participantes")
    .select("id, nome, cpf, telefone, email, peso, altura, data_nascimento")
    .in("id", (termoRows ?? []).map((t: any) => t.participante_id));

  const partByIdMap = new Map((partsData ?? []).map((p: any) => [p.id, p]));

  return (termoRows ?? []).map((t: any) => {
    const p = partByIdMap.get(t.participante_id) ?? {};
    return {
      nome: p.nome ?? "",
      cpf: p.cpf ?? "",
      telefone: p.telefone ?? "",
      email: p.email ?? "",
      peso_kg: p.peso ?? "",
      altura_m: p.altura ?? "",
      data_nascimento: p.data_nascimento ?? "",
      status_termo: t.status,
      data_aceite: t.aceito_em ? new Date(t.aceito_em).toLocaleString("pt-BR") : "",
      servidor: t.registrado_por_nome ?? "",
      assinatura_base64: t.assinatura_base64 ?? "",
    };
  });
};
```

**Exportação CSV (UTF-8 com BOM para Excel):**

```typescript
const handleExportarCSV = async () => {
  const rows = await getTermosAceitosData();
  if (rows.length === 0) { toast({ title: "Nenhum termo aceito para exportar" }); return; }

  const headers = ["Nome Completo","CPF","Telefone","E-mail","Peso (kg)","Altura (m)","Data Nascimento","Status Termo","Data/Hora Aceite","Servidor que Registrou","Assinatura (base64)"];
  const csvContent = [
    headers.join(";"),
    ...rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const datePart = new Date().toISOString().split("T")[0];
  link.href = url;
  link.setAttribute("download", `termos_tirolesa_TOP1575_${datePart}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
```

**Botão no header** (ao lado de "Config. Termo"):
```jsx
<Button variant="outline" size="sm" onClick={handleExportarCSV} disabled={!topId}>
  <Download className="h-4 w-4 mr-1" /> Exportar Termos (CSV)
</Button>
```

---

### Dependência Nova

`signature_pad` já está listada como opção compatível. Verificar se já está instalada — se não, instalar via `package.json`.

---

### Resumo dos Arquivos a Modificar

| Arquivo | Tipo | O que muda |
|---|---|---|
| `package.json` | Adicionar dep | `signature_pad` + `@types/signature_pad` |
| `src/components/checkin/ConsultaPulseiraTab.tsx` | Modificar | Canvas de assinatura no dialog do termo; `assinatura_base64` no upsert; botão "Confirmar" condicional |
| `src/pages/Tirolesa.tsx` | Modificar | Texto padrão do termo (fallback); aba Briefing Prévio; botão "Exportar Termos (CSV)"; função `getTermosAceitosData` |
| `src/integrations/supabase/types.ts` | NÃO TOCAR | Tipos são gerados automaticamente pelo Supabase |

### Migration Necessária

Nenhuma. A coluna `assinatura_base64` já existe na tabela `tirolesa_termo_aceite` (confirmado via query SQL).

### Atualização do Texto do Termo no Banco

O texto do termo precisa ser atualizado no banco para o TOP atual. Isso será feito atualizando o valor padrão do `useState` em `Tirolesa.tsx` (que é gravado quando o usuário salva via "Config. Termo") e também fornecendo o texto completo via instrução SQL para o admin rodar no Supabase Dashboard — pois não queremos sobrescrever programaticamente uma config já existente no banco sem consentimento.

Alternativamente: o texto padrão será atualizado no código para que, quando `tirolesa_config` não tiver registro para o TOP, ele use o texto oficial. O admin ainda pode salvar via "Config. Termo" para persistir.

### Ordem de Implementação

1. Instalar `signature_pad`
2. Atualizar texto padrão do termo em `Tirolesa.tsx` e `ConsultaPulseiraTab.tsx`
3. Adicionar assinatura digital ao dialog de aceite em `ConsultaPulseiraTab.tsx`
4. Adicionar Briefing Prévio em `Tirolesa.tsx`
5. Adicionar botão "Exportar Termos (CSV)" + função utilitária em `Tirolesa.tsx`

