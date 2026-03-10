

## Bug Fix: Coordenador vê todas as áreas na tela de Servidores

### Problem
Coordinators see all 12 area cards and all action buttons (Novo Servidor, Importar, CSV, PDF) — they should only see the server list filtered to their own area.

### Solution

**File: `src/pages/Servidores.tsx`**

1. **Add a `isCoord` flag** based on role:
   ```tsx
   const isCoord = ["coordenacao", "coord02", "coord03"].includes(role ?? "");
   ```

2. **Auto-set `filterArea` for coordinators** — when `areaServico` loads, force the filter:
   ```tsx
   useEffect(() => {
     if (isCoord && areaServico) {
       setFilterArea(areaServico);
     }
   }, [isCoord, areaServico]);
   ```

3. **Hide area cards section** — wrap the `{/* Area Cards */}` grid (lines 400-470) in `{!isCoord && (...)}`.

4. **Hide action buttons** — wrap the buttons section (lines 350-369: CSV, PDF, Import, Novo Servidor) in `{!isCoord && (...)}`.

5. **Hide alert cards** (pendentes, sem_area) for coordinators — wrap lines 372-398 in `{!isCoord && (...)}`.

6. **Hide the area filter dropdown** for coordinators since it's locked to their area.

This ensures coordinators land directly on a filtered server list for their area only, with no ability to navigate to other areas or create/import servers.

