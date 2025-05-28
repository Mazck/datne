module.exports.config = {
    name: "fishing",
    version: "3.0.0",
    hasPermission: 0,
    credits: "Mazck(https://github.com/Mazck)",
    description: "Game câu cá siêu nâng cao với tính năng: Guild, PvP, Pet, Auction, Prestige và nhiều hơn nữa",
    commandCategory: "game",
    usages: "[câu|bán|shop|guild|pvp|pet|auction|prestige|help]",
    cooldowns: 2,
    dependencies: {
        "fs-extra": "",
        "path": "",
        "moment-timezone": ""
    }
};

const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

// File paths
const pathData = path.join(__dirname, "cache", "fishing-data.json");
const pathGlobalData = path.join(__dirname, "cache", "fishing-global.json");
const pathGuildData = path.join(__dirname, "cache", "fishing-guilds.json");
const pathAuctionData = path.join(__dirname, "cache", "fishing-auction.json");
const pathPvPData = path.join(__dirname, "cache", "fishing-pvp.json");

// Game Data Configuration
const GAME_CONFIG = {
    // Basic Settings
    ENERGY_RECOVERY_RATE: 300000, // 5 minutes per energy point
    FISHING_COOLDOWN: 3000, // 3 seconds between fishing
    MAX_INVENTORY_SIZE: 1000,

    // Economic Settings
    BASE_FISH_PRICE_MULTIPLIER: 1.0,
    GUILD_CREATION_COST: 100000,
    VIP_COST_PER_LEVEL: 1000, // gems

    // Level Settings
    EXP_BASE: 100,
    LEVEL_CAP: 999,
    PRESTIGE_UNLOCK_LEVEL: 100,

    // PvP Settings
    PVP_UNLOCK_LEVEL: 15,
    PVP_MATCH_DURATION: 180000, // 3 minutes

    // Rates
    MATERIAL_DROP_RATE: 0.3,
    TREASURE_BASE_RATE: 0.01,
    RARE_FISH_BASE_RATE: 0.05
};

// Default Player Data
const defaultPlayerData = {
    // Basic Info
    money: 1000,
    gems: 50,
    exp: 0,
    level: 1,
    prestige: 0,
    energy: 100,
    maxEnergy: 100,

    // Timestamps
    lastFishing: 0,
    lastDaily: 0,
    lastRecoveryTime: 0,
    lastGuildContribution: 0,

    // Current Equipment
    rod: "Cần câu tre cơ bản",
    currentLocation: "Hồ làng nhỏ",
    currentBoat: "Thuyền gỗ",
    activePet: null,
    activeTitle: null,

    // Collections
    inventory: [],
    fishCollection: [],
    materialStorage: {},
    achievements: {},

    // Equipment Sets
    equipment: {
        hat: null,
        clothes: null,
        boots: null,
        accessory: null,
        tackle: null,
        reel: null,
        line: null,
        hook: null
    },

    // Pets
    pets: [],
    petStats: {},

    // Guild
    guildID: null,
    guildRank: "member",
    guildContribution: 0,

    // PvP
    pvpRating: 1000,
    pvpWins: 0,
    pvpLoses: 0,
    pvpStreak: 0,

    // VIP & Premium
    vipLevel: 0,
    vipExpiry: 0,
    premiumPass: false,
    passLevel: 0,
    passExp: 0,

    // Statistics
    stats: {
        totalFishCaught: 0,
        totalMoneyEarned: 0,
        rareFishCaught: 0,
        bossesDefeated: 0,
        questsCompleted: 0,
        pvpMatches: 0,
        guildContributions: 0,
        perfectCatches: 0,
        streak: 0,
        maxStreak: 0,
        fishingTime: 0,
        explorationDepth: 0
    },

    // Progression
    titles: [],
    quests: {
        daily: [],
        weekly: [],
        achievement: [],
        special: []
    },

    // Temporary Effects
    buffs: {},
    debuffs: {},
    cooldowns: {},

    // Settings
    preferences: {
        autoSell: false,
        autoBait: false,
        notifications: true,
        language: "vi"
    }
};

const AUTO_FISHING_CONFIG = {
    AUTO_FISHING_INTERVAL: 10000, // 10 seconds between auto fishing attempts
    AUTO_FISHING_DURATION: 1800000, // 30 minutes default duration
    AUTO_FISHING_SUCCESS_PENALTY: 0.7, // 70% of normal success rate
    AFK_FISHING_INTERVAL: 10000, // 5 minutes between AFK fishing attempts
    AFK_FISHING_ENERGY_DISCOUNT: 0.5, // 50% energy cost
    AFK_FISHING_SUCCESS_PENALTY: 0.4, // 40% of normal success rate
    TOURNAMENT_DURATION: 86400000, // 24 hours
    ROD_UPGRADE_MAX_LEVEL: 10
};

// Add to the defaultPlayerData object
const autoFishingData = {
    autoFishing: false,
    autoFishingEndTime: 0,
    afkFishing: false,
    afkFishingStartTime: 0,
    tournamentScore: 0,
    lastTournamentReward: 0,
    rodUpgrades: {},
    quests: {
        daily: [],
        weekly: [],
        special: []
    },
    achievements: {},
    craftingMaterials: {}
};

// Game Data
const gameData = {
    // Fishing Rods (Tier 1-10)
    rods: [
        // Tier 1 - Beginner (Level 1-10)
        { name: "Cần câu tre cơ bản", tier: 1, price: 0, probability: 0.6, energyCost: 8, durability: 100, unlockLevel: 1 },
        { name: "Cần câu gỗ thông", tier: 1, price: 800, probability: 0.65, energyCost: 7, durability: 120, unlockLevel: 3 },
        { name: "Cần câu tre Nhật", tier: 1, price: 1500, probability: 0.7, energyCost: 6, durability: 150, unlockLevel: 5 },

        // Tier 2 - Amateur (Level 10-20)
        { name: "Cần câu sắt", tier: 2, price: 3000, probability: 0.73, energyCost: 6, durability: 180, unlockLevel: 10, specialEffect: "ironStrength" },
        { name: "Cần câu đồng", tier: 2, price: 5000, probability: 0.75, energyCost: 5, durability: 200, unlockLevel: 12, specialEffect: "copperLuck" },
        { name: "Cần câu thủy tinh", tier: 2, price: 7500, probability: 0.77, energyCost: 5, durability: 160, unlockLevel: 15, specialEffect: "clearWater" },

        // Tier 3 - Professional (Level 20-35)
        { name: "Cần câu carbon", tier: 3, price: 12000, probability: 0.8, energyCost: 4, durability: 250, unlockLevel: 20, specialEffect: "carbonFlex" },
        { name: "Cần câu titanium", tier: 3, price: 18000, probability: 0.82, energyCost: 4, durability: 280, unlockLevel: 23, specialEffect: "titaniumDura" },
        { name: "Cần câu lửa", tier: 3, price: 25000, probability: 0.84, energyCost: 3, durability: 220, unlockLevel: 26, specialEffect: "fireBoost" },
        { name: "Cần câu băng", tier: 3, price: 28000, probability: 0.85, energyCost: 3, durability: 240, unlockLevel: 29, specialEffect: "iceBonus" },
        { name: "Cần câu gió", tier: 3, price: 32000, probability: 0.86, energyCost: 3, durability: 260, unlockLevel: 32, specialEffect: "windSpeed" },

        // Tier 4 - Expert (Level 35-50)
        { name: "Cần câu vàng", tier: 4, price: 50000, probability: 0.88, energyCost: 2, durability: 350, unlockLevel: 35, specialEffect: "goldLuck" },
        { name: "Cần câu bạc", tier: 4, price: 60000, probability: 0.89, energyCost: 2, durability: 330, unlockLevel: 37, specialEffect: "silverShine" },
        { name: "Cần câu điện từ", tier: 4, price: 80000, probability: 0.9, energyCost: 2, durability: 380, unlockLevel: 40, specialEffect: "electroShock" },
        { name: "Cần câu plasma", tier: 4, price: 120000, probability: 0.91, energyCost: 1, durability: 400, unlockLevel: 43, specialEffect: "plasmaBoost" },
        { name: "Cần câu quantum", tier: 4, price: 150000, probability: 0.92, energyCost: 1, durability: 420, unlockLevel: 46, specialEffect: "quantumField" },

        // Tier 5 - Master (Level 50-65)
        { name: "Cần câu kim cương", tier: 5, price: 250000, probability: 0.93, energyCost: 1, durability: 500, unlockLevel: 50, specialEffect: "diamondPure" },
        { name: "Cần câu ruby", tier: 5, price: 350000, probability: 0.94, energyCost: 1, durability: 480, unlockLevel: 53, specialEffect: "rubyFire" },
        { name: "Cần câu sapphire", tier: 5, price: 450000, probability: 0.95, energyCost: 1, durability: 520, unlockLevel: 56, specialEffect: "sapphireWater" },
        { name: "Cần câu emerald", tier: 5, price: 550000, probability: 0.95, energyCost: 0, durability: 540, unlockLevel: 59, specialEffect: "emeraldNature" },
        { name: "Cần câu obsidian", tier: 5, price: 750000, probability: 0.96, energyCost: 0, durability: 600, unlockLevel: 62, specialEffect: "obsidianPower" },

        // Tier 6 - Legendary (Level 65-80)
        { name: "Cần câu ánh sao", tier: 6, price: 1000000, probability: 0.97, energyCost: 0, durability: 700, unlockLevel: 65, specialEffect: "starLight" },
        { name: "Cần câu thiên thạch", tier: 6, price: 1500000, probability: 0.97, energyCost: 0, durability: 750, unlockLevel: 68, specialEffect: "meteorPower" },
        { name: "Cần câu địa ngục", tier: 6, price: 2000000, probability: 0.98, energyCost: 0, durability: 650, unlockLevel: 71, specialEffect: "hellFire" },
        { name: "Cần câu thiên đường", tier: 6, price: 2500000, probability: 0.98, energyCost: 0, durability: 800, unlockLevel: 74, specialEffect: "heavenBless" },
        { name: "Cần câu vũ trụ", tier: 6, price: 3500000, probability: 0.99, energyCost: 0, durability: 900, unlockLevel: 77, specialEffect: "cosmicPower" },

        // Tier 7 - Mythical (Level 80-90)
        { name: "Cần câu rồng", tier: 7, price: 5000000, probability: 0.99, energyCost: 0, durability: 1200, unlockLevel: 80, specialEffect: "dragonMight" },
        { name: "Cần câu phượng hoàng", tier: 7, price: 6000000, probability: 0.995, energyCost: 0, durability: 1300, unlockLevel: 83, specialEffect: "phoenixRebirth" },
        { name: "Cần câu kỳ lân", tier: 7, price: 7000000, probability: 0.995, energyCost: 0, durability: 1400, unlockLevel: 86, specialEffect: "unicornMagic" },
        { name: "Cần câu cổ đại", tier: 7, price: 10000000, probability: 1.0, energyCost: 0, durability: 1600, unlockLevel: 89, specialEffect: "ancientWisdom" },

        // Tier 8 - Divine (Level 90-95)
        { name: "Cần câu thiên thần", tier: 8, price: 20000000, probability: 1.0, energyCost: 0, durability: 2000, unlockLevel: 90, specialEffect: "angelicGrace" },
        { name: "Cần câu ác ma", tier: 8, price: 25000000, probability: 1.0, energyCost: 0, durability: 1800, unlockLevel: 92, specialEffect: "demonicPower" },
        { name: "Cần câu thần thánh", tier: 8, price: 35000000, probability: 1.0, energyCost: 0, durability: 2500, unlockLevel: 94, specialEffect: "divinePower" },

        // Tier 9 - Transcendent (Level 95-99)
        { name: "Cần câu thời gian", tier: 9, price: 50000000, probability: 1.0, energyCost: 0, durability: 3000, unlockLevel: 95, specialEffect: "timeControl" },
        { name: "Cần câu không gian", tier: 9, price: 75000000, probability: 1.0, energyCost: 0, durability: 3500, unlockLevel: 97, specialEffect: "spaceWarp" },
        { name: "Cần câu thực tại", tier: 9, price: 100000000, probability: 1.0, energyCost: 0, durability: 4000, unlockLevel: 99, specialEffect: "realityBend" },

        // Tier 10 - Omnipotent (Prestige 1+)
        { name: "Cần câu tối cao", tier: 10, price: 500000000, probability: 1.0, energyCost: 0, durability: 9999, prestige: 1, specialEffect: "omnipotence" },
        { name: "Cần câu vô cực", tier: 10, price: 1000000000, probability: 1.0, energyCost: 0, durability: 99999, prestige: 3, specialEffect: "infinity" },
        { name: "Cần câu tuyệt đối", tier: 10, price: 5000000000, probability: 1.0, energyCost: 0, durability: 999999, prestige: 5, specialEffect: "absolute" },

        // Special Purpose Rods
        { name: "Cần câu nhẹ gió", tier: 3, price: 40000, probability: 0.85, energyCost: 3, durability: 270, unlockLevel: 34, specialEffect: "windResistance", bonusHabitat: "sky_pond" },
        { name: "Cần câu ánh sáng", tier: 4, price: 90000, probability: 0.9, energyCost: 2, durability: 390, unlockLevel: 42, specialEffect: "lightBeam", bonusHabitat: "light_realm" },
        { name: "Cần câu bóng tối", tier: 4, price: 95000, probability: 0.9, energyCost: 2, durability: 370, unlockLevel: 44, specialEffect: "shadowPower", bonusHabitat: "dark_waters" },
        { name: "Cần câu bốn mùa", tier: 5, price: 600000, probability: 0.95, energyCost: 1, durability: 550, unlockLevel: 60, specialEffect: "seasonalAdaptation" },

        // Ultra Premium Rods
        { name: "Cần câu sao băng", tier: 6, price: 2800000, probability: 0.98, energyCost: 0, durability: 850, unlockLevel: 75, specialEffect: "shootingStar" },
        { name: "Cần câu nguyên tử", tier: 7, price: 8000000, probability: 0.99, energyCost: 0, durability: 1500, unlockLevel: 85, specialEffect: "atomicPower" },
        { name: "Cần câu ma thuật", tier: 8, price: 30000000, probability: 1.0, energyCost: 0, durability: 2800, unlockLevel: 93, specialEffect: "magicCast" },

        // Tournament Rods
        { name: "Cần câu giải đấu", tier: 5, price: 500000, probability: 0.94, energyCost: 1, durability: 530, unlockLevel: 55, specialEffect: "tournamentBonus", tournament: true },
        { name: "Cần câu quán quân", tier: 6, price: 2000000, probability: 0.97, energyCost: 0, durability: 700, unlockLevel: 70, specialEffect: "championAura", tournament: true },

        // Prestige Only Rods
        { name: "Cần câu linh hồn", tier: 9, price: 60000000, probability: 1.0, energyCost: 0, durability: 3200, prestige: 2, specialEffect: "soulBind" },
        { name: "Cần câu đa vũ trụ", tier: 10, price: 2000000000, probability: 1.0, energyCost: 0, durability: 999999, prestige: 7, specialEffect: "multiverseAccess" }

        
    ],

    // Fish Database (100+ fish)
    fish: [
        { name: "Cá lồng đèn", rarity: "rare", tier: 3, price: 1300, exp: 60, probability: 0.02, habitat: ["festival_pond"], season: "autumn", size: [40, 100], event: "mid_autumn" },
        { name: "Cá pháo hoa", rarity: "epic", tier: 4, price: 3500, exp: 140, probability: 0.01, habitat: ["celebration_sea"], season: "summer", size: [60, 150], event: "independence_day" },
        { name: "Cá ngôi sao", rarity: "epic", tier: 4, price: 3800, exp: 150, probability: 0.015, habitat: ["night_sky_lake"], timeRestriction: "night", size: [50, 120] },
        { name: "Cá kẹo ngọt", rarity: "rare", tier: 3, price: 1200, exp: 50, probability: 0.025, habitat: ["candy_river"], season: "winter", size: [30, 80], event: "halloween" },

        // Mythical Fish
        { name: "Cá Đế Vương", rarity: "mythical", tier: 6, price: 75000, exp: 2000, probability: 0.0004, habitat: ["imperial_sea"], size: [700, 1800], isBoss: true },
        { name: "Cá Chiến Binh", rarity: "legendary", tier: 5, price: 30000, exp: 800, probability: 0.001, habitat: ["battle_ocean"], size: [400, 900], element: "battle" },
        { name: "Cá Ánh Sáng", rarity: "divine", tier: 7, price: 280000, exp: 6500, probability: 0.00007, habitat: ["light_realm"], size: [600, 1600], element: "light" },

        // Crafting Special Fish
        { name: "Cá Tinh Luyện", rarity: "rare", tier: 3, price: 2000, exp: 70, probability: 0.02, habitat: ["forge_lake"], size: [40, 90], crafting: true },
        { name: "Cá Nguyên Tố", rarity: "epic", tier: 4, price: 5000, exp: 160, probability: 0.008, habitat: ["elemental_pool"], size: [70, 160], crafting: true, element: "multi" },

        // Tournament Exclusive Fish
        { name: "Cá Quán Quân", rarity: "legendary", tier: 5, price: 40000, exp: 1000, probability: 0.002, habitat: ["champion_waters"], size: [300, 700], tournament: true },
        { name: "Cá Kỷ Lục", rarity: "epic", tier: 4, price: 7000, exp: 200, probability: 0.005, habitat: ["record_bay"], size: [200, 400], tournament: true },

        // Ultra Rare Fish
        { name: "Cá Huyền Thoại", rarity: "transcendent", tier: 9, price: 12000000, exp: 120000, probability: 0.000004, habitat: ["legendary_depths"], size: [5000, 15000] },
        { name: "Cá Vạn Năng", rarity: "omnipotent", tier: 10, price: 50000000, exp: 500000, probability: 0.000002, habitat: ["omnipotent_void"], size: [8000, 20000] },

        // Common Fish (Tier 1) - Freshwater
        { name: "Cá bống", rarity: "common", tier: 1, price: 15, exp: 1, probability: 0.5, habitat: ["freshwater"], size: [5, 15] },
        { name: "Cá rô", rarity: "common", tier: 1, price: 20, exp: 1, probability: 0.45, habitat: ["freshwater"], size: [8, 20] },
        { name: "Cá thường", rarity: "common", tier: 1, price: 25, exp: 2, probability: 0.4, habitat: ["freshwater", "saltwater"], size: [10, 25] },
        { name: "Cá vược", rarity: "common", tier: 1, price: 30, exp: 2, probability: 0.35, habitat: ["freshwater"], size: [12, 30] },
        { name: "Cá chuối", rarity: "common", tier: 1, price: 35, exp: 2, probability: 0.3, habitat: ["saltwater"], size: [15, 35] },

        // Uncommon Fish (Tier 2)
        { name: "Cá chép", rarity: "uncommon", tier: 2, price: 60, exp: 5, probability: 0.2, habitat: ["freshwater"], size: [20, 50] },
        { name: "Cá trê", rarity: "uncommon", tier: 2, price: 80, exp: 6, probability: 0.18, habitat: ["freshwater"], size: [25, 60] },
        { name: "Cá lóc", rarity: "uncommon", tier: 2, price: 100, exp: 8, probability: 0.15, habitat: ["freshwater"], size: [30, 70] },
        { name: "Cá diêu hồng", rarity: "uncommon", tier: 2, price: 120, exp: 10, probability: 0.12, habitat: ["saltwater"], size: [25, 55] },
        { name: "Cá bơn", rarity: "uncommon", tier: 2, price: 110, exp: 9, probability: 0.14, habitat: ["saltwater"], size: [20, 45] },
        { name: "Cá rô phi", rarity: "uncommon", tier: 2, price: 90, exp: 7, probability: 0.16, habitat: ["freshwater"], size: [18, 40] },

        // Rare Fish (Tier 3)
        { name: "Cá hồi", rarity: "rare", tier: 3, price: 250, exp: 20, probability: 0.08, habitat: ["saltwater", "freshwater"], size: [40, 100] },
        { name: "Cá ngừ", rarity: "rare", tier: 3, price: 350, exp: 25, probability: 0.06, habitat: ["saltwater"], size: [50, 120] },
        { name: "Cá kiếm", rarity: "rare", tier: 3, price: 450, exp: 30, probability: 0.05, habitat: ["saltwater"], size: [60, 150] },
        { name: "Cá mập mini", rarity: "rare", tier: 3, price: 600, exp: 35, probability: 0.04, habitat: ["saltwater"], size: [70, 180] },
        { name: "Cá tầm", rarity: "rare", tier: 3, price: 500, exp: 28, probability: 0.045, habitat: ["freshwater"], size: [80, 200] },
        { name: "Cá cơm", rarity: "rare", tier: 3, price: 300, exp: 22, probability: 0.07, habitat: ["saltwater"], size: [35, 80] },
        { name: "Cá thu", rarity: "rare", tier: 3, price: 400, exp: 26, probability: 0.055, habitat: ["saltwater"], size: [45, 110] },

        // Epic Fish (Tier 4)
        { name: "Cá voi con", rarity: "epic", tier: 4, price: 1500, exp: 80, probability: 0.02, habitat: ["deep_ocean"], size: [200, 500] },
        { name: "Cá ngừ vây xanh", rarity: "epic", tier: 4, price: 2000, exp: 100, probability: 0.015, habitat: ["deep_ocean"], size: [150, 400] },
        { name: "Cá mập trắng", rarity: "epic", tier: 4, price: 2500, exp: 120, probability: 0.012, habitat: ["deep_ocean"], size: [300, 800] },
        { name: "Cá heo", rarity: "epic", tier: 4, price: 1800, exp: 90, probability: 0.018, habitat: ["saltwater"], size: [180, 350] },
        { name: "Cá ray điện", rarity: "epic", tier: 4, price: 2200, exp: 110, probability: 0.014, habitat: ["saltwater"], size: [100, 250] },
        { name: "Cá đuối khổng lồ", rarity: "epic", tier: 4, price: 2800, exp: 130, probability: 0.01, habitat: ["deep_ocean"], size: [250, 600] },

        // Legendary Fish (Tier 5)
        { name: "Rồng biển", rarity: "legendary", tier: 5, price: 8000, exp: 300, probability: 0.005, habitat: ["mythical_sea"], size: [500, 1200], isBoss: false },
        { name: "Phượng hoàng cá", rarity: "legendary", tier: 5, price: 12000, exp: 400, probability: 0.003, habitat: ["fire_realm"], size: [400, 1000], element: "fire" },
        { name: "Kỳ lân biển", rarity: "legendary", tier: 5, price: 15000, exp: 500, probability: 0.002, habitat: ["crystal_lake"], size: [350, 900], element: "light" },
        { name: "Cá thiên thần", rarity: "legendary", tier: 5, price: 20000, exp: 600, probability: 0.001, habitat: ["heaven_pool"], size: [300, 800], element: "holy" },
        { name: "Bạch long vương", rarity: "legendary", tier: 5, price: 25000, exp: 700, probability: 0.0008, habitat: ["dragon_palace"], size: [600, 1500] },

        // Mythical Fish (Tier 6) - Boss Fish
        { name: "Leviathan", rarity: "mythical", tier: 6, price: 50000, exp: 1500, probability: 0.0005, habitat: ["abyss"], size: [1000, 2500], isBoss: true },
        { name: "Kraken", rarity: "mythical", tier: 6, price: 60000, exp: 1800, probability: 0.0003, habitat: ["storm_sea"], size: [1200, 3000], isBoss: true },
        { name: "Cá rồng cổ đại", rarity: "mythical", tier: 6, price: 80000, exp: 2200, probability: 0.0002, habitat: ["dragon_realm"], size: [800, 2000], isBoss: true },
        { name: "Thủy quái Cthulhu", rarity: "mythical", tier: 6, price: 100000, exp: 2500, probability: 0.0001, habitat: ["void_sea"], size: [1500, 4000], isBoss: true },

        // Divine Fish (Tier 7)
        { name: "Thần cá Poseidon", rarity: "divine", tier: 7, price: 200000, exp: 5000, probability: 0.0001, habitat: ["divine_realm"], size: [2000, 5000] },
        { name: "Ma cá Lucifer", rarity: "divine", tier: 7, price: 250000, exp: 6000, probability: 0.00008, habitat: ["demon_realm"], size: [1800, 4500] },
        { name: "Thiên thần cá Seraphim", rarity: "divine", tier: 7, price: 300000, exp: 7000, probability: 0.00006, habitat: ["celestial_sea"], size: [1500, 4000] },

        // Cosmic Fish (Tier 8)
        { name: "Cá vũ trụ", rarity: "cosmic", tier: 8, price: 1000000, exp: 15000, probability: 0.00003, habitat: ["cosmic_void"], size: [3000, 8000] },
        { name: "Cá hắc lỗ", rarity: "cosmic", tier: 8, price: 1500000, exp: 20000, probability: 0.00002, habitat: ["black_hole"], size: [5000, 12000] },
        { name: "Cá neutron", rarity: "cosmic", tier: 8, price: 2000000, exp: 25000, probability: 0.00001, habitat: ["neutron_star"], size: [1000, 2500] },

        // Transcendent Fish (Tier 9)
        { name: "Cá siêu việt", rarity: "transcendent", tier: 9, price: 10000000, exp: 100000, probability: 0.000005, habitat: ["transcendent_realm"], size: [10000, 25000] },
        { name: "Cá thời gian", rarity: "transcendent", tier: 9, price: 15000000, exp: 150000, probability: 0.000003, habitat: ["time_stream"], size: [8000, 20000] },

        // Omnipotent Fish (Tier 10)
        { name: "Cá tối cao", rarity: "omnipotent", tier: 10, price: 100000000, exp: 1000000, probability: 0.000001, habitat: ["omnipotent_void"], size: [50000, 100000] },

        // Special Time-based Fish
        { name: "Cá ma đêm", rarity: "rare", tier: 3, price: 800, exp: 40, probability: 0.03, habitat: ["dark_waters"], timeRestriction: "night", size: [60, 150] },
        { name: "Cá bình minh", rarity: "epic", tier: 4, price: 3000, exp: 140, probability: 0.01, habitat: ["sunrise_lake"], timeRestriction: "dawn", size: [120, 300] },
        { name: "Cá hoàng hôn", rarity: "epic", tier: 4, price: 3500, exp: 150, probability: 0.008, habitat: ["sunset_bay"], timeRestriction: "dusk", size: [130, 320] },
        { name: "Cá giữa trưa", rarity: "uncommon", tier: 2, price: 150, exp: 12, probability: 0.1, habitat: ["sunny_pond"], timeRestriction: "noon", size: [25, 60] },

        // Seasonal Fish
        { name: "Cá hoa anh đào", rarity: "rare", tier: 3, price: 1000, exp: 45, probability: 0.02, habitat: ["spring_river"], season: "spring", size: [50, 120] },
        { name: "Cá mùa hè", rarity: "uncommon", tier: 2, price: 180, exp: 15, probability: 0.08, habitat: ["summer_beach"], season: "summer", size: [30, 70] },
        { name: "Cá lá vàng", rarity: "rare", tier: 3, price: 900, exp: 42, probability: 0.025, habitat: ["autumn_lake"], season: "autumn", size: [45, 110] },
        { name: "Cá băng giá", rarity: "epic", tier: 4, price: 2800, exp: 125, probability: 0.012, habitat: ["winter_sea"], season: "winter", size: [100, 280] },

        // Element Fish
        { name: "Cá lửa", rarity: "rare", tier: 3, price: 1200, exp: 50, probability: 0.015, habitat: ["lava_lake"], element: "fire", size: [80, 200] },
        { name: "Cá băng", rarity: "rare", tier: 3, price: 1100, exp: 48, probability: 0.016, habitat: ["ice_cave"], element: "ice", size: [75, 190] },
        { name: "Cá gió", rarity: "uncommon", tier: 2, price: 220, exp: 18, probability: 0.06, habitat: ["sky_pond"], element: "wind", size: [40, 100] },
        { name: "Cá đất", rarity: "uncommon", tier: 2, price: 190, exp: 16, probability: 0.07, habitat: ["earth_spring"], element: "earth", size: [35, 90] },
        { name: "Cá sét", rarity: "epic", tier: 4, price: 3200, exp: 135, probability: 0.01, habitat: ["thunder_lake"], element: "lightning", size: [110, 290] },

        // Event Fish
        { name: "Cá tết", rarity: "epic", tier: 4, price: 8888, exp: 200, probability: 0.005, habitat: ["festival_pond"], event: "lunar_new_year", size: [88, 188] },
        { name: "Cá Halloween", rarity: "rare", tier: 3, price: 666, exp: 31, probability: 0.031, habitat: ["spooky_swamp"], event: "halloween", size: [66, 166] },
        { name: "Cá Giáng sinh", rarity: "epic", tier: 4, price: 2500, exp: 100, probability: 0.025, habitat: ["snow_lake"], event: "christmas", size: [100, 250] },
        { name: "Cá Valentine", rarity: "rare", tier: 3, price: 1400, exp: 55, probability: 0.014, habitat: ["love_pond"], event: "valentine", size: [70, 170] }
    ],

    // Baits (30+ types)
    baits: [
        // Tier 1 - Basic Baits
        { name: "Mồi giun", tier: 1, price: 5, probability: 0.05, specialEffect: null, targetType: "common" },
        { name: "Mồi thường", tier: 1, price: 10, probability: 0.08, specialEffect: null, targetType: "all" },
        { name: "Mồi cào cào", tier: 1, price: 12, probability: 0.06, specialEffect: null, targetType: "freshwater" },
        { name: "Mồi tôm nhỏ", tier: 1, price: 15, probability: 0.07, specialEffect: null, targetType: "saltwater" },

        // Tier 2 - Advanced Baits
        { name: "Mồi cao cấp", tier: 2, price: 50, probability: 0.15, specialEffect: null, targetType: "uncommon" },
        { name: "Mồi tôm", tier: 2, price: 40, probability: 0.12, specialEffect: null, targetType: "saltwater" },
        { name: "Mồi cá con", tier: 2, price: 60, probability: 0.14, specialEffect: null, targetType: "predator" },
        { name: "Mồi côn trùng", tier: 2, price: 35, probability: 0.11, specialEffect: null, targetType: "freshwater" },
        { name: "Mồi nhân tạo", tier: 2, price: 80, probability: 0.16, specialEffect: "synthetic", targetType: "all" },

        // Tier 3 - Professional Baits
        { name: "Mồi đặc biệt", tier: 3, price: 200, probability: 0.25, specialEffect: null, targetType: "rare" },
        { name: "Mồi phát sáng", tier: 3, price: 250, probability: 0.2, specialEffect: "glow", targetType: "deep" },
        { name: "Mồi điện từ", tier: 3, price: 300, probability: 0.18, specialEffect: "magnetic", targetType: "electric" },
        { name: "Mồi huyết thanh", tier: 3, price: 400, probability: 0.22, specialEffect: "bloodScent", targetType: "predator" },
        { name: "Mồi pheromone", tier: 3, price: 350, probability: 0.23, specialEffect: "attract", targetType: "all" },

        // Tier 4 - Master Baits
        { name: "Mồi huyền thoại", tier: 4, price: 1000, probability: 0.4, specialEffect: "legendary", targetType: "legendary" },
        { name: "Mồi boss", tier: 4, price: 2000, probability: 0.1, specialEffect: "bossCall", targetType: "boss" },
        { name: "Mồi thời gian", tier: 4, price: 1500, probability: 0.3, specialEffect: "timeIgnore", targetType: "temporal" },
        { name: "Mồi nguyên tố", tier: 4, price: 1200, probability: 0.35, specialEffect: "elemental", targetType: "elemental" },

        // Tier 5 - Divine Baits
        { name: "Mồi thiên thần", tier: 5, price: 5000, probability: 0.6, specialEffect: "divine", targetType: "divine" },
        { name: "Mồi ác ma", tier: 5, price: 6000, probability: 0.55, specialEffect: "demonic", targetType: "demonic" },
        { name: "Mồi vũ trụ", tier: 5, price: 10000, probability: 0.7, specialEffect: "cosmic", targetType: "cosmic" },
        { name: "Mồi siêu việt", tier: 5, price: 25000, probability: 0.8, specialEffect: "transcendent", targetType: "transcendent" },

        // Special Event Baits
        { name: "Mồi lễ hội", tier: 3, price: 888, probability: 0.3, specialEffect: "festival", targetType: "event" },
        { name: "Mồi máu trăng", tier: 4, price: 3000, probability: 0.5, specialEffect: "bloodMoon", targetType: "vampire" },
        { name: "Mồi kim cương", tier: 5, price: 50000, probability: 1.0, specialEffect: "perfect", targetType: "all" },

        // Experimental Baits
        { name: "Mồi nano", tier: 4, price: 8000, probability: 0.45, specialEffect: "nano", targetType: "tech" },
        { name: "Mồi quantum", tier: 5, price: 15000, probability: 0.65, specialEffect: "quantum", targetType: "quantum" },
        { name: "Mồi vô cực", tier: 5, price: 100000, probability: 1.5, specialEffect: "infinity", targetType: "omnipotent" }
    ],

    // Boats (15 types)
    boats: [
        // Tier 1 - Basic Boats
        { name: "Thuyền gỗ", tier: 1, price: 0, speed: 1, capacity: 50, durability: 100, areas: ["river", "lake"], unlockLevel: 1 },
        { name: "Thuyền nan", tier: 1, price: 1500, speed: 1.2, capacity: 75, durability: 150, areas: ["river", "lake", "coast"], unlockLevel: 5 },
        { name: "Thuyền buồm", tier: 1, price: 3000, speed: 1.5, capacity: 100, durability: 180, areas: ["river", "lake", "coast"], unlockLevel: 8 },

        // Tier 2 - Motor Boats
        { name: "Xuồng máy", tier: 2, price: 8000, speed: 2, capacity: 150, durability: 250, areas: ["river", "lake", "coast", "sea"], unlockLevel: 12 },
        { name: "Tàu câu nhỏ", tier: 2, price: 20000, speed: 2.5, capacity: 250, durability: 350, areas: ["coast", "sea", "deep_sea"], unlockLevel: 18 },
        { name: "Tàu tuần tra", tier: 2, price: 35000, speed: 3, capacity: 300, durability: 400, areas: ["sea", "deep_sea"], unlockLevel: 22 },

        // Tier 3 - Professional Ships
        { name: "Tàu câu vừa", tier: 3, price: 80000, speed: 3.5, capacity: 500, durability: 600, areas: ["sea", "deep_sea", "ocean"], unlockLevel: 28 },
        { name: "Tàu thám hiểm", tier: 3, price: 150000, speed: 4, capacity: 750, durability: 800, areas: ["ocean", "storm_sea"], unlockLevel: 35 },
        { name: "Tàu câu lớn", tier: 3, price: 300000, speed: 4.5, capacity: 1000, durability: 1000, areas: ["ocean", "storm_sea", "abyss"], unlockLevel: 42 },

        // Tier 4 - Advanced Vessels
        { name: "Tàu ngầm", tier: 4, price: 800000, speed: 3, capacity: 800, durability: 1500, areas: ["deep_sea", "abyss", "trench"], unlockLevel: 50, specialEffect: "deepDive" },
        { name: "Du thuyền hoàng gia", tier: 4, price: 2000000, speed: 5, capacity: 2000, durability: 1200, areas: ["all"], unlockLevel: 60, specialEffect: "luxury" },
        { name: "Tàu chiến", tier: 4, price: 5000000, speed: 6, capacity: 1500, durability: 2000, areas: ["all"], unlockLevel: 70, specialEffect: "combat" },

        // Tier 5 - Mythical Ships
        { name: "Tàu ma", tier: 5, price: 15000000, speed: 8, capacity: 3000, durability: 2500, areas: ["all", "spirit_realm"], unlockLevel: 80, specialEffect: "ghostly" },
        { name: "Tàu vũ trụ", tier: 5, price: 50000000, speed: 10, capacity: 5000, durability: 5000, areas: ["cosmic"], unlockLevel: 90, specialEffect: "warp" },
        { name: "Tàu thời gian", tier: 5, price: 100000000, speed: 15, capacity: 10000, durability: 9999, areas: ["all", "temporal"], prestige: 1, specialEffect: "timeTravel" }
    ],

    // Locations (25+ areas)
    locations: [
        // Tier 1 - Beginner Areas (Level 1-15)
        {
            name: "Hồ làng nhỏ", tier: 1, unlockLevel: 1, difficulty: 1,
            fish: ["Cá bống", "Cá rô", "Cá thường"],
            specialFish: { name: "Cá koi mini", rarity: "uncommon", price: 150, exp: 8, chance: 0.05 },
            habitat: "freshwater", requiredBoat: "Thuyền gỗ", weather: ["sunny", "rainy"]
        },
        {
            name: "Suối núi", tier: 1, unlockLevel: 3, difficulty: 1,
            fish: ["Cá vược", "Cá thường", "Cá rô"],
            specialFish: { name: "Cá suối trong", rarity: "uncommon", price: 200, exp: 10, chance: 0.04 },
            habitat: "freshwater", requiredBoat: "Thuyền gỗ", weather: ["sunny", "misty"]
        },
        {
            name: "Ao sen", tier: 1, unlockLevel: 6, difficulty: 1,
            fish: ["Cá chép", "Cá bống", "Cá giữa trưa"],
            specialFish: { name: "Cá sen vàng", rarity: "rare", price: 400, exp: 18, chance: 0.02 },
            habitat: "freshwater", requiredBoat: "Thuyền nan", timeRestriction: "day"
        },
        {
            name: "Sông nhỏ", tier: 1, unlockLevel: 9, difficulty: 2,
            fish: ["Cá trê", "Cá lóc", "Cá chép"],
            specialFish: { name: "Cá sông cổ", rarity: "rare", price: 500, exp: 22, chance: 0.018 },
            habitat: "freshwater", requiredBoat: "Thuyền buồm"
        },

        // Tier 2 - Amateur Areas (Level 15-30)
        {
            name: "Sông lớn", tier: 2, unlockLevel: 12, difficulty: 2,
            fish: ["Cá trê", "Cá lóc", "Cá tầm", "Cá hồi"],
            specialFish: { name: "Cá tầm vàng", rarity: "rare", price: 800, exp: 35, chance: 0.015 },
            habitat: "freshwater", requiredBoat: "Xuồng máy", weather: ["rainy", "stormy"]
        },
        {
            name: "Đầm sen cổ", tier: 2, unlockLevel: 16, difficulty: 2,
            fish: ["Cá chép", "Cá hoa anh đào", "Cá lá vàng"],
            specialFish: { name: "Cá thiên nga", rarity: "epic", price: 1500, exp: 60, chance: 0.01 },
            habitat: "freshwater", requiredBoat: "Xuồng máy", season: "spring"
        },
        {
            name: "Hồ núi", tier: 2, unlockLevel: 20, difficulty: 3,
            fish: ["Cá trê", "Cá ma đêm", "Cá lóc"],
            specialFish: { name: "Rồng hồ", rarity: "epic", price: 2000, exp: 80, chance: 0.008 },
            habitat: "freshwater", requiredBoat: "Tàu câu nhỏ", timeRestriction: "night"
        },

        // Tier 3 - Professional Areas (Level 30-50)
        {
            name: "Biển ven bờ", tier: 3, unlockLevel: 25, difficulty: 3,
            fish: ["Cá diêu hồng", "Cá bơn", "Cá hồi", "Cá chuối"],
            specialFish: { name: "Cá heo bạc", rarity: "epic", price: 2500, exp: 100, chance: 0.012 },
            habitat: "saltwater", requiredBoat: "Tàu câu nhỏ", weather: ["sunny", "windy"]
        },
        {
            name: "Vịnh kỳ bí", tier: 3, unlockLevel: 30, difficulty: 4,
            fish: ["Cá ngừ", "Cá kiếm", "Cá ray điện"],
            specialFish: { name: "Hải tặc ma", rarity: "epic", price: 3500, exp: 140, chance: 0.008 },
            habitat: "saltwater", requiredBoat: "Tàu tuần tra", timeRestriction: "night"
        },
        {
            name: "Đảo hoang", tier: 3, unlockLevel: 35, difficulty: 4,
            fish: ["Cá mập mini", "Cá ngừ", "Cá heo"],
            specialFish: { name: "Vua cá mập", rarity: "legendary", price: 8000, exp: 300, chance: 0.005 },
            habitat: "saltwater", requiredBoat: "Tàu thám hiểm"
        },

        // Tier 4 - Expert Areas (Level 50-70)
        {
            name: "Đại dương sâu", tier: 4, unlockLevel: 45, difficulty: 5,
            fish: ["Cá voi con", "Cá ngừ vây xanh", "Cá mập trắng"],
            specialFish: { name: "Cá voi hoàng gia", rarity: "legendary", price: 15000, exp: 500, chance: 0.003 },
            habitat: "deep_ocean", requiredBoat: "Tàu câu vừa", weather: ["stormy"]
        },
        {
            name: "Vực sâu bí ẩn", tier: 4, unlockLevel: 50, difficulty: 6,
            fish: ["Cá đuối khổng lồ", "Cá mập trắng", "Rồng biển"],
            specialFish: { name: "Thủy quái cổ đại", rarity: "mythical", price: 25000, exp: 800, chance: 0.002 },
            habitat: "abyss", requiredBoat: "Tàu câu lớn"
        },
        {
            name: "Rãnh đại dương", tier: 4, unlockLevel: 55, difficulty: 7,
            fish: ["Cá voi con", "Leviathan", "Kraken"],
            specialFish: { name: "Chúa tể vực sâu", rarity: "mythical", price: 50000, exp: 1200, chance: 0.001 },
            habitat: "trench", requiredBoat: "Tàu ngầm"
        },

        // Tier 5 - Master Areas (Level 70-85)
        {
            name: "Biển lửa", tier: 5, unlockLevel: 60, difficulty: 7,
            fish: ["Cá lửa", "Phượng hoàng cá", "Cá sét"],
            specialFish: { name: "Chúa tể lửa", rarity: "divine", price: 100000, exp: 2500, chance: 0.0008 },
            habitat: "fire_realm", requiredBoat: "Du thuyền hoàng gia", element: "fire"
        },
        {
            name: "Băng cung", tier: 5, unlockLevel: 65, difficulty: 8,
            fish: ["Cá băng", "Cá băng giá", "Kỳ lân biển"],
            specialFish: { name: "Hoàng đế băng", rarity: "divine", price: 120000, exp: 3000, chance: 0.0006 },
            habitat: "ice_realm", requiredBoat: "Du thuyền hoàng gia", element: "ice"
        },
        {
            name: "Cung điện rồng", tier: 5, unlockLevel: 70, difficulty: 8,
            fish: ["Bạch long vương", "Cá rồng cổ đại", "Rồng biển"],
            specialFish: { name: "Ngũ long tổ", rarity: "divine", price: 200000, exp: 5000, chance: 0.0004 },
            habitat: "dragon_palace", requiredBoat: "Tàu chiến", element: "dragon"
        },

        // Tier 6 - Legendary Areas (Level 85-95)
        {
            name: "Thiên đường", tier: 6, unlockLevel: 75, difficulty: 9,
            fish: ["Cá thiên thần", "Thiên thần cá Seraphim"],
            specialFish: { name: "Thần biển tối cao", rarity: "cosmic", price: 500000, exp: 10000, chance: 0.0002 },
            habitat: "divine_realm", requiredBoat: "Tàu chiến", prestige: 1
        },
        {
            name: "Địa ngục", tier: 6, unlockLevel: 80, difficulty: 10,
            fish: ["Ma cá Lucifer", "Thủy quái Cthulhu"],
            specialFish: { name: "Ma vương biển", rarity: "cosmic", price: 600000, exp: 12000, chance: 0.0001 },
            habitat: "demon_realm", requiredBoat: "Tàu ma", prestige: 1
        },

        // Tier 7 - Mythical Areas (Level 95+)
        {
            name: "Không gian vũ trụ", tier: 7, unlockLevel: 85, difficulty: 12,
            fish: ["Cá vũ trụ", "Cá hắc lỗ", "Cá neutron"],
            specialFish: { name: "Thực thể vũ trụ", rarity: "transcendent", price: 2000000, exp: 50000, chance: 0.00005 },
            habitat: "cosmic_void", requiredBoat: "Tàu vũ trụ", prestige: 2
        },
        {
            name: "Dòng thời gian", tier: 8, unlockLevel: 90, difficulty: 15,
            fish: ["Cá thời gian", "Cá siêu việt"],
            specialFish: { name: "Chúa tể thời gian", rarity: "transcendent", price: 5000000, exp: 100000, chance: 0.00002 },
            habitat: "time_stream", requiredBoat: "Tàu thời gian", prestige: 3
        },
        {
            name: "Vực thẳm vô tận", tier: 9, unlockLevel: 95, difficulty: 20,
            fish: ["Cá tối cao"],
            specialFish: { name: "Đấng tối cao", rarity: "omnipotent", price: 50000000, exp: 1000000, chance: 0.000001 },
            habitat: "omnipotent_void", requiredBoat: "Tàu thời gian", prestige: 5
        },

        // Special Event Areas
        {
            name: "Đảo kho báu", tier: 3, unlockLevel: 25, difficulty: 4,
            fish: ["Cá vàng", "Cá bạc", "Cá ngọc trai"],
            specialFish: { name: "Rồng kho báu", rarity: "legendary", price: 25000, exp: 600, chance: 0.01 },
            habitat: "treasure_island", requiredBoat: "Tàu thám hiểm", event: "treasure_hunt"
        },
        {
            name: "Hồ máu", tier: 5, unlockLevel: 60, difficulty: 8,
            fish: ["Cá vampire", "Cá máu"],
            specialFish: { name: "Chúa tể ma cà rồng", rarity: "divine", price: 150000, exp: 4000, chance: 0.0005 },
            habitat: "blood_lake", requiredBoat: "Du thuyền hoàng gia", event: "blood_moon"
        }
    ],

    // Equipment categories
    equipment: {
        hats: [
            { name: "Mũ câu cá cơ bản", tier: 1, price: 500, effect: { type: "energyCost", value: -1 }, unlockLevel: 1 },
            { name: "Mũ may mắn", tier: 2, price: 2000, effect: { type: "luck", value: 0.1 }, unlockLevel: 10 },
            { name: "Mũ thợ săn", tier: 3, price: 8000, effect: { type: "rareFish", value: 0.05 }, unlockLevel: 20 },
            { name: "Mũ hoàng gia", tier: 4, price: 50000, effect: { type: "allBonus", value: 0.15 }, unlockLevel: 40 },
            { name: "Mũ thần thánh", tier: 5, price: 500000, effect: { type: "divine", value: 0.3 }, unlockLevel: 70 }
        ],
        clothes: [
            { name: "Áo câu cá cơ bản", tier: 1, price: 800, effect: { type: "maxEnergy", value: 20 }, unlockLevel: 1 },
            { name: "Áo thợ câu", tier: 2, price: 3000, effect: { type: "energyRegen", value: 0.2 }, unlockLevel: 12 },
            { name: "Áo săn cá", tier: 3, price: 12000, effect: { type: "fishValue", value: 0.15 }, unlockLevel: 25 },
            { name: "Áo hoàng gia", tier: 4, price: 80000, effect: { type: "expBonus", value: 0.25 }, unlockLevel: 45 },
            { name: "Áo thần thánh", tier: 5, price: 800000, effect: { type: "immunity", value: 1 }, unlockLevel: 75 }
        ],
        boots: [
            { name: "Giày câu cá cơ bản", tier: 1, price: 600, effect: { type: "moveSpeed", value: 1 }, unlockLevel: 1 },
            { name: "Giày chống nước", tier: 2, price: 2500, effect: { type: "waterWalk", value: 1 }, unlockLevel: 15 },
            { name: "Giày thần tốc", tier: 3, price: 15000, effect: { type: "instantMove", value: 0.1 }, unlockLevel: 30 },
            { name: "Giày bay", tier: 4, price: 100000, effect: { type: "flight", value: 1 }, unlockLevel: 50 },
            { name: "Giày thần thánh", tier: 5, price: 1000000, effect: { type: "teleport", value: 1 }, unlockLevel: 80 }
        ]
    },

    // Pets (20 pets)
    pets: [
        // Tier 1 - Basic Pets
        { name: "Mèo câu cá", tier: 1, price: 5000, gems: 10, ability: "fishFinder", bonus: 0.1, unlockLevel: 10 },
        { name: "Chó biển", tier: 1, price: 6000, gems: 12, ability: "energySaver", bonus: 0.15, unlockLevel: 12 },
        { name: "Rùa may mắn", tier: 1, price: 8000, gems: 15, ability: "luckBoost", bonus: 0.2, unlockLevel: 15 },

        // Tier 2 - Uncommon Pets
        { name: "Cua hoàng gia", tier: 2, price: 25000, gems: 50, ability: "treasureHunt", bonus: 0.25, unlockLevel: 25 },
        { name: "Bạch tuộc thông minh", tier: 2, price: 30000, gems: 60, ability: "multiCatch", bonus: 0.15, unlockLevel: 28 },
        { name: "Cá heo vàng", tier: 2, price: 50000, gems: 100, ability: "rareFishGuide", bonus: 0.3, unlockLevel: 32 },
        { name: "Hải âu thông minh", tier: 2, price: 35000, gems: 70, ability: "weatherPredict", bonus: 0.2, unlockLevel: 30 },

        // Tier 3 - Rare Pets
        { name: "Rồng biển mini", tier: 3, price: 200000, gems: 300, ability: "dragonBreath", bonus: 0.5, unlockLevel: 45 },
        { name: "Phượng hoàng nước", tier: 3, price: 300000, gems: 400, ability: "rebirth", bonus: 1.0, unlockLevel: 50 },
        { name: "Kỳ lân biển", tier: 3, price: 500000, gems: 500, ability: "purification", bonus: 0.8, unlockLevel: 55 },
        { name: "Hổ cá", tier: 3, price: 400000, gems: 350, ability: "predatorInstinct", bonus: 0.6, unlockLevel: 48 },

        // Tier 4 - Epic Pets
        { name: "Thiên thần cá", tier: 4, price: 1000000, gems: 800, ability: "divineBlessing", bonus: 1.2, unlockLevel: 65 },
        { name: "Ác ma biển", tier: 4, price: 1200000, gems: 1000, ability: "demonicPact", bonus: 1.5, unlockLevel: 70 },
        { name: "Sphinx biển", tier: 4, price: 1500000, gems: 1200, ability: "ancientWisdom", bonus: 1.8, unlockLevel: 75 },

        // Tier 5 - Legendary Pets
        { name: "Rồng vũ trụ", tier: 5, price: 5000000, gems: 2000, ability: "cosmicPower", bonus: 2.5, unlockLevel: 85 },
        { name: "Thần biển", tier: 5, price: 10000000, gems: 3000, ability: "seaGodBlessing", bonus: 3.0, unlockLevel: 90 },
        { name: "Thời gian rồng", tier: 5, price: 25000000, gems: 5000, ability: "timeManipulation", bonus: 5.0, prestige: 1 },

        // Special Event Pets
        { name: "Cá vàng may mắn", tier: 2, price: 88888, gems: 188, ability: "festival", bonus: 0.88, event: "lunar_new_year" },
        { name: "Ma cà rồng cá", tier: 3, price: 666666, gems: 666, ability: "bloodMoon", bonus: 1.3, event: "halloween" },
        { name: "Tuần lộc biển", tier: 2, price: 250000, gems: 250, ability: "christmas", bonus: 0.25, event: "christmas" }
    ]
};

// Utility Functions
function initializeDirectories() {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir);
    }
}

function loadData(filePath, defaultData = {}) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 4));
            return defaultData;
        }
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error(`Error loading data from ${filePath}:`, error);
        return defaultData;
    }
}

async function saveDataAsync(filePath, data) {
    try {
        const fs = require("fs-extra");
        await fs.writeFile(filePath, JSON.stringify(data, null, 4));
        return true;
    } catch (error) {
        console.error(`Error saving data to ${filePath}:`, error);
        return false;
    }
}

function saveData(filePath, data) {
    try {
        const fs = require("fs-extra");
        fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
        return true;
    } catch (error) {
        console.error(`Error saving data to ${filePath}:`, error);
        // Try to save to backup location
        try {
            const backupPath = filePath + '.backup';
            fs.writeFileSync(backupPath, JSON.stringify(data, null, 4));
            console.log(`Data saved to backup: ${backupPath}`);
            return true;
        } catch (backupError) {
            console.error(`Failed to save backup:`, backupError);
            return false;
        }
    }
}

function getPlayerData(senderID) {
    try {
        if (!senderID || typeof senderID !== 'string') {
            throw new Error('Invalid senderID');
        }

        const allData = loadData(pathData, {});
        if (!allData[senderID]) {
            allData[senderID] = JSON.parse(JSON.stringify(defaultPlayerData));
            // Initialize required arrays/objects
            if (!allData[senderID].inventory) allData[senderID].inventory = [];
            if (!allData[senderID].fishCollection) allData[senderID].fishCollection = [];
            if (!allData[senderID].pets) allData[senderID].pets = [];
            if (!allData[senderID].materialStorage) allData[senderID].materialStorage = {};
            if (!allData[senderID].stats) allData[senderID].stats = defaultPlayerData.stats;

            saveData(pathData, allData);
        }
        return allData;
    } catch (error) {
        console.error('Error in getPlayerData:', error);
        return {};
    }
}

function calculateLevel(exp) {
    // Validate input
    if (typeof exp !== 'number' || exp < 0 || !isFinite(exp)) {
        return 1;
    }

    return Math.floor(Math.sqrt(exp / GAME_CONFIG.EXP_BASE)) + 1;
}

function calculateExpForNextLevel(level) {
    return (level * level) * GAME_CONFIG.EXP_BASE;
}

function getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 7) return "dawn";
    if (hour >= 11 && hour < 13) return "noon";
    if (hour >= 18 && hour < 20) return "dusk";
    if (hour >= 22 || hour < 5) return "night";
    return "day";
}

function getSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "autumn";
    return "winter";
}

function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
}

function getRarityEmoji(rarity) {
    const emojis = {
        "common": "⚪",
        "uncommon": "🟢",
        "rare": "🔵",
        "epic": "🟣",
        "legendary": "🟡",
        "mythical": "🔴",
        "divine": "⭐",
        "cosmic": "🌌",
        "transcendent": "✨",
        "omnipotent": "👑"
    };
    return emojis[rarity] || "⚪";
}

function recoverEnergy(player) {
    const currentTime = Date.now();
    const timeDiff = currentTime - (player.lastRecoveryTime || currentTime);
    const energyToRecover = Math.floor(timeDiff / GAME_CONFIG.ENERGY_RECOVERY_RATE);

    if (energyToRecover > 0 && player.energy < player.maxEnergy) {
        player.energy = Math.min(player.energy + energyToRecover, player.maxEnergy);
        player.lastRecoveryTime = currentTime;
        return energyToRecover;
    }

    return 0;
}

// Auto-Fishing System
function startAutoFishing(api, event, userData, senderID, duration) {
    const player = userData[senderID];

    if (player.autoFishing) {
        return api.sendMessage(`⚠️ Bạn đã đang câu tự động rồi! Dùng "fishing autostop" để dừng.`, event.threadID);
    }

    // Set duration (default or user-specified)
    const autoFishDuration = duration ? parseInt(duration) * 60000 : AUTO_FISHING_CONFIG.AUTO_FISHING_DURATION;

    // Initialize auto fishing
    player.autoFishing = true;
    player.autoFishingEndTime = Date.now() + autoFishDuration;

    saveData(pathData, userData);

    // Send confirmation
    api.sendMessage(
        `🤖 **BẬT CÂU TỰ ĐỘNG**\n\n` +
        `⏱️ Thời gian: ${autoFishDuration / 60000} phút\n` +
        `⏰ Kết thúc lúc: ${new Date(player.autoFishingEndTime).toLocaleTimeString()}\n` +
        `🎣 Tần suất: ${AUTO_FISHING_CONFIG.AUTO_FISHING_INTERVAL / 1000}s/lần\n` +
        `⚡ Tiêu hao năng lượng: Bình thường\n` +
        `🎯 Tỉ lệ thành công: ${Math.round(AUTO_FISHING_CONFIG.AUTO_FISHING_SUCCESS_PENALTY * 100)}% bình thường\n\n` +
        `💡 Dùng "fishing autostop" để dừng.`,
        event.threadID
    );

    // Start auto fishing loop
    autoFishingLoop(api, event, userData, senderID);
}

function autoFishingLoop(api, event, userData, senderID) {
    const player = userData[senderID];

    // Check if auto fishing is still active
    if (!player || !player.autoFishing || Date.now() >= player.autoFishingEndTime) {
        if (player) {
            player.autoFishing = false;
            player.autoFishingEndTime = 0;
            cleanupTimeouts(player); // Cleanup all timeouts
            saveData(pathData, userData);
        }
        return api.sendMessage(`🤖 Đã kết thúc câu tự động!`, event.threadID);
    }

    // Perform auto fishing with error handling
    try {
        performAutoFishing(api, event, userData, senderID);
    } catch (error) {
        console.error("Auto fishing error:", error);
        player.autoFishing = false;
        cleanupTimeouts(player);
        return api.sendMessage(`❌ Lỗi auto fishing!`, event.threadID);
    }

    // Schedule next auto fishing attempt with safety check
    const timeoutId = setTimeout(() => {
        const currentUserData = getPlayerData(senderID);
        const currentPlayer = currentUserData[senderID];

        if (currentPlayer && currentPlayer.autoFishing) {
            autoFishingLoop(api, event, currentUserData, senderID);
        }
    }, AUTO_FISHING_CONFIG.AUTO_FISHING_INTERVAL);

    // Store timeout ID for potential cleanup
    if (!player.timeouts) player.timeouts = [];
    player.timeouts.push(timeoutId);
}

function stopAutoFishing(api, event, userData, senderID) {
    const player = userData[senderID];

    if (!player.autoFishing) {
        return api.sendMessage(`⚠️ Bạn không đang câu tự động!`, event.threadID);
    }

    player.autoFishing = false;
    player.autoFishingEndTime = 0;

    saveData(pathData, userData);

    return api.sendMessage(`🤖 Đã dừng câu tự động!`, event.threadID);
}

function performAutoFishing(api, event, userData, senderID) {
    const player = userData[senderID];
    const currentTime = Date.now();

    // Recover energy
    recoverEnergy(player);

    // Check energy
    if (player.energy < 1) {
        api.sendMessage(`⚡ Hết năng lượng! Không thể tiếp tục câu tự động.`, event.threadID);
        player.autoFishing = false;
        player.autoFishingEndTime = 0;
        saveData(pathData, userData);
        return;
    }

    // Get current rod and location
    const rod = gameData.rods.find(r => r.name === player.rod);
    const location = gameData.locations.find(l => l.name === player.currentLocation);

    if (!rod || !location) {
        api.sendMessage(`❌ Lỗi dữ liệu cần câu hoặc địa điểm!`, event.threadID);
        player.autoFishing = false;
        player.autoFishingEndTime = 0;
        saveData(pathData, userData);
        return;
    }

    // Calculate fishing success rate with auto penalty
    let successRate = rod.probability * AUTO_FISHING_CONFIG.AUTO_FISHING_SUCCESS_PENALTY;
    let energyCost = rod.energyCost;

    // Apply equipment bonuses
    successRate = applyEquipmentBonuses(player, successRate, 'probability');
    energyCost = Math.max(1, applyEquipmentBonuses(player, energyCost, 'energyCost'));

    // Apply pet bonuses
    if (player.activePet) {
        const pet = gameData.pets.find(p => p.name === player.activePet);
        if (pet) {
            if (pet.ability === "fishFinder") successRate += pet.bonus;
            if (pet.ability === "energySaver") energyCost = Math.max(1, energyCost * (1 - pet.bonus));
        }
    }

    // Consume energy
    player.energy -= energyCost;
    player.lastFishing = currentTime;

    // Fishing attempt
    const success = Math.random() < successRate;

    if (!success) {
        // Failed fishing - just save data without notification
        player.stats.streak = 0;
        saveData(pathData, userData);
        return;
    }

    // Successful fishing - select fish
    const caughtFish = selectFishFromLocation(location, player);

    if (!caughtFish) {
        saveData(pathData, userData);
        return;
    }

    // Generate fish size
    const fishSize = Math.floor(Math.random() * (caughtFish.size[1] - caughtFish.size[0] + 1)) + caughtFish.size[0];

    // Calculate final price and exp based on size
    const sizeMultiplier = 1 + (fishSize - caughtFish.size[0]) / (caughtFish.size[1] - caughtFish.size[0]) * 0.5;
    const finalPrice = Math.floor(caughtFish.price * sizeMultiplier);
    let finalExp = Math.floor(caughtFish.exp * sizeMultiplier);

    // Apply equipment bonuses to exp
    finalExp = Math.floor(applyEquipmentBonuses(player, finalExp, 'exp'));

    // Add to inventory
    const fishItem = {
        name: caughtFish.name,
        rarity: caughtFish.rarity,
        tier: caughtFish.tier,
        price: finalPrice,
        size: fishSize,
        caughtAt: currentTime,
        location: player.currentLocation
    };

    player.inventory.push(fishItem);

    // Update collection
    if (!player.fishCollection.includes(caughtFish.name)) {
        player.fishCollection.push(caughtFish.name);
    }

    // Update stats
    player.exp += finalExp;
    player.stats.totalFishCaught++;
    player.stats.streak++;
    player.stats.maxStreak = Math.max(player.stats.maxStreak, player.stats.streak);

    if (["rare", "epic", "legendary", "mythical", "divine", "cosmic", "transcendent", "omnipotent"].includes(caughtFish.rarity)) {
        player.stats.rareFishCaught++;
    }

    if (caughtFish.isBoss) {
        player.stats.bossesDefeated++;
    }

    // Check for level up
    const newLevel = calculateLevel(player.exp);
    if (newLevel > player.level) {
        player.level = newLevel;
        player.maxEnergy += 10;
        player.energy = player.maxEnergy; // Full energy on level up

        // Send level up notification
        api.sendMessage(
            `🎉 **AUTO FISHING - LEVEL UP!**\n` +
            `⭐ Đã lên cấp ${newLevel}!\n` +
            `⚡ Năng lượng đã hồi phục đầy!`,
            event.threadID
        );
    }

    // Check for materials drop
    const materials = checkMaterialDrop(caughtFish, player);
    if (materials.length > 0) {
        materials.forEach(material => {
            if (!player.materialStorage[material]) {
                player.materialStorage[material] = 0;
            }
            player.materialStorage[material]++;
        });
    }

    // Add tournament score if tournament is active
    if (isTournamentActive() && player.tournamentJoined) {
        const tournamentPoints = calculateTournamentPoints(caughtFish);
        player.tournamentScore += tournamentPoints;
    }

    // Auto-sell if enabled
    if (player.preferences.autoSell) {
        player.money += finalPrice;
        player.stats.totalMoneyEarned += finalPrice;
        player.inventory.pop(); // Remove the fish we just added
    }

    // Send notification for rare catches only
    if (["legendary", "mythical", "divine", "cosmic", "transcendent", "omnipotent"].includes(caughtFish.rarity)) {
        api.sendMessage(
            `🎣 **AUTO FISHING - CÁ HIẾM!**\n` +
            `${getRarityEmoji(caughtFish.rarity)} Đã câu được **${caughtFish.name}** (${caughtFish.rarity})\n` +
            `📏 Kích thước: ${fishSize}cm\n` +
            `💰 Giá trị: ${formatNumber(finalPrice)} xu\n` +
            `⭐ Kinh nghiệm: +${formatNumber(finalExp)}`,
            event.threadID
        );
    }

    // Save data
    saveData(pathData, userData);
}

// AFK Fishing System
function startAFKFishing(api, event, userData, senderID) {
    const player = userData[senderID];

    if (player.afkFishing) {
        return api.sendMessage(`⚠️ Bạn đã đang treo câu rồi! Dùng "fishing afkstop" để dừng.`, event.threadID);
    }

    if (player.autoFishing) {
        return api.sendMessage(`⚠️ Bạn đang câu tự động! Hãy dừng trước khi bắt đầu treo câu.`, event.threadID);
    }

    // Initialize AFK fishing
    player.afkFishing = true;
    player.afkFishingStartTime = Date.now();

    saveData(pathData, userData);

    // Send confirmation
    api.sendMessage(
        `🎣 **BẮT ĐẦU TREO CÂU**\n\n` +
        `⏱️ Bắt đầu lúc: ${new Date(player.afkFishingStartTime).toLocaleTimeString()}\n` +
        `🎣 Tần suất: ${AUTO_FISHING_CONFIG.AFK_FISHING_INTERVAL / 60000} phút/lần\n` +
        `⚡ Tiêu hao năng lượng: ${AUTO_FISHING_CONFIG.AFK_FISHING_ENERGY_DISCOUNT * 100}% bình thường\n` +
        `🎯 Tỉ lệ thành công: ${Math.round(AUTO_FISHING_CONFIG.AFK_FISHING_SUCCESS_PENALTY * 100)}% bình thường\n\n` +
        `💡 Dùng "fishing afkstop" để dừng và nhận kết quả.\n` +
        `💡 Treo câu sẽ cho bạn ít cá hơn nhưng tiết kiệm năng lượng.\n` +
        `💡 Một số loại cá đặc biệt chỉ xuất hiện khi treo câu!`,
        event.threadID
    );
}

function stopAFKFishing(api, event, userData, senderID) {
    const player = userData[senderID];

    if (!player.afkFishing) {
        return api.sendMessage(`⚠️ Bạn không đang treo câu!`, event.threadID);
    }

    const afkFishingDuration = Date.now() - player.afkFishingStartTime;
    const hours = Math.floor(afkFishingDuration / (60 * 60 * 1000));
    const minutes = Math.floor((afkFishingDuration % (60 * 60 * 1000)) / (60 * 1000));

    // Calculate how many fishing attempts were made
    const attempts = Math.floor(afkFishingDuration / AUTO_FISHING_CONFIG.AFK_FISHING_INTERVAL);

    // Process AFK fishing results
    const results = processAFKFishingResults(player, attempts);

    // Reset AFK fishing state
    player.afkFishing = false;
    player.afkFishingStartTime = 0;

    // Recover energy
    recoverEnergy(player);

    // Check for level up
    const newLevel = calculateLevel(player.exp);
    if (newLevel > player.level) {
        player.level = newLevel;
        player.maxEnergy += 10;

        // Don't restore energy fully - AFK fishing is meant to be less efficient
        player.energy = Math.min(player.energy + 20, player.maxEnergy);
    }

    saveData(pathData, userData);

    // Format result message
    let message = `🎣 **KẾT QUẢ TREO CÂU**\n\n`;
    message += `⏱️ Thời gian: ${hours}h ${minutes}m\n`;
    message += `🎣 Số lần câu: ${attempts}\n`;
    message += `🐟 Cá bắt được: ${results.totalCaught} con\n`;
    message += `💰 Tổng giá trị: ${formatNumber(results.totalValue)} xu\n`;
    message += `⭐ EXP: +${formatNumber(results.totalExp)}\n`;

    if (results.rareFish > 0) {
        message += `🌟 Cá hiếm: ${results.rareFish} con\n`;
    }

    if (results.materials.length > 0) {
        message += `🧰 Nguyên liệu: ${results.materials.join(", ")}\n`;
    }

    if (results.specialCatch) {
        message += `\n✨ **Đặc biệt:** Bắt được ${results.specialCatch.name}!\n`;
    }

    message += `\n⚡ Năng lượng: ${player.energy}/${player.maxEnergy}`;

    return api.sendMessage(message, event.threadID);
}

function processAFKFishingResults(player, attempts) {
    // Get current rod and location
    const rod = gameData.rods.find(r => r.name === player.rod);
    const location = gameData.locations.find(l => l.name === player.currentLocation);

    let totalCaught = 0;
    let totalValue = 0;
    let totalExp = 0;
    let rareFish = 0;
    let specialCatch = null;
    const materials = [];

    // Calculate base success rate with AFK penalty
    let successRate = rod.probability * AUTO_FISHING_CONFIG.AFK_FISHING_SUCCESS_PENALTY;
    let energyCost = Math.max(1, rod.energyCost * AUTO_FISHING_CONFIG.AFK_FISHING_ENERGY_DISCOUNT);

    // Apply equipment and pet bonuses
    successRate = applyEquipmentBonuses(player, successRate, 'probability');
    energyCost = Math.max(1, applyEquipmentBonuses(player, energyCost, 'energyCost'));

    // Process each attempt
    for (let i = 0; i < attempts; i++) {
        // Check if we have enough energy
        if (player.energy < energyCost) {
            break;
        }

        // Consume energy
        player.energy -= energyCost;

        // Fishing attempt
        const success = Math.random() < successRate;

        if (success) {
            // Select fish
            const caughtFish = selectFishFromLocation(location, player);

            if (caughtFish) {
                // Generate fish size
                const fishSize = Math.floor(Math.random() * (caughtFish.size[1] - caughtFish.size[0] + 1)) + caughtFish.size[0];

                // Calculate price and exp
                const sizeMultiplier = 1 + (fishSize - caughtFish.size[0]) / (caughtFish.size[1] - caughtFish.size[0]) * 0.5;
                const finalPrice = Math.floor(caughtFish.price * sizeMultiplier);
                const finalExp = Math.floor(caughtFish.exp * sizeMultiplier);

                // Add to inventory
                const fishItem = {
                    name: caughtFish.name,
                    rarity: caughtFish.rarity,
                    tier: caughtFish.tier,
                    price: finalPrice,
                    size: fishSize,
                    caughtAt: Date.now(),
                    location: player.currentLocation
                };

                player.inventory.push(fishItem);

                // Update collection
                if (!player.fishCollection.includes(caughtFish.name)) {
                    player.fishCollection.push(caughtFish.name);
                }

                // Update stats
                totalCaught++;
                totalValue += finalPrice;
                totalExp += finalExp;
                player.exp += finalExp;
                player.stats.totalFishCaught++;

                if (["rare", "epic", "legendary", "mythical", "divine", "cosmic", "transcendent", "omnipotent"].includes(caughtFish.rarity)) {
                    rareFish++;
                    player.stats.rareFishCaught++;
                }

                // Check for materials
                const fishMaterials = checkMaterialDrop(caughtFish, player);
                if (fishMaterials.length > 0) {
                    materials.push(...fishMaterials);
                    fishMaterials.forEach(material => {
                        if (!player.materialStorage[material]) {
                            player.materialStorage[material] = 0;
                        }
                        player.materialStorage[material]++;
                    });
                }

                // Special catch (highest rarity/value)
                if (!specialCatch || (caughtFish.tier > specialCatch.tier)) {
                    specialCatch = {
                        name: caughtFish.name,
                        rarity: caughtFish.rarity,
                        size: fishSize,
                        value: finalPrice
                    };
                }
            }
        }
    }

    // Apply tournament points if active
    if (isTournamentActive() && player.tournamentJoined) {
        const tournamentPoints = Math.floor(totalExp / 10); // Simplified tournament points for AFK fishing
        player.tournamentScore += tournamentPoints;
    }

    // Auto-sell if enabled
    if (player.preferences.autoSell) {
        player.money += totalValue;
        player.stats.totalMoneyEarned += totalValue;
        // Remove all fish from this session
        player.inventory = player.inventory.slice(0, player.inventory.length - totalCaught);
    }

    return {
        totalCaught,
        totalValue,
        totalExp,
        rareFish,
        materials: [...new Set(materials)], // Remove duplicates
        specialCatch
    };
}

// Tournament System
function startTournament(api, event, userData) {
    const globalData = loadData(pathGlobalData, {});

    if (globalData.tournamentActive) {
        return api.sendMessage(`⚠️ Đã có giải đấu đang diễn ra! Kết thúc lúc: ${new Date(globalData.tournamentEndTime).toLocaleString()}`, event.threadID);
    }

    // Set up tournament
    const endTime = Date.now() + AUTO_FISHING_CONFIG.TOURNAMENT_DURATION;

    globalData.tournamentActive = true;
    globalData.tournamentEndTime = endTime;
    globalData.tournamentTheme = generateTournamentTheme();
    globalData.tournamentParticipants = {};

    saveData(pathGlobalData, globalData);

    // Announce tournament
    api.sendMessage(
        `🏆 **GIẢI ĐẤU CÂU CÁ ĐÃ BẮT ĐẦU!**\n\n` +
        `🎯 Chủ đề: ${globalData.tournamentTheme.name}\n` +
        `📝 Mô tả: ${globalData.tournamentTheme.description}\n` +
        `⏱️ Thời gian: 24 giờ (kết thúc lúc ${new Date(endTime).toLocaleString()})\n\n` +
        `🏅 **Phần thưởng:**\n` +
        `🥇 Hạng 1: 100,000 xu + 50 gems + Cần câu quán quân\n` +
        `🥈 Hạng 2: 50,000 xu + 30 gems\n` +
        `🥉 Hạng 3: 25,000 xu + 15 gems\n` +
        `🎖️ Top 10: 10,000 xu + 5 gems\n\n` +
        `💡 Dùng "fishing tournament join" để tham gia!`,
        event.threadID
    );

    // Schedule tournament end
    setTimeout(() => {
        endTournament(api, event, userData);
    }, AUTO_FISHING_CONFIG.TOURNAMENT_DURATION);
}

function joinTournament(api, event, userData, senderID) {
    const player = userData[senderID];
    const globalData = loadData(pathGlobalData, {});

    if (!globalData.tournamentActive) {
        return api.sendMessage(`⚠️ Không có giải đấu nào đang diễn ra! Hãy chờ giải đấu tiếp theo.`, event.threadID);
    }

    if (player.tournamentJoined) {
        return api.sendMessage(`⚠️ Bạn đã tham gia giải đấu rồi! Điểm hiện tại: ${player.tournamentScore}`, event.threadID);
    }

    // Join tournament
    player.tournamentJoined = true;
    player.tournamentScore = 0;

    // Add to global tournament data
    globalData.tournamentParticipants[senderID] = {
        id: senderID,
        name: player.name,
        score: 0
    };

    saveData(pathData, userData);
    saveData(pathGlobalData, globalData);

    return api.sendMessage(
        `✅ Đã tham gia giải đấu ${globalData.tournamentTheme.name}!\n` +
        `🎯 Hãy câu cá để ghi điểm. Điểm sẽ dựa trên:\n` +
        `   - Giá trị và độ hiếm của cá\n` +
        `   - Kích thước của cá\n` +
        `   - Thành tích câu liên tiếp\n\n` +
        `💡 Dùng "fishing tournament status" để xem thứ hạng hiện tại.`,
        event.threadID
    );
}

function endTournament(api, event, userData) {
    const globalData = loadData(pathGlobalData, {});

    if (!globalData.tournamentActive) {
        return;
    }

    // Update all participants' scores from their individual data
    const allPlayerData = loadData(pathData, {});

    for (const id in globalData.tournamentParticipants) {
        if (allPlayerData[id] && allPlayerData[id].tournamentScore) {
            globalData.tournamentParticipants[id].score = allPlayerData[id].tournamentScore;
        }
    }

    // Sort participants by score
    const sortedParticipants = Object.values(globalData.tournamentParticipants)
        .sort((a, b) => b.score - a.score);

    // Assign rewards
    for (let i = 0; i < sortedParticipants.length; i++) {
        const participant = sortedParticipants[i];

        if (allPlayerData[participant.id]) {
            const player = allPlayerData[participant.id];
            player.tournamentJoined = false;

            if (i === 0) { // First place
                player.money += 100000;
                player.gems += 50;
                // Give champion rod if they don't have it
                if (!player.rod.includes("Cần câu quán quân")) {
                    player.rod = "Cần câu quán quân";
                }
                player.lastTournamentReward = 1;
            } else if (i === 1) { // Second place
                player.money += 50000;
                player.gems += 30;
                player.lastTournamentReward = 2;
            } else if (i === 2) { // Third place
                player.money += 25000;
                player.gems += 15;
                player.lastTournamentReward = 3;
            } else if (i < 10) { // Top 10
                player.money += 10000;
                player.gems += 5;
                player.lastTournamentReward = 10;
            } else { // Participation reward
                player.money += 2000;
                player.lastTournamentReward = 0;
            }
        }
    }

    // Save all player data
    saveData(pathData, allPlayerData);

    // Create results message
    let resultsMessage = `🏆 **KẾT QUẢ GIẢI ĐẤU CÂU CÁ**\n\n`;
    resultsMessage += `🎯 Chủ đề: ${globalData.tournamentTheme.name}\n`;
    resultsMessage += `👥 Số người tham gia: ${sortedParticipants.length}\n\n`;

    if (sortedParticipants.length > 0) {
        resultsMessage += `🏅 **TOP 10:**\n`;

        for (let i = 0; i < Math.min(10, sortedParticipants.length); i++) {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
            resultsMessage += `${medal} ${sortedParticipants[i].name}: ${formatNumber(sortedParticipants[i].score)} điểm\n`;
        }
    } else {
        resultsMessage += `😥 Không có người tham gia nào!`;
    }

    // Reset tournament data
    globalData.tournamentActive = false;
    globalData.tournamentEndTime = 0;
    globalData.tournamentParticipants = {};

    saveData(pathGlobalData, globalData);

    // Send results message
    api.sendMessage(resultsMessage, event.threadID);
}

function generateTournamentTheme() {
    const themes = [
        {
            name: "Săn Cá Hiếm",
            description: "Giải đấu tập trung vào việc bắt được nhiều cá hiếm nhất có thể. Cá càng hiếm, điểm càng cao!"
        },
        {
            name: "Đại Dương Sâu",
            description: "Khám phá vùng nước sâu và bắt được những loài cá lớn nhất. Kích thước sẽ quyết định điểm số!"
        },
        {
            name: "Vua Câu Cá",
            description: "Giải đấu toàn diện - tổng hợp điểm dựa trên số lượng, chất lượng và giá trị của cá."
        },
        {
            name: "Nhiệt Đới",
            description: "Săn tìm các loài cá nhiệt đới đầy màu sắc. Các loại cá có nguồn gốc từ vùng biển nhiệt đới sẽ có điểm cao hơn!"
        },
        {
            name: "Thách Thức Mùa Đông",
            description: "Câu cá trong điều kiện khắc nghiệt của mùa đông. Cá có nguồn gốc từ vùng nước lạnh sẽ được cộng điểm."
        }
    ];

    return themes[Math.floor(Math.random() * themes.length)];
}

function calculateTournamentPoints(fish) {
    // Base points from fish value and rarity
    let points = 0;

    // Points based on rarity
    const rarityPoints = {
        "common": 1,
        "uncommon": 2,
        "rare": 5,
        "epic": 10,
        "legendary": 20,
        "mythical": 50,
        "divine": 100,
        "cosmic": 200,
        "transcendent": 500,
        "omnipotent": 1000
    };

    points += rarityPoints[fish.rarity] || 1;

    // Points based on fish value
    points += Math.floor(fish.price / 100);

    // Bonus for boss fish
    if (fish.isBoss) {
        points *= 2;
    }

    // Check if fish matches tournament theme (would need to implement)
    const globalData = loadData(pathGlobalData, {});
    if (globalData.tournamentActive && globalData.tournamentTheme) {
        // Example: If theme is about deep sea and fish is from deep ocean
        if (globalData.tournamentTheme.name === "Đại Dương Sâu" && fish.habitat.includes("deep_ocean")) {
            points *= 1.5;
        }
        // More theme checks can be added
    }

    return Math.floor(points);
}

function isTournamentActive() {
    const globalData = loadData(pathGlobalData, {});
    return globalData.tournamentActive && Date.now() < globalData.tournamentEndTime;
}

function getTournamentStatus(api, event, userData, senderID) {
    const globalData = loadData(pathGlobalData, {});
    const player = userData[senderID];

    if (!globalData.tournamentActive) {
        return api.sendMessage(`⚠️ Không có giải đấu nào đang diễn ra!\n\nGiải đấu thường diễn ra 2 lần mỗi tuần.`, event.threadID);
    }

    // Calculate remaining time
    const remainingTime = globalData.tournamentEndTime - Date.now();
    const hours = Math.floor(remainingTime / (60 * 60 * 1000));
    const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));

    // Get all participants and their scores
    const participants = [];

    for (const id in globalData.tournamentParticipants) {
        const allPlayerData = loadData(pathData, {});
        if (allPlayerData[id]) {
            participants.push({
                id: id,
                name: allPlayerData[id].name || `Player${id.slice(-4)}`,
                score: allPlayerData[id].tournamentScore || 0
            });
        }
    }

    // Sort by score
    participants.sort((a, b) => b.score - a.score);

    // Find player's rank
    const playerRank = participants.findIndex(p => p.id === senderID) + 1;

    let message = `🏆 **TRẠNG THÁI GIẢI ĐẤU**\n\n`;
    message += `🎯 Chủ đề: ${globalData.tournamentTheme.name}\n`;
    message += `⏱️ Thời gian còn lại: ${hours}h ${minutes}m\n`;
    message += `👥 Số người tham gia: ${participants.length}\n\n`;

    if (player.tournamentJoined) {
        message += `📊 **Điểm của bạn:** ${player.tournamentScore}\n`;
        message += `📊 **Xếp hạng:** ${playerRank > 0 ? playerRank : "Chưa có"}\n\n`;
    } else {
        message += `⚠️ Bạn chưa tham gia! Dùng "fishing tournament join" để tham gia.\n\n`;
    }

    message += `🏅 **TOP 5:**\n`;

    for (let i = 0; i < Math.min(5, participants.length); i++) {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        message += `${medal} ${participants[i].name}: ${formatNumber(participants[i].score)} điểm\n`;
    }

    return api.sendMessage(message, event.threadID);
}

// Rod Upgrade System
function upgradeRod(api, event, userData, senderID, amount) {
    const player = userData[senderID];
    const currentRod = gameData.rods.find(r => r.name === player.rod);

    if (!currentRod) {
        return api.sendMessage(`❌ Bạn chưa có cần câu nào!`, event.threadID);
    }

    // Initialize rod upgrades if needed
    if (!player.rodUpgrades) player.rodUpgrades = {};
    if (!player.rodUpgrades[currentRod.name]) player.rodUpgrades[currentRod.name] = 0;

    const currentLevel = player.rodUpgrades[currentRod.name];

    if (currentLevel >= AUTO_FISHING_CONFIG.ROD_UPGRADE_MAX_LEVEL) {
        return api.sendMessage(`⚠️ Cần câu ${currentRod.name} đã đạt cấp độ tối đa (${currentLevel})!`, event.threadID);
    }

    // Calculate upgrade cost
    const baseCost = currentRod.price * 0.1;
    const upgradeCost = Math.floor(baseCost * Math.pow(1.5, currentLevel));

    // Parse upgrade amount
    const upgrades = amount ? parseInt(amount) : 1;
    const totalCost = upgradeCost * upgrades;

    const maxPossibleUpgrades = Math.min(
        upgrades,
        AUTO_FISHING_CONFIG.ROD_UPGRADE_MAX_LEVEL - currentLevel,
        Math.floor(player.money / upgradeCost)
    );

    if (maxPossibleUpgrades <= 0) {
        return api.sendMessage(
            `❌ Không đủ tiền để nâng cấp cần câu!\n` +
            `💰 Chi phí: ${formatNumber(upgradeCost)} xu/cấp\n` +
            `💰 Hiện có: ${formatNumber(player.money)} xu`,
            event.threadID
        );
    }

    // Apply upgrade
    player.money -= upgradeCost * maxPossibleUpgrades;
    player.rodUpgrades[currentRod.name] += maxPossibleUpgrades;

    // Calculate and show upgrade benefits
    const oldProbability = currentRod.probability;
    const oldEnergyCost = currentRod.energyCost;

    const newProbability = Math.min(1, oldProbability * (1 + (player.rodUpgrades[currentRod.name] * 0.05)));
    const newEnergyCost = Math.max(0, oldEnergyCost * (1 - (player.rodUpgrades[currentRod.name] * 0.1)));

    saveData(pathData, userData);

    return api.sendMessage(
        `✅ Đã nâng cấp ${currentRod.name} lên cấp ${player.rodUpgrades[currentRod.name]}!\n` +
        `💰 Chi phí: ${formatNumber(upgradeCost * maxPossibleUpgrades)} xu\n` +
        `💰 Còn lại: ${formatNumber(player.money)} xu\n\n` +
        `📈 **Chỉ số mới:**\n` +
        `🎯 Tỉ lệ thành công: ${Math.round(newProbability * 100)}% (${Math.round(oldProbability * 100)}% + ${Math.round((newProbability - oldProbability) * 100)}%)\n` +
        `⚡ Năng lượng: ${newEnergyCost.toFixed(1)} (${oldEnergyCost} - ${(oldEnergyCost - newEnergyCost).toFixed(1)})`,
        event.threadID
    );
}

// Crafting System
function showCrafting(api, event, userData, senderID) {
    let message = `🔨 **HỆ THỐNG CHẾ TẠO**\n\n`;

    message += `💡 Chế tạo cho phép bạn dùng nguyên liệu để tạo ra trang bị và vật phẩm đặc biệt!\n\n`;

    message += `🧰 **Danh mục:**\n`;
    message += `📝 \`fishing craft rod\` - Chế tạo cần câu\n`;
    message += `📝 \`fishing craft bait\` - Chế tạo mồi câu\n`;
    message += `📝 \`fishing craft equipment\` - Chế tạo trang bị\n`;
    message += `📝 \`fishing craft special\` - Vật phẩm đặc biệt\n\n`;

    message += `🔍 Dùng \`fishing craft [danh mục]\` để xem chi tiết công thức chế tạo.`;

    return api.sendMessage(message, event.threadID);
}

function craftItem(api, event, userData, senderID, args) {
    const player = userData[senderID];
    const category = args[1]?.toLowerCase();
    const itemName = args.slice(2).join(" ");

    if (!category || !itemName) {
        return api.sendMessage(`❌ Cú pháp: fishing craft [danh mục] [tên vật phẩm]`, event.threadID);
    }

    // Get crafting recipes (would need to implement a full recipe system)
    const recipes = getCraftingRecipes(category);
    const recipe = recipes.find(r => r.name.toLowerCase().includes(itemName.toLowerCase()));

    if (!recipe) {
        return api.sendMessage(`❌ Không tìm thấy công thức cho "${itemName}"!`, event.threadID);
    }

    // Check if player has required materials
    const missingMaterials = [];

    for (const material of recipe.materials) {
        const playerAmount = player.materialStorage[material.name] || 0;
        if (playerAmount < material.amount) {
            missingMaterials.push(`${material.name} (${playerAmount}/${material.amount})`);
        }
    }

    if (missingMaterials.length > 0) {
        return api.sendMessage(
            `❌ Thiếu nguyên liệu để chế tạo ${recipe.name}!\n\n` +
            `📝 **Thiếu:**\n${missingMaterials.join("\n")}`,
            event.threadID
        );
    }

    // Consume materials
    for (const material of recipe.materials) {
        player.materialStorage[material.name] -= material.amount;
    }

    // Add crafted item to player
    switch (category) {
        case "rod":
            player.rod = recipe.name;
            break;
        case "bait":
            if (!player.baits) player.baits = {};
            if (!player.baits[recipe.name]) player.baits[recipe.name] = 0;
            player.baits[recipe.name] += recipe.amount || 1;
            break;
        case "equipment":
            if (!player.equipment) player.equipment = {};
            player.equipment[recipe.slot] = recipe.name;
            break;
        case "special":
            if (!player.specialItems) player.specialItems = [];
            player.specialItems.push(recipe.name);
            break;
    }

    saveData(pathData, userData);

    return api.sendMessage(
        `🔨 Đã chế tạo thành công ${recipe.name}!\n\n` +
        `✨ ${recipe.description}\n\n` +
        `💡 Chế tạo vật phẩm từ nguyên liệu câu cá giúp bạn có được trang bị mạnh mẽ mà không cần tiêu tiền!`,
        event.threadID
    );
}

function getCraftingRecipes(category) {
    // Sample crafting recipes
    const recipes = {
        rod: [
            {
                name: "Cần câu nguyên tố",
                description: "Cần câu đặc biệt kết hợp sức mạnh của tất cả các nguyên tố.",
                materials: [
                    { name: "Vảy cá quý", amount: 50 },
                    { name: "Tinh thể huyền thoại", amount: 10 },
                    { name: "Ngọc biển", amount: 20 }
                ],
                tier: 5,
                probability: 0.95,
                energyCost: 1,
                durability: 550,
                specialEffect: "elementalMastery"
            },
            {
                name: "Cần câu ánh sáng thánh thần",
                description: "Được rèn từ ánh sáng thiêng liêng, cần câu này có sức mạnh xua đuổi bóng tối.",
                materials: [
                    { name: "Tinh thể huyền thoại", amount: 20 },
                    { name: "Essence thần thoại", amount: 5 },
                    { name: "Shard tuyệt đối", amount: 2 }
                ],
                tier: 6,
                probability: 0.97,
                energyCost: 0,
                durability: 800,
                specialEffect: "holyLight"
            }
        ],
        bait: [
            {
                name: "Mồi ánh sáng vĩnh cửu",
                description: "Tỏa ra ánh sáng không bao giờ tắt, thu hút cá từ khoảng cách xa.",
                materials: [
                    { name: "Ngọc biển", amount: 15 },
                    { name: "Tinh thể huyền thoại", amount: 3 }
                ],
                tier: 4,
                price: 0,
                probability: 0.4,
                specialEffect: "eternalLight",
                targetType: "all",
                amount: 5
            },
            {
                name: "Mồi vua biển",
                description: "Mồi đặc biệt được tạo ra để thu hút những loài cá vương giả.",
                materials: [
                    { name: "Tinh thể huyền thoại", amount: 8 },
                    { name: "Essence thần thoại", amount: 3 },
                    { name: "Vảy cá quý", amount: 30 }
                ],
                tier: 5,
                price: 0,
                probability: 0.6,
                specialEffect: "royalAttract",
                targetType: "legendary",
                amount: 3
            }
        ],
        equipment: [
            {
                name: "Mũ thợ câu bậc thầy",
                description: "Mũ được làm từ vảy của những loài cá hiếm, tăng khả năng phát hiện cá quý.",
                materials: [
                    { name: "Vảy cá quý", amount: 40 },
                    { name: "Ngọc biển", amount: 10 }
                ],
                slot: "hat",
                tier: 4,
                effect: { type: "rareFish", value: 0.2 }
            },
            {
                name: "Áo giáp biển cả",
                description: "Áo giáp được rèn từ tinh thể của đại dương, bảo vệ người mặc và tăng sức mạnh.",
                materials: [
                    { name: "Tinh thể huyền thoại", amount: 15 },
                    { name: "Essence thần thoại", amount: 2 },
                    { name: "Ngọc biển", amount: 25 }
                ],
                slot: "clothes",
                tier: 5,
                effect: { type: "allBonus", value: 0.25 }
            }
        ],
        special: [
            {
                name: "Bùa may mắn của ngư dân",
                description: "Bùa đặc biệt tăng cường vận may khi câu cá trong 24 giờ.",
                materials: [
                    { name: "Vảy cá", amount: 100 },
                    { name: "Ngọc biển", amount: 5 }
                ],
                effect: { type: "luck", value: 0.2, duration: 86400000 }
            },
            {
                name: "Thần chú triệu hồi cá boss",
                description: "Phép thuật cổ xưa có khả năng triệu hồi một con cá boss.",
                materials: [
                    { name: "Essence thần thoại", amount: 3 },
                    { name: "Tinh thể huyền thoại", amount: 10 },
                    { name: "Shard tuyệt đối", amount: 1 }
                ],
                effect: { type: "summonBoss" }
            }
        ]
    };

    return recipes[category] || [];
}

// Achievement System
function showAchievements(api, event, userData, senderID) {
    const player = userData[senderID];
    const achievements = getAchievementsList();

    let message = `🏆 **THÀNH TỰU**\n\n`;

    // Group achievements by category
    const achievementsByCategory = {};

    achievements.forEach(achievement => {
        if (!achievementsByCategory[achievement.category]) {
            achievementsByCategory[achievement.category] = [];
        }
        achievementsByCategory[achievement.category].push(achievement);
    });

    // Display achievements by category
    for (const category in achievementsByCategory) {
        message += `**${category}:**\n`;

        achievementsByCategory[category].forEach(achievement => {
            const completed = player.achievements && player.achievements[achievement.id];
            const progress = getAchievementProgress(player, achievement);
            const progressText = achievement.progressive ? ` (${progress}/${achievement.target})` : '';

            message += `${completed ? "✅" : "⬜"} ${achievement.name}${progressText}\n`;
            message += `   💬 ${achievement.description}\n`;
            if (!completed) {
                message += `   🎁 ${achievement.reward}\n`;
            }
        });

        message += "\n";
    }

    return api.sendMessage(message, event.threadID);
}

function getAchievementsList() {
    return [
        {
            id: "first_catch",
            name: "Lần đầu câu cá",
            description: "Câu con cá đầu tiên",
            category: "Nhập môn",
            reward: "500 xu",
            progressive: false
        },
        {
            id: "fish_collector",
            name: "Sưu tập viên",
            description: "Sưu tầm 10 loại cá khác nhau",
            category: "Sưu tầm",
            reward: "1,000 xu + 5 gems",
            progressive: true,
            target: 10,
            checkProgress: (player) => player.fishCollection.length
        },
        {
            id: "master_collector",
            name: "Bậc thầy sưu tầm",
            description: "Sưu tầm 50 loại cá khác nhau",
            category: "Sưu tầm",
            reward: "10,000 xu + 20 gems",
            progressive: true,
            target: 50,
            checkProgress: (player) => player.fishCollection.length
        },
        {
            id: "rich_fisher",
            name: "Ngư dân giàu có",
            description: "Kiếm được 100,000 xu từ câu cá",
            category: "Kinh tế",
            reward: "10,000 xu + 10 gems",
            progressive: true,
            target: 100000,
            checkProgress: (player) => player.stats.totalMoneyEarned
        },
        {
            id: "fisher_king",
            name: "Vua câu cá",
            description: "Đạt level 50",
            category: "Tiến trình",
            reward: "50,000 xu + 50 gems",
            progressive: true,
            target: 50,
            checkProgress: (player) => player.level
        },
        {
            id: "rare_hunter",
            name: "Thợ săn cá hiếm",
            description: "Bắt được 10 con cá hiếm",
            category: "Săn bắn",
            reward: "5,000 xu + 15 gems",
            progressive: true,
            target: 10,
            checkProgress: (player) => player.stats.rareFishCaught
        },
        {
            id: "boss_slayer",
            name: "Người săn boss",
            description: "Đánh bại 5 con cá boss",
            category: "Săn bắn",
            reward: "20,000 xu + 25 gems",
            progressive: true,
            target: 5,
            checkProgress: (player) => player.stats.bossesDefeated
        },
        {
            id: "prestige_fisher",
            name: "Ngư dân danh vọng",
            description: "Đạt prestige lần đầu tiên",
            category: "Prestige",
            reward: "100,000 xu + 100 gems",
            progressive: false
        },
        {
            id: "fishing_streak",
            name: "Chuyên nghiệp",
            description: "Đạt streak 20 lần câu thành công liên tiếp",
            category: "Kỹ năng",
            reward: "10,000 xu + Mồi đặc biệt x5",
            progressive: true,
            target: 20,
            checkProgress: (player) => player.stats.maxStreak
        }
    ];
}

function getAchievementProgress(player, achievement) {
    if (!achievement.progressive) return 0;

    if (achievement.checkProgress) {
        return achievement.checkProgress(player);
    }

    return 0;
}

function checkAchievements(api, event, userData, senderID) {
    const player = userData[senderID];
    const achievements = getAchievementsList();
    const newlyCompleted = [];

    // Initialize achievements object if it doesn't exist
    if (!player.achievements) {
        player.achievements = {};
    }

    // Check each achievement
    achievements.forEach(achievement => {
        // Skip already completed achievements
        if (player.achievements[achievement.id]) return;

        let completed = false;

        if (achievement.progressive) {
            const progress = getAchievementProgress(player, achievement);
            completed = progress >= achievement.target;
        } else {
            // Special case achievements
            switch (achievement.id) {
                case "first_catch":
                    completed = player.stats.totalFishCaught > 0;
                    break;
                case "prestige_fisher":
                    completed = player.prestige > 0;
                    break;
                // Add more cases as needed
            }
        }

        if (completed) {
            player.achievements[achievement.id] = true;
            newlyCompleted.push(achievement);

            // Apply rewards
            applyAchievementReward(player, achievement);
        }
    });

    if (newlyCompleted.length > 0) {
        saveData(pathData, userData);

        // Notify about new achievements
        let message = `🏆 **THÀNH TỰU MỚI!**\n\n`;

        newlyCompleted.forEach(achievement => {
            message += `✅ ${achievement.name}\n`;
            message += `   💬 ${achievement.description}\n`;
            message += `   🎁 ${achievement.reward}\n\n`;
        });

        api.sendMessage(message, event.threadID);
    }
}

function applyAchievementReward(player, achievement) {
    // Parse and apply rewards
    if (achievement.reward.includes("xu")) {
        const match = achievement.reward.match(/(\d+,*\d*) xu/);
        if (match) {
            const amount = parseInt(match[1].replace(/,/g, ''));
            player.money += amount;
        }
    }

    if (achievement.reward.includes("gems")) {
        const match = achievement.reward.match(/(\d+) gems/);
        if (match) {
            const amount = parseInt(match[1]);
            player.gems += amount;
        }
    }

    // Special rewards
    if (achievement.reward.includes("Mồi")) {
        const match = achievement.reward.match(/Mồi ([^ ]+) x(\d+)/);
        if (match) {
            const baitName = match[1];
            const amount = parseInt(match[2]);

            if (!player.baits) player.baits = {};
            if (!player.baits[baitName]) player.baits[baitName] = 0;
            player.baits[baitName] += amount;
        }
    }
}

// Enhanced Settings
function showSettings(api, event, userData, senderID) {
    const player = userData[senderID];

    // Initialize preferences if needed
    if (!player.preferences) {
        player.preferences = {
            autoSell: false,
            autoBait: false,
            notifications: true,
            language: "vi"
        };
    }

    let message = `⚙️ **CÀI ĐẶT**\n\n`;

    message += `📝 **Tự động bán:** ${player.preferences.autoSell ? "✅" : "❌"}\n`;
    message += `   💡 Tự động bán cá sau khi câu được\n\n`;

    message += `📝 **Tự động dùng mồi:** ${player.preferences.autoBait ? "✅" : "❌"}\n`;
    message += `   💡 Tự động sử dụng mồi câu phù hợp\n\n`;

    message += `📝 **Thông báo:** ${player.preferences.notifications ? "✅" : "❌"}\n`;
    message += `   💡 Hiển thị thông báo chi tiết\n\n`;

    message += `📝 **Ngôn ngữ:** ${player.preferences.language === "vi" ? "Tiếng Việt" : "English"}\n`;
    message += `   💡 Thay đổi ngôn ngữ hiển thị\n\n`;

    message += `💡 Dùng \`fishing settings [setting] [on/off]\` để thay đổi.`;

    return api.sendMessage(message, event.threadID);
}

function updateSettings(api, event, userData, senderID, args) {
    const player = userData[senderID];
    const setting = args[1]?.toLowerCase();
    const value = args[2]?.toLowerCase();

    // Initialize preferences if needed
    if (!player.preferences) {
        player.preferences = {
            autoSell: false,
            autoBait: false,
            notifications: true,
            language: "vi"
        };
    }

    if (!setting || !value) {
        return api.sendMessage(`❌ Cú pháp: fishing settings [autosell/autobait/notifications/language] [on/off/vi/en]`, event.threadID);
    }

    switch (setting) {
        case "autosell":
        case "bán":
            player.preferences.autoSell = (value === "on" || value === "true");
            break;
        case "autobait":
        case "mồi":
            player.preferences.autoBait = (value === "on" || value === "true");
            break;
        case "notifications":
        case "thông":
            player.preferences.notifications = (value === "on" || value === "true");
            break;
        case "language":
        case "ngôn":
            player.preferences.language = (value === "en" ? "en" : "vi");
            break;
        default:
            return api.sendMessage(`❌ Cài đặt không hợp lệ! Các lựa chọn: autosell, autobait, notifications, language.`, event.threadID);
    }

    saveData(pathData, userData);

    return api.sendMessage(`✅ Đã cập nhật cài đặt ${setting} thành ${value}.`, event.threadID);
}

// Core Fishing Logic
function performFishing(api, event, userData, senderID) {
    try {
        const player = userData[senderID];

        if (!player) {
            return api.sendMessage(`❌ Lỗi dữ liệu người chơi!`, event.threadID);
        }

        const currentTime = Date.now();

        // Check cooldown
        if (currentTime - (player.lastFishing || 0) < GAME_CONFIG.FISHING_COOLDOWN) {
            const remaining = Math.ceil((GAME_CONFIG.FISHING_COOLDOWN - (currentTime - (player.lastFishing || 0))) / 1000);
            return api.sendMessage(`⏰ Còn ${remaining}s nữa mới câu được!`, event.threadID);
        }

        // Recover energy
        recoverEnergy(player);

        // Check energy
        if ((player.energy || 0) < 1) {
            return api.sendMessage(`⚡ Hết năng lượng! Hãy nghỉ ngơi hoặc dùng item hồi năng lượng.`, event.threadID);
        }

        // Get current rod and location with validation
        const rod = gameData.rods.find(r => r.name === (player.rod || "Cần câu tre cơ bản"));
        const location = gameData.locations.find(l => l.name === (player.currentLocation || "Hồ làng nhỏ"));

        if (!rod) {
            player.rod = "Cần câu tre cơ bản";
            rod = gameData.rods.find(r => r.name === player.rod);
        }

        if (!location) {
            player.currentLocation = "Hồ làng nhỏ";
            location = gameData.locations.find(l => l.name === player.currentLocation);
        }

        if (!rod || !location) {
            return api.sendMessage(`❌ Lỗi dữ liệu cần câu hoặc địa điểm!`, event.threadID);
        }

        // Calculate fishing success rate
        let successRate = Number(rod.probability) || 0.5;
        let energyCost = Number(rod.energyCost);

        // Apply equipment bonuses
        successRate = applyEquipmentBonuses(player, successRate, 'probability');
        energyCost = applyEquipmentBonuses(player, energyCost, 'energyCost');

        // Apply pet bonuses
        if (player.activePet && typeof player.activePet === 'string') {
            try {
                const pet = gameData.pets.find(p => p.name === player.activePet);
                if (pet && pet.ability && typeof pet.bonus === 'number') {
                    if (pet.ability === "fishFinder") successRate += pet.bonus;
                    if (pet.ability === "energySaver") {
                        energyCost = energyCost * (1 - pet.bonus);
                    }
                }
            } catch (error) {
                console.warn('Error applying pet bonuses:', error);
            }
        }

        energyCost = Math.max(0, Math.floor(energyCost));

        // Only check energy if energyCost > 0
        if (energyCost > 0 && player.energy < energyCost) {
            return api.sendMessage(`⚡ Không đủ năng lượng! Cần ${energyCost}, còn ${player.energy}.`, event.threadID);
        }

        // Consume energy (only if energyCost > 0)
        if (energyCost > 0) {
            player.energy = Math.max(0, player.energy - energyCost);
        }
        player.lastFishing = currentTime;

        // Apply VIP bonuses
        if (player.vipLevel > 0) {
            successRate += player.vipLevel * 0.02; // 2% per VIP level
        }

        // Consume energy
        player.energy -= energyCost;
        player.lastFishing = currentTime;

        // Fishing attempt
        const success = Math.random() < successRate;

        if (!success) {
            // Failed fishing
            player.stats.streak = 0;
            saveData(pathData, userData);

            const failMessages = [
                "🎣 Cá đã cắn câu nhưng thoát mất rồi!",
                "🎣 Không có cá nào cắn câu...",
                "🎣 Cần câu bị mắc vào rong biển!",
                "🎣 Cá quá thông minh, không chịu cắn câu!"
            ];
            const randomMessage = failMessages[Math.floor(Math.random() * failMessages.length)];

            return api.sendMessage(`${randomMessage}\n⚡ Năng lượng: ${player.energy}/${player.maxEnergy}`, event.threadID);
        }

        // Successful fishing - select fish
        const caughtFish = selectFishFromLocation(location, player);

        if (!caughtFish) {
            saveData(pathData, userData);
            return api.sendMessage(`❌ Lỗi khi chọn cá!`, event.threadID);
        }

        // Generate fish size
        const fishSize = Math.floor(Math.random() * (caughtFish.size[1] - caughtFish.size[0] + 1)) + caughtFish.size[0];

        // Calculate final price and exp based on size
        const sizeMultiplier = 1 + (fishSize - caughtFish.size[0]) / (caughtFish.size[1] - caughtFish.size[0]) * 0.5;
        const finalPrice = Math.floor(caughtFish.price * sizeMultiplier);
        let finalExp = Math.floor(caughtFish.exp * sizeMultiplier);

        // Apply equipment bonuses to exp and money
        finalExp = Math.floor(applyEquipmentBonuses(player, finalExp, 'exp'));

        // Add to inventory
        const fishItem = {
            name: caughtFish.name,
            rarity: caughtFish.rarity,
            tier: caughtFish.tier,
            price: finalPrice,
            size: fishSize,
            caughtAt: currentTime,
            location: player.currentLocation
        };

        player.inventory.push(fishItem);

        // Update collection
        if (!player.fishCollection.includes(caughtFish.name)) {
            player.fishCollection.push(caughtFish.name);
        }

        // Update stats
        player.exp += finalExp;
        player.stats.totalFishCaught++;
        player.stats.streak++;
        player.stats.maxStreak = Math.max(player.stats.maxStreak, player.stats.streak);

        if (["rare", "epic", "legendary", "mythical", "divine", "cosmic", "transcendent", "omnipotent"].includes(caughtFish.rarity)) {
            player.stats.rareFishCaught++;
        }

        if (caughtFish.isBoss) {
            player.stats.bossesDefeated++;
        }

        // Check for level up
        const newLevel = calculateLevel(player.exp);
        const levelUp = newLevel > player.level;
        if (levelUp) {
            player.level = newLevel;
            player.maxEnergy += 10;
            player.energy = player.maxEnergy; // Full energy on level up
        }

        // Check for materials drop
        const materials = checkMaterialDrop(caughtFish, player);
        if (materials.length > 0) {
            materials.forEach(material => {
                if (!player.materialStorage[material]) {
                    player.materialStorage[material] = 0;
                }
                player.materialStorage[material]++;
            });
        }

        // Save data
        saveData(pathData, userData);

        // Create response message
        let message = `🎣 ${getRarityEmoji(caughtFish.rarity)} **${caughtFish.name}** (${caughtFish.rarity})\n`;
        message += `📏 Kích thước: ${fishSize}cm\n`;
        message += `💰 Giá trị: ${formatNumber(finalPrice)} xu\n`;
        message += `⭐ Kinh nghiệm: +${formatNumber(finalExp)}\n`;
        message += `🔥 Streak: ${player.stats.streak}\n`;

        if (materials.length > 0) {
            message += `🧰 Nguyên liệu: ${materials.join(", ")}\n`;
        }

        if (levelUp) {
            message += `\n🎉 **LEVEL UP!** Cấp ${newLevel}!\n`;
            message += `⚡ Năng lượng đã hồi phục đầy!\n`;
            message += `💪 Năng lượng tối đa: ${player.maxEnergy}`;
        } else {
            message += `\n⚡ Năng lượng: ${player.energy}/${player.maxEnergy}`;

            const expForNext = calculateExpForNextLevel(player.level);
            const expProgress = player.exp - calculateExpForNextLevel(player.level - 1);
            const expNeeded = expForNext - calculateExpForNextLevel(player.level - 1);
            message += `\n📊 EXP: ${formatNumber(expProgress)}/${formatNumber(expNeeded)}`;
        }

        return api.sendMessage(message, event.threadID);

    } catch (error) {
        console.error("Fishing error:", error);
        return api.sendMessage(`❌ Đã xảy ra lỗi khi câu cá! Hãy thử lại.`, event.threadID);
    }
}

function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.trim().substring(0, 100); // Limit length and trim
}

function validateNumber(input, min = 0, max = Infinity) {
    const num = Number(input);
    if (!isFinite(num) || num < min || num > max) {
        return null;
    }
    return num;
}

function selectFishFromLocation(location, player) {
    if (!location || !location.fish || !Array.isArray(location.fish)) {
        console.error("Invalid location data:", location);
        return null;
    }

    // Get available fish for this location with validation
    let availableFish = gameData.fish.filter(fish => {
        if (!fish || !fish.name || !location.fish.includes(fish.name)) return false;

        // Check time restriction
        if (fish.timeRestriction && fish.timeRestriction !== getTimeOfDay()) return false;

        // Check season restriction  
        if (fish.season && fish.season !== getSeason()) return false;

        // Check event restriction
        if (fish.event) {
            // Add event checking logic here
            return false;
        }

        return true;
    });

    // Add location's special fish with validation
    if (location.specialFish && typeof location.specialFish.chance === 'number'
        && Math.random() < location.specialFish.chance) {
        return {
            name: location.specialFish.name || "Cá đặc biệt",
            rarity: location.specialFish.rarity || "rare",
            tier: location.tier || 1,
            price: location.specialFish.price || 100,
            exp: location.specialFish.exp || 10,
            size: [50, 200], // Default size for special fish
            isBoss: false
        };
    }

    if (availableFish.length === 0) {
        console.warn("No available fish in location:", location.name);
        return null;
    }

    // Calculate weighted probabilities with validation
    const fishWithWeights = availableFish.map(fish => {
        let weight = Number(fish.probability) || 0.1;

        // Apply rarity bonuses from equipment/pets
        try {
            const rarityMultiplier = getRarityBonusMultiplier(player, fish.rarity);
            weight *= Math.max(0.1, rarityMultiplier);
        } catch (error) {
            console.error("Error calculating rarity bonus:", error);
            weight = 0.1;
        }

        return { ...fish, weight };
    });

    // Select fish based on weighted probability
    const totalWeight = fishWithWeights.reduce((sum, fish) => sum + (fish.weight || 0), 0);

    if (totalWeight <= 0) {
        return fishWithWeights[0] || null; // Fallback
    }

    let random = Math.random() * totalWeight;

    for (const fish of fishWithWeights) {
        random -= (fish.weight || 0);
        if (random <= 0) {
            return fish;
        }
    }

    return fishWithWeights[0]; // Fallback
}

function getRarityBonusMultiplier(player, rarity) {
    let multiplier = 1;

    // Base multiplier based on equipment
    if (player.equipment) {
        Object.values(player.equipment).forEach(itemName => {
            if (itemName) {
                const equipment = findEquipmentByName(itemName);
                if (equipment && equipment.effect.type === 'rareFish') {
                    multiplier += equipment.effect.value;
                }
            }
        });
    }

    // Pet bonus
    if (player.activePet) {
        const pet = gameData.pets.find(p => p.name === player.activePet);
        if (pet && pet.ability === 'rareFishGuide') {
            multiplier += pet.bonus;
        }
    }

    return multiplier;
}

function findEquipmentByName(itemName) {
    for (const category of Object.values(gameData.equipment)) {
        const item = category.find(item => item.name === itemName);
        if (item) return item;
    }
    return null;
}

function applyEquipmentBonuses(player, value, bonusType) {
    if (!player || typeof value !== 'number') {
        return value || 0;
    }

    let multiplier = 1;

    if (player.equipment && typeof player.equipment === 'object') {
        Object.values(player.equipment).forEach(itemName => {
            if (itemName && typeof itemName === 'string') {
                const equipment = findEquipmentByName(itemName);
                if (equipment && equipment.effect && equipment.effect.type === bonusType) {
                    const effectValue = Number(equipment.effect.value);
                    if (isFinite(effectValue)) {
                        multiplier += effectValue;
                    }
                }
            }
        });
    }

    return value * Math.max(0, multiplier);
}

function checkMaterialDrop(fish, player) {
    const materials = [];

    // Basic material drops based on fish rarity
    const dropChance = GAME_CONFIG.MATERIAL_DROP_RATE;

    if (Math.random() < dropChance) {
        switch (fish.rarity) {
            case "common":
            case "uncommon":
                materials.push("Vảy cá");
                break;
            case "rare":
                materials.push(Math.random() < 0.5 ? "Vảy cá quý" : "Xương cá");
                break;
            case "epic":
                materials.push("Ngọc biển");
                break;
            case "legendary":
                materials.push("Tinh thể huyền thoại");
                break;
            case "mythical":
                materials.push("Essence thần thoại");
                break;
            case "divine":
            case "cosmic":
            case "transcendent":
            case "omnipotent":
                materials.push("Shard tuyệt đối");
                break;
        }
    }

    // Rare material drops
    if (Math.random() < 0.05) {
        materials.push("Đá quý ngẫu nhiên");
    }

    return materials;
}

// Inventory Management
function viewInventory(api, event, userData, senderID) {
    const player = userData[senderID];

    if (!Array.isArray(player.inventory) || player.inventory.length === 0) {
        if (!player.inventory) player.inventory = [];
        return api.sendMessage(`🎒 Túi đồ trống!`, event.threadID);
    }

    // Group fish by name
    const fishCount = {};
    let totalValue = 0;

    player.inventory.forEach(fish => {
        if (!fishCount[fish.name]) {
            fishCount[fish.name] = {
                count: 0,
                rarity: fish.rarity,
                totalPrice: 0,
                avgSize: 0,
                maxSize: 0
            };
        }
        fishCount[fish.name].count++;
        fishCount[fish.name].totalPrice += fish.price;
        fishCount[fish.name].avgSize += fish.size || 0;
        fishCount[fish.name].maxSize = Math.max(fishCount[fish.name].maxSize, fish.size || 0);
        totalValue += fish.price;
    });

    // Calculate averages
    Object.keys(fishCount).forEach(fishName => {
        fishCount[fishName].avgSize = Math.floor(fishCount[fishName].avgSize / fishCount[fishName].count);
    });

    // Sort by rarity and value
    const sortedFish = Object.entries(fishCount).sort((a, b) => {
        const rarityOrder = ["common", "uncommon", "rare", "epic", "legendary", "mythical", "divine", "cosmic", "transcendent", "omnipotent"];
        const aRarityIndex = rarityOrder.indexOf(a[1].rarity);
        const bRarityIndex = rarityOrder.indexOf(b[1].rarity);
        if (aRarityIndex !== bRarityIndex) return bRarityIndex - aRarityIndex;
        return b[1].totalPrice - a[1].totalPrice;
    });

    let message = `🎒 **Túi đồ của ${player.name || 'bạn'}**\n`;
    message += `📊 Tổng số: ${player.inventory.length} con cá\n`;
    message += `💰 Tổng giá trị: ${formatNumber(totalValue)} xu\n\n`;

    // Show top 15 fish types
    const displayCount = Math.min(15, sortedFish.length);
    for (let i = 0; i < displayCount; i++) {
        const [fishName, data] = sortedFish[i];
        message += `${getRarityEmoji(data.rarity)} **${fishName}** x${data.count}\n`;
        message += `   💰 ${formatNumber(data.totalPrice)} xu (TB: ${formatNumber(Math.floor(data.totalPrice / data.count))})\n`;
        if (data.avgSize > 0) {
            message += `   📏 TB: ${data.avgSize}cm, Max: ${data.maxSize}cm\n`;
        }
    }

    if (sortedFish.length > 15) {
        message += `\n... và ${sortedFish.length - 15} loại khác`;
    }

    message += `\n\n🗂️ Bộ sưu tập: ${player.fishCollection.length}/${gameData.fish.length} loại`;
    message += `\n💼 Nguyên liệu: ${Object.keys(player.materialStorage || {}).length} loại`;

    message += `\n\n📝 Dùng "fishing bán" để bán cá`;
    message += `\n📝 Dùng "fishing collection" để xem bộ sưu tập`;

    return api.sendMessage(message, event.threadID);
}

function sellFish(api, event, userData, senderID, args) {
    const player = userData[senderID];

    if (player.inventory.length === 0) {
        return api.sendMessage(`🎒 Túi đồ trống! Không có gì để bán.`, event.threadID);
    }

    const option = args[1]?.toLowerCase();

    if (option === "all" || option === "tất" || option === "cả") {
        // Sell all fish
        let totalValue = 0;
        const soldCount = player.inventory.length;

        player.inventory.forEach(fish => {
            totalValue += fish.price;
        });

        // Apply selling bonuses
        totalValue = Math.floor(applyEquipmentBonuses(player, totalValue, 'fishValue'));

        player.money += totalValue;
        player.stats.totalMoneyEarned += totalValue;
        player.inventory = [];

        saveData(pathData, userData);

        return api.sendMessage(
            `💰 Đã bán ${soldCount} con cá!\n` +
            `💵 Nhận được: ${formatNumber(totalValue)} xu\n` +
            `🏦 Tổng tiền: ${formatNumber(player.money)} xu`,
            event.threadID
        );
    }

    if (option === "rarity" && args[2]) {
        // Sell by rarity
        const rarity = args[2].toLowerCase();
        const fishToSell = player.inventory.filter(fish => fish.rarity.toLowerCase() === rarity);

        if (fishToSell.length === 0) {
            return api.sendMessage(`❌ Không có cá ${rarity} nào trong túi đồ!`, event.threadID);
        }

        let totalValue = 0;
        fishToSell.forEach(fish => {
            totalValue += fish.price;
        });

        totalValue = Math.floor(applyEquipmentBonuses(player, totalValue, 'fishValue'));

        player.money += totalValue;
        player.stats.totalMoneyEarned += totalValue;
        player.inventory = player.inventory.filter(fish => fish.rarity.toLowerCase() !== rarity);

        saveData(pathData, userData);

        return api.sendMessage(
            `💰 Đã bán ${fishToSell.length} con cá ${rarity}!\n` +
            `💵 Nhận được: ${formatNumber(totalValue)} xu\n` +
            `🏦 Tổng tiền: ${formatNumber(player.money)} xu`,
            event.threadID
        );
    }

    if (args.length >= 2) {
        // Sell specific fish
        const fishName = args.slice(1).join(" ");
        const fishToSell = player.inventory.filter(fish => fish.name.toLowerCase().includes(fishName.toLowerCase()));

        if (fishToSell.length === 0) {
            return api.sendMessage(`❌ Không tìm thấy cá "${fishName}" trong túi đồ!`, event.threadID);
        }

        let totalValue = 0;
        fishToSell.forEach(fish => {
            totalValue += fish.price;
        });

        totalValue = Math.floor(applyEquipmentBonuses(player, totalValue, 'fishValue'));

        player.money += totalValue;
        player.stats.totalMoneyEarned += totalValue;
        player.inventory = player.inventory.filter(fish => !fish.name.toLowerCase().includes(fishName.toLowerCase()));

        saveData(pathData, userData);

        return api.sendMessage(
            `💰 Đã bán ${fishToSell.length} con ${fishToSell[0].name}!\n` +
            `💵 Nhận được: ${formatNumber(totalValue)} xu\n` +
            `🏦 Tổng tiền: ${formatNumber(player.money)} xu`,
            event.threadID
        );
    }

    // Show sell menu
    return api.sendMessage(
        `💰 **Menu bán cá:**\n\n` +
        `📝 \`fishing bán all\` - Bán tất cả\n` +
        `📝 \`fishing bán rarity [độ hiếm]\` - Bán theo độ hiếm\n` +
        `📝 \`fishing bán [tên cá]\` - Bán loại cá cụ thể\n\n` +
        `**Độ hiếm:** common, uncommon, rare, epic, legendary, mythical, divine, cosmic, transcendent, omnipotent`,
        event.threadID
    );
}

// Shop System
function showShop(api, event, userData, senderID, args) {
    const player = userData[senderID];
    const category = args[1]?.toLowerCase();

    if (!category) {
        return api.sendMessage(
            `🏪 **ULTIMATE FISHING SHOP**\n\n` +
            `📝 \`fishing shop rod\` - Cần câu\n` +
            `📝 \`fishing shop bait\` - Mồi câu\n` +
            `📝 \`fishing shop boat\` - Thuyền bè\n` +
            `📝 \`fishing shop equipment\` - Trang bị\n` +
            `📝 \`fishing shop pet\` - Thú cưng\n` +
            `📝 \`fishing shop gem\` - Mua gem\n\n` +
            `💰 Tiền của bạn: ${formatNumber(player.money)} xu\n` +
            `💎 Gem của bạn: ${formatNumber(player.gems)} gems`,
            event.threadID
        );
    }

    switch (category) {
        case "rod":
        case "cần":
            return showRodShop(api, event, player);
        case "bait":
        case "mồi":
            return showBaitShop(api, event, player);
        case "boat":
        case "thuyền":
            return showBoatShop(api, event, player);
        case "equipment":
        case "trang":
            return showEquipmentShop(api, event, player);
        case "pet":
        case "thú":
            return showPetShop(api, event, player);
        case "gem":
            return showGemShop(api, event, player);
        default:
            return api.sendMessage(`❌ Danh mục không hợp lệ! Dùng "fishing shop" để xem tất cả danh mục.`, event.threadID);
    }
}

function showRodShop(api, event, player) {
    let message = `🎣 **CỬA HÀNG CẦN CÂU**\n\n`;

    // Filter rods based on player level and prestige
    const availableRods = gameData.rods.filter(rod => {
        if (rod.unlockLevel && player.level < rod.unlockLevel) return false;
        if (rod.prestige && player.prestige < rod.prestige) return false;
        return true;
    });

    // Group by tier
    const rodsByTier = {};
    availableRods.forEach(rod => {
        if (!rodsByTier[rod.tier]) rodsByTier[rod.tier] = [];
        rodsByTier[rod.tier].push(rod);
    });

    Object.keys(rodsByTier).sort((a, b) => a - b).forEach(tier => {
        message += `**Tier ${tier}:**\n`;
        rodsByTier[tier].forEach((rod, index) => {
            const affordable = player.money >= rod.price;
            const equipped = player.rod === rod.name;

            message += `${equipped ? "✅" : affordable ? "💰" : "❌"} ${rod.name}\n`;
            message += `   💵 ${formatNumber(rod.price)} xu | ⚡ ${rod.energyCost} | 🎯 ${Math.round(rod.probability * 100)}%\n`;
            if (rod.specialEffect) message += `   ✨ ${rod.specialEffect}\n`;
        });
        message += "\n";
    });

    message += `💡 Dùng \`fishing buy rod [tên]\` để mua`;

    return api.sendMessage(message, event.threadID);
}

function showBaitShop(api, event, player) {
    let message = `🪱 **CỬA HÀNG MỒI CÂU**\n\n`;

    const baitsByTier = {};
    gameData.baits.forEach(bait => {
        if (!baitsByTier[bait.tier]) baitsByTier[bait.tier] = [];
        baitsByTier[bait.tier].push(bait);
    });

    Object.keys(baitsByTier).sort((a, b) => a - b).forEach(tier => {
        message += `**Tier ${tier}:**\n`;
        baitsByTier[tier].forEach(bait => {
            const affordable = player.money >= bait.price;

            message += `${affordable ? "💰" : "❌"} ${bait.name}\n`;
            message += `   💵 ${formatNumber(bait.price)} xu | 📈 +${Math.round(bait.probability * 100)}%\n`;
            if (bait.specialEffect) message += `   ✨ ${bait.specialEffect}\n`;
        });
        message += "\n";
    });

    message += `💡 Dùng \`fishing buy bait [tên] [số lượng]\` để mua`;

    return api.sendMessage(message, event.threadID);
}

function showBoatShop(api, event, player) {
    let message = `🚢 **CỬA HÀNG THUYỀN BÈ**\n\n`;

    const availableBoats = gameData.boats.filter(boat => {
        if (boat.unlockLevel && player.level < boat.unlockLevel) return false;
        if (boat.prestige && player.prestige < boat.prestige) return false;
        return true;
    });

    const boatsByTier = {};
    availableBoats.forEach(boat => {
        if (!boatsByTier[boat.tier]) boatsByTier[boat.tier] = [];
        boatsByTier[boat.tier].push(boat);
    });

    Object.keys(boatsByTier).sort((a, b) => a - b).forEach(tier => {
        message += `**Tier ${tier}:**\n`;
        boatsByTier[tier].forEach(boat => {
            const affordable = player.money >= boat.price;
            const equipped = player.currentBoat === boat.name;

            message += `${equipped ? "✅" : affordable ? "💰" : "❌"} ${boat.name}\n`;
            message += `   💵 ${formatNumber(boat.price)} xu | 🚀 ${boat.speed}x | 📦 ${boat.capacity}\n`;
            message += `   🌊 ${boat.areas.join(", ")}\n`;
            if (boat.specialEffect) message += `   ✨ ${boat.specialEffect}\n`;
        });
        message += "\n";
    });

    message += `💡 Dùng \`fishing buy boat [tên]\` để mua`;

    return api.sendMessage(message, event.threadID);
}

function showEquipmentShop(api, event, player) {
    let message = `⚔️ **CỬA HÀNG TRANG BỊ**\n\n`;

    Object.keys(gameData.equipment).forEach(category => {
        const items = gameData.equipment[category].filter(item => {
            if (item.unlockLevel && player.level < item.unlockLevel) return false;
            if (item.prestige && player.prestige < item.prestige) return false;
            return true;
        });

        if (items.length > 0) {
            message += `**${category.toUpperCase()}:**\n`;
            items.forEach(item => {
                const affordable = player.money >= item.price;
                const equipped = player.equipment[category] === item.name;

                message += `${equipped ? "✅" : affordable ? "💰" : "❌"} ${item.name}\n`;
                message += `   💵 ${formatNumber(item.price)} xu | ${item.effect.type}: ${item.effect.value}\n`;
            });
            message += "\n";
        }
    });

    message += `💡 Dùng \`fishing buy equipment [loại] [tên]\` để mua`;

    return api.sendMessage(message, event.threadID);
}

function showPetShop(api, event, player) {
    let message = `🐾 **CỬA HÀNG THÚ CƯNG**\n\n`;

    const availablePets = gameData.pets.filter(pet => {
        if (pet.unlockLevel && player.level < pet.unlockLevel) return false;
        if (pet.prestige && player.prestige < pet.prestige) return false;
        if (pet.event) return false; // Event pets not in shop
        return true;
    });

    const petsByTier = {};
    availablePets.forEach(pet => {
        if (!petsByTier[pet.tier]) petsByTier[pet.tier] = [];
        petsByTier[pet.tier].push(pet);
    });

    Object.keys(petsByTier).sort((a, b) => a - b).forEach(tier => {
        message += `**Tier ${tier}:**\n`;
        petsByTier[tier].forEach(pet => {
            const affordableMoney = player.money >= pet.price;
            const affordableGems = player.gems >= pet.gems;
            const owned = player.pets.includes(pet.name);
            const active = player.activePet === pet.name;

            message += `${active ? "🟢" : owned ? "✅" : (affordableMoney && affordableGems) ? "💰" : "❌"} ${pet.name}\n`;
            message += `   💵 ${formatNumber(pet.price)} xu | 💎 ${pet.gems} gems\n`;
            message += `   🎯 ${pet.ability}: +${Math.round(pet.bonus * 100)}%\n`;
        });
        message += "\n";
    });

    message += `💡 Dùng \`fishing buy pet [tên]\` để mua`;
    message += `\n💡 Dùng \`fishing pet equip [tên]\` để trang bị`;

    return api.sendMessage(message, event.threadID);
}

function showGemShop(api, event, player) {
    let message = `💎 **CỬA HÀNG GEM**\n\n`;
    message += `**Gói Gem:**\n`;
    message += `💰 100 gems = 50,000 xu\n`;
    message += `💰 500 gems = 200,000 xu\n`;
    message += `💰 1,000 gems = 350,000 xu\n`;
    message += `💰 5,000 gems = 1,500,000 xu\n`;
    message += `💰 10,000 gems = 2,500,000 xu\n\n`;

    message += `**VIP Packages:**\n`;
    message += `👑 VIP Level 1 = 1,000 gems\n`;
    message += `👑 VIP Level 2 = 2,000 gems\n`;
    message += `👑 VIP Level 3 = 3,000 gems\n`;
    message += `👑 VIP Level 4 = 4,000 gems\n`;
    message += `👑 VIP Level 5 = 5,000 gems\n\n`;

    message += `💡 Dùng \`fishing buy gem [số lượng]\` để mua\n`;
    message += `💡 Dùng \`fishing buy vip [level]\` để mua VIP`;

    return api.sendMessage(message, event.threadID);
}

// Buy System
function buyItem(api, event, userData, senderID, args) {
    try {
        const player = userData[senderID];

        if (!player) {
            return api.sendMessage(`❌ Lỗi dữ liệu người chơi!`, event.threadID);
        }

        if (!args || args.length < 3) {
            return api.sendMessage(`❌ Cú pháp: fishing buy [loại] [tên/số lượng]`, event.threadID);
        }

        const itemType = sanitizeInput(args[1]).toLowerCase();
        const itemName = args.slice(2).map(sanitizeInput).join(" ");

        if (!itemType || !itemName) {
            return api.sendMessage(`❌ Vui lòng nhập đầy đủ thông tin!`, event.threadID);
        }

        switch (itemType) {
            case "rod":
            case "cần":
                return buyRod(api, event, userData, senderID, itemName);
            case "bait":
            case "mồi":
                return buyBait(api, event, userData, senderID, args);
            case "boat":
            case "thuyền":
                return buyBoat(api, event, userData, senderID, itemName);
            case "equipment":
            case "trang":
                return buyEquipment(api, event, userData, senderID, args);
            case "pet":
            case "thú":
                return buyPet(api, event, userData, senderID, itemName);
            case "gem":
                return buyGem(api, event, userData, senderID, itemName);
            case "vip":
                return buyVIP(api, event, userData, senderID, itemName);
            default:
                return api.sendMessage(`❌ Loại vật phẩm không hợp lệ!`, event.threadID);
        }
    } catch (error) {
        console.error("Buy item error:", error);
        return api.sendMessage(`❌ Lỗi khi mua vật phẩm!`, event.threadID);
    }
}

function buyRod(api, event, userData, senderID, rodName) {
    const player = userData[senderID];
    const rod = gameData.rods.find(r => r.name.toLowerCase().includes(rodName.toLowerCase()));

    if (!rod) {
        return api.sendMessage(`❌ Không tìm thấy cần câu "${rodName}"!`, event.threadID);
    }

    if (rod.unlockLevel && player.level < rod.unlockLevel) {
        return api.sendMessage(`❌ Cần đạt level ${rod.unlockLevel} để mua ${rod.name}!`, event.threadID);
    }

    if (rod.prestige && player.prestige < rod.prestige) {
        return api.sendMessage(`❌ Cần đạt prestige ${rod.prestige} để mua ${rod.name}!`, event.threadID);
    }

    if (player.money < rod.price) {
        return api.sendMessage(`❌ Không đủ tiền! Cần ${formatNumber(rod.price)} xu, bạn có ${formatNumber(player.money)} xu.`, event.threadID);
    }

    if (player.rod === rod.name) {
        return api.sendMessage(`❌ Bạn đã sử dụng ${rod.name} rồi!`, event.threadID);
    }

    player.money -= rod.price;
    player.rod = rod.name;

    saveData(pathData, userData);

    return api.sendMessage(
        `✅ Đã mua và trang bị ${rod.name}!\n` +
        `💰 Còn lại: ${formatNumber(player.money)} xu\n` +
        `⚡ Tiêu hao năng lượng: ${rod.energyCost}\n` +
        `🎯 Tỉ lệ thành công: ${Math.round(rod.probability * 100)}%`,
        event.threadID
    );
}

function validateQuantity(input, min = 1, max = 1000000) {
    const num = parseInt(input);
    if (!Number.isInteger(num) || num < min || num > max) {
        return null;
    }
    return num;
}

function buyBait(api, event, userData, senderID, args) {
    const player = userData[senderID];
    const baitName = args.slice(2, -1).join(" ");
    const quantity = validateQuantity(args[args.length - 1]) || 1;

    const bait = gameData.baits.find(b => b.name.toLowerCase().includes(baitName.toLowerCase()));

    if (!bait) {
        return api.sendMessage(`❌ Không tìm thấy mồi câu "${baitName}"!`, event.threadID);
    }

    const totalCost = bait.price * quantity;

    if (player.money < totalCost) {
        return api.sendMessage(`❌ Không đủ tiền! Cần ${formatNumber(totalCost)} xu, bạn có ${formatNumber(player.money)} xu.`, event.threadID);
    }

    player.money -= totalCost;

    if (!player.baits) player.baits = {};
    if (!player.baits[bait.name]) player.baits[bait.name] = 0;
    player.baits[bait.name] += quantity;

    saveData(pathData, userData);

    return api.sendMessage(
        `✅ Đã mua ${quantity}x ${bait.name}!\n` +
        `💰 Còn lại: ${formatNumber(player.money)} xu\n` +
        `🎒 Hiện có: ${player.baits[bait.name]}x ${bait.name}`,
        event.threadID
    );
}

function buyBoat(api, event, userData, senderID, boatName) {
    const player = userData[senderID];
    const boat = gameData.boats.find(b => b.name.toLowerCase().includes(boatName.toLowerCase()));

    if (!boat) {
        return api.sendMessage(`❌ Không tìm thấy thuyền "${boatName}"!`, event.threadID);
    }

    if (boat.unlockLevel && player.level < boat.unlockLevel) {
        return api.sendMessage(`❌ Cần đạt level ${boat.unlockLevel} để mua ${boat.name}!`, event.threadID);
    }

    if (boat.prestige && player.prestige < boat.prestige) {
        return api.sendMessage(`❌ Cần đạt prestige ${boat.prestige} để mua ${boat.name}!`, event.threadID);
    }

    if (player.money < boat.price) {
        return api.sendMessage(`❌ Không đủ tiền! Cần ${formatNumber(boat.price)} xu, bạn có ${formatNumber(player.money)} xu.`, event.threadID);
    }

    if (player.currentBoat === boat.name) {
        return api.sendMessage(`❌ Bạn đã sử dụng ${boat.name} rồi!`, event.threadID);
    }

    player.money -= boat.price;
    player.currentBoat = boat.name;

    saveData(pathData, userData);

    return api.sendMessage(
        `✅ Đã mua và trang bị ${boat.name}!\n` +
        `💰 Còn lại: ${formatNumber(player.money)} xu\n` +
        `🚀 Tốc độ: ${boat.speed}x\n` +
        `📦 Sức chứa: ${boat.capacity}`,
        event.threadID
    );
}

function buyEquipment(api, event, userData, senderID, args) {
    const player = userData[senderID];
    const category = args[2]?.toLowerCase();
    const itemName = args.slice(3).join(" ");

    if (!category || !itemName) {
        return api.sendMessage(`❌ Cú pháp: fishing buy equipment [hat/clothes/boots] [tên]`, event.threadID);
    }

    const validCategories = {
        "hat": "hats",
        "mũ": "hats",
        "clothes": "clothes",
        "áo": "clothes",
        "boots": "boots",
        "giày": "boots"
    };

    const equipCategory = validCategories[category];
    if (!equipCategory) {
        return api.sendMessage(`❌ Loại trang bị không hợp lệ! (hat/clothes/boots)`, event.threadID);
    }

    const item = gameData.equipment[equipCategory].find(e => e.name.toLowerCase().includes(itemName.toLowerCase()));

    if (!item) {
        return api.sendMessage(`❌ Không tìm thấy trang bị "${itemName}"!`, event.threadID);
    }

    if (item.unlockLevel && player.level < item.unlockLevel) {
        return api.sendMessage(`❌ Cần đạt level ${item.unlockLevel} để mua ${item.name}!`, event.threadID);
    }

    if (player.money < item.price) {
        return api.sendMessage(`❌ Không đủ tiền! Cần ${formatNumber(item.price)} xu, bạn có ${formatNumber(player.money)} xu.`, event.threadID);
    }

    if (player.equipment[equipCategory.slice(0, -1)] === item.name) {
        return api.sendMessage(`❌ Bạn đã trang bị ${item.name} rồi!`, event.threadID);
    }

    player.money -= item.price;

    if (!player.equipment) player.equipment = {};
    const categoryKey = equipCategory.slice(0, -1);
    player.equipment[categoryKey] = item.name;

    // Apply equipment effect
    if (item.effect.type === "maxEnergy") {
        player.maxEnergy += item.effect.value;
    }

    saveData(pathData, userData);

    return api.sendMessage(
        `✅ Đã mua và trang bị ${item.name}!\n` +
        `💰 Còn lại: ${formatNumber(player.money)} xu\n` +
        `🎯 Hiệu ứng: ${item.effect.type} +${item.effect.value}`,
        event.threadID
    );
}

function buyPet(api, event, userData, senderID, petName) {
    const player = userData[senderID];
    const pet = gameData.pets.find(p => p.name.toLowerCase().includes(petName.toLowerCase()));

    if (!pet) {
        return api.sendMessage(`❌ Không tìm thấy thú cưng "${petName}"!`, event.threadID);
    }

    if (pet.unlockLevel && player.level < pet.unlockLevel) {
        return api.sendMessage(`❌ Cần đạt level ${pet.unlockLevel} để mua ${pet.name}!`, event.threadID);
    }

    if (pet.prestige && player.prestige < pet.prestige) {
        return api.sendMessage(`❌ Cần đạt prestige ${pet.prestige} để mua ${pet.name}!`, event.threadID);
    }

    if (player.pets.includes(pet.name)) {
        return api.sendMessage(`❌ Bạn đã sở hữu ${pet.name} rồi!`, event.threadID);
    }

    if (player.money < pet.price || player.gems < pet.gems) {
        return api.sendMessage(
            `❌ Không đủ tiền!\n` +
            `Cần: ${formatNumber(pet.price)} xu + ${pet.gems} gems\n` +
            `Có: ${formatNumber(player.money)} xu + ${player.gems} gems`,
            event.threadID
        );
    }

    player.money -= pet.price;
    player.gems -= pet.gems;
    player.pets.push(pet.name);

    saveData(pathData, userData);

    return api.sendMessage(
        `✅ Đã mua ${pet.name}!\n` +
        `💰 Còn lại: ${formatNumber(player.money)} xu\n` +
        `💎 Còn lại: ${player.gems} gems\n` +
        `🎯 Khả năng: ${pet.ability} +${Math.round(pet.bonus * 100)}%\n` +
        `💡 Dùng "fishing pet equip ${pet.name}" để trang bị`,
        event.threadID
    );
}

function buyGem(api, event, userData, senderID, amount) {
    const player = userData[senderID];
    const gemAmount = parseInt(amount);

    if (!gemAmount || gemAmount <= 0) {
        return api.sendMessage(`❌ Số lượng gem không hợp lệ!`, event.threadID);
    }

    let cost;
    if (gemAmount === 100) cost = 50000;
    else if (gemAmount === 500) cost = 200000;
    else if (gemAmount === 1000) cost = 350000;
    else if (gemAmount === 5000) cost = 1500000;
    else if (gemAmount === 10000) cost = 2500000;
    else {
        cost = gemAmount * 500; // Base rate: 500 xu per gem
    }

    if (player.money < cost) {
        return api.sendMessage(`❌ Không đủ tiền! Cần ${formatNumber(cost)} xu, bạn có ${formatNumber(player.money)} xu.`, event.threadID);
    }

    player.money -= cost;
    player.gems += gemAmount;

    saveData(pathData, userData);

    return api.sendMessage(
        `✅ Đã mua ${formatNumber(gemAmount)} gems!\n` +
        `💰 Còn lại: ${formatNumber(player.money)} xu\n` +
        `💎 Tổng gems: ${formatNumber(player.gems)} gems`,
        event.threadID
    );
}

function buyVIP(api, event, userData, senderID, level) {
    const player = userData[senderID];
    const vipLevel = parseInt(level);

    if (!vipLevel || vipLevel <= 0 || vipLevel > 10) {
        return api.sendMessage(`❌ VIP level không hợp lệ! (1-10)`, event.threadID);
    }

    if (player.vipLevel >= vipLevel) {
        return api.sendMessage(`❌ Bạn đã có VIP level ${player.vipLevel} rồi!`, event.threadID);
    }

    const cost = vipLevel * GAME_CONFIG.VIP_COST_PER_LEVEL;

    if (player.gems < cost) {
        return api.sendMessage(`❌ Không đủ gems! Cần ${cost} gems, bạn có ${player.gems} gems.`, event.threadID);
    }

    player.gems -= cost;
    player.vipLevel = vipLevel;
    player.vipExpiry = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days

    saveData(pathData, userData);

    return api.sendMessage(
        `✅ Đã nâng cấp lên VIP Level ${vipLevel}!\n` +
        `💎 Còn lại: ${player.gems} gems\n` +
        `⏰ Thời hạn: 30 ngày\n` +
        `🎁 Bonus: +${vipLevel * 2}% tất cả`,
        event.threadID
    );
}

// Player Info System
function showPlayerInfo(api, event, userData, senderID) {
    const player = userData[senderID];

    // Recover energy first
    recoverEnergy(player);

    let message = `👤 **THÔNG TIN NGƯỜI CHƠI**\n\n`;

    // Basic Info
    message += `📊 **Thông tin cơ bản:**\n`;
    message += `🆔 Tên: ${player.name || 'Chưa đặt tên'}\n`;
    message += `⭐ Level: ${player.level} (${formatNumber(player.exp)} EXP)\n`;

    if (player.prestige > 0) {
        message += `🌟 Prestige: ${player.prestige}\n`;
    }

    message += `💰 Tiền: ${formatNumber(player.money)} xu\n`;
    message += `💎 Gems: ${formatNumber(player.gems)}\n`;

    if (player.vipLevel > 0) {
        const daysLeft = Math.ceil((player.vipExpiry - Date.now()) / (24 * 60 * 60 * 1000));
        message += `👑 VIP: Level ${player.vipLevel} (${daysLeft} ngày)\n`;
    }

    message += `⚡ Năng lượng: ${player.energy}/${player.maxEnergy}\n\n`;

    // Equipment
    message += `🎣 **Trang bị hiện tại:**\n`;
    message += `🎣 Cần câu: ${player.rod}\n`;
    message += `🚢 Thuyền: ${player.currentBoat}\n`;
    message += `📍 Địa điểm: ${player.currentLocation}\n`;

    if (player.activePet) {
        message += `🐾 Pet: ${player.activePet}\n`;
    }

    if (player.equipment) {
        if (player.equipment.hat) message += `👒 Mũ: ${player.equipment.hat}\n`;
        if (player.equipment.clothes) message += `👕 Áo: ${player.equipment.clothes}\n`;
        if (player.equipment.boots) message += `👞 Giày: ${player.equipment.boots}\n`;
    }

    message += `\n📊 **Thống kê:**\n`;
    message += `🐟 Tổng cá câu: ${formatNumber(player.stats.totalFishCaught)}\n`;
    message += `🌟 Cá hiếm: ${formatNumber(player.stats.rareFishCaught)}\n`;
    message += `👑 Boss đánh bại: ${formatNumber(player.stats.bossesDefeated)}\n`;
    message += `💰 Tổng tiền kiếm: ${formatNumber(player.stats.totalMoneyEarned)} xu\n`;
    message += `🔥 Streak hiện tại: ${player.stats.streak}\n`;
    message += `🏆 Streak tối đa: ${player.stats.maxStreak}\n`;

    message += `\n📚 **Bộ sưu tập:**\n`;
    message += `🐟 Cá: ${player.fishCollection.length}/${gameData.fish.length}\n`;
    message += `🐾 Pet: ${player.pets.length}/${gameData.pets.length}\n`;

    if (player.guildID) {
        message += `\n🏰 Guild: ${player.guildID} (${player.guildRank})`;
    }

    saveData(pathData, userData);

    return api.sendMessage(message, event.threadID);
}

// Location System
function showLocations(api, event, userData, senderID) {
    const player = userData[senderID];

    let message = `🗺️ **CÁC KHU VỰC CÂU CÁ**\n\n`;

    const locationsByTier = {};
    gameData.locations.forEach(location => {
        if (!locationsByTier[location.tier]) locationsByTier[location.tier] = [];
        locationsByTier[location.tier].push(location);
    });

    Object.keys(locationsByTier).sort((a, b) => a - b).forEach(tier => {
        message += `**🌟 Tier ${tier}:**\n`;

        locationsByTier[tier].forEach(location => {
            let status = "";
            const unlocked = player.level >= location.unlockLevel;
            const current = player.currentLocation === location.name;

            if (current) status = "📍";
            else if (unlocked) status = "✅";
            else status = "🔒";

            message += `${status} ${location.name}`;

            if (!unlocked) {
                message += ` (Level ${location.unlockLevel})`;
            } else {
                message += ` - Độ khó: ${"⭐".repeat(location.difficulty)}`;
            }

            message += `\n`;

            if (unlocked) {
                message += `   🐟 ${location.fish.slice(0, 3).join(", ")}${location.fish.length > 3 ? "..." : ""}\n`;
                message += `   ✨ ${location.specialFish.name}\n`;

                if (location.requiredBoat) {
                    message += `   🚢 Cần: ${location.requiredBoat}\n`;
                }

                if (location.element) {
                    message += `   🌟 Nguyên tố: ${location.element}\n`;
                }

                if (location.timeRestriction) {
                    message += `   ⏰ Thời gian: ${location.timeRestriction}\n`;
                }
            }
        });
        message += "\n";
    });

    message += `💡 Dùng \`fishing move [tên khu vực]\` để di chuyển`;

    return api.sendMessage(message, event.threadID);
}

function moveToLocation(api, event, userData, senderID, locationName) {
    const player = userData[senderID];

    if (!locationName) {
        return showLocations(api, event, userData, senderID);
    }

    const location = gameData.locations.find(l => l.name.toLowerCase().includes(locationName.toLowerCase()));

    if (!location) {
        return api.sendMessage(`❌ Không tìm thấy khu vực "${locationName}"!`, event.threadID);
    }

    if (player.level < location.unlockLevel) {
        return api.sendMessage(`❌ Cần đạt level ${location.unlockLevel} để vào ${location.name}!`, event.threadID);
    }

    if (location.prestige && player.prestige < location.prestige) {
        return api.sendMessage(`❌ Cần đạt prestige ${location.prestige} để vào ${location.name}!`, event.threadID);
    }

    if (location.requiredBoat) {
        const boat = gameData.boats.find(b => b.name === player.currentBoat);
        if (!boat || !boat.areas.some(area => location.habitat === area || boat.areas.includes("all"))) {
            return api.sendMessage(`❌ Thuyền hiện tại không thể đến ${location.name}! Cần: ${location.requiredBoat}`, event.threadID);
        }
    }

    if (player.currentLocation === location.name) {
        return api.sendMessage(`❌ Bạn đã ở ${location.name} rồi!`, event.threadID);
    }

    const oldLocation = player.currentLocation;
    player.currentLocation = location.name;

    saveData(pathData, userData);

    return api.sendMessage(
        `🚢 Đã di chuyển từ **${oldLocation}** đến **${location.name}**!\n\n` +
        `🌊 Môi trường: ${location.habitat}\n` +
        `⭐ Độ khó: ${"⭐".repeat(location.difficulty)}\n` +
        `🐟 Các loại cá: ${location.fish.join(", ")}\n` +
        `✨ Cá đặc biệt: ${location.specialFish.name} (${Math.round(location.specialFish.chance * 100)}%)`,
        event.threadID
    );
}

// Pet System
function handlePetCommand(api, event, userData, senderID, args) {
    const player = userData[senderID];
    const subCommand = args[1]?.toLowerCase();

    switch (subCommand) {
        case "list":
        case "danh":
            return showPetList(api, event, player);
        case "equip":
        case "trang":
            return equipPet(api, event, userData, senderID, args.slice(2).join(" "));
        case "unequip":
        case "tháo":
            return unequipPet(api, event, userData, senderID);
        case "info":
        case "thông":
            return showPetInfo(api, event, player, args.slice(2).join(" "));
        default:
            return api.sendMessage(
                `🐾 **HỆ THỐNG PET**\n\n` +
                `📝 \`fishing pet list\` - Xem danh sách pet\n` +
                `📝 \`fishing pet equip [tên]\` - Trang bị pet\n` +
                `📝 \`fishing pet unequip\` - Tháo pet\n` +
                `📝 \`fishing pet info [tên]\` - Thông tin pet\n\n` +
                `🛒 Mua pet tại: \`fishing shop pet\``,
                event.threadID
            );
    }
}

function showPetList(api, event, player) {
    if (player.pets.length === 0) {
        return api.sendMessage(`🐾 Bạn chưa có pet nào! Hãy mua tại \`fishing shop pet\``, event.threadID);
    }

    let message = `🐾 **DANH SÁCH PET CỦA BẠN**\n\n`;

    player.pets.forEach(petName => {
        const pet = gameData.pets.find(p => p.name === petName);
        if (pet) {
            const isActive = player.activePet === petName;
            message += `${isActive ? "🟢" : "⚪"} **${pet.name}** (Tier ${pet.tier})\n`;
            message += `   🎯 ${pet.ability}: +${Math.round(pet.bonus * 100)}%\n`;
        }
    });

    if (player.activePet) {
        message += `\n🟢 **Đang hoạt động:** ${player.activePet}`;
    } else {
        message += `\n💡 Dùng \`fishing pet equip [tên]\` để trang bị pet`;
    }

    return api.sendMessage(message, event.threadID);
}

function equipPet(api, event, userData, senderID, petName) {
    const player = userData[senderID];

    if (!petName) {
        return api.sendMessage(`❌ Hãy chỉ định tên pet! Dùng \`fishing pet list\` để xem danh sách.`, event.threadID);
    }

    const pet = gameData.pets.find(p => p.name.toLowerCase().includes(petName.toLowerCase()));

    if (!pet) {
        return api.sendMessage(`❌ Không tìm thấy pet "${petName}"!`, event.threadID);
    }

    if (!player.pets.includes(pet.name)) {
        return api.sendMessage(`❌ Bạn chưa sở hữu ${pet.name}! Hãy mua tại \`fishing shop pet\``, event.threadID);
    }

    if (player.activePet === pet.name) {
        return api.sendMessage(`❌ ${pet.name} đã được trang bị rồi!`, event.threadID);
    }

    const oldPet = player.activePet;
    player.activePet = pet.name;

    saveData(pathData, userData);

    let message = `✅ Đã trang bị ${pet.name}!\n`;
    message += `🎯 Khả năng: ${pet.ability} +${Math.round(pet.bonus * 100)}%\n`;

    if (oldPet) {
        message += `🔄 Đã thay thế: ${oldPet}`;
    }

    return api.sendMessage(message, event.threadID);
}

function unequipPet(api, event, userData, senderID) {
    const player = userData[senderID];

    if (!player.activePet) {
        return api.sendMessage(`❌ Bạn chưa trang bị pet nào!`, event.threadID);
    }

    const petName = player.activePet;
    player.activePet = null;

    saveData(pathData, userData);

    return api.sendMessage(`✅ Đã tháo ${petName}!`, event.threadID);
}

function showPetInfo(api, event, player, petName) {
    if (!petName) {
        return api.sendMessage(`❌ Hãy chỉ định tên pet! Dùng \`fishing pet list\` để xem danh sách.`, event.threadID);
    }

    const pet = gameData.pets.find(p => p.name.toLowerCase().includes(petName.toLowerCase()));

    if (!pet) {
        return api.sendMessage(`❌ Không tìm thấy pet "${petName}"!`, event.threadID);
    }

    const owned = player.pets.includes(pet.name);
    const active = player.activePet === pet.name;

    let message = `🐾 **${pet.name}**\n\n`;
    message += `⭐ Tier: ${pet.tier}\n`;
    message += `🎯 Khả năng: ${pet.ability}\n`;
    message += `📈 Bonus: +${Math.round(pet.bonus * 100)}%\n`;
    message += `💰 Giá: ${formatNumber(pet.price)} xu + ${pet.gems} gems\n`;

    if (pet.unlockLevel) {
        message += `🔓 Mở khóa: Level ${pet.unlockLevel}\n`;
    }

    message += `\n📋 Trạng thái: `;
    if (active) {
        message += `🟢 Đang hoạt động`;
    } else if (owned) {
        message += `✅ Đã sở hữu`;
    } else {
        message += `❌ Chưa sở hữu`;
    }

    // Ability descriptions
    const abilityDescriptions = {
        "fishFinder": "Tăng tỉ lệ tìm thấy cá",
        "energySaver": "Giảm tiêu hao năng lượng",
        "luckBoost": "Tăng may mắn câu cá",
        "treasureHunt": "Tăng cơ hội tìm thấy kho báu",
        "multiCatch": "Cơ hội câu nhiều cá cùng lúc",
        "rareFishGuide": "Tăng tỉ lệ cá hiếm",
        "dragonBreath": "Tăng sát thương với boss",
        "rebirth": "Hồi sinh khi thất bại",
        "purification": "Thanh lọc môi trường câu cá",
        "divineBlessing": "Phù hộ thiên thần",
        "demonicPact": "Giao kèo ác ma",
        "cosmicPower": "Sức mạnh vũ trụ",
        "seaGodBlessing": "Phù hộ thần biển",
        "timeManipulation": "Điều khiển thời gian"
    };

    if (abilityDescriptions[pet.ability]) {
        message += `\n\n📖 Mô tả: ${abilityDescriptions[pet.ability]}`;
    }

    return api.sendMessage(message, event.threadID);
}

// Collection System
function showCollection(api, event, userData, senderID) {
    const player = userData[senderID];

    if (player.fishCollection.length === 0) {
        return api.sendMessage(`📚 Bộ sưu tập trống! Hãy đi câu cá để thu thập.`, event.threadID);
    }

    // Group by rarity
    const collectionByRarity = {};
    player.fishCollection.forEach(fishName => {
        const fish = gameData.fish.find(f => f.name === fishName);
        if (fish) {
            if (!collectionByRarity[fish.rarity]) collectionByRarity[fish.rarity] = [];
            collectionByRarity[fish.rarity].push(fish.name);
        }
    });

    let message = `📚 **BỘ SƯU TẬP CỦA BẠN**\n`;
    message += `🐟 ${player.fishCollection.length}/${gameData.fish.length} loại cá\n\n`;

    const rarityOrder = ["omnipotent", "transcendent", "cosmic", "divine", "mythical", "legendary", "epic", "rare", "uncommon", "common"];

    rarityOrder.forEach(rarity => {
        if (collectionByRarity[rarity]) {
            message += `${getRarityEmoji(rarity)} **${rarity.toUpperCase()}** (${collectionByRarity[rarity].length}):\n`;
            collectionByRarity[rarity].forEach(fishName => {
                message += `   • ${fishName}\n`;
            });
            message += "\n";
        }
    });

    // Collection rewards
    const milestones = [10, 25, 50, 75, 100, 150, 200];
    const nextMilestone = milestones.find(m => m > player.fishCollection.length);

    if (nextMilestone) {
        message += `🎯 Mục tiêu tiếp theo: ${nextMilestone} loại cá (${nextMilestone - player.fishCollection.length} nữa)`;
    } else {
        message += `🏆 Đã hoàn thành tất cả mốc sưu tập!`;
    }

    return api.sendMessage(message, event.threadID);
}

// Leaderboard System
function showLeaderboard(api, event, userData, senderID, type) {
    const allPlayerData = loadData(pathData, {});

    if (Object.keys(allPlayerData).length === 0) {
        return api.sendMessage(`📊 Chưa có dữ liệu bảng xếp hạng!`, event.threadID);
    }

    const validTypes = ["level", "money", "fish", "rare", "boss", "streak"];
    const leaderboardType = type?.toLowerCase() || "level";

    if (!validTypes.includes(leaderboardType)) {
        return api.sendMessage(
            `📊 **BẢNG XẾP HẠNG**\n\n` +
            `📝 \`fishing rank level\` - Xếp hạng level\n` +
            `📝 \`fishing rank money\` - Xếp hạng tiền\n` +
            `📝 \`fishing rank fish\` - Xếp hạng số cá\n` +
            `📝 \`fishing rank rare\` - Xếp hạng cá hiếm\n` +
            `📝 \`fishing rank boss\` - Xếp hạng boss\n` +
            `📝 \`fishing rank streak\` - Xếp hạng streak`,
            event.threadID
        );
    }

    // Create player list for ranking
    const players = Object.entries(allPlayerData).map(([id, data]) => ({
        id,
        name: data.name || id,
        level: data.level || 1,
        money: data.money || 0,
        totalFish: data.stats?.totalFishCaught || 0,
        rareFish: data.stats?.rareFishCaught || 0,
        bosses: data.stats?.bossesDefeated || 0,
        maxStreak: data.stats?.maxStreak || 0,
        prestige: data.prestige || 0
    }));

    // Sort based on type
    let sortedPlayers;
    let titleKey;
    let valueKey;

    switch (leaderboardType) {
        case "level":
            sortedPlayers = players.sort((a, b) => {
                if (b.prestige !== a.prestige) return b.prestige - a.prestige;
                return b.level - a.level;
            });
            titleKey = "🏆 TOP LEVEL";
            valueKey = (player) => player.prestige > 0 ? `P${player.prestige} L${player.level}` : `Level ${player.level}`;
            break;
        case "money":
            sortedPlayers = players.sort((a, b) => b.money - a.money);
            titleKey = "💰 TOP GIÀU CÓ";
            valueKey = (player) => formatNumber(player.money) + " xu";
            break;
        case "fish":
            sortedPlayers = players.sort((a, b) => b.totalFish - a.totalFish);
            titleKey = "🐟 TOP THỢ CÂU";
            valueKey = (player) => formatNumber(player.totalFish) + " con";
            break;
        case "rare":
            sortedPlayers = players.sort((a, b) => b.rareFish - a.rareFish);
            titleKey = "🌟 TOP CÁ HIẾM";
            valueKey = (player) => formatNumber(player.rareFish) + " con";
            break;
        case "boss":
            sortedPlayers = players.sort((a, b) => b.bosses - a.bosses);
            titleKey = "👑 TOP SĂN BOSS";
            valueKey = (player) => formatNumber(player.bosses) + " boss";
            break;
        case "streak":
            sortedPlayers = players.sort((a, b) => b.maxStreak - a.maxStreak);
            titleKey = "🔥 TOP STREAK";
            valueKey = (player) => formatNumber(player.maxStreak) + " streak";
            break;
    }

    const top10 = sortedPlayers.slice(0, 10);
    const currentPlayerRank = sortedPlayers.findIndex(p => p.id === senderID) + 1;

    let message = `📊 **${titleKey}**\n\n`;

    top10.forEach((player, index) => {
        const rank = index + 1;
        const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}.`;

        message += `${medal} ${player.name}\n`;
        message += `   ${valueKey(player)}\n`;
    });

    if (currentPlayerRank > 10) {
        message += `\n📍 Bạn đang ở hạng ${currentPlayerRank}`;
    } else if (currentPlayerRank > 0) {
        message += `\n📍 Bạn đang ở top ${currentPlayerRank}!`;
    }

    return api.sendMessage(message, event.threadID);
}

// Daily Rewards & Quests
function claimDailyReward(api, event, userData, senderID) {
    const player = userData[senderID];
    const currentTime = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (currentTime - player.lastDaily < oneDayMs) {
        const timeLeft = oneDayMs - (currentTime - player.lastDaily);
        const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

        return api.sendMessage(
            `⏰ Đã nhận thưởng hàng ngày rồi!\n` +
            `🕐 Còn: ${hoursLeft}h ${minutesLeft}m`,
            event.threadID
        );
    }

    // Calculate rewards based on level, VIP, etc.
    let moneyReward = 1000 + (player.level * 100);
    let expReward = 100 + (player.level * 10);
    let gemReward = 5;

    // VIP bonus
    if (player.vipLevel > 0) {
        moneyReward *= (1 + player.vipLevel * 0.1);
        expReward *= (1 + player.vipLevel * 0.1);
        gemReward += player.vipLevel;
    }

    // Prestige bonus
    if (player.prestige > 0) {
        moneyReward *= (1 + player.prestige * 0.5);
        expReward *= (1 + player.prestige * 0.5);
        gemReward += player.prestige * 2;
    }

    // Apply rewards
    player.money += Math.floor(moneyReward);
    player.exp += Math.floor(expReward);
    player.gems += gemReward;
    player.lastDaily = currentTime;

    // Full energy restore
    player.energy = player.maxEnergy;

    // Check level up
    const newLevel = calculateLevel(player.exp);
    const levelUp = newLevel > player.level;
    if (levelUp) {
        player.level = newLevel;
        player.maxEnergy += 10;
    }

    saveData(pathData, userData);

    let message = `🎁 **THƯỞNG HÀNG NGÀY**\n\n`;
    message += `💰 +${formatNumber(Math.floor(moneyReward))} xu\n`;
    message += `⭐ +${formatNumber(Math.floor(expReward))} EXP\n`;
    message += `💎 +${gemReward} gems\n`;
    message += `⚡ Năng lượng đã hồi phục đầy!\n`;

    if (levelUp) {
        message += `\n🎉 **LEVEL UP!** Cấp ${newLevel}!`;
    }

    return api.sendMessage(message, event.threadID);
}

// Help System
function showHelp(api, event, category) {
    const helpCategories = {
        main: `🎣 **ULTIMATE FISHING GAME v3.0**\n\n` +
            `📋 **Lệnh cơ bản:**\n` +
            `• \`fishing câu\` - Câu cá\n` +
            `• \`fishing info\` - Thông tin cá nhân\n` +
            `• \`fishing bag\` - Xem túi đồ\n` +
            `• \`fishing sell\` - Bán cá\n` +
            `• \`fishing shop\` - Cửa hàng\n` +
            `• \`fishing daily\` - Thưởng hàng ngày\n\n` +
            `🔥 **Tính năng nâng cao:**\n` +
            `• \`fishing location\` - Khu vực câu cá\n` +
            `• \`fishing pet\` - Hệ thống pet\n` +
            `• \`fishing collection\` - Bộ sưu tập\n` +
            `• \`fishing rank\` - Bảng xếp hạng\n\n` +
            `📖 Dùng \`fishing help [chủ đề]\` để xem chi tiết!`,

        shop: `🏪 **HỆ THỐNG CỬA HÀNG**\n\n` +
            `📝 \`fishing shop rod\` - Cần câu (30+ loại)\n` +
            `📝 \`fishing shop bait\` - Mồi câu (25+ loại)\n` +
            `📝 \`fishing shop boat\` - Thuyền bè (15+ loại)\n` +
            `📝 \`fishing shop equipment\` - Trang bị\n` +
            `📝 \`fishing shop pet\` - Thú cưng (20+ loại)\n` +
            `📝 \`fishing shop gem\` - Mua gems & VIP\n\n` +
            `💡 Mua: \`fishing buy [loại] [tên]\``,

        fishing: `🎣 **HƯỚNG DẪN CÂU CÁ**\n\n` +
            `⚡ **Năng lượng:** Cần năng lượng để câu, hồi 1 điểm/5 phút\n` +
            `🎯 **Tỉ lệ thành công:** Phụ thuộc cần câu, trang bị, pet\n` +
            `🐟 **Độ hiếm:** Common → Omnipotent (10 cấp độ)\n` +
            `📏 **Kích thước:** Ảnh hưởng giá trị và EXP\n` +
            `🌟 **Cá đặc biệt:** Mỗi khu vực có cá riêng\n\n` +
            `💡 **Tips:**\n` +
            `• Nâng cấp cần câu để tăng tỉ lệ\n` +
            `• Dùng mồi phù hợp với từng loại cá\n` +
            `• Trang bị đầy đủ để có bonus\n` +
            `• Pet hỗ trợ nhiều khía cạnh khác nhau`,

        progression: `📈 **HỆ THỐNG TIẾN TRÌNH**\n\n` +
            `⭐ **Level:** Tăng bằng EXP từ câu cá\n` +
            `💰 **Money:** Bán cá để kiếm tiền\n` +
            `💎 **Gems:** Tiền tệ premium, mua VIP/pet\n` +
            `👑 **VIP:** 10 cấp độ, bonus mọi thứ\n` +
            `🌟 **Prestige:** Tái sinh ở level 100+\n\n` +
            `🏆 **Achievements & Collection:**\n` +
            `• Thu thập tất cả loại cá\n` +
            `• Hoàn thành thành tựu\n` +
            `• Đánh bại boss fish\n` +
            `• Xây dựng streak dài`
    };

    const helpContent = helpCategories[category] || helpCategories.main;
    return api.sendMessage(helpContent, event.threadID);
}

// Main Handler Functions
module.exports.handleReply = async function ({ api, event, handleReply }) {
    // Handle reply logic would go here
    // This is for interactive menus, confirmations, etc.
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    try {
        // Initialize directories
        initializeDirectories();

        // Load user data with validation
        const userData = getPlayerData(senderID);
        if (!userData || !userData[senderID]) {
            return api.sendMessage(`❌ Lỗi tải dữ liệu người chơi!`, threadID);
        }

        const player = userData[senderID];

        // Auto-save user name with error handling
        if (!player.name) {
            try {
                const userInfo = await api.getUserInfo(senderID);
                if (userInfo && userInfo[senderID] && userInfo[senderID].name) {
                    player.name = userInfo[senderID].name.substring(0, 50); // Limit length
                } else {
                    player.name = `Player${senderID.slice(-4)}`;
                }
                saveData(pathData, userData);
            } catch (error) {
                console.warn("Could not get user info:", error);
                player.name = `Player${senderID.slice(-4)}`;
                saveData(pathData, userData);
            }
        }

        // Parse command with validation
        const command = args && args[0] ? sanitizeInput(args[0]).toLowerCase() : '';

        // Check for achievements after each action
        if (command && !['help', 'h', 'hướng'].includes(command)) {
            try {
                checkAchievements(api, event, userData, senderID);
            } catch (error) {
                console.warn("Achievement check error:", error);
            }
        }

        switch (command) {
            // Core Fishing
            case "câu":
            case "fish":
            case "c":
                return performFishing(api, event, userData, senderID);

            // Player Info
            case "info":
            case "profile":
            case "me":
                return showPlayerInfo(api, event, userData, senderID);
            // Inventory Management  
            case "bag":
            case "túi":
            case "inventory":
                return viewInventory(api, event, userData, senderID);

            case "sell":
            case "bán":
                return sellFish(api, event, userData, senderID, args);

            // Shopping
            case "shop":
            case "cửa":
                return showShop(api, event, userData, senderID, args);

            case "buy":
            case "mua":
                return buyItem(api, event, userData, senderID, args);

            // Location
            case "location":
            case "move":
            case "khu":
            case "đi":
                return args[1] ? moveToLocation(api, event, userData, senderID, args.slice(1).join(" "))
                    : showLocations(api, event, userData, senderID);

            // Pet System
            case "pet":
            case "thú":
                return handlePetCommand(api, event, userData, senderID, args);

            // Collection & Progress
            case "collection":
            case "sưu":
                return showCollection(api, event, userData, senderID);

            case "rank":
            case "leaderboard":
            case "bxh":
                return showLeaderboard(api, event, userData, senderID, args[1]);

            // Daily System
            case "daily":
            case "nhận":
                return claimDailyReward(api, event, userData, senderID);

            // Help System
            case "help":
            case "hướng":
            case "h":
                return showHelp(api, event, args[1]);

            case "auto":
            case "auto-fishing":
                return startAutoFishing(api, event, userData, senderID, args[1]);
            case "autostop":
                return stopAutoFishing(api, event, userData, senderID);

            // AFK Fishing
            case "afk":
            case "treo":
                return startAFKFishing(api, event, userData, senderID);
            case "afkstop":
                return stopAFKFishing(api, event, userData, senderID);

            // Tournament
            case "tournament":
            case "giải":
                if (args[1] === "start" && senderID === "your_admin_id") {
                    return startTournament(api, event, userData);
                } else if (args[1] === "join") {
                    return joinTournament(api, event, userData, senderID);
                } else if (args[1] === "status") {
                    return getTournamentStatus(api, event, userData, senderID);
                } else {
                    return getTournamentStatus(api, event, userData, senderID);
                }

            // Rod Upgrade
            case "upgrade":
            case "nâng":
                return upgradeRod(api, event, userData, senderID, args[1]);

            // Crafting
            case "craft":
            case "chế":
                if (args.length < 2) {
                    return showCrafting(api, event, userData, senderID);
                } else {
                    return craftItem(api, event, userData, senderID, args);
                }

            // Achievements
            case "achievements":
            case "thành":
                return showAchievements(api, event, userData, senderID);

            // Settings
            case "settings":
            case "cài":
                if (args.length < 2) {
                    return showSettings(api, event, userData, senderID);
                } else {
                    return updateSettings(api, event, userData, senderID, args);
                }

            // Admin/Debug Commands (if needed)
            case "reset":
                if (senderID === "100038946913086") {
                    delete userData[senderID];
                    saveData(pathData, userData);
                    return api.sendMessage("✅ Đã reset dữ liệu!", threadID);
                }
                break;

            default:
                return showHelp(api, event);
        }

    } catch (error) {
        console.error("Main run error:", error);
        return api.sendMessage(`❌ Đã xảy ra lỗi! Vui lòng thử lại sau.`, threadID);
    }
};

function cleanupTimeouts(player) {
    if (player && player.timeouts && Array.isArray(player.timeouts)) {
        player.timeouts.forEach(timeoutId => {
            try {
                clearTimeout(timeoutId);
            } catch (error) {
                console.warn("Error clearing timeout:", error);
            }
        });
        player.timeouts = [];
    }
}
