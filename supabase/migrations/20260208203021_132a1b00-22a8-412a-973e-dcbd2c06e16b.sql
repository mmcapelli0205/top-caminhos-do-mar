
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('diretoria', 'coordenacao', 'coord02', 'coord03', 'sombra', 'servidor');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. RLS policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Diretoria can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'diretoria'))
  WITH CHECK (public.has_role(auth.uid(), 'diretoria'));

-- 5. Drop existing user_profiles policies and recreate properly
DROP POLICY IF EXISTS "Ver perfis" ON public.user_profiles;
DROP POLICY IF EXISTS "Criar próprio perfil" ON public.user_profiles;
DROP POLICY IF EXISTS "Atualizar perfis" ON public.user_profiles;

-- Users can read own profile
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Diretoria can read all profiles
CREATE POLICY "Diretoria can read all profiles"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'diretoria'));

-- Users can create own profile (during signup)
CREATE POLICY "Users can create own profile"
  ON public.user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Diretoria can update any profile (approve/reject)
CREATE POLICY "Diretoria can update profiles"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'diretoria'))
  WITH CHECK (public.has_role(auth.uid(), 'diretoria'));

-- Users can update own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 6. system_config: allow authenticated users to read (for keyword validation via edge function with service role)
-- Keep existing policies, they already allow SELECT for authenticated
