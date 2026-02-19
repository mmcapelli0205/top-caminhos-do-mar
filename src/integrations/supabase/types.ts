export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      area_avisos: {
        Row: {
          area_id: string | null
          autor_id: string | null
          autor_nome: string | null
          conteudo: string
          created_at: string | null
          fixado: boolean | null
          id: string
          titulo: string
          top_id: string | null
          updated_at: string | null
        }
        Insert: {
          area_id?: string | null
          autor_id?: string | null
          autor_nome?: string | null
          conteudo: string
          created_at?: string | null
          fixado?: boolean | null
          id?: string
          titulo: string
          top_id?: string | null
          updated_at?: string | null
        }
        Update: {
          area_id?: string | null
          autor_id?: string | null
          autor_nome?: string | null
          conteudo?: string
          created_at?: string | null
          fixado?: boolean | null
          id?: string
          titulo?: string
          top_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "area_avisos_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_avisos_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_avisos_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      area_comentarios: {
        Row: {
          autor_id: string | null
          autor_nome: string | null
          aviso_id: string | null
          conteudo: string
          created_at: string | null
          id: string
        }
        Insert: {
          autor_id?: string | null
          autor_nome?: string | null
          aviso_id?: string | null
          conteudo: string
          created_at?: string | null
          id?: string
        }
        Update: {
          autor_id?: string | null
          autor_nome?: string | null
          aviso_id?: string | null
          conteudo?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "area_comentarios_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_comentarios_aviso_id_fkey"
            columns: ["aviso_id"]
            isOneToOne: false
            referencedRelation: "area_avisos"
            referencedColumns: ["id"]
          },
        ]
      }
      area_designacoes: {
        Row: {
          area_id: string | null
          created_at: string | null
          criado_por: string | null
          id: string
          observacoes: string | null
          participante_id: string | null
          servidor_id: string | null
          status: string | null
          tipo: string | null
          top_id: string | null
        }
        Insert: {
          area_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          id?: string
          observacoes?: string | null
          participante_id?: string | null
          servidor_id?: string | null
          status?: string | null
          tipo?: string | null
          top_id?: string | null
        }
        Update: {
          area_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          id?: string
          observacoes?: string | null
          participante_id?: string | null
          servidor_id?: string | null
          status?: string | null
          tipo?: string | null
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "area_designacoes_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_designacoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_designacoes_participante_id_fkey"
            columns: ["participante_id"]
            isOneToOne: false
            referencedRelation: "participantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_designacoes_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_designacoes_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      area_documentos: {
        Row: {
          area_id: string | null
          arquivo_url: string
          created_at: string | null
          descricao: string | null
          enviado_por: string | null
          enviado_por_nome: string | null
          id: string
          nome: string
          tamanho_bytes: number | null
          tipo_arquivo: string | null
          top_id: string | null
        }
        Insert: {
          area_id?: string | null
          arquivo_url: string
          created_at?: string | null
          descricao?: string | null
          enviado_por?: string | null
          enviado_por_nome?: string | null
          id?: string
          nome: string
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          top_id?: string | null
        }
        Update: {
          area_id?: string | null
          arquivo_url?: string
          created_at?: string | null
          descricao?: string | null
          enviado_por?: string | null
          enviado_por_nome?: string | null
          id?: string
          nome?: string
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "area_documentos_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_documentos_enviado_por_fkey"
            columns: ["enviado_por"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_documentos_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      area_eventos: {
        Row: {
          area_id: string | null
          created_at: string | null
          criado_por: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          id: string
          local: string | null
          tipo: string | null
          titulo: string
          top_id: string | null
        }
        Insert: {
          area_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          id?: string
          local?: string | null
          tipo?: string | null
          titulo: string
          top_id?: string | null
        }
        Update: {
          area_id?: string | null
          created_at?: string | null
          criado_por?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          id?: string
          local?: string | null
          tipo?: string | null
          titulo?: string
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "area_eventos_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_eventos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_eventos_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          coordenador_02_id: string | null
          coordenador_03_id: string | null
          coordenador_id: string | null
          cor: string | null
          created_at: string | null
          descricao: string | null
          id: string
          logo_url: string | null
          nome: string
          sombra_02_id: string | null
          sombra_03_id: string | null
          sombra_id: string | null
          top_id: string | null
        }
        Insert: {
          coordenador_02_id?: string | null
          coordenador_03_id?: string | null
          coordenador_id?: string | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          logo_url?: string | null
          nome: string
          sombra_02_id?: string | null
          sombra_03_id?: string | null
          sombra_id?: string | null
          top_id?: string | null
        }
        Update: {
          coordenador_02_id?: string | null
          coordenador_03_id?: string | null
          coordenador_id?: string | null
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          logo_url?: string | null
          nome?: string
          sombra_02_id?: string | null
          sombra_03_id?: string | null
          sombra_id?: string | null
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "areas_coordenador_02_id_fkey"
            columns: ["coordenador_02_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_coordenador_03_id_fkey"
            columns: ["coordenador_03_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_coordenador_id_fkey"
            columns: ["coordenador_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_sombra_02_id_fkey"
            columns: ["sombra_02_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_sombra_03_id_fkey"
            columns: ["sombra_03_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_sombra_id_fkey"
            columns: ["sombra_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      artes: {
        Row: {
          arquivo_url: string | null
          created_at: string | null
          descricao: string | null
          id: string
          tipo: string | null
          titulo: string
          top_id: string | null
        }
        Insert: {
          arquivo_url?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          tipo?: string | null
          titulo: string
          top_id?: string | null
        }
        Update: {
          arquivo_url?: string | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          tipo?: string | null
          titulo?: string
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artes_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      artes_docs: {
        Row: {
          arquivo_url: string
          categoria: string
          created_at: string | null
          descricao: string | null
          enviado_por: string | null
          id: string
          nome: string
          subcategoria: string | null
          tags: string | null
          tamanho_bytes: number | null
          tipo_arquivo: string | null
          top_id: string | null
          updated_at: string | null
          versao: number | null
        }
        Insert: {
          arquivo_url: string
          categoria: string
          created_at?: string | null
          descricao?: string | null
          enviado_por?: string | null
          id?: string
          nome: string
          subcategoria?: string | null
          tags?: string | null
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          top_id?: string | null
          updated_at?: string | null
          versao?: number | null
        }
        Update: {
          arquivo_url?: string
          categoria?: string
          created_at?: string | null
          descricao?: string | null
          enviado_por?: string | null
          id?: string
          nome?: string
          subcategoria?: string | null
          tags?: string | null
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          top_id?: string | null
          updated_at?: string | null
          versao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artes_docs_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      atendimentos_hakuna: {
        Row: {
          created_at: string | null
          glicemia: number | null
          glicemia_status: string | null
          hakuna_servidor_id: string | null
          id: string
          medicamento_id: string | null
          medicamento_nome: string | null
          medicamento_origem: string | null
          medicamento_quantidade: number | null
          medicamento_via: string | null
          observacoes: string | null
          participante_id: string | null
          pressao_diastolica: number | null
          pressao_sistolica: number | null
          pressao_status: string | null
          temperatura: number | null
          temperatura_status: string | null
          top_id: string | null
        }
        Insert: {
          created_at?: string | null
          glicemia?: number | null
          glicemia_status?: string | null
          hakuna_servidor_id?: string | null
          id?: string
          medicamento_id?: string | null
          medicamento_nome?: string | null
          medicamento_origem?: string | null
          medicamento_quantidade?: number | null
          medicamento_via?: string | null
          observacoes?: string | null
          participante_id?: string | null
          pressao_diastolica?: number | null
          pressao_sistolica?: number | null
          pressao_status?: string | null
          temperatura?: number | null
          temperatura_status?: string | null
          top_id?: string | null
        }
        Update: {
          created_at?: string | null
          glicemia?: number | null
          glicemia_status?: string | null
          hakuna_servidor_id?: string | null
          id?: string
          medicamento_id?: string | null
          medicamento_nome?: string | null
          medicamento_origem?: string | null
          medicamento_quantidade?: number | null
          medicamento_via?: string | null
          observacoes?: string | null
          participante_id?: string | null
          pressao_diastolica?: number | null
          pressao_sistolica?: number | null
          pressao_status?: string | null
          temperatura?: number | null
          temperatura_status?: string | null
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atendimentos_hakuna_hakuna_servidor_id_fkey"
            columns: ["hakuna_servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_hakuna_participante_id_fkey"
            columns: ["participante_id"]
            isOneToOne: false
            referencedRelation: "participantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atendimentos_hakuna_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      autorizacoes_medicas: {
        Row: {
          autorizado_por: string | null
          created_at: string | null
          data_autorizacao: string | null
          id: string
          observacoes: string | null
          participante_id: string | null
          status: string | null
          top_id: string | null
        }
        Insert: {
          autorizado_por?: string | null
          created_at?: string | null
          data_autorizacao?: string | null
          id?: string
          observacoes?: string | null
          participante_id?: string | null
          status?: string | null
          top_id?: string | null
        }
        Update: {
          autorizado_por?: string | null
          created_at?: string | null
          data_autorizacao?: string | null
          id?: string
          observacoes?: string | null
          participante_id?: string | null
          status?: string | null
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "autorizacoes_medicas_autorizado_por_fkey"
            columns: ["autorizado_por"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autorizacoes_medicas_participante_id_fkey"
            columns: ["participante_id"]
            isOneToOne: false
            referencedRelation: "participantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autorizacoes_medicas_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      bases_legendarios: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          instagram_handle: string
          logo_url: string | null
          nome: string
          regiao: string | null
          seguidores: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          instagram_handle: string
          logo_url?: string | null
          nome: string
          regiao?: string | null
          seguidores?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          instagram_handle?: string
          logo_url?: string | null
          nome?: string
          regiao?: string | null
          seguidores?: number | null
        }
        Relationships: []
      }
      bebidas_itens: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          preco_manual: number | null
          preco_mercado1: number | null
          preco_mercado2: number | null
          preco_mercado3: number | null
          quantidade_por_pessoa: number | null
          top_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          preco_manual?: number | null
          preco_mercado1?: number | null
          preco_mercado2?: number | null
          preco_mercado3?: number | null
          quantidade_por_pessoa?: number | null
          top_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          preco_manual?: number | null
          preco_mercado1?: number | null
          preco_mercado2?: number | null
          preco_mercado3?: number | null
          quantidade_por_pessoa?: number | null
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bebidas_itens_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_despesas: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          ordem: number | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          ordem?: number | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          ordem?: number | null
        }
        Relationships: []
      }
      cela_itens: {
        Row: {
          id: string
          kg_por_pessoa: number | null
          margem_seguranca: number | null
          nome: string
          percentual: number | null
          preco_araujo: number | null
          preco_krill: number | null
          preco_manual: number | null
          preco_swift: number | null
          top_id: string | null
        }
        Insert: {
          id?: string
          kg_por_pessoa?: number | null
          margem_seguranca?: number | null
          nome: string
          percentual?: number | null
          preco_araujo?: number | null
          preco_krill?: number | null
          preco_manual?: number | null
          preco_swift?: number | null
          top_id?: string | null
        }
        Update: {
          id?: string
          kg_por_pessoa?: number | null
          margem_seguranca?: number | null
          nome?: string
          percentual?: number | null
          preco_araujo?: number | null
          preco_krill?: number | null
          preco_manual?: number | null
          preco_swift?: number | null
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cela_itens_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      cronograma_atividades: {
        Row: {
          cenario_recursos: string | null
          created_at: string | null
          cronograma_tipo: string | null
          descricao: string | null
          dia: string
          equipe_responsavel: string | null
          horario_fim: string | null
          horario_fim_real: string | null
          horario_inicio: string | null
          horario_inicio_real: string | null
          id: string
          local: string | null
          observacao_execucao: string | null
          ordem: number
          reposicao_agua: string | null
          responsavel_nome: string | null
          status_execucao: string | null
          tempo_previsto_min: number | null
          tempo_real_min: number | null
          tipo: string
          titulo: string
          top_id: string | null
          updated_at: string | null
        }
        Insert: {
          cenario_recursos?: string | null
          created_at?: string | null
          cronograma_tipo?: string | null
          descricao?: string | null
          dia: string
          equipe_responsavel?: string | null
          horario_fim?: string | null
          horario_fim_real?: string | null
          horario_inicio?: string | null
          horario_inicio_real?: string | null
          id?: string
          local?: string | null
          observacao_execucao?: string | null
          ordem: number
          reposicao_agua?: string | null
          responsavel_nome?: string | null
          status_execucao?: string | null
          tempo_previsto_min?: number | null
          tempo_real_min?: number | null
          tipo: string
          titulo: string
          top_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cenario_recursos?: string | null
          created_at?: string | null
          cronograma_tipo?: string | null
          descricao?: string | null
          dia?: string
          equipe_responsavel?: string | null
          horario_fim?: string | null
          horario_fim_real?: string | null
          horario_inicio?: string | null
          horario_inicio_real?: string | null
          id?: string
          local?: string | null
          observacao_execucao?: string | null
          ordem?: number
          reposicao_agua?: string | null
          responsavel_nome?: string | null
          status_execucao?: string | null
          tempo_previsto_min?: number | null
          tempo_real_min?: number | null
          tipo?: string
          titulo?: string
          top_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_atividades_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      cronograma_locais: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          top_id: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          top_id?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cronograma_locais_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          auto_calculado: boolean | null
          categoria: string | null
          comprovante_url: string | null
          created_at: string | null
          data: string | null
          data_aquisicao: string | null
          descricao: string
          fornecedor: string | null
          id: string
          item: string | null
          observacoes: string | null
          quantidade: number | null
          responsavel: string | null
          top_id: string | null
          valor: number
          valor_unitario: number | null
        }
        Insert: {
          auto_calculado?: boolean | null
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          data?: string | null
          data_aquisicao?: string | null
          descricao: string
          fornecedor?: string | null
          id?: string
          item?: string | null
          observacoes?: string | null
          quantidade?: number | null
          responsavel?: string | null
          top_id?: string | null
          valor: number
          valor_unitario?: number | null
        }
        Update: {
          auto_calculado?: boolean | null
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          data?: string | null
          data_aquisicao?: string | null
          descricao?: string
          fornecedor?: string | null
          id?: string
          item?: string | null
          observacoes?: string | null
          quantidade?: number | null
          responsavel?: string | null
          top_id?: string | null
          valor?: number
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "despesas_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      doacoes: {
        Row: {
          created_at: string | null
          data: string | null
          doador: string
          id: string
          observacoes: string | null
          top_id: string | null
          valor: number
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          doador: string
          id?: string
          observacoes?: string | null
          top_id?: string | null
          valor: number
        }
        Update: {
          created_at?: string | null
          data?: string | null
          doador?: string
          id?: string
          observacoes?: string | null
          top_id?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "doacoes_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamento_emprestimos: {
        Row: {
          created_at: string | null
          data_devolucao: string | null
          data_retirada: string | null
          devolvido: boolean | null
          equipamento_id: string | null
          estado_devolucao: string | null
          estado_saida: string | null
          foto_devolucao_url: string | null
          foto_saida_url: string | null
          id: string
          observacoes: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          top_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_devolucao?: string | null
          data_retirada?: string | null
          devolvido?: boolean | null
          equipamento_id?: string | null
          estado_devolucao?: string | null
          estado_saida?: string | null
          foto_devolucao_url?: string | null
          foto_saida_url?: string | null
          id?: string
          observacoes?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          top_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_devolucao?: string | null
          data_retirada?: string | null
          devolvido?: boolean | null
          equipamento_id?: string | null
          estado_devolucao?: string | null
          estado_saida?: string | null
          foto_devolucao_url?: string | null
          foto_saida_url?: string | null
          id?: string
          observacoes?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipamento_emprestimos_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipamento_emprestimos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipamento_emprestimos_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos: {
        Row: {
          categoria: string | null
          created_at: string | null
          data_devolucao: string | null
          descricao: string | null
          emprestado_por: string | null
          estado: string | null
          foto_url: string | null
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          proprietario: string | null
          quantidade: number | null
          status: string | null
          tipo: string | null
          top_id: string | null
          valor_estimado: number | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          data_devolucao?: string | null
          descricao?: string | null
          emprestado_por?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          proprietario?: string | null
          quantidade?: number | null
          status?: string | null
          tipo?: string | null
          top_id?: string | null
          valor_estimado?: number | null
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          data_devolucao?: string | null
          descricao?: string | null
          emprestado_por?: string | null
          estado?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          proprietario?: string | null
          quantidade?: number | null
          status?: string | null
          tipo?: string | null
          top_id?: string | null
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipamentos_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      ergometrico_config: {
        Row: {
          comorbidades_obrigatorias: string[] | null
          id: string
          idade_minima: number | null
          top_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          comorbidades_obrigatorias?: string[] | null
          id?: string
          idade_minima?: number | null
          top_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          comorbidades_obrigatorias?: string[] | null
          id?: string
          idade_minima?: number | null
          top_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ergometrico_config_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      ergometricos: {
        Row: {
          analisado_por: string | null
          arquivo_url: string | null
          created_at: string | null
          data_analise: string | null
          data_envio: string | null
          id: string
          observacoes_medicas: string | null
          participante_id: string | null
          status: string | null
          top_id: string | null
        }
        Insert: {
          analisado_por?: string | null
          arquivo_url?: string | null
          created_at?: string | null
          data_analise?: string | null
          data_envio?: string | null
          id?: string
          observacoes_medicas?: string | null
          participante_id?: string | null
          status?: string | null
          top_id?: string | null
        }
        Update: {
          analisado_por?: string | null
          arquivo_url?: string | null
          created_at?: string | null
          data_analise?: string | null
          data_envio?: string | null
          id?: string
          observacoes_medicas?: string | null
          participante_id?: string | null
          status?: string | null
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ergometricos_analisado_por_fkey"
            columns: ["analisado_por"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ergometricos_participante_id_fkey"
            columns: ["participante_id"]
            isOneToOne: false
            referencedRelation: "participantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ergometricos_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      familias: {
        Row: {
          created_at: string | null
          familia_top_id: string | null
          hakuma_id: string | null
          id: number
          nome: string | null
          numero: number
        }
        Insert: {
          created_at?: string | null
          familia_top_id?: string | null
          hakuma_id?: string | null
          id?: number
          nome?: string | null
          numero: number
        }
        Update: {
          created_at?: string | null
          familia_top_id?: string | null
          hakuma_id?: string | null
          id?: number
          nome?: string | null
          numero?: number
        }
        Relationships: [
          {
            foreignKeyName: "familias_familia_top_id_fkey"
            columns: ["familia_top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "familias_hakuma_id_fkey"
            columns: ["hakuma_id"]
            isOneToOne: false
            referencedRelation: "hakunas"
            referencedColumns: ["id"]
          },
        ]
      }
      hakuna_equipamentos: {
        Row: {
          cedido_por: string | null
          created_at: string | null
          fonte_auto: boolean | null
          id: string
          nome: string
          obrigatorio: boolean | null
          observacoes: string | null
          preco_loja1: number | null
          preco_loja2: number | null
          preco_loja3: number | null
          preco_manual: number | null
          quantidade: number | null
          situacao: string | null
          top_id: string | null
        }
        Insert: {
          cedido_por?: string | null
          created_at?: string | null
          fonte_auto?: boolean | null
          id?: string
          nome: string
          obrigatorio?: boolean | null
          observacoes?: string | null
          preco_loja1?: number | null
          preco_loja2?: number | null
          preco_loja3?: number | null
          preco_manual?: number | null
          quantidade?: number | null
          situacao?: string | null
          top_id?: string | null
        }
        Update: {
          cedido_por?: string | null
          created_at?: string | null
          fonte_auto?: boolean | null
          id?: string
          nome?: string
          obrigatorio?: boolean | null
          observacoes?: string | null
          preco_loja1?: number | null
          preco_loja2?: number | null
          preco_loja3?: number | null
          preco_manual?: number | null
          quantidade?: number | null
          situacao?: string | null
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hakuna_equipamentos_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      hakuna_estoque_equipamentos: {
        Row: {
          created_at: string | null
          estado: string | null
          id: string
          nome: string
          observacao: string | null
          quantidade: number
          top_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacao?: string | null
          quantidade?: number
          top_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacao?: string | null
          quantidade?: number
          top_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hakuna_estoque_equipamentos_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      hakuna_estoque_medicamentos: {
        Row: {
          created_at: string | null
          doador_nome: string | null
          estoque_minimo: number | null
          id: string
          nome: string
          origem: string
          pedido_id: string | null
          quantidade: number
          top_id: string | null
          unidade: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          doador_nome?: string | null
          estoque_minimo?: number | null
          id?: string
          nome: string
          origem: string
          pedido_id?: string | null
          quantidade?: number
          top_id?: string | null
          unidade?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          doador_nome?: string | null
          estoque_minimo?: number | null
          id?: string
          nome?: string
          origem?: string
          pedido_id?: string | null
          quantidade?: number
          top_id?: string | null
          unidade?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hakuna_estoque_medicamentos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos_orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hakuna_estoque_medicamentos_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      hakuna_estoque_movimentacoes: {
        Row: {
          created_at: string | null
          data_movimentacao: string | null
          doador_nome: string | null
          hakuna_responsavel_id: string | null
          hakuna_responsavel_nome: string | null
          id: string
          medicamento_id: string | null
          observacao: string | null
          origem_entrada: string | null
          paciente_equipe: string | null
          paciente_familia: string | null
          paciente_nome: string | null
          paciente_tipo: string | null
          quantidade: number
          tipo: string
          top_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_movimentacao?: string | null
          doador_nome?: string | null
          hakuna_responsavel_id?: string | null
          hakuna_responsavel_nome?: string | null
          id?: string
          medicamento_id?: string | null
          observacao?: string | null
          origem_entrada?: string | null
          paciente_equipe?: string | null
          paciente_familia?: string | null
          paciente_nome?: string | null
          paciente_tipo?: string | null
          quantidade: number
          tipo: string
          top_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_movimentacao?: string | null
          doador_nome?: string | null
          hakuna_responsavel_id?: string | null
          hakuna_responsavel_nome?: string | null
          id?: string
          medicamento_id?: string | null
          observacao?: string | null
          origem_entrada?: string | null
          paciente_equipe?: string | null
          paciente_familia?: string | null
          paciente_nome?: string | null
          paciente_tipo?: string | null
          quantidade?: number
          tipo?: string
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hakuna_estoque_movimentacoes_hakuna_responsavel_id_fkey"
            columns: ["hakuna_responsavel_id"]
            isOneToOne: false
            referencedRelation: "hakunas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hakuna_estoque_movimentacoes_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "hakuna_estoque_medicamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hakuna_estoque_movimentacoes_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      hakuna_medicamentos: {
        Row: {
          cedido_por: string | null
          created_at: string | null
          fonte_auto: boolean | null
          id: string
          nome: string
          obrigatorio: boolean | null
          observacoes: string | null
          preco_farmacia1: number | null
          preco_farmacia2: number | null
          preco_farmacia3: number | null
          preco_manual: number | null
          quantidade: number | null
          situacao: string | null
          top_id: string | null
          unidade: string | null
        }
        Insert: {
          cedido_por?: string | null
          created_at?: string | null
          fonte_auto?: boolean | null
          id?: string
          nome: string
          obrigatorio?: boolean | null
          observacoes?: string | null
          preco_farmacia1?: number | null
          preco_farmacia2?: number | null
          preco_farmacia3?: number | null
          preco_manual?: number | null
          quantidade?: number | null
          situacao?: string | null
          top_id?: string | null
          unidade?: string | null
        }
        Update: {
          cedido_por?: string | null
          created_at?: string | null
          fonte_auto?: boolean | null
          id?: string
          nome?: string
          obrigatorio?: boolean | null
          observacoes?: string | null
          preco_farmacia1?: number | null
          preco_farmacia2?: number | null
          preco_farmacia3?: number | null
          preco_manual?: number | null
          quantidade?: number | null
          situacao?: string | null
          top_id?: string | null
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hakuna_medicamentos_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      hakuna_necessaire: {
        Row: {
          hakuna_servidor_id: string | null
          id: string
          medicamento_id: string
          medicamento_nome: string
          quantidade: number | null
          top_id: string | null
          updated_at: string | null
        }
        Insert: {
          hakuna_servidor_id?: string | null
          id?: string
          medicamento_id: string
          medicamento_nome: string
          quantidade?: number | null
          top_id?: string | null
          updated_at?: string | null
        }
        Update: {
          hakuna_servidor_id?: string | null
          id?: string
          medicamento_id?: string
          medicamento_nome?: string
          quantidade?: number | null
          top_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hakuna_necessaire_hakuna_servidor_id_fkey"
            columns: ["hakuna_servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hakuna_necessaire_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      hakuna_participante: {
        Row: {
          created_at: string | null
          hakuna_id: string | null
          id: string
          motivo: string | null
          participante_id: string | null
          prioridade: number | null
          servidor_id: string | null
          top_id: string | null
        }
        Insert: {
          created_at?: string | null
          hakuna_id?: string | null
          id?: string
          motivo?: string | null
          participante_id?: string | null
          prioridade?: number | null
          servidor_id?: string | null
          top_id?: string | null
        }
        Update: {
          created_at?: string | null
          hakuna_id?: string | null
          id?: string
          motivo?: string | null
          participante_id?: string | null
          prioridade?: number | null
          servidor_id?: string | null
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hakuna_participante_hakuna_id_fkey"
            columns: ["hakuna_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hakuna_participante_participante_id_fkey"
            columns: ["participante_id"]
            isOneToOne: false
            referencedRelation: "participantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hakuna_participante_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hakuna_participante_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      hakunas: {
        Row: {
          associacao_medica: string | null
          created_at: string | null
          crm: string | null
          disponibilidade: string | null
          especialidade: string | null
          especialidade_medica: string | null
          id: string
          profissao: string | null
          registro_profissional: string | null
          servidor_id: string | null
          top_id: string | null
        }
        Insert: {
          associacao_medica?: string | null
          created_at?: string | null
          crm?: string | null
          disponibilidade?: string | null
          especialidade?: string | null
          especialidade_medica?: string | null
          id?: string
          profissao?: string | null
          registro_profissional?: string | null
          servidor_id?: string | null
          top_id?: string | null
        }
        Update: {
          associacao_medica?: string | null
          created_at?: string | null
          crm?: string | null
          disponibilidade?: string | null
          especialidade?: string | null
          especialidade_medica?: string | null
          id?: string
          profissao?: string | null
          registro_profissional?: string | null
          servidor_id?: string | null
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hakumas_servidor_id_fkey"
            columns: ["servidor_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hakumas_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      homologacao_etapas: {
        Row: {
          concluida: boolean | null
          created_at: string | null
          data_conclusao: string | null
          data_prevista: string | null
          descricao: string | null
          id: string
          nome: string
          numero: number
          observacao: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          status: string
          top_id: string | null
          updated_at: string | null
        }
        Insert: {
          concluida?: boolean | null
          created_at?: string | null
          data_conclusao?: string | null
          data_prevista?: string | null
          descricao?: string | null
          id?: string
          nome: string
          numero: number
          observacao?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          status?: string
          top_id?: string | null
          updated_at?: string | null
        }
        Update: {
          concluida?: boolean | null
          created_at?: string | null
          data_conclusao?: string | null
          data_prevista?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          numero?: number
          observacao?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          status?: string
          top_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homologacao_etapas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homologacao_etapas_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_log: {
        Row: {
          canal: string | null
          conteudo: string | null
          created_at: string | null
          crm: string | null
          enviado: boolean | null
          id: string
          participante_id: string | null
          status: string | null
          tipo: string | null
        }
        Insert: {
          canal?: string | null
          conteudo?: string | null
          created_at?: string | null
          crm?: string | null
          enviado?: boolean | null
          id?: string
          participante_id?: string | null
          status?: string | null
          tipo?: string | null
        }
        Update: {
          canal?: string | null
          conteudo?: string | null
          created_at?: string | null
          crm?: string | null
          enviado?: boolean | null
          id?: string
          participante_id?: string | null
          status?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_log_participante_id_fkey"
            columns: ["participante_id"]
            isOneToOne: false
            referencedRelation: "participantes"
            referencedColumns: ["id"]
          },
        ]
      }
      mre_itens: {
        Row: {
          atualizado_em: string | null
          fonte_auto: boolean | null
          id: string
          nome: string
          obrigatorio: boolean | null
          preco_atacadao: number | null
          preco_manual: number | null
          preco_marsil: number | null
          preco_mercadao: number | null
          quantidade_por_kit: number | null
          top_id: string | null
        }
        Insert: {
          atualizado_em?: string | null
          fonte_auto?: boolean | null
          id?: string
          nome: string
          obrigatorio?: boolean | null
          preco_atacadao?: number | null
          preco_manual?: number | null
          preco_marsil?: number | null
          preco_mercadao?: number | null
          quantidade_por_kit?: number | null
          top_id?: string | null
        }
        Update: {
          atualizado_em?: string | null
          fonte_auto?: boolean | null
          id?: string
          nome?: string
          obrigatorio?: boolean | null
          preco_atacadao?: number | null
          preco_manual?: number | null
          preco_marsil?: number | null
          preco_mercadao?: number | null
          quantidade_por_kit?: number | null
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mre_itens_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      participantes: {
        Row: {
          alergia_alimentar: string | null
          altura: number | null
          amigo_parente: string | null
          checkin_em: string | null
          checkin_por: string | null
          checkin_realizado: boolean | null
          cidade: string | null
          condicionamento: number | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          contrato_assinado: boolean | null
          contrato_url: string | null
          cpf: string
          created_at: string | null
          cupom_desconto: string | null
          data_nascimento: string | null
          doenca: string | null
          email: string | null
          ergometrico_status: string | null
          ergometrico_url: string | null
          familia_id: number | null
          forma_pagamento: string | null
          id: string
          igreja: string | null
          inscrito_por: string | null
          instagram: string | null
          medicamentos: string | null
          motivo_inscricao: string | null
          nome: string
          numero_legendario: string | null
          peso: number | null
          peso_checkin: number | null
          profissao: string | null
          qr_code: string | null
          status: string | null
          tamanho_farda: string | null
          telefone: string | null
          top_id: string | null
          updated_at: string | null
          valor_pago: number | null
        }
        Insert: {
          alergia_alimentar?: string | null
          altura?: number | null
          amigo_parente?: string | null
          checkin_em?: string | null
          checkin_por?: string | null
          checkin_realizado?: boolean | null
          cidade?: string | null
          condicionamento?: number | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          contrato_assinado?: boolean | null
          contrato_url?: string | null
          cpf: string
          created_at?: string | null
          cupom_desconto?: string | null
          data_nascimento?: string | null
          doenca?: string | null
          email?: string | null
          ergometrico_status?: string | null
          ergometrico_url?: string | null
          familia_id?: number | null
          forma_pagamento?: string | null
          id?: string
          igreja?: string | null
          inscrito_por?: string | null
          instagram?: string | null
          medicamentos?: string | null
          motivo_inscricao?: string | null
          nome: string
          numero_legendario?: string | null
          peso?: number | null
          peso_checkin?: number | null
          profissao?: string | null
          qr_code?: string | null
          status?: string | null
          tamanho_farda?: string | null
          telefone?: string | null
          top_id?: string | null
          updated_at?: string | null
          valor_pago?: number | null
        }
        Update: {
          alergia_alimentar?: string | null
          altura?: number | null
          amigo_parente?: string | null
          checkin_em?: string | null
          checkin_por?: string | null
          checkin_realizado?: boolean | null
          cidade?: string | null
          condicionamento?: number | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          contrato_assinado?: boolean | null
          contrato_url?: string | null
          cpf?: string
          created_at?: string | null
          cupom_desconto?: string | null
          data_nascimento?: string | null
          doenca?: string | null
          email?: string | null
          ergometrico_status?: string | null
          ergometrico_url?: string | null
          familia_id?: number | null
          forma_pagamento?: string | null
          id?: string
          igreja?: string | null
          inscrito_por?: string | null
          instagram?: string | null
          medicamentos?: string | null
          motivo_inscricao?: string | null
          nome?: string
          numero_legendario?: string | null
          peso?: number | null
          peso_checkin?: number | null
          profissao?: string | null
          qr_code?: string | null
          status?: string | null
          tamanho_farda?: string | null
          telefone?: string | null
          top_id?: string | null
          updated_at?: string | null
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "participantes_familia_id_fkey"
            columns: ["familia_id"]
            isOneToOne: false
            referencedRelation: "familias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participantes_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_orcamentos: {
        Row: {
          aprovado_por: string | null
          area_solicitante: string
          categoria: string
          comprado: boolean | null
          comprovante_nf_url: string | null
          comprovante_url: string | null
          created_at: string | null
          data_compra: string | null
          data_solicitacao: string | null
          finalidade: string | null
          fornecedor_aprovado: string | null
          id: string
          is_obrigatorio_global: boolean | null
          migrado_despesas: boolean | null
          motivo_reprovacao: string | null
          nome_item: string
          orcamento_1_fornecedor: string | null
          orcamento_1_valor: number | null
          orcamento_2_fornecedor: string | null
          orcamento_2_valor: number | null
          orcamento_3_fornecedor: string | null
          orcamento_3_valor: number | null
          quantidade: number
          quantidade_comprada: number | null
          responsavel_id: string | null
          responsavel_nome: string
          status: string
          top_id: string | null
          updated_at: string | null
          valor_pago: number | null
          valor_total_estimado: number | null
          valor_unitario_estimado: number | null
        }
        Insert: {
          aprovado_por?: string | null
          area_solicitante: string
          categoria: string
          comprado?: boolean | null
          comprovante_nf_url?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          data_compra?: string | null
          data_solicitacao?: string | null
          finalidade?: string | null
          fornecedor_aprovado?: string | null
          id?: string
          is_obrigatorio_global?: boolean | null
          migrado_despesas?: boolean | null
          motivo_reprovacao?: string | null
          nome_item: string
          orcamento_1_fornecedor?: string | null
          orcamento_1_valor?: number | null
          orcamento_2_fornecedor?: string | null
          orcamento_2_valor?: number | null
          orcamento_3_fornecedor?: string | null
          orcamento_3_valor?: number | null
          quantidade?: number
          quantidade_comprada?: number | null
          responsavel_id?: string | null
          responsavel_nome: string
          status?: string
          top_id?: string | null
          updated_at?: string | null
          valor_pago?: number | null
          valor_total_estimado?: number | null
          valor_unitario_estimado?: number | null
        }
        Update: {
          aprovado_por?: string | null
          area_solicitante?: string
          categoria?: string
          comprado?: boolean | null
          comprovante_nf_url?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          data_compra?: string | null
          data_solicitacao?: string | null
          finalidade?: string | null
          fornecedor_aprovado?: string | null
          id?: string
          is_obrigatorio_global?: boolean | null
          migrado_despesas?: boolean | null
          motivo_reprovacao?: string | null
          nome_item?: string
          orcamento_1_fornecedor?: string | null
          orcamento_1_valor?: number | null
          orcamento_2_fornecedor?: string | null
          orcamento_2_valor?: number | null
          orcamento_3_fornecedor?: string | null
          orcamento_3_valor?: number | null
          quantidade?: number
          quantidade_comprada?: number | null
          responsavel_id?: string | null
          responsavel_nome?: string
          status?: string
          top_id?: string | null
          updated_at?: string | null
          valor_pago?: number | null
          valor_total_estimado?: number | null
          valor_unitario_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_orcamentos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_orcamentos_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      predicas: {
        Row: {
          codigo: string
          created_at: string | null
          dia: string
          duracao_estimada_min: number | null
          horario_previsto: string | null
          id: string
          local: string | null
          observacoes: string | null
          passagens_biblicas: string | null
          pregador_id: string | null
          pregador_nome: string | null
          publico: string | null
          recursos_necessarios: string | null
          status: string | null
          titulo: string
          top_id: string | null
          updated_at: string | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          dia: string
          duracao_estimada_min?: number | null
          horario_previsto?: string | null
          id?: string
          local?: string | null
          observacoes?: string | null
          passagens_biblicas?: string | null
          pregador_id?: string | null
          pregador_nome?: string | null
          publico?: string | null
          recursos_necessarios?: string | null
          status?: string | null
          titulo: string
          top_id?: string | null
          updated_at?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          dia?: string
          duracao_estimada_min?: number | null
          horario_previsto?: string | null
          id?: string
          local?: string | null
          observacoes?: string | null
          passagens_biblicas?: string | null
          pregador_id?: string | null
          pregador_nome?: string | null
          publico?: string | null
          recursos_necessarios?: string | null
          status?: string | null
          titulo?: string
          top_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predicas_pregador_id_fkey"
            columns: ["pregador_id"]
            isOneToOne: false
            referencedRelation: "servidores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predicas_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      pulseiras: {
        Row: {
          codigo: string
          created_at: string | null
          desvinculada_em: string | null
          desvinculada_por: string | null
          id: string
          participante_id: string | null
          status: string | null
          top_id: string | null
          vinculada_em: string | null
          vinculada_por: string | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          desvinculada_em?: string | null
          desvinculada_por?: string | null
          id?: string
          participante_id?: string | null
          status?: string | null
          top_id?: string | null
          vinculada_em?: string | null
          vinculada_por?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          desvinculada_em?: string | null
          desvinculada_por?: string | null
          id?: string
          participante_id?: string | null
          status?: string | null
          top_id?: string | null
          vinculada_em?: string | null
          vinculada_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pulseiras_participante_id_fkey"
            columns: ["participante_id"]
            isOneToOne: false
            referencedRelation: "participantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pulseiras_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      radar_noticias: {
        Row: {
          created_at: string | null
          data_captura: string | null
          data_publicacao: string | null
          fonte_nome: string | null
          fonte_url: string | null
          id: string
          resumo: string | null
          titulo: string
        }
        Insert: {
          created_at?: string | null
          data_captura?: string | null
          data_publicacao?: string | null
          fonte_nome?: string | null
          fonte_url?: string | null
          id?: string
          resumo?: string | null
          titulo: string
        }
        Update: {
          created_at?: string | null
          data_captura?: string | null
          data_publicacao?: string | null
          fonte_nome?: string | null
          fonte_url?: string | null
          id?: string
          resumo?: string | null
          titulo?: string
        }
        Relationships: []
      }
      servidores: {
        Row: {
          area_preferencia_1: string | null
          area_preferencia_2: string | null
          area_servico: string | null
          areas_servidas: string | null
          cargo_area: string | null
          cep: string | null
          checkin: boolean | null
          cidade: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_telefone: string | null
          cpf: string | null
          created_at: string | null
          crm: string | null
          cupom_desconto: string | null
          dados_completos: boolean | null
          data_nascimento: string | null
          email: string | null
          endereco: string | null
          especialidade: string | null
          especialidade_medica: string | null
          estado: string | null
          estrangeiro: boolean | null
          experiencia: string | null
          forma_pagamento: string | null
          habilidades: string | null
          id: string
          igreja: string | null
          nome: string
          numero_legendario: string | null
          origem: string | null
          pais: string | null
          profissao: string | null
          qr_code: string | null
          recurso_descricao: string | null
          sede: string | null
          status: string | null
          tamanho_farda: string | null
          telefone: string | null
          tem_recurso: boolean | null
          tem_veiculo: boolean | null
          top_id: string | null
          updated_at: string | null
          valor_pago: number | null
        }
        Insert: {
          area_preferencia_1?: string | null
          area_preferencia_2?: string | null
          area_servico?: string | null
          areas_servidas?: string | null
          cargo_area?: string | null
          cep?: string | null
          checkin?: boolean | null
          cidade?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          cpf?: string | null
          created_at?: string | null
          crm?: string | null
          cupom_desconto?: string | null
          dados_completos?: boolean | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          especialidade?: string | null
          especialidade_medica?: string | null
          estado?: string | null
          estrangeiro?: boolean | null
          experiencia?: string | null
          forma_pagamento?: string | null
          habilidades?: string | null
          id?: string
          igreja?: string | null
          nome: string
          numero_legendario?: string | null
          origem?: string | null
          pais?: string | null
          profissao?: string | null
          qr_code?: string | null
          recurso_descricao?: string | null
          sede?: string | null
          status?: string | null
          tamanho_farda?: string | null
          telefone?: string | null
          tem_recurso?: boolean | null
          tem_veiculo?: boolean | null
          top_id?: string | null
          updated_at?: string | null
          valor_pago?: number | null
        }
        Update: {
          area_preferencia_1?: string | null
          area_preferencia_2?: string | null
          area_servico?: string | null
          areas_servidas?: string | null
          cargo_area?: string | null
          cep?: string | null
          checkin?: boolean | null
          cidade?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_telefone?: string | null
          cpf?: string | null
          created_at?: string | null
          crm?: string | null
          cupom_desconto?: string | null
          dados_completos?: boolean | null
          data_nascimento?: string | null
          email?: string | null
          endereco?: string | null
          especialidade?: string | null
          especialidade_medica?: string | null
          estado?: string | null
          estrangeiro?: boolean | null
          experiencia?: string | null
          forma_pagamento?: string | null
          habilidades?: string | null
          id?: string
          igreja?: string | null
          nome?: string
          numero_legendario?: string | null
          origem?: string | null
          pais?: string | null
          profissao?: string | null
          qr_code?: string | null
          recurso_descricao?: string | null
          sede?: string | null
          status?: string | null
          tamanho_farda?: string | null
          telefone?: string | null
          tem_recurso?: boolean | null
          tem_veiculo?: boolean | null
          top_id?: string | null
          updated_at?: string | null
          valor_pago?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "servidores_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          chave: string
          id: string
          updated_at: string | null
          valor: string
        }
        Insert: {
          chave: string
          id?: string
          updated_at?: string | null
          valor: string
        }
        Update: {
          chave?: string
          id?: string
          updated_at?: string | null
          valor?: string
        }
        Relationships: []
      }
      tirolesa_duplas: {
        Row: {
          created_at: string | null
          familia_id: number | null
          id: string
          observacao: string | null
          ordem: number | null
          participante_1_id: string | null
          participante_2_id: string | null
          peso_1: number | null
          peso_2: number | null
          peso_total: number | null
          status: string | null
          top_id: string | null
        }
        Insert: {
          created_at?: string | null
          familia_id?: number | null
          id?: string
          observacao?: string | null
          ordem?: number | null
          participante_1_id?: string | null
          participante_2_id?: string | null
          peso_1?: number | null
          peso_2?: number | null
          peso_total?: number | null
          status?: string | null
          top_id?: string | null
        }
        Update: {
          created_at?: string | null
          familia_id?: number | null
          id?: string
          observacao?: string | null
          ordem?: number | null
          participante_1_id?: string | null
          participante_2_id?: string | null
          peso_1?: number | null
          peso_2?: number | null
          peso_total?: number | null
          status?: string | null
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tirolesa_duplas_familia_id_fkey"
            columns: ["familia_id"]
            isOneToOne: false
            referencedRelation: "familias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tirolesa_duplas_participante_1_id_fkey"
            columns: ["participante_1_id"]
            isOneToOne: false
            referencedRelation: "participantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tirolesa_duplas_participante_2_id_fkey"
            columns: ["participante_2_id"]
            isOneToOne: false
            referencedRelation: "participantes"
            referencedColumns: ["id"]
          },
        ]
      }
      tops: {
        Row: {
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          local: string | null
          max_participantes: number | null
          nome: string
          observacoes: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          local?: string | null
          max_participantes?: number | null
          nome: string
          observacoes?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          local?: string | null
          max_participantes?: number | null
          nome?: string
          observacoes?: string | null
          status?: string | null
        }
        Relationships: []
      }
      tops_legendarios: {
        Row: {
          ativo: boolean | null
          cidade: string | null
          created_at: string | null
          data_captura: string | null
          data_checkin: string | null
          data_retorno: string | null
          destaque: boolean | null
          estado: string | null
          id: string
          instagram_base: string | null
          link_participante: string | null
          link_servidor: string | null
          link_servidor_data: string | null
          link_servidor_encontrado_em: string | null
          link_servidor_enviado_por: string | null
          nome_track: string | null
          numero_top: string | null
          origem_dados: string | null
          status: string | null
          top_id: string | null
          updated_at: string | null
          valor_participante: number | null
          valor_servidor: number | null
        }
        Insert: {
          ativo?: boolean | null
          cidade?: string | null
          created_at?: string | null
          data_captura?: string | null
          data_checkin?: string | null
          data_retorno?: string | null
          destaque?: boolean | null
          estado?: string | null
          id?: string
          instagram_base?: string | null
          link_participante?: string | null
          link_servidor?: string | null
          link_servidor_data?: string | null
          link_servidor_encontrado_em?: string | null
          link_servidor_enviado_por?: string | null
          nome_track?: string | null
          numero_top?: string | null
          origem_dados?: string | null
          status?: string | null
          top_id?: string | null
          updated_at?: string | null
          valor_participante?: number | null
          valor_servidor?: number | null
        }
        Update: {
          ativo?: boolean | null
          cidade?: string | null
          created_at?: string | null
          data_captura?: string | null
          data_checkin?: string | null
          data_retorno?: string | null
          destaque?: boolean | null
          estado?: string | null
          id?: string
          instagram_base?: string | null
          link_participante?: string | null
          link_servidor?: string | null
          link_servidor_data?: string | null
          link_servidor_encontrado_em?: string | null
          link_servidor_enviado_por?: string | null
          nome_track?: string | null
          numero_top?: string | null
          origem_dados?: string | null
          status?: string | null
          top_id?: string | null
          updated_at?: string | null
          valor_participante?: number | null
          valor_servidor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tops_legendarios_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          acesso_financeiro: boolean | null
          aprovado_por: string | null
          area_preferencia: string | null
          cargo: string | null
          created_at: string | null
          data_aprovacao: string | null
          email: string
          id: string
          login_temporario: boolean | null
          motivo_recusa: string | null
          nome: string
          numero_legendario: string | null
          pode_aprovar: boolean | null
          primeiro_acesso: boolean | null
          status: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          acesso_financeiro?: boolean | null
          aprovado_por?: string | null
          area_preferencia?: string | null
          cargo?: string | null
          created_at?: string | null
          data_aprovacao?: string | null
          email: string
          id: string
          login_temporario?: boolean | null
          motivo_recusa?: string | null
          nome: string
          numero_legendario?: string | null
          pode_aprovar?: boolean | null
          primeiro_acesso?: boolean | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          acesso_financeiro?: boolean | null
          aprovado_por?: string | null
          area_preferencia?: string | null
          cargo?: string | null
          created_at?: string | null
          data_aprovacao?: string | null
          email?: string
          id?: string
          login_temporario?: boolean | null
          motivo_recusa?: string | null
          nome?: string
          numero_legendario?: string | null
          pode_aprovar?: boolean | null
          primeiro_acesso?: boolean | null
          status?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          acesso_financeiro: boolean | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          acesso_financeiro?: boolean | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          acesso_financeiro?: boolean | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_envios: {
        Row: {
          created_at: string | null
          destinatario_nome: string | null
          destinatario_telefone: string | null
          enviado_em: string | null
          erro: string | null
          id: string
          mensagem_enviada: string | null
          status: string | null
          template_id: string | null
          top_id: string | null
        }
        Insert: {
          created_at?: string | null
          destinatario_nome?: string | null
          destinatario_telefone?: string | null
          enviado_em?: string | null
          erro?: string | null
          id?: string
          mensagem_enviada?: string | null
          status?: string | null
          template_id?: string | null
          top_id?: string | null
        }
        Update: {
          created_at?: string | null
          destinatario_nome?: string | null
          destinatario_telefone?: string | null
          enviado_em?: string | null
          erro?: string | null
          id?: string
          mensagem_enviada?: string | null
          status?: string | null
          template_id?: string | null
          top_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_envios_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_envios_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          destino: string | null
          gatilho: string
          id: string
          mensagem: string
          nome: string
          top_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          destino?: string | null
          gatilho: string
          id?: string
          mensagem: string
          nome: string
          top_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          destino?: string | null
          gatilho?: string
          id?: string
          mensagem?: string
          nome?: string
          top_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "diretoria"
        | "coordenacao"
        | "coord02"
        | "coord03"
        | "sombra"
        | "servidor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "diretoria",
        "coordenacao",
        "coord02",
        "coord03",
        "sombra",
        "servidor",
      ],
    },
  },
} as const
