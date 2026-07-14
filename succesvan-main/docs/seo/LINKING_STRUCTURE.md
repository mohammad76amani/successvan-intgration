# 🔗 Internal Linking Structure - Week 1

## Current Implementation (Day 1-2)

```
┌─────────────────────────────────────────────────────────────┐
│                     PILLAR PAGES (Week 1)                    │
└─────────────────────────────────────────────────────────────┘

    ┌──────────────────────┐         ┌──────────────────────┐
    │  Van Hire London     │◄───────►│ Cheap Van Hire       │
    │  (Day 1)             │         │ London (Day 2)       │
    │                      │         │                      │
    │  /van-hire-london    │         │ /cheap-van-hire-     │
    │                      │         │ london               │
    │  Keywords:           │         │                      │
    │  • van hire london   │         │ Keywords:            │
    │  • van rental london │         │ • cheap van hire     │
    │                      │         │ • budget van hire    │
    └──────────────────────┘         └──────────────────────┘
            │                                 │
            │                                 │
            └────────────┬────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   CLUSTER (Day 3)      │
            │   Van Hire London      │
            │   Prices               │
            │                        │
            │   /blog/van-hire-      │
            │   london-prices        │
            └────────────────────────┘
```

## Planned Structure (End of Week 1)

```
┌─────────────────────────────────────────────────────────────┐
│                  WEEK 1 COMPLETE STRUCTURE                   │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │  Van Hire London     │
                    │  (Main Pillar)       │
                    └──────────┬───────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
    ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Cheap Van Hire   │  │ Luton Van    │  │ Removal Van  │
    │ London           │  │ Hire London  │  │ Hire London  │
    │ (Pillar)         │  │ (Pillar)     │  │ (Pillar)     │
    └──────────────────┘  └──────────────┘  └──────────────┘
            │
            │
            ▼
    ┌──────────────────┐
    │ Van Hire London  │
    │ Prices           │
    │ (Cluster)        │
    └──────────────────┘
```

## Linking Rules Applied

### Pillar → Pillar
- ✅ Van Hire London → Cheap Van Hire London
- ✅ Cheap Van Hire London → Van Hire London
- ⏳ Van Hire London → Luton Van Hire London (Week 2)
- ⏳ Van Hire London → Removal Van Hire London (Week 2)

### Cluster → Pillar
- ⏳ Van Hire London Prices → Van Hire London (Day 3)
- ⏳ Van Hire London Prices → Cheap Van Hire London (Day 3)

### Anchor Text Strategy

#### From Van Hire London:
```typescript
"including cheap van hire London options"
         ↓
    Links to: /cheap-van-hire-london
```

#### From Cheap Van Hire London:
```typescript
"affordable van rental London from £78/day"
           ↓
    Links to: /van-hire-london
```

## Month 1 Linking Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MONTH 1 STRUCTURE                         │
└─────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │  Van Hire London     │
                    │  (Hub Pillar)        │
                    └──────────┬───────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Cheap Van    │      │ Luton Van    │      │ Removal Van  │
│ Hire London  │      │ Hire London  │      │ Hire London  │
│ (Pillar)     │      │ (Pillar)     │      │ (Pillar)     │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Prices       │      │ Luton vs LWB │      │ Best Van Size│
│ (Cluster)    │      │ (Cluster)    │      │ (Cluster)    │
└──────────────┘      └──────────────┘      └──────────────┘
       │                     │                     │
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Under £50    │      │ Tail Lift    │      │ Man & Van vs │
│ (Cluster)    │      │ (Cluster)    │      │ Self Drive   │
└──────────────┘      └──────────────┘      └──────────────┘
```

## Link Juice Flow

```
Homepage
   │
   ├─► Van Hire London (Pillar) ──────┐
   │         │                         │
   │         ├─► Cheap Van Hire ◄──────┤
   │         │   (Pillar)              │
   │         │                         │
   │         ├─► Luton Van Hire ◄──────┤
   │         │   (Pillar)              │
   │         │                         │
   │         └─► Removal Van Hire ◄────┘
   │             (Pillar)
   │
   └─► Blog Index
           │
           ├─► Prices (Cluster)
           ├─► Insurance (Cluster)
           ├─► Unlimited Mileage (Cluster)
           └─► Same Day (Cluster)
```

## SEO Power Distribution

```
┌─────────────────────────────────────────────────────────────┐
│                    LINK POWER HIERARCHY                      │
└─────────────────────────────────────────────────────────────┘

Level 1: Homepage (100% Authority)
         │
         ▼
Level 2: Main Pillar - Van Hire London (90% Authority)
         │
         ├─► Pillar 2: Cheap Van Hire (80%)
         ├─► Pillar 3: Luton Van Hire (80%)
         └─► Pillar 4: Removal Van Hire (80%)
                 │
                 ▼
Level 3: Cluster Content (60-70%)
         │
         ▼
Level 4: Support Content (40-50%)
         │
         ▼
Level 5: Borough Pages (50-60%)
```

## Current Status

### ✅ Implemented (Day 1-2)
- Van Hire London ↔ Cheap Van Hire London (reciprocal)
- Natural anchor text
- Contextual placement
- Dofollow links

### ⏳ Pending (Day 3+)
- Cluster blog linking
- Additional pillar cross-linking
- Support content linking
- Borough page linking

## Best Practices Applied

1. ✅ **Natural Anchor Text**
   - "cheap van hire London options"
   - "van rental London"

2. ✅ **Contextual Placement**
   - Links within main content
   - Relevant to surrounding text

3. ✅ **Reciprocal Linking**
   - Pillar pages link to each other
   - Creates strong internal network

4. ✅ **Keyword-Rich Anchors**
   - Target keywords in anchor text
   - Helps with topical relevance

5. ✅ **User-Focused**
   - Links add value to reader
   - Natural reading flow

---

**Legend:**
- ✅ = Completed
- ⏳ = Planned/Pending
- ◄─► = Reciprocal link
- ─► = One-way link
- │ = Hierarchical relationship
