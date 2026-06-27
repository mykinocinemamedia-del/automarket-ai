-- Seed data for AutoMarket AI
-- Demo brand: Kopi Senja (specialty coffee)

-- Clear existing data (in case of re-seed)
DELETE FROM "analytics_snapshots";
DELETE FROM "automation_rules";
DELETE FROM "content_posts";
DELETE FROM "assets";
DELETE FROM "brand_profiles";

-- 1. Brand profile
INSERT INTO "brand_profiles" ("id", "name", "tagline", "industry", "targetAudience", "brandVoice", "toneKeywords", "primaryColor", "hashtagSets", "createdAt", "updatedAt") VALUES
('demo-brand-1', 'Kopi Senja', 'Setiap teguk, satu cerita', 'F&B / Specialty Coffee', 'Urban professionals 25-40 yang appreciate slow living & quality coffee', 'Warm, contemplative, slightly poetic. Mix BM-English. Not pushy, more like friend sharing passion.', 'warm, authentic, poetic, calming, friendly', '#8B5A3C', '["#kopisenja #specialtycoffee #slowliving #coffeemalaysia","#coffeelover #kualalumpur #coffeeculture #thirdwave"]', NOW(), NOW());

-- 2. Demo posts (6 posts)
INSERT INTO "content_posts" ("id", "title", "body", "platform", "status", "hashtags", "scheduledAt", "publishedAt", "brandId", "createdAt", "updatedAt") VALUES
('demo-post-1', 'Morning brew ritual', 'Pagi ni kita slow down sikit. Sebelum meeting berturut-turut, kopi hangat dulu.

Apa kopi kamu hari ini? ☕️

#kopisenja #morningritual #specialtycoffee', 'instagram', 'published', '#kopisenja #morningritual #specialtycoffee', NULL, NOW() - INTERVAL '2 days', 'demo-brand-1', NOW() - INTERVAL '2 days', NOW()),
('demo-post-2', 'Single origin Ethiopia launch', 'Just dropped our latest single origin from Yirgacheffe, Ethiopia. Notes of jasmine, bergamot, dan hint of peach. Limited 50 packs saja. Link in bio.', 'linkedin', 'scheduled', '#specialtycoffee #ethiopia #singleorigin', NOW() + INTERVAL '1 day', NULL, 'demo-brand-1', NOW() - INTERVAL '1 day', NOW()),
('demo-post-3', 'Latte art workshop reminder', 'Workshop Sabtu ni penuh, tapi kita open 1 slot je lagi. Siapa cepat dia dapat. DM kita sekarang! 🎨☕️', 'instagram', 'draft', NULL, NULL, NULL, 'demo-brand-1', NOW(), NOW()),
('demo-post-4', 'Behind the scenes roasting', 'Roasting batch baru malam tadi. Cara lain kita roast beans ni — ada note chocolate yang lebih depth. Coming soon.', 'facebook', 'scheduled', NULL, NOW() + INTERVAL '2 days', NULL, 'demo-brand-1', NOW() - INTERVAL '12 hours', NOW()),
('demo-post-5', 'Quick tip: storing coffee beans', 'Tip petang: simpan beans dalam airtight container, jauh dari sunlight. Fresh beans = better coffee. Simple tapi make a difference.', 'twitter', 'published', NULL, NULL, NOW() - INTERVAL '5 days', 'demo-brand-1', NOW() - INTERVAL '5 days', NOW()),
('demo-post-6', 'Customer love story', 'Salah seorang regular kita, Aisyah, datang every morning before keja. Dia kata "kopi sini je yang betul-betul buat hari saya start betul." Itu yang kita kerja untuk. Bukan kopi saja, tapi moment. 💛', 'instagram', 'scheduled', NULL, NOW() + INTERVAL '3 days', NULL, 'demo-brand-1', NOW() - INTERVAL '6 hours', NOW());

-- 3. Demo assets (4 images)
INSERT INTO "assets" ("id", "name", "type", "url", "tags", "brandId", "createdAt") VALUES
('asset-1', 'Latte art rosetta', 'image', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800', 'latte,coffee,art', 'demo-brand-1', NOW()),
('asset-2', 'Coffee beans closeup', 'image', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800', 'beans,roasted', 'demo-brand-1', NOW()),
('asset-3', 'Cafe interior', 'image', 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800', 'cafe,interior', 'demo-brand-1', NOW()),
('asset-4', 'Barista pouring', 'image', 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800', 'barista,pour', 'demo-brand-1', NOW());

-- 4. Demo automation rules
INSERT INTO "automation_rules" ("id", "name", "description", "trigger", "action", "config", "active", "createdAt", "updatedAt") VALUES
('rule-1', 'Morning motivation post', 'Auto-generate motivation quote setiap 8am pagi untuk Instagram', 'daily', 'generate_post', '{"time":"08:00","platform":"instagram","prompt":"motivation quote related to coffee & slow living"}', true, NOW(), NOW()),
('rule-2', 'Repurpose blog to LinkedIn', 'Bila ada blog baru, auto-repurpose untuk LinkedIn dengan tone profesional', 'on_event', 'repurpose', '{"source":"blog","target":"linkedin"}', true, NOW(), NOW()),
('rule-3', 'Weekly recap carousel', 'Setiap Isnin, generate weekly recap carousel Instagram', 'weekly', 'generate_post', '{"day":"monday","time":"10:00","platform":"instagram"}', false, NOW(), NOW());

-- 5. Demo analytics (31 days × 4 platforms × 4 metrics = 496 records)
-- Using generate_series for efficiency, gen_random_uuid() for IDs
INSERT INTO "analytics_snapshots" ("id", "platform", "metric", "value", "recordedAt")
SELECT
    gen_random_uuid(),
    platform,
    metric,
    CASE
        WHEN metric = 'reach' THEN 500 + (random() * 1500)::int
        WHEN metric = 'engagement' THEN 30 + (random() * 120)::int
        WHEN metric = 'followers' THEN (random() * 10)::int - 2
        WHEN metric = 'clicks' THEN 10 + (random() * 80)::int
    END,
    NOW() - (day * INTERVAL '1 day')
FROM
    generate_series(0, 30) AS day
CROSS JOIN
    (VALUES ('instagram'), ('facebook'), ('linkedin'), ('twitter')) AS p(platform)
CROSS JOIN
    (VALUES ('reach'), ('engagement'), ('followers'), ('clicks')) AS m(metric);
