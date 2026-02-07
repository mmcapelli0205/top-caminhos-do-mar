ALTER TABLE public.servidores
  ADD COLUMN valor_pago numeric DEFAULT 0,
  ADD COLUMN forma_pagamento text,
  ADD COLUMN cupom_desconto text,
  ADD COLUMN status text DEFAULT 'ativo';