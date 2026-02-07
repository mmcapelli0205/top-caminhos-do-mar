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
          preco_swift2: number | null
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
          preco_swift2?: number | null
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
          preco_swift2?: number | null
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
      despesas: {
        Row: {
          auto_calculado: boolean | null
          categoria: string | null
          comprovante_url: string | null
          created_at: string | null
          data: string | null
          descricao: string
          id: string
          responsavel: string | null
          top_id: string | null
          valor: number
        }
        Insert: {
          auto_calculado?: boolean | null
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          data?: string | null
          descricao: string
          id?: string
          responsavel?: string | null
          top_id?: string | null
          valor: number
        }
        Update: {
          auto_calculado?: boolean | null
          categoria?: string | null
          comprovante_url?: string | null
          created_at?: string | null
          data?: string | null
          descricao?: string
          id?: string
          responsavel?: string | null
          top_id?: string | null
          valor?: number
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
      equipamentos: {
        Row: {
          created_at: string | null
          data_devolucao: string | null
          emprestado_por: string | null
          id: string
          nome: string
          quantidade: number | null
          status: string | null
          tipo: string | null
          top_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_devolucao?: string | null
          emprestado_por?: string | null
          id?: string
          nome: string
          quantidade?: number | null
          status?: string | null
          tipo?: string | null
          top_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_devolucao?: string | null
          emprestado_por?: string | null
          id?: string
          nome?: string
          quantidade?: number | null
          status?: string | null
          tipo?: string | null
          top_id?: string | null
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
      hakunas: {
        Row: {
          associacao_medica: string | null
          created_at: string | null
          crm: string | null
          disponibilidade: string | null
          id: string
          servidor_id: string | null
          top_id: string | null
        }
        Insert: {
          associacao_medica?: string | null
          created_at?: string | null
          crm?: string | null
          disponibilidade?: string | null
          id?: string
          servidor_id?: string | null
          top_id?: string | null
        }
        Update: {
          associacao_medica?: string | null
          created_at?: string | null
          crm?: string | null
          disponibilidade?: string | null
          id?: string
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
          checkin_realizado: boolean | null
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
          peso: number | null
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
          checkin_realizado?: boolean | null
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
          peso?: number | null
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
          checkin_realizado?: boolean | null
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
          peso?: number | null
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
            foreignKeyName: "participantes_top_id_fkey"
            columns: ["top_id"]
            isOneToOne: false
            referencedRelation: "tops"
            referencedColumns: ["id"]
          },
        ]
      }
      servidores: {
        Row: {
          area_servico: string | null
          checkin: boolean | null
          cpf: string | null
          created_at: string | null
          email: string | null
          especialidade: string | null
          id: string
          nome: string
          qr_code: string | null
          telefone: string | null
          top_id: string | null
        }
        Insert: {
          area_servico?: string | null
          checkin?: boolean | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          especialidade?: string | null
          id?: string
          nome: string
          qr_code?: string | null
          telefone?: string | null
          top_id?: string | null
        }
        Update: {
          area_servico?: string | null
          checkin?: boolean | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          especialidade?: string | null
          id?: string
          nome?: string
          qr_code?: string | null
          telefone?: string | null
          top_id?: string | null
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
      tops: {
        Row: {
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          local: string | null
          max_participantes: number | null
          nome: string
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
          status?: string | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          area_servico: string | null
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          papel: string
          senha_hash: string
          top_id: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          area_servico?: string | null
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          papel: string
          senha_hash: string
          top_id?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          area_servico?: string | null
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          papel?: string
          senha_hash?: string
          top_id?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_top_id_fkey"
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
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
