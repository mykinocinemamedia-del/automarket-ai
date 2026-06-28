-- Multi-project migration
-- Adds support for multiple companies/projects/clients in one account

-- 1. Create projects table (use quoted column names for camelCase consistency)
CREATE TABLE IF NOT EXISTS projects (
    id TEXT NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'company',
    description TEXT,
    color TEXT,
    emoji TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT projects_pkey PRIMARY KEY (id)
);

-- Disable RLS on projects
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- 2. Add projectId column to all existing tables (nullable for backward compat)
ALTER TABLE public.brand_profiles ADD COLUMN IF NOT EXISTS "projectId" TEXT REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS "projectId" TEXT REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS "projectId" TEXT REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS "projectId" TEXT REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.analytics_snapshots ADD COLUMN IF NOT EXISTS "projectId" TEXT REFERENCES projects(id) ON DELETE CASCADE;

-- 3. Create indexes for projectId
CREATE INDEX IF NOT EXISTS idx_brand_profiles_project ON brand_profiles("projectId");
CREATE INDEX IF NOT EXISTS idx_content_posts_project ON content_posts("projectId");
CREATE INDEX IF NOT EXISTS idx_assets_project ON assets("projectId");
CREATE INDEX IF NOT EXISTS idx_automation_rules_project ON automation_rules("projectId");
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_project ON analytics_snapshots("projectId");

-- 4. Create 3 demo projects
INSERT INTO projects (id, name, type, description, color, emoji) VALUES
('proj-kopisenja', 'Kopi Senja', 'company', 'Specialty coffee shop in KL — our own brand', '#8B5A3C', '☕'),
('proj-fitpro', 'FitPro Coaching', 'client', 'Online fitness coaching for busy professionals', '#00e060', '💪'),
('proj-techstart', 'TechStart SaaS', 'client', 'B2B SaaS startup launching project management tool', '#4d9fff', '🚀')
ON CONFLICT (id) DO NOTHING;

-- 5. Backfill existing data with default project (Kopi Senja)
UPDATE brand_profiles SET "projectId" = 'proj-kopisenja' WHERE "projectId" IS NULL;
UPDATE content_posts SET "projectId" = 'proj-kopisenja' WHERE "projectId" IS NULL;
UPDATE assets SET "projectId" = 'proj-kopisenja' WHERE "projectId" IS NULL;
UPDATE automation_rules SET "projectId" = 'proj-kopisenja' WHERE "projectId" IS NULL;
UPDATE analytics_snapshots SET "projectId" = 'proj-kopisenja' WHERE "projectId" IS NULL;

-- 6. Verify
SELECT 'projects' as t, COUNT(*) as c FROM projects
UNION ALL SELECT 'brand_profiles', COUNT(*) FROM brand_profiles
UNION ALL SELECT 'content_posts', COUNT(*) FROM content_posts
UNION ALL SELECT 'assets', COUNT(*) FROM assets
UNION ALL SELECT 'automation_rules', COUNT(*) FROM automation_rules
UNION ALL SELECT 'analytics_snapshots', COUNT(*) FROM analytics_snapshots;
