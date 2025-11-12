-- Create diet_types table for predefined diet plans
CREATE TABLE public.diet_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diet_name text NOT NULL UNIQUE,
  calorie_target integer NOT NULL,
  protein_target integer NOT NULL,
  carbs_target integer NOT NULL,
  fat_target integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diet_types ENABLE ROW LEVEL SECURITY;

-- Anyone can view diet types (they're predefined options)
CREATE POLICY "Anyone can view diet types"
ON public.diet_types
FOR SELECT
USING (true);

-- Only admins can manage diet types
CREATE POLICY "Admins can manage diet types"
ON public.diet_types
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert the diet data
INSERT INTO public.diet_types (diet_name, calorie_target, protein_target, carbs_target, fat_target) VALUES
('Low Carb', 1800, 100, 120, 40),
('High Protein', 2000, 150, 130, 50),
('Balanced', 2200, 120, 150, 60),
('Vegan', 1700, 80, 200, 30),
('Keto', 1600, 110, 50, 80),
('Paleo', 1900, 130, 100, 45),
('Mediterranean', 2100, 115, 140, 55),
('Weight Loss', 1500, 90, 100, 25),
('Muscle Gain', 2500, 160, 180, 70),
('Athletic', 2300, 140, 170, 65);

-- Add diet_type_id to diet_plans table to link user's selected diet
ALTER TABLE public.diet_plans
ADD COLUMN diet_type_id uuid REFERENCES public.diet_types(id);