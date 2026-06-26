// Seed script — populate demo brand, posts, analytics, rules
// Run: bun /home/z/my-project/scripts/seed.ts

import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Brand profile
  const brand = await db.brandProfile.upsert({
    where: { id: 'demo-brand-1' },
    update: {},
    create: {
      id: 'demo-brand-1',
      name: 'Kopi Senja',
      tagline: 'Setiap teguk, satu cerita',
      industry: 'F&B / Specialty Coffee',
      targetAudience: 'Urban professionals 25-40 yang appreciate slow living & quality coffee',
      brandVoice: 'Warm, contemplative, slightly poetic. Mix BM-English. Not pushy, more like friend sharing passion.',
      toneKeywords: 'warm, authentic, poetic, calming, friendly',
      primaryColor: '#8B5A3C',
      hashtagSets: JSON.stringify([
        '#kopisenja #specialtycoffee #slowliving #coffeemalaysia',
        '#coffeelover #kualalumpur #coffeeculture #thirdwave',
      ]),
    },
  })
  console.log('✅ Brand:', brand.name)

  // 2. Demo posts
  const posts = [
    {
      id: 'demo-post-1',
      title: 'Morning brew ritual',
      body: 'Pagi ni kita slow down sikit. Sebelum meeting berturut-turut, kopi hangat dulu. \n\nApa kopi kamu hari ini? ☕️\n\n#kopisenja #morningritual #specialtycoffee',
      platform: 'instagram',
      status: 'published',
      hashtags: '#kopisenja #morningritual #specialtycoffee',
      publishedAt: new Date(Date.now() - 86400000 * 2),
      brandId: brand.id,
    },
    {
      id: 'demo-post-2',
      title: 'Single origin Ethiopia launch',
      body: 'Just dropped our latest single origin from Yirgacheffe, Ethiopia. Notes of jasmine, bergamot, dan hint of peach. Limited 50 packs saja. Link in bio.',
      platform: 'linkedin',
      status: 'scheduled',
      hashtags: '#specialtycoffee #ethiopia #singleorigin',
      scheduledAt: new Date(Date.now() + 86400000),
      brandId: brand.id,
    },
    {
      id: 'demo-post-3',
      title: 'Latte art workshop reminder',
      body: 'Workshop Sabtu ni penuh, tapi kita open 1 slot je lagi. Siapa cepat dia dapat. DM kita sekarang! 🎨☕️',
      platform: 'instagram',
      status: 'draft',
      brandId: brand.id,
    },
    {
      id: 'demo-post-4',
      title: 'Behind the scenes roasting',
      body: 'Roasting batch baru malam tadi. Cara lain kita roast beans ni — ada note chocolate yang lebih depth. Coming soon.',
      platform: 'facebook',
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 86400000 * 2),
      brandId: brand.id,
    },
    {
      id: 'demo-post-5',
      title: 'Quick tip: storing coffee beans',
      body: 'Tip petang: simpan beans dalam airtight container, jauh dari sunlight. Fresh beans = better coffee. Simple tapi make a difference.',
      platform: 'twitter',
      status: 'published',
      publishedAt: new Date(Date.now() - 86400000 * 5),
      brandId: brand.id,
    },
    {
      id: 'demo-post-6',
      title: 'Customer love story',
      body: 'Salah seorang regular kita, Aisyah, datang every morning before keja. Dia kata "kopi sini je yang betul-betul buat hari saya start betul." Itu yang kita kerja untuk. Bukan kopi saja, tapi moment. 💛',
      platform: 'instagram',
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 86400000 * 3),
      brandId: brand.id,
    },
  ]

  for (const p of posts) {
    await db.contentPost.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    })
  }
  console.log(`✅ ${posts.length} posts seeded`)

  // 3. Demo assets
  const assets = [
    { id: 'asset-1', name: 'Latte art rosetta', type: 'image', url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800', tags: 'latte,coffee,art' },
    { id: 'asset-2', name: 'Coffee beans closeup', type: 'image', url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800', tags: 'beans,roasted' },
    { id: 'asset-3', name: 'Cafe interior', type: 'image', url: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800', tags: 'cafe,interior' },
    { id: 'asset-4', name: 'Barista pouring', type: 'image', url: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800', tags: 'barista,pour' },
  ]
  for (const a of assets) {
    await db.asset.upsert({
      where: { id: a.id },
      update: {},
      create: { ...a, brandId: brand.id },
    })
  }
  console.log(`✅ ${assets.length} assets seeded`)

  // 4. Demo analytics (last 30 days, random-ish)
  const platforms = ['instagram', 'facebook', 'linkedin', 'twitter']
  const metrics = ['reach', 'engagement', 'followers', 'clicks']
  const now = Date.now()
  const analyticsRecords = []

  for (let day = 30; day >= 0; day--) {
    for (const platform of platforms) {
      for (const metric of metrics) {
        const baseValue: Record<string, number> = {
          reach: 500 + Math.floor(Math.random() * 1500),
          engagement: 30 + Math.floor(Math.random() * 120),
          followers: Math.floor(Math.random() * 10) - 2,
          clicks: 10 + Math.floor(Math.random() * 80),
        }
        analyticsRecords.push({
          platform,
          metric,
          value: baseValue[metric],
          recordedAt: new Date(now - day * 86400000),
        })
      }
    }
  }

  // Bulk insert via createMany
  await db.analyticsSnapshot.createMany({ data: analyticsRecords })
  console.log(`✅ ${analyticsRecords.length} analytics snapshots seeded`)

  // 5. Demo automation rules
  const rules = [
    {
      id: 'rule-1',
      name: 'Morning motivation post',
      description: 'Auto-generate motivation quote setiap 8am pagi untuk Instagram',
      trigger: 'daily',
      action: 'generate_post',
      config: JSON.stringify({ time: '08:00', platform: 'instagram', prompt: 'motivation quote related to coffee & slow living' }),
      active: true,
    },
    {
      id: 'rule-2',
      name: 'Repurpose blog to LinkedIn',
      description: 'Bila ada blog baru, auto-repurpose untuk LinkedIn dengan tone profesional',
      trigger: 'on_event',
      action: 'repurpose',
      config: JSON.stringify({ source: 'blog', target: 'linkedin' }),
      active: true,
    },
    {
      id: 'rule-3',
      name: 'Weekly recap carousel',
      description: 'Setiap Isnin, generate weekly recap carousel Instagram',
      trigger: 'weekly',
      action: 'generate_post',
      config: JSON.stringify({ day: 'monday', time: '10:00', platform: 'instagram' }),
      active: false,
    },
  ]

  for (const r of rules) {
    await db.automationRule.upsert({
      where: { id: r.id },
      update: {},
      create: r,
    })
  }
  console.log(`✅ ${rules.length} automation rules seeded`)

  console.log('\n🎉 Seed complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
