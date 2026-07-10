-- 1. Create Portal Categories Table
CREATE TABLE IF NOT EXISTS public.portal_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Portal Resources Table
CREATE TABLE IF NOT EXISTS public.portal_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.portal_categories(id) ON DELETE SET NULL,
  portal_slug TEXT NOT NULL, -- e.g., 'canva', 'google-drive', 'jotform', etc.
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail TEXT,
  favorite BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Hidden', 'Archived')),
  display_order INTEGER DEFAULT 0,
  created_by TEXT DEFAULT 'Admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_portal_resources_portal_slug ON public.portal_resources(portal_slug);
CREATE INDEX IF NOT EXISTS idx_portal_resources_category_id ON public.portal_resources(category_id);
CREATE INDEX IF NOT EXISTS idx_portal_resources_favorite ON public.portal_resources(favorite);

-- 4. Enable Row Level Security (RLS) on tables
ALTER TABLE public.portal_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_resources ENABLE ROW LEVEL SECURITY;

-- 5. Set up SELECT, INSERT, UPDATE, DELETE policies for portal_categories
CREATE POLICY "Allow select for all on portal_categories" ON public.portal_categories FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users on portal_categories" ON public.portal_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users on portal_categories" ON public.portal_categories FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users on portal_categories" ON public.portal_categories FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Set up SELECT, INSERT, UPDATE, DELETE policies for portal_resources
CREATE POLICY "Allow select for all on portal_resources" ON public.portal_resources FOR SELECT USING (true);
CREATE POLICY "Allow insert for authenticated users on portal_resources" ON public.portal_resources FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update for authenticated users on portal_resources" ON public.portal_resources FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow delete for authenticated users on portal_resources" ON public.portal_resources FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Seed standard categories
INSERT INTO public.portal_categories (name, slug, icon, color) VALUES
('Marketing', 'marketing', 'Briefcase', '#F4C542'),
('Templates', 'templates', 'Copy', '#4A90E2'),
('Presentations', 'presentations', 'Presentation', '#F5A623'),
('Social Media', 'social-media', 'Share2', '#D0021B'),
('Recruitment', 'recruitment', 'UserPlus', '#7ED321'),
('Training', 'training', 'GraduationCap', '#9013FE'),
('Brand Assets', 'brand-assets', 'Image', '#50E3C2'),
('Certificates', 'certificates', 'Award', '#B8E986')
ON CONFLICT (slug) DO NOTHING;

-- 8. Seed sample Canva resources to showcase the CRUD immediately
DO $$
DECLARE
  cat_marketing UUID;
  cat_recruitment UUID;
  cat_presentations UUID;
  cat_brand UUID;
  cat_templates UUID;
BEGIN
  SELECT id INTO cat_marketing FROM public.portal_categories WHERE slug = 'marketing';
  SELECT id INTO cat_recruitment FROM public.portal_categories WHERE slug = 'recruitment';
  SELECT id INTO cat_presentations FROM public.portal_categories WHERE slug = 'presentations';
  SELECT id INTO cat_brand FROM public.portal_categories WHERE slug = 'brand-assets';
  SELECT id INTO cat_templates FROM public.portal_categories WHERE slug = 'templates';

  -- Seed Canva resources if categories found
  IF cat_marketing IS NOT NULL THEN
    INSERT INTO public.portal_resources (category_id, portal_slug, title, description, url, favorite, status, display_order)
    VALUES (cat_marketing, 'canva', 'Client Birthday Posters', 'Editable templates for customized client birthday greeting graphics.', 'https://www.canva.com/design/DAF-example1/view', true, 'Active', 1);
  END IF;

  IF cat_recruitment IS NOT NULL THEN
    INSERT INTO public.portal_resources (category_id, portal_slug, title, description, url, favorite, status, display_order)
    VALUES (cat_recruitment, 'canva', 'Recruitment Posters', 'Flyers and templates for career growth and recruitment drives.', 'https://www.canva.com/design/DAF-example2/view', false, 'Active', 2);
  END IF;

  IF cat_presentations IS NOT NULL THEN
    INSERT INTO public.portal_resources (category_id, portal_slug, title, description, url, favorite, status, display_order)
    VALUES (cat_presentations, 'canva', 'Presentation Decks', 'Standard enterprise slide layouts for pitching and operations.', 'https://www.canva.com/design/DAF-example3/view', true, 'Active', 3);
  END IF;

  IF cat_brand IS NOT NULL THEN
    INSERT INTO public.portal_resources (category_id, portal_slug, title, description, url, favorite, status, display_order)
    VALUES (cat_brand, 'canva', 'Brand Kit & Logos', 'Vector logos, custom typography guidelines, and official branding assets.', 'https://www.canva.com/design/DAF-example4/view', false, 'Active', 4);
  END IF;

  IF cat_templates IS NOT NULL THEN
    INSERT INTO public.portal_resources (category_id, portal_slug, title, description, url, favorite, status, display_order)
    VALUES (cat_templates, 'canva', 'Intern Templates', 'Standardised onboarding slide presentation templates for interns.', 'https://www.canva.com/design/DAF-example5/view', false, 'Active', 5);
  END IF;

  -- Seed some sample Google Drive resources
  IF cat_brand IS NOT NULL THEN
    INSERT INTO public.portal_resources (category_id, portal_slug, title, description, url, favorite, status, display_order)
    VALUES (cat_brand, 'google-drive', 'Official Company Logos & SVGs', 'Google Drive folder containing corporate vector files and SVG layouts.', 'https://drive.google.com/drive/folders/example-logos', true, 'Active', 1);
  END IF;
END $$;
