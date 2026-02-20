
The plan is to correct the permission resolution logic in the `AreaPortal` component. 

Currently, when a user with the "diretoria" role accesses any area portal (like Hakuna or Events), the code incorrectly forces the `effectiveArea` to be "Diretoria". This causes the system to look up permissions under keys like `Diretoria_Coord 01`, which lacks the area-specific permissions defined for specialized modules (such as `familias_visualizar` or `equipe_ver`).

By changing the logic to always use the area from the URL (`decodedNome`) for `effectiveArea`, we ensure that Diretoria users receive the full "Coord 01" permissions for the specific area they are currently viewing.

### Proposed Changes:

#### 1. Modify `src/pages/AreaPortal.tsx`
- Update line 143 to set `effectiveArea` to `decodedNome` regardless of the user's role.
- This ensures that if a "diretoria" user is in the "Hakuna" portal, the permissions are fetched for the "Hakuna" area with "Coord 01" rank, granting them access to all specialized modules (Equipe, Ergométricos, etc.).

#### 2. Verification of the logic:
- **Scenario 1: Diretoria visiting /areas/Hakuna**
  - `role === "diretoria"`, `decodedNome === "Hakuna"`.
  - `effectiveArea = "Hakuna"`.
  - `effectiveCargo = "Coord 01"`.
  - Permission key: `Hakuna_Coord 01` (Correct: grants access to all Hakuna modules).
- **Scenario 2: Diretoria visiting /areas/Diretoria**
  - `role === "diretoria"`, `decodedNome === "Diretoria"`.
  - `effectiveArea = "Diretoria"`.
  - `effectiveCargo = "Coord 01"`.
  - Permission key: `Diretoria_Coord 01` (Correct: grants access to Diretoria portal).
- **Scenario 3: Normal user (Hakuna Coord) visiting /areas/Hakuna**
  - `role !== "diretoria"`, `decodedNome === "Hakuna"`, `cargoArea === "Coordenador 01"`.
  - `effectiveArea = "Hakuna"`.
  - `effectiveCargo = "Coordenador 01"`.
  - Permission key: `Hakuna_Coordenador 01` (which gets normalized to `Hakuna_Coord 01` in the library). (Correct).

This fix is simple and directly addresses the bug reported.

### Technical Implementation:

1.  **Modify `src/pages/AreaPortal.tsx`**:
    -   Replace:
        ```tsx
        const effectiveArea  = role === "diretoria" ? "Diretoria" : decodedNome;
        ```
        with:
        ```tsx
        const effectiveArea = decodedNome;
        ```

This change will restore access to all specialized modules for the Diretoria when they browse different area portals.
