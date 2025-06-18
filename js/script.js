window.onload = function() {

    // --- 1. SELEÇÃO DE ELEMENTOS DO DOM ---
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const soundPermissionPopup = document.getElementById("soundPermissionPopup");
    const allowSoundBtn = document.getElementById("allowSoundBtn");
    const denySoundBtn = document.getElementById("denySoundBtn");
    const introScreen = document.getElementById("introScreen");
    const playButton = document.getElementById("playButton");
    const introVideo = document.getElementById("introVideo");
    const introMusic = document.getElementById("introMusic");
    const gameMusic = document.getElementById("gameMusic");
    const shotSound = document.getElementById("shotSound");
    const plasmaSound = document.getElementById("plasmaSound");
    const gameOverSound = document.getElementById("gameOverSound");
    const bossMusic = document.getElementById("bossMusic");
    const scoreContainer = document.getElementById("scoreContainer");
    const scoreDigits = [
        document.getElementById("scoreDigit0"),
        document.getElementById("scoreDigit1"),
        document.getElementById("scoreDigit2"),
        document.getElementById("scoreDigit3"),
        document.getElementById("scoreDigit4"),
    ];
    const xpBarContainer = document.getElementById("xpBarContainer");
    const healthBarContainer = document.getElementById("healthBarContainer");
    const heatBarContainer = document.getElementById("heatBarContainer");
    const heatBarFill = document.getElementById("heatBarFill");
    const heatText = document.getElementById("heatText");
    const levelUpScreen = document.getElementById("levelUpScreen");
    const rerollButton = document.getElementById("rerollButton");
    const controls = document.getElementById("controls");
    const gameOverScreen = document.getElementById("gameOverScreen");
    const restartButton = document.getElementById("restartButton");
    const bossHealthBarContainer = document.getElementById("bossHealthBarContainer");
    const bossHealthText = document.getElementById("bossHealthText");
    const bossWarningBorder = document.getElementById("bossWarningBorder");
    const cheatMenu = document.getElementById("cheatMenu");
    const cheatPowerupList = document.getElementById("cheatPowerupList");
    const closeCheatMenuBtn = document.getElementById("closeCheatMenuBtn");
    const pauseMenu = document.getElementById("pauseMenu");
    const resumeButton = document.getElementById("resumeButton");
    const restartFromPauseButton = document.getElementById("restartFromPauseButton");
    const abilityCooldownsContainer = document.getElementById("abilityCooldownsContainer");
    const passivePowerupsContainer = document.getElementById("passivePowerupsContainer");
    const damageFlashEffect = document.getElementById("damageFlashEffect");
    const notificationContainer = document.getElementById("notificationContainer");
    // Mobile Controls
    const mobileControls = document.getElementById('mobileControls');
    const joystickBase = document.getElementById('joystickBase');
    const joystickStick = document.getElementById('joystickStick');
    const mobileAbilityButtons = document.getElementById('mobileAbilityButtons');


    // --- MELHORIA: CENTRALIZAÇÃO DE CONSTANTES ---
    const gameConfig = {
        player: {
            maxHealth: 100, baseDamage: 10, armor: 0, fireRate: 6, moveSpeed: 1.5,
            critChance: 0.05, critDamage: 1.5, projectileSpeed: 5.5, projectileRange: 1000,
            xpCollectionRadius: 100, cooldownReduction: 1, rotationSpeed: 0.13, luck: 0.1,
            size: 15, bobbingSpeed: 400, bobbingAmount: 2, tiltAmount: 0.25
        },
        asteroid: {
            small:  { radius: 15, health: 10,  damage: 15, xpReward: 1 },
            medium: { radius: 30, health: 40,  damage: 30, xpReward: 5 },
            large:  { radius: 50, health: 100, damage: 60, xpReward: 7 },
            baseSpeed: 2
        },
        boss: {
            terra: { health: 500, damage: 100, speed: 0.7 },
            mars: { health: 800 * 0.65, damage: 120, speed: 0.4 * 1.2, turretDamage: 15 * 1.3, laserDamagePerFrame: 0.5 * 1.3 }
        },
        abilities: {
            plasmaCannon:     { cooldown: 360, damageMultiplier: 3 },
            energyBlade:      { cooldown: 1200, duration: 600 },
            staticPulse:      { cooldown: 300, damageMultiplier: 3 },
            emergencyTeleport:{ cooldown: 180, distance: 150 },
            invisibilityCloak:{ cooldown: 600, duration: 300 },
            shieldOvercharge: { cooldown: 600, duration: 180, healthCost: 0.2 },
            reactiveShield:   { cooldown: 1800, duration: 120 },
            repulsionField:   { cooldown: 1800, radius: 105, force: 10 }
        },
        pooling: { initialBulletPool: 100, initialParticlePool: 300, initialXpOrbPool: 50 }
    };


    // --- 2. ESTADO INICIAL E VARIÁVEIS GLOBAIS DO JOGO ---
    let animationFrameId = null;
    let soundEnabled = false;
    let isMobileDevice = false;

    const gameState = {
        paused: false, isLevelingUp: false, level: 1, xp: 0, xpRequired: 5,
        rerollsAvailableThisLevel: 1, sector: 1, time: 0, score: 0, bossActive: false,
        postBossMode: false, bossDefeats: 0, isGameOver: false
    };

    const initialPlayerStats = {
        maxHealth: gameConfig.player.maxHealth, health: gameConfig.player.maxHealth,
        baseDamage: gameConfig.player.baseDamage, armor: gameConfig.player.armor,
        fireRate: gameConfig.player.fireRate, moveSpeed: gameConfig.player.moveSpeed,
        critChance: gameConfig.player.critChance, critDamage: gameConfig.player.critDamage,
        projectileSpeed: gameConfig.player.projectileSpeed, projectileRange: gameConfig.player.projectileRange,
        xpCollectionRadius: gameConfig.player.xpCollectionRadius, cooldownReduction: gameConfig.player.cooldownReduction,
        rotationSpeed: gameConfig.player.rotationSpeed, luck: gameConfig.player.luck
    };
    let playerStats = { ...initialPlayerStats };

    const initialPlayerEffects = {
        bifurcatedShot: { active: false, level: 0 },
        plasmaCannon: { active: false, charges: 0, maxCharges: 4, cooldown: 0, maxCooldown: gameConfig.abilities.plasmaCannon.cooldown },
        missileStorm: { active: false, shotCount: 0, shotsNeeded: 10 },
        orbitalDrones: { active: false, drones: [] },
        energyBlade: { active: false, duration: 0, cooldown: 0, maxCooldown: gameConfig.abilities.energyBlade.cooldown, maxDuration: gameConfig.abilities.energyBlade.duration, angle: 0 },
        ricochetShot: false,
        chainLightning: { active: false, chance: 0.15, bounces: 2, damage: 0.5 },
        battleFrenzy: { active: false, timer: 0, maxTime: 300 },
        staticPulse: { active: false, cooldown: 0, maxCooldown: gameConfig.abilities.staticPulse.cooldown },
        spectralCannon: false,
        reactiveShield: { active: false, cooldown: 0, maxCooldown: gameConfig.abilities.reactiveShield.cooldown, duration: 0, maxDuration: gameConfig.abilities.reactiveShield.duration },
        repulsionField: { active: false, radius: gameConfig.abilities.repulsionField.radius, force: gameConfig.abilities.repulsionField.force, cooldown: 0, maxCooldown: gameConfig.abilities.repulsionField.cooldown },
        emergencyTeleport: { active: false, cooldown: 0, maxCooldown: gameConfig.abilities.emergencyTeleport.cooldown },
        nanobotRegeneration: false,
        invisibilityCloak: { active: false, cooldown: 0, maxCooldown: gameConfig.abilities.invisibilityCloak.cooldown, duration: 0, maxDuration: gameConfig.abilities.invisibilityCloak.duration },
        shieldOvercharge: { active: false, cooldown: 0, maxCooldown: gameConfig.abilities.shieldOvercharge.cooldown, duration: 0, maxDuration: gameConfig.abilities.shieldOvercharge.duration },
        hullShield: { active: false, shield: 0, maxShield: 0 }
    };
    let playerEffects = JSON.parse(JSON.stringify(initialPlayerEffects));

    const player = { x: 0, y: 0, angle: 0, targetAngle: 0, vx: 0, vy: 0, size: gameConfig.player.size, invisible: false, bobbingPhase: Math.random() * Math.PI * 2 };
    
    const objectPools = { bullets: [], particles: [], xpOrbs: [] };
    const bullets = [], asteroids = [], particles = [], missiles = [], xpOrbs = [], satellites = [], blueMeteors = [], lightningBolts = [], bossProjectiles = [];
    
    let boss = null, lastSatelliteLaunch = 0, lastBlueMeteorWaveTime = 0;
    const keys = {};
    let mouseDown = false;

    // Mobile Joystick State
    const joystick = {
        active: false,
        touchId: null,
        baseX: 0, baseY: 0,
        stickX: 0, stickY: 0,
        moveX: 0, moveY: 0
    };

    let keySequence = [];
    let sequenceTimeout;

    // Imagens do Jogo e UI
    const playerShipImage = new Image(); playerShipImage.src = "assets/images/player_ship.png";
    const projectileImage = new Image(); projectileImage.src = "assets/images/projectile.png";
    const asteroidImage = new Image(); asteroidImage.src = "assets/images/asteroid.png";
    const backgroundImage = new Image(); backgroundImage.src = "assets/images/background.png";
    const earthImage = new Image(); earthImage.src = "assets/images/terra.png";
    const moonImage = new Image(); moonImage.src = "assets/images/lua.png";
    const satelliteImage = new Image(); satelliteImage.src = "assets/images/satelite.png";
    const satelliteRedImage = new Image(); satelliteRedImage.src = "assets/images/satelitered.png";
    const blueMeteorImage = new Image(); blueMeteorImage.src = "assets/images/meteoroazul.png";
    const destroyedShipImage = new Image(); destroyedShipImage.src = "assets/images/Navedestruida.png";
    const restartButtonImage = new Image(); restartButtonImage.src = "assets/images/botaojogarnovamente.png";
    const gameOverMessageImage = new Image(); gameOverMessageImage.src = "assets/images/ruim.png";
    const plasmaShotImage = new Image(); plasmaShotImage.src = "assets/images/esferaplasma.png"; 
    const energyBladeImage = new Image(); energyBladeImage.src = "assets/images/lamina.png"; 
    const marsImage = new Image(); marsImage.src = "assets/images/marte.png";
    const marsShipImage = new Image(); marsShipImage.src = "assets/images/navemarte.png";
    
    const iconImages = {
        staticPulse: 'assets/icons/static_pulse.png', emergencyTeleport: 'assets/icons/teleport.png',
        energyBlade: 'assets/icons/energy_blade.png', invisibilityCloak: 'assets/icons/invisibility.png',
        shieldOvercharge: 'assets/icons/shield_overcharge.png', plasmaCannon: 'assets/icons/plasma_cannon.png',
        ricochetShot: 'assets/icons/ricochet.png', nanobotRegeneration: 'assets/icons/regen.png',
        spectralCannon: 'assets/icons/spectral.png'
    };

    const numberImages = [];
    for(let i=0; i < 10; i++) { numberImages[i] = new Image(); numberImages[i].src = `assets/images/${i}.png`; }

    const cardDatabase = [
        { id: "bifurcated_shot", name: "Tiro Bifurcado", description: "Adiciona +1 projétil ao disparo (máx. 4), mas reduz o dano de cada um para 70%.", type: "attack" },
        { id: "plasma_cannon", name: "Canhão de Plasma", description: "Tecla 'K': Dispara um tiro carregado massivo. Ganha +1 carga por upgrade.", type: "attack", key: 'K' },
        { id: "missile_storm", name: "Tormenta de Mísseis", description: "Passivo: Lança uma salva de 8 mísseis a cada 10 disparos. Upgrades reduzem a contagem em -1.", type: "attack" },
        { id: "orbital_drones", name: "Drones Orbitais", description: "Gera um drone que dispara automaticamente em inimigos próximos.", type: "attack" },
        { id: "energy_blade", name: "Lâmina de Energia", description: "Tecla 'J': Ativa uma lâmina giratória por 10s que causa dano contínuo. Recarga: 20s.", type: "attack", key: 'J' },
        { id: "ricochet_shot", name: "Tiro Ricochete", description: "Seus projéteis ricocheteiam nas bordas da tela até 2 vezes.", type: "attack" },
        { id: "chain_lightning", name: "Cadeia de Raios", description: "15% de chance dos tiros criarem um raio que salta para inimigos. Upgrades adicionam +1 salto.", type: "attack" },
        { id: "battle_frenzy", name: "Frenesi de Batalha", description: "Aumenta a cadência de tiro em 50% por 5s após destruir um inimigo.", type: "attack" },
        { id: "static_pulse", name: "Pulso Estático", description: "Tecla 'U': Emite uma onda de choque que causa dano em área. Recarga: 5s.", type: "attack", key: 'U' },
        { id: "spectral_cannon", name: "Canhão Espectral", description: "Seus projéteis atravessam inimigos, podendo atingir múltiplos alvos.", type: "attack" },
        { id: "reactive_shield", name: "Escudo Reativo", description: "Ao receber dano, bloqueia todos os ataques por 2s. Recarrega em 30s.", type: "defense" },
        { id: "maneuver_thrusters", name: "Propulsores de Manobra", description: "Aumenta a velocidade de movimento em 25%.", type: "defense" },
        { id: "adamantium_plating", name: "Placas de Adamântio", description: "Aumenta a vida máxima em +50 e a armadura em +5.", type: "defense" },
        { id: "repulsion_field", name: "Campo de Repulsão", description: "Emite um pulso de repulsão a cada 30s. Upgrades diminuem a recarga e aumentam o raio.", type: "defense" },
        { id: "emergency_teleport", name: "Teleporte de Emergência", description: "Tecla 'P': Teleporta a nave para frente. Recarga: 3s.", type: "defense", key: 'P' },
        { id: "nanobot_regeneration", name: "Regeneração Nanobótica", description: "Regenera 0.5% da vida máxima por segundo.", type: "defense" },
        { id: "invisibility_cloak", name: "Manto de Invisibilidade", description: "Tecla 'I': Fica invisível e ignora colisões por 5s. Recarga: 10s.", type: "defense", key: 'I' },
        { id: "shield_overcharge", name: "Sobrecarga de Escudo", description: "Tecla 'O': Fica invulnerável por 3s, mas consome 20% da vida atual. Recarga: 10s.", type: "defense", key: 'O' },
        { id: "fine_calibration", name: "Calibragem Fina", description: "Aumenta a velocidade dos projéteis em 20%.", type: "attribute" },
        { id: "combat_focus", name: "Foco de Combate", description: "Aumenta a chance de crítico em +5%.", type: "attribute" },
        { id: "improved_reactor", name: "Reator Aprimorado", description: "Aumenta a cadência de tiro em 25%.", type: "attribute" },
        { id: "expansion_modules", name: "Módulos de Expansão", description: "Aumenta o alcance dos tiros em 30%.", type: "attribute" },
        { id: "target_analyzer", name: "Analisador de Alvos", description: "Aumenta o dano crítico em +50%.", type: "attribute" },
        { id: "magnetic_collector", name: "Coletor Magnético", description: "Aumenta o raio de coleta de XP em 20%.", type: "attribute" },
        { id: "cooldown_reducer", name: "Redutor de Recarga", description: "Diminui a recarga de todas as habilidades em 10%.", type: "attribute" },
        { id: "explorer_luck", name: "Sorte do Explorador", description: "Aumenta a sorte (chance de XP dobrado e cartas raras) em +1%.", type: "attribute" },
        { id: "reinforced_chassis", name: "Chassi Reforçado", description: "Aumenta a vida máxima em +35.", type: "health" },
        { id: "armor_plating", name: "Placas de Blindagem", description: "Adiciona +3 de armadura.", type: "health" },
        { id: "hull_shield", name: "Escudo de Fuselagem", description: "Converte 30% da vida máxima em um escudo que se regenera lentamente.", type: "health" }
    ];

    // --- 3. DEFINIÇÕES DE FUNÇÕES ---

    function isMobile() {
        return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    }
    
    function getFromPool(poolName) {
        const pool = objectPools[poolName];
        if (pool.length > 0) {
            const obj = pool.pop();
            obj.active = true;
            return obj;
        }
        return { active: true };
    }

    function returnToPool(obj, poolName) {
        obj.active = false;
        objectPools[poolName].push(obj);
    }
    
    function prewarmPools() {
        for (let i = 0; i < gameConfig.pooling.initialBulletPool; i++) objectPools.bullets.push({ active: false });
        for (let i = 0; i < gameConfig.pooling.initialParticlePool; i++) objectPools.particles.push({ active: false });
        for (let i = 0; i < gameConfig.pooling.initialXpOrbPool; i++) objectPools.xpOrbs.push({ active: false });
    }

    // --- FUNÇÕES DE HABILIDADE (Refatorado para fácil chamada) ---
    function triggerPlasmaCannon() {
        if (playerEffects.plasmaCannon.active && playerEffects.plasmaCannon.charges > 0 && playerEffects.plasmaCannon.cooldown <= 0) {
            firePlasmaShot();
            playerEffects.plasmaCannon.charges--;
            if (playerEffects.plasmaCannon.charges <= 0) {
                playerEffects.plasmaCannon.cooldown = playerEffects.plasmaCannon.maxCooldown * playerStats.cooldownReduction;
            }
            updateUI();
        }
    }
    function triggerEnergyBlade() {
        if (playerEffects.energyBlade.active && playerEffects.energyBlade.cooldown <= 0) {
            playerEffects.energyBlade.duration = playerEffects.energyBlade.maxDuration;
            playerEffects.energyBlade.cooldown = playerEffects.energyBlade.maxCooldown * playerStats.cooldownReduction;
        }
    }
    function triggerStaticPulse() {
        if (playerEffects.staticPulse.active && playerEffects.staticPulse.cooldown <= 0) {
            for (let a of asteroids) { if(Math.hypot(player.x - a.x, player.y - a.y) < 200) a.health -= playerStats.baseDamage * gameConfig.abilities.staticPulse.damageMultiplier; }
            createParticles(player.x, player.y, 50, "#FFFF00", 3);
            playerEffects.staticPulse.cooldown = playerEffects.staticPulse.maxCooldown * playerStats.cooldownReduction;
        }
    }
    function triggerEmergencyTeleport() {
         if (playerEffects.emergencyTeleport.active && playerEffects.emergencyTeleport.cooldown <= 0) {
            player.x += Math.cos(player.angle) * gameConfig.abilities.emergencyTeleport.distance; 
            player.y += Math.sin(player.angle) * gameConfig.abilities.emergencyTeleport.distance;
            createParticles(player.x, player.y, 20, "#00FFFF", 2.5);
            playerEffects.emergencyTeleport.cooldown = playerEffects.emergencyTeleport.maxCooldown * playerStats.cooldownReduction;
        }
    }
    function triggerInvisibilityCloak() {
         if (playerEffects.invisibilityCloak.active && playerEffects.invisibilityCloak.cooldown <= 0) {
            playerEffects.invisibilityCloak.duration = playerEffects.invisibilityCloak.maxDuration;
            playerEffects.invisibilityCloak.cooldown = playerEffects.invisibilityCloak.maxCooldown * playerStats.cooldownReduction;
        }
    }
    function triggerShieldOvercharge() {
        if (playerEffects.shieldOvercharge.active && playerEffects.shieldOvercharge.cooldown <= 0) {
            const healthCost = playerStats.maxHealth * gameConfig.abilities.shieldOvercharge.healthCost;
            if(playerStats.health > healthCost) {
                playerStats.health -= healthCost;
                playerEffects.shieldOvercharge.duration = playerEffects.shieldOvercharge.maxDuration;
                playerEffects.shieldOvercharge.cooldown = playerEffects.shieldOvercharge.maxCooldown * playerStats.cooldownReduction;
            }
        }
    }
    
    // Mapeia IDs de habilidade para suas funções de gatilho
    const abilityTriggers = {
        plasmaCannon: triggerPlasmaCannon,
        energyBlade: triggerEnergyBlade,
        staticPulse: triggerStaticPulse,
        emergencyTeleport: triggerEmergencyTeleport,
        invisibilityCloak: triggerInvisibilityCloak,
        shieldOvercharge: triggerShieldOvercharge
    };

    function createAsteroid(size, x, y, isFragment = false) {
        const speedMultiplier = 1 + (gameState.bossDefeats * 0.20);
        const baseSpeed = gameConfig.asteroid.baseSpeed;
        const speed = baseSpeed * speedMultiplier;
        const config = gameConfig.asteroid[size];

        const asteroid = { 
            x: x || Math.random() * canvas.width, y: y || Math.random() * canvas.height, 
            angle: Math.random() * Math.PI * 2, angularVelocity: (Math.random() - 0.5) * 0.1, 
            size: size, isFragment: isFragment, targetSpeed: speed,
            radius: config.radius, health: config.health, damage: config.damage,
            xpReward: config.xpReward, maxHealth: config.health
        };

        if (isFragment) {
            const angle = Math.random() * Math.PI * 2;
            const pushSpeed = speed * 2.5;
            asteroid.vx = Math.cos(angle) * pushSpeed;
            asteroid.vy = Math.sin(angle) * pushSpeed;
        } else {
            asteroid.vx = (Math.random() - 0.5) * speed; 
            asteroid.vy = (Math.random() - 0.5) * speed; 
        }

        if (!isFragment && Math.hypot(asteroid.x - player.x, asteroid.y - player.y) < 200) { 
            asteroid.x = player.x + (Math.random() > 0.5 ? 250 : -250); 
            asteroid.y = player.y + (Math.random() > 0.5 ? 250 : -250); 
        }
        asteroids.push(asteroid);
    }

    function createBlueMeteor() {
        const radius = (15 * 0.7) * 1.35;
        const x = Math.random() * canvas.width;
        const y = -radius;
        const speedMultiplier = 1 + (gameState.bossDefeats * 0.20);
        blueMeteors.push({ x: x, y: y, vx: (Math.random() - 0.5) * 2, vy: (2 + Math.random()) * speedMultiplier, radius: radius, damage: 20 });
    }

    function createBullet(x, y, angle, speed = playerStats.projectileSpeed, damage = playerStats.baseDamage, special = {}) {
        if (soundEnabled && !special.plasma) {
            shotSound.currentTime = 0;
            shotSound.volume = 0.5;
            shotSound.play();
        }
        if (playerEffects.missileStorm.active) {
            playerEffects.missileStorm.shotCount++;
            if (playerEffects.missileStorm.shotCount >= playerEffects.missileStorm.shotsNeeded) {
                launchMissileSalvo();
                playerEffects.missileStorm.shotCount = 0;
            }
        }
        
        const b = getFromPool('bullets');
        b.x = x; b.y = y; b.vx = Math.cos(angle) * speed; b.vy = Math.sin(angle) * speed;
        b.damage = damage; b.life = playerStats.projectileRange / speed;
        b.special = special; b.rotation = 0; b.bounced = 0; b.hitTargets = [];
        bullets.push(b);
    }

    function createBossProjectile(x, y, vx, vy, damage = 10) {
        bossProjectiles.push({ x, y, vx, vy, damage, life: 300, radius: 5 });
    }

    function firePlasmaShot() {
        if (soundEnabled) {
            plasmaSound.currentTime = 0;
            plasmaSound.volume = 0.7;
            plasmaSound.play();
        }
        const special = { plasma: true, size: player.size * 5 };
        createBullet(player.x, player.y, player.angle, playerStats.projectileSpeed * 0.8, playerStats.baseDamage * gameConfig.abilities.plasmaCannon.damageMultiplier, special);
    }

    function createMissile(x, y, target, initialAngle) {
        const impulseForce = 4;
        missiles.push({
            x, y, target, vx: Math.cos(initialAngle) * impulseForce, vy: Math.sin(initialAngle) * impulseForce,
            speed: 6, damage: playerStats.baseDamage * 0.5, life: 300, angle: initialAngle, homingDelay: 15
        });
    }

    function launchMissileSalvo() {
        const enemies = [...asteroids, ...satellites].filter(e => e.health > 0);
        enemies.sort((a, b) => Math.hypot(player.x - a.x, player.y - a.y) - Math.hypot(player.x - b.x, player.y - b.y));
        if (enemies.length === 0) return;
        const rightOffsetAngle = player.angle + Math.PI / 2, leftOffsetAngle = player.angle - Math.PI / 2;
        const spawnDist = 15;
        const rightSpawnX = player.x + Math.cos(rightOffsetAngle) * spawnDist;
        const rightSpawnY = player.y + Math.sin(rightOffsetAngle) * spawnDist;
        const leftSpawnX = player.x + Math.cos(leftOffsetAngle) * spawnDist;
        const leftSpawnY = player.y + Math.sin(leftOffsetAngle) * spawnDist;
        const totalMissiles = 8;
        for (let i = 0; i < totalMissiles; i++) {
            const target = enemies[i % enemies.length];
            const side = i < totalMissiles / 2 ? -1 : 1;
            const spawnX = side === -1 ? leftSpawnX : rightSpawnX;
            const spawnY = side === -1 ? leftSpawnY : rightSpawnY;
            const randomAngleOffset = (Math.random() - 0.5) * 1.2; 
            const initialAngle = player.angle + (side * 0.7) + randomAngleOffset;
            createMissile(spawnX, spawnY, target, initialAngle);
        }
    }
    
    function createXPOrb(x, y, amount) {
        const orb = getFromPool('xpOrbs');
        orb.x = x; orb.y = y; orb.vx = (Math.random() - 0.5) * 2;
        orb.vy = (Math.random() - 0.5) * 2; orb.amount = amount; orb.life = 1000;
        xpOrbs.push(orb);
    }

    function createParticles(x, y, count, color = "#fff", maxSize = 4, lifeSpan = 20) {
        for (let i = 0; i < count; i++) {
            const p = getFromPool('particles');
            p.x = x; p.y = y; p.vx = (Math.random() - 0.5) * (maxSize * 2);
            p.vy = (Math.random() - 0.5) * (maxSize * 2);
            p.life = lifeSpan + Math.random() * lifeSpan;
            p.maxLife = p.life; p.color = color;
            p.size = 1 + Math.random() * (maxSize - 1);
            particles.push(p);
        }
    }

    function createLightningBolt(x, y, firstTarget, bounces, damage, alreadyHit) {
        lightningBolts.push({
            target: firstTarget, bouncesLeft: bounces, damage: damage,
            hitTargets: alreadyHit, path: [{x: x, y: y}, {x: firstTarget.x, y: firstTarget.y}], life: 15 
        });
        if(firstTarget.health > 0) firstTarget.health -= damage;
    }

    function spawnNextBoss() {
        if (gameState.bossDefeats % 2 === 0) spawnTerraBoss(); else spawnMarsBoss();
    }

    function createSatellite(x, y, side) {
        const baseAngle = Math.PI / 2; const separationAngle = Math.PI / 4;
        const spawnAngle = baseAngle + (side * separationAngle);
        const spawnX = x + Math.cos(spawnAngle) * (boss.radius + 10);
        const spawnY = y + Math.sin(spawnAngle) * (boss.radius + 10);
        const isElite = Math.random() < 0.20;

        if (isElite) {
            satellites.push({ x: spawnX, y: spawnY, vx: 0, vy: 0, speed: 1.0, radius: 30, damage: 20 * 1.20, health: 30, isElite: true });
        } else {
            const impulseAngle = Math.random() * Math.PI * 2; const impulseForce = 10;
            satellites.push({ x: spawnX, y: spawnY, vx: Math.cos(impulseAngle) * impulseForce, vy: Math.sin(impulseAngle) * impulseForce,
                speed: 1.8, radius: 20, damage: 20, health: 10, isElite: false, homingDelay: 45 });
        }
    }

    function spawnTerraBoss() {
        if (soundEnabled) { gameMusic.pause(); bossMusic.currentTime = 0; bossMusic.play(); }
        gameState.bossActive = true; gameState.postBossMode = false;
        bossHealthBarContainer.classList.remove('hidden');
        bossHealthText.textContent = "Terra, o Explorador";
        bossWarningBorder.classList.remove('hidden');
        
        const bossSpeedMultiplier = 1 + (gameState.bossDefeats * 0.20);
        const healthMultiplier = 1 + gameState.bossDefeats * 0.5;

        boss = { type: 'terra', x: canvas.width / 2, y: -100, vx: 0, vy: 1, hasEntered: false, radius: 80,
            initialVx: gameConfig.boss.terra.speed * bossSpeedMultiplier, health: gameConfig.boss.terra.health * healthMultiplier,
            maxHealth: gameConfig.boss.terra.health * healthMultiplier, damage: gameConfig.boss.terra.damage,
            moon: { angle: 0, distance: 120, radius: 16 }
        };
        lastSatelliteLaunch = Date.now();
    }

    function spawnMarsBoss() {
        if (soundEnabled) { gameMusic.pause(); bossMusic.currentTime = 0; bossMusic.play(); }
        gameState.bossActive = true; gameState.postBossMode = false;
        bossHealthBarContainer.classList.remove('hidden');
        bossHealthText.textContent = "Marte, o Conquistador";
        bossWarningBorder.classList.remove('hidden');
    
        const bossSpeedMultiplier = 1.2;
        const marsHealth = gameConfig.boss.mars.health * (1 + gameState.bossDefeats * 0.5);

        boss = { type: 'marte', x: canvas.width / 2, y: -100, vx: 0, vy: 1, hasEntered: false, radius: 90,
            initialVx: gameConfig.boss.mars.speed * bossSpeedMultiplier, health: marsHealth, maxHealth: marsHealth,
            damage: gameConfig.boss.mars.damage,
            turrets: [
                { xOffset: -105, yOffset: 0, health: 100, fireCooldown: 0, fireRate: 60, radius: 20, animationPhase: Math.random() * Math.PI * 2 },
                { xOffset: 105, yOffset: 0, health: 100, fireCooldown: 0, fireRate: 60, radius: 20, animationPhase: Math.random() * Math.PI * 2 }
            ],
            laserShips: [
                { side: 'left', initialY: canvas.height / 3, y: canvas.height / 3, health: 150, state: 'idle', timer: 420, animationPhase: Math.random() * Math.PI * 2, currentX: -50, targetX: -50 },
                { side: 'right', initialY: canvas.height / 3 * 2, y: canvas.height / 3 * 2, health: 150, state: 'idle', timer: 420, animationPhase: Math.random() * Math.PI * 2, currentX: canvas.width + 50, targetX: canvas.width + 50 }
            ],
            lasers: []
        };
    }

    function activateRepulsionPulse() {
        const radius = playerEffects.repulsionField.radius;
        for(let i = 0; i < 360; i += 10) {
            const angle = i * Math.PI / 180;
            createParticles(player.x + Math.cos(angle) * radius, player.y + Math.sin(angle) * radius, 1, '#87CEEB');
        }
        const force = playerEffects.repulsionField.force;
        [...asteroids, ...satellites, ...blueMeteors].forEach(target => {
            if (Math.hypot(player.x - target.x, player.y - target.y) < radius) {
                const angle = Math.atan2(target.y - player.y, target.x - player.x);
                target.vx += Math.cos(angle) * force; target.vy += Math.sin(angle) * force;
                if (target.size && !target.isFragment) target.isFragment = true; 
            }
        });
    }
    
    function updateRepulsionField() {
        if (!playerEffects.repulsionField.active) return;
        if (playerEffects.repulsionField.cooldown > 0) playerEffects.repulsionField.cooldown--;
        if (playerEffects.repulsionField.cooldown <= 0) {
            activateRepulsionPulse();
            playerEffects.repulsionField.cooldown = playerEffects.repulsionField.maxCooldown * playerStats.cooldownReduction;
        }
    }


    function updatePlayer() {
        player.invisible = playerEffects.invisibilityCloak.duration > 0;
        
        // Combina inputs do teclado e do joystick
        let moveX = (keys["KeyD"] ? 1 : 0) - (keys["KeyA"] ? 1 : 0) + joystick.moveX;
        let moveY = (keys["KeyS"] ? 1 : 0) - (keys["KeyW"] ? 1 : 0) + joystick.moveY;

        if (moveX !== 0 || moveY !== 0) {
            player.targetAngle = Math.atan2(moveY, moveX);
        }

        let angleDiff = player.targetAngle - player.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        player.angle += angleDiff * playerStats.rotationSpeed;
        
        const thrustPower = 0.4 * playerStats.moveSpeed;
        player.vx += moveX * thrustPower;
        player.vy += moveY * thrustPower;
    
        player.vx *= 0.95; player.vy *= 0.95;
        const maxSpeed = playerStats.moveSpeed * 1.5;
        const speed = Math.hypot(player.vx, player.vy);
        if (speed > maxSpeed) { player.vx = (player.vx / speed) * maxSpeed; player.vy = (player.vy / speed) * maxSpeed; }
        player.x += player.vx; player.y += player.vy;

        if (gameState.bossActive) {
            if (player.x - player.size < 0) player.x = player.size;
            if (player.x + player.size > canvas.width) player.x = canvas.width - player.size;
            if (player.y - player.size < 0) player.y = player.size;
            if (player.y + player.size > canvas.height) player.y = canvas.height - player.size;
        } else {
            if (player.x < 0) player.x = canvas.width; if (player.x > canvas.width) player.x = 0;
            if (player.y < 0) player.y = canvas.height; if (player.y > canvas.height) player.y = 0;
        }
    
        Object.values(playerEffects).forEach(effect => { 
            if (effect && typeof effect === 'object' && effect.cooldown > 0) effect.cooldown--; 
            if (effect && typeof effect === 'object' && effect.duration > 0) effect.duration--;
        });

        updateRepulsionField();
        if (playerEffects.battleFrenzy.active && playerEffects.battleFrenzy.timer > 0) playerEffects.battleFrenzy.timer--;
        if (playerEffects.nanobotRegeneration && playerStats.health < playerStats.maxHealth) playerStats.health += (playerStats.maxHealth * 0.005) / 60;
        if (playerEffects.hullShield.active && playerEffects.hullShield.shield < playerEffects.hullShield.maxShield) playerEffects.hullShield.shield += 0.1;
        playerStats.health = Math.min(playerStats.health, playerStats.maxHealth);
    
        if (playerEffects.plasmaCannon.active && playerEffects.plasmaCannon.cooldown > 0) {
            if (playerEffects.plasmaCannon.cooldown <= 1) playerEffects.plasmaCannon.charges = playerEffects.plasmaCannon.maxCharges;
        }
    }
    
    function updateEnergyBlade() {
        if (!playerEffects.energyBlade.active || playerEffects.energyBlade.duration <= 0) return;
        playerEffects.energyBlade.angle += 0.05;
        const bladeLength = 80; const bladeRadius = bladeLength / 2;
        const angle = playerEffects.energyBlade.angle;
        const p1x = player.x + Math.cos(angle) * bladeRadius; const p1y = player.y + Math.sin(angle) * bladeRadius;
        const p2x = player.x - Math.cos(angle) * bladeRadius; const p2y = player.y - Math.sin(angle) * bladeRadius;
    
        if (!player.invisible) {
            const allEnemies = [...asteroids, ...satellites];
            if(boss) allEnemies.push(boss);
            allEnemies.forEach(enemy => {
                if (Math.hypot(p1x - enemy.x, p1y - enemy.y) < enemy.radius || Math.hypot(p2x - enemy.x, p2y - enemy.y) < enemy.radius) enemy.health -= 0.5;
            });
        }
    }

    function updateBullets() {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.x += b.vx; b.y += b.vy; b.life--;
            if (b.special && b.special.plasma) { b.rotation += 0.1; createParticles(b.x, b.y, 1, '#00BFFF', 2, 10); }
            if (playerEffects.ricochetShot && b.bounced < 2) {
                if ((b.x < 0 || b.x > canvas.width)) { b.vx *= -1; b.bounced++; }
                if ((b.y < 0 || b.y > canvas.height)) { b.vy *= -1; b.bounced++; }
            }
            if (b.life <= 0) { returnToPool(b, 'bullets'); bullets.splice(i, 1); }
        }
        for (let i = bossProjectiles.length - 1; i >= 0; i--) {
            const bp = bossProjectiles[i];
            bp.x += bp.vx; bp.y += bp.vy; bp.life--;
            if (bp.life <= 0) { bossProjectiles.splice(i, 1); continue; }
            if (Math.hypot(player.x - bp.x, player.y - bp.y) < player.size + bp.radius) {
                if (!takeDamage(bp.damage)) createParticles(bp.x, bp.y, 5, 'red', 2);
                bossProjectiles.splice(i, 1);
            }
        }
    }

    function updateMissiles() {
        for (let i = missiles.length - 1; i >= 0; i--) {
            const m = missiles[i];
            if (m.homingDelay > 0) {
                m.x += m.vx; m.y += m.vy; m.vx *= 0.98; m.vy *= 0.98; m.homingDelay--;
            } else {
                if (!m.target || m.target.health <= 0) {
                    m.target = [...asteroids, ...satellites].filter(e => e.health > 0)
                                 .reduce((closest, ast) => (Math.hypot(m.x - ast.x, m.y - ast.y) < Math.hypot(m.x - (closest?.x || Infinity), m.y - (closest?.y || Infinity)) ? ast : closest), null);
                }
                if (m.target) {
                    const angleToTarget = Math.atan2(m.target.y - m.y, m.target.x - m.x);
                    m.vx = Math.cos(angleToTarget) * m.speed; m.vy = Math.sin(angleToTarget) * m.speed;
                }
            }
            m.angle = Math.atan2(m.vy, m.vx); m.x += m.vx; m.y += m.vy; m.life--;
            if (m.life <= 0) missiles.splice(i, 1);
        }
    }

    function updateLightningBolts() {
        for (let i = lightningBolts.length - 1; i >= 0; i--) {
            const bolt = lightningBolts[i];
            bolt.life--;
            if (bolt.life <= 0) { lightningBolts.splice(i, 1); continue; }
            if (bolt.bouncesLeft > 0 && bolt.life < 5) {
                const lastTarget = bolt.target;
                let nextTarget = null; let minDistance = Infinity;
                const potentialTargets = [...asteroids, ...satellites];
                if (boss && !bolt.hitTargets.includes(boss)) potentialTargets.push(boss);

                potentialTargets.forEach(pTarget => {
                    if (pTarget.health > 0 && !bolt.hitTargets.includes(pTarget)) {
                        const distance = Math.hypot(lastTarget.x - pTarget.x, lastTarget.y - pTarget.y);
                        if (distance < minDistance && distance < 350) { minDistance = distance; nextTarget = pTarget; }
                    }
                });
                if (nextTarget) {
                    if(nextTarget.health > 0) nextTarget.health -= bolt.damage;
                    bolt.hitTargets.push(nextTarget); bolt.target = nextTarget; bolt.bouncesLeft--;
                    bolt.path.push({x: nextTarget.x, y: nextTarget.y}); bolt.life = 15;
                }
            }
        }
    }

    function resolveAsteroidCollision(a, b) {
        const dx = b.x - a.x, dy = b.y - a.y;
        const angle = Math.atan2(dy, dx);
        const baseSpeed = (a.targetSpeed + b.targetSpeed) / 2 * 1.15;
        a.vx = -Math.cos(angle) * baseSpeed; a.vy = -Math.sin(angle) * baseSpeed;
        b.vx = Math.cos(angle) * baseSpeed; b.vy = Math.sin(angle) * baseSpeed;
        const overlap = (a.radius + b.radius) - Math.hypot(dx, dy);
        if (overlap > 0) {
            const separationX = (overlap / 2 + 0.1) * Math.cos(angle);
            const separationY = (overlap / 2 + 0.1) * Math.sin(angle);
            a.x -= separationX; a.y -= separationY; b.x += separationX; b.y += separationY;
        }
    }

    function updateAsteroids() {
        if (asteroids.length === 0 && !gameState.bossActive && boss === null) spawnNextBoss();
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const a = asteroids[i];
            if (a.isFragment) {
                a.vx *= 0.98; a.vy *= 0.98;
                if(Math.hypot(a.vx, a.vy) < a.targetSpeed) a.isFragment = false;
            }
            a.x += a.vx; a.y += a.vy; a.angle += a.angularVelocity;
            if (a.x < -a.radius) a.x = canvas.width + a.radius; if (a.x > canvas.width + a.radius) a.x = -a.radius;
            if (a.y < -a.radius) a.y = canvas.height + a.radius; if (a.y > canvas.height + a.radius) a.y = -a.radius;
            
            for (let j = i + 1; j < asteroids.length; j++) {
                if (Math.hypot(a.x - asteroids[j].x, a.y - asteroids[j].y) < a.radius + asteroids[j].radius) resolveAsteroidCollision(a, asteroids[j]);
            }

            if (!player.invisible && !gameState.isGameOver && !(playerEffects.shieldOvercharge.duration > 0) && Math.hypot(player.x - a.x, player.y - a.y) < a.radius + player.size) {
                const blocked = takeDamage(a.damage);
                const angleOfCollision = Math.atan2(player.y - a.y, player.x - a.x);
                const pushForce = 2, weakPushForce = 0.5;
                a.vx -= Math.cos(angleOfCollision) * pushForce; a.vy -= Math.sin(angleOfCollision) * pushForce;
                if (blocked) {
                    player.vx += Math.cos(angleOfCollision) * weakPushForce; player.vy += Math.sin(angleOfCollision) * weakPushForce;
                } else {
                    createParticles(player.x, player.y, 15, "#ff8c00", 3);
                    player.vx += Math.cos(angleOfCollision) * pushForce; player.vy += Math.sin(angleOfCollision) * pushForce;
                }
            }

            for (let j = bullets.length - 1; j >= 0; j--) {
                const b = bullets[j];
                if (!b.active) continue;
                if (!player.invisible && Math.hypot(b.x - a.x, b.y - a.y) < a.radius) {
                    a.health -= b.damage;
                    if (playerEffects.chainLightning.active && Math.random() < playerEffects.chainLightning.chance) createLightningBolt(b.x, b.y, a, playerEffects.chainLightning.bounces, b.damage * playerEffects.chainLightning.damage, [a]);
                    createParticles(b.x, b.y, 3, "#FFD700", 2);
                    if (!b.special.spectral) { returnToPool(b, 'bullets'); bullets.splice(j, 1); }
                    if (a.health <= 0) { handleAsteroidDestruction(a, i); break; }
                }
            }
            if (i >= asteroids.length || asteroids[i].health <= 0) continue;
            for (let j = missiles.length - 1; j >= 0; j--) {
                if (Math.hypot(missiles[j].x - a.x, missiles[j].y - a.y) < a.radius) {
                    a.health -= missiles[j].damage; createParticles(missiles[j].x, missiles[j].y, 10, "#FF4500", 2.5);
                    missiles.splice(j, 1);
                    if (a.health <= 0) { handleAsteroidDestruction(a, i); break; }
                }
            }
        }
    }

    function updateBoss() {
        if (!boss) return;
        if (!boss.hasEntered) {
            boss.y += boss.vy;
            if (boss.y >= 150) { boss.hasEntered = true; boss.vx = boss.initialVx; }
        } else {
            boss.x += boss.vx;
            if (boss.x - boss.radius < 0 || boss.x + boss.radius > canvas.width) boss.vx *= -1;
        }
        if (boss.type === 'terra') updateTerraBoss(); else if (boss.type === 'marte') updateMarsBoss();
        updateBossUI();
        if (boss.health <= 0) {
            createParticles(boss.x, boss.y, 300, "#ffffff", 8, 100);
            if (soundEnabled) { bossMusic.pause(); gameMusic.currentTime = 0; gameMusic.play(); }
            gameState.bossActive = false; boss = null; satellites.length = 0; bossProjectiles.length = 0;
            bossHealthBarContainer.classList.add('hidden'); bossWarningBorder.classList.add('hidden');
            gameState.postBossMode = true; gameState.bossDefeats++; lastBlueMeteorWaveTime = Date.now();
            for (let i = 0; i < 7 + gameState.bossDefeats; i++) createAsteroid("large");
        }
    }

    function updateTerraBoss() {
        boss.moon.angle += 0.02;
        const moonX = boss.x + Math.cos(boss.moon.angle) * boss.moon.distance;
        const moonY = boss.y + Math.sin(boss.moon.angle) * boss.moon.distance;
        if (Date.now() - lastSatelliteLaunch > 4000 * Math.pow(0.8, gameState.bossDefeats)) {
            createSatellite(boss.x, boss.y, -1); createSatellite(boss.x, boss.y, 1);
            lastSatelliteLaunch = Date.now();
        }
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            if (!b.active) continue;
            let hit = false;
            if (Math.hypot(b.x - moonX, b.y - moonY) < boss.moon.radius) { createParticles(b.x, b.y, 3, "#cccccc", 1.5); hit = true;
            } else if (!player.invisible && Math.hypot(b.x - boss.x, b.y - boss.y) < boss.radius) {
                boss.health -= b.damage; createParticles(b.x, b.y, 5, "#ff4500", 2); hit = true;
            }
            if (hit && !b.special.spectral) { returnToPool(b, 'bullets'); bullets.splice(i, 1); }
        }
        if (!player.invisible && !gameState.isGameOver) {
            if (Math.hypot(player.x - boss.x, player.y - boss.y) < boss.radius + player.size) {
                 if (!takeDamage(boss.damage)) {
                    const angle = Math.atan2(player.y - boss.y, player.x - boss.x), force = 4;
                    player.vx += Math.cos(angle) * force; player.vy += Math.sin(angle) * force;
                    createParticles(player.x, player.y, 20, "#ff4500", 3);
                 }
            }
            if (Math.hypot(player.x - moonX, player.y - moonY) < boss.moon.radius + player.size) {
                 if (!takeDamage(50)) {
                    const angle = Math.atan2(player.y - moonY, player.x - moonX), force = 3;
                    player.vx += Math.cos(angle) * force; player.vy += Math.sin(angle) * force;
                    createParticles(player.x, player.y, 10, "#cccccc", 2.5);
                 }
            }
        }
    }

    function updateMarsBoss() {
        if (Math.hypot(player.x - boss.x, player.y - boss.y) < boss.radius + player.size) {
            if (!takeDamage(boss.damage)) {
               const angle = Math.atan2(player.y - boss.y, player.x - boss.x), force = 4;
               player.vx += Math.cos(angle) * force; player.vy += Math.sin(angle) * force;
               createParticles(player.x, player.y, 20, "#ff4500", 3);
            }
        }
        boss.turrets.forEach(turret => {
            if (turret.health <= 0) return;
            turret.x = boss.x + turret.xOffset;
            turret.y = boss.y + turret.yOffset + Math.sin(Date.now() / 400 + turret.animationPhase) * 8;
            turret.fireCooldown--;
            if (turret.fireCooldown <= 0) { createBossProjectile(turret.x, turret.y, 0, 5, gameConfig.boss.mars.turretDamage); turret.fireCooldown = turret.fireRate; }
        });
        boss.laserShips.forEach(ship => {
            if (ship.health <= 0 && ship.state !== 'dead') { ship.state = 'exiting'; ship.targetX = ship.side === 'left' ? -50 : canvas.width + 50; }
            const onScreenX = ship.side === 'left' ? 40 : canvas.width - 40;
            const offScreenX = ship.side === 'left' ? -50 : canvas.width + 50;
            if (!ship.initialY) ship.initialY = ship.y;
            ship.y = ship.initialY + Math.sin(Date.now() / 600 + ship.animationPhase) * 5;
            ship.timer--;
            switch(ship.state) {
                case 'idle': if (ship.timer <= 0 && ship.health > 0) { ship.state = 'entering'; ship.targetX = onScreenX; } break;
                case 'entering': if (Math.abs(ship.currentX - ship.targetX) < 1) { ship.state = 'charging'; ship.timer = 120; } break;
                case 'charging': if (ship.timer <= 0) { ship.state = 'firing'; ship.timer = 120; boss.lasers.push({ y: ship.y, life: 120, side: ship.side, originX: ship.currentX }); } break;
                case 'firing': if (ship.timer <= 0) { ship.state = 'exiting'; ship.targetX = offScreenX; } break;
                case 'exiting': if (Math.abs(ship.currentX - ship.targetX) < 1) { if (ship.health > 0) { ship.state = 'idle'; ship.timer = 420; } else { ship.state = 'dead'; } } break;
            }
            ship.currentX += (ship.targetX - ship.currentX) * 0.05;
        });
        for (let i = boss.lasers.length - 1; i >= 0; i--) {
            const laser = boss.lasers[i];
            laser.life--;
            if (player.y + player.size > laser.y - 20 && player.y - player.size < laser.y + 20) {
                if (!takeDamage(gameConfig.boss.mars.laserDamagePerFrame)) createParticles(player.x, laser.y, 2, 'red', 1.5);
            }
            if (laser.life <= 0) boss.lasers.splice(i, 1);
        }
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            if (!b.active) continue;
            let hit = false;
            if (!player.invisible && Math.hypot(b.x - boss.x, b.y - boss.y) < boss.radius) {
                boss.health -= b.damage; createParticles(b.x, b.y, 5, "#ff4500", 2); hit = true;
            }
            boss.turrets.forEach(turret => {
                if (turret.health > 0 && Math.hypot(b.x - turret.x, b.y - turret.y) < turret.radius) {
                    turret.health -= b.damage; hit = true;
                    if(turret.health <= 0) createParticles(turret.x, turret.y, 50, "#FFA500", 5, 40);
                    else createParticles(b.x, b.y, 3, "#FFFFFF", 1.5);
                }
            });
            boss.laserShips.forEach(ship => {
                if (ship.state !== 'idle' && ship.health > 0 && Math.hypot(b.x - ship.currentX, b.y - ship.y) < 30) {
                     ship.health -= b.damage; hit = true;
                     if(ship.health <= 0) createParticles(ship.currentX, ship.y, 50, "#FFA500", 5, 40);
                     else createParticles(b.x, b.y, 3, "#FFFFFF", 1.5);
                }
            });
            if (hit && !b.special.spectral) { returnToPool(b, 'bullets'); bullets.splice(i, 1); }
        }
    }

    function updateSatellites() {
        for (let i = satellites.length - 1; i >= 0; i--) {
            const s = satellites[i];
            if (s.homingDelay && s.homingDelay > 0) {
                s.x += s.vx; s.y += s.vy; s.vx *= 0.98; s.vy *= 0.98; s.homingDelay--;
            } else {
                const angleToPlayer = Math.atan2(player.y - s.y, player.x - s.x);
                s.vx = Math.cos(angleToPlayer) * s.speed; s.vy = Math.sin(angleToPlayer) * s.speed;
                s.x += s.vx; s.y += s.vy;
            }
            for (let j = bullets.length - 1; j >= 0; j--) {
                const b = bullets[j];
                if (!b.active) continue;
                if (!player.invisible && Math.hypot(b.x - s.x, b.y - s.y) < s.radius) {
                    s.health -= b.damage;
                     if (playerEffects.chainLightning.active && Math.random() < playerEffects.chainLightning.chance) createLightningBolt(b.x, b.y, s, playerEffects.chainLightning.bounces, b.damage * playerEffects.chainLightning.damage, [s]);
                    createParticles(b.x, b.y, 2, "#ffff00", 1.5);
                    if(!b.special.spectral) { returnToPool(b, 'bullets'); bullets.splice(j, 1); }
                    if (s.health <= 0) { createParticles(s.x, s.y, 15, "#ffa500", 2.5, 30); satellites.splice(i, 1); break; }
                }
            }
            if (i >= satellites.length) continue;
            if (!player.invisible && !gameState.isGameOver) {
                const noseX = player.x + Math.cos(player.angle) * (player.size * 0.5), noseY = player.y + Math.sin(player.angle) * (player.size * 0.5);
                if (Math.hypot(player.x - s.x, player.y - s.y) < s.radius + player.size * 0.8 || Math.hypot(noseX - s.x, noseY - s.y) < s.radius + player.size * 0.5) {
                    if (!takeDamage(s.damage)) {
                        const angle = Math.atan2(player.y - s.y, player.x - s.x), force = 1.5;
                        player.vx += Math.cos(angle) * force; player.vy += Math.sin(angle) * force;
                        createParticles(s.x, s.y, 10, "#ffff00", 2.5);
                    }
                    satellites.splice(i, 1); continue; 
                }
            }
        }
    }

    function updateBlueMeteors() {
        if (gameState.postBossMode && Date.now() - lastBlueMeteorWaveTime > 13000) {
            const amount = [3, 3, 3, 4, 4, 5, 5, 6, 7][Math.floor(Math.random() * 9)];
            for(let i=0; i<amount; i++) createBlueMeteor();
            lastBlueMeteorWaveTime = Date.now();
        }
        for (let i = blueMeteors.length - 1; i >= 0; i--) {
            const bm = blueMeteors[i];
            bm.x += bm.vx; bm.y += bm.vy;
            if (!player.invisible && !gameState.isGameOver && Math.hypot(player.x - bm.x, player.y - bm.y) < bm.radius + player.size) {
                if (!takeDamage(bm.damage)) {
                    const angle = Math.atan2(player.y - bm.y, player.x - bm.x), force = 1.5;
                    player.vx += Math.cos(angle) * force; player.vy += Math.sin(angle) * force;
                    createParticles(bm.x, bm.y, 15, "#00BFFF", 2.5);
                }
                blueMeteors.splice(i, 1); continue;
            }
            if(bm.y > canvas.height + bm.radius) blueMeteors.splice(i, 1);
        }
    }

    function handleAsteroidDestruction(asteroid, index) {
        let pCount = 20, pSize = 3, pLife = 30;
        if(asteroid.size === "medium") { pCount = 40; pSize = 4; pLife = 40; }
        if(asteroid.size === "large")  { pCount = 60; pSize = 5; pLife = 50; }
        createParticles(asteroid.x, asteroid.y, pCount, "#A9A9A9", pSize, pLife);
        let xpAmount = asteroid.xpReward;
        if(Math.random() < 0.15 + playerStats.luck) xpAmount *= 2;
        createXPOrb(asteroid.x, asteroid.y, xpAmount);
        gameState.score += asteroid.xpReward; updateScoreUI();
        if (asteroid.size === "large") { createAsteroid("medium", asteroid.x, asteroid.y, true); createAsteroid("medium", asteroid.x, asteroid.y, true); }
        else if (asteroid.size === "medium") { for(let i=0; i<4; i++) createAsteroid("small", asteroid.x, asteroid.y, true); }
        asteroids.splice(index, 1);
        if (playerEffects.battleFrenzy.active) playerEffects.battleFrenzy.timer = playerEffects.battleFrenzy.maxTime; 
    }

    function updateParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.life--;
            if (p.life <= 0) { returnToPool(p, 'particles'); particles.splice(i, 1); }
        }
    }
    
    function updateXPOrbs() {
        for (let i = xpOrbs.length - 1; i >= 0; i--) {
            const orb = xpOrbs[i];
            orb.life--;
            const dist = Math.hypot(player.x - orb.x, player.y - orb.y);
            if (dist < playerStats.xpCollectionRadius) {
                const angleToPlayer = Math.atan2(player.y - orb.y, player.x - orb.x);
                orb.vx = Math.cos(angleToPlayer) * 5; orb.vy = Math.sin(angleToPlayer) * 5;
            } else {
                orb.vx *= 0.98; orb.vy *= 0.98;
            }
            orb.x += orb.vx; orb.y += orb.vy;
            if (dist < 15 && !gameState.isGameOver) { gainXP(orb.amount); returnToPool(orb, 'xpOrbs'); xpOrbs.splice(i, 1); }
            else if (orb.life <= 0) { returnToPool(orb, 'xpOrbs'); xpOrbs.splice(i, 1); }
        }
    }

    function drawPlayer() {
        ctx.save();
        const bobbingY = player.y + Math.sin(Date.now() / gameConfig.player.bobbingSpeed + player.bobbingPhase) * gameConfig.player.bobbingAmount;
        ctx.translate(player.x, bobbingY);
        let angleDiff = player.targetAngle - player.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        const tilt = Math.max(-1, Math.min(1, angleDiff * 5)) * gameConfig.player.tiltAmount;
        ctx.rotate(player.angle + tilt);
        if (player.invisible) ctx.globalAlpha = 0.4;
        ctx.drawImage(playerShipImage, -player.size, -player.size, player.size * 2, player.size * 2);
        ctx.restore();

        if (playerEffects.reactiveShield.active) {
            if (playerEffects.reactiveShield.duration > 0) {
                ctx.save(); ctx.beginPath();
                const activeAlpha = 0.5 + Math.sin(Date.now() / 150) * 0.2;
                ctx.arc(player.x, player.y, player.size * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 191, 255, ${activeAlpha * 0.4})`; ctx.fill();
                ctx.strokeStyle = `rgba(0, 191, 255, ${activeAlpha})`; ctx.lineWidth = 3; ctx.stroke();
                ctx.restore();
            } else if (playerEffects.reactiveShield.cooldown <= 0) {
                ctx.save(); ctx.beginPath();
                const readyAlpha = 0.4 + Math.sin(Date.now() / 250) * 0.2;
                ctx.arc(player.x, player.y, player.size * 1.4, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(0, 191, 255, ${readyAlpha})`; ctx.lineWidth = 2; ctx.stroke();
                ctx.restore();
            }
        }
        if (playerEffects.shieldOvercharge.duration > 0) { ctx.beginPath(); ctx.arc(player.x, player.y, player.size * 1.5, 0, Math.PI * 2); ctx.strokeStyle = `rgba(255, 223, 0, ${0.5 + Math.sin(Date.now() / 100) * 0.2})`; ctx.lineWidth = 4; ctx.stroke(); }
        if (playerEffects.hullShield.active) { ctx.beginPath(); ctx.arc(player.x, player.y, player.size * 1.2, 0, Math.PI * 2 * (playerEffects.hullShield.shield / playerEffects.hullShield.maxShield)); ctx.strokeStyle = "rgba(135, 206, 250, 0.7)"; ctx.lineWidth = 3; ctx.stroke(); }
    }
    
    function drawEnergyBlade() {
        if (!playerEffects.energyBlade.active || playerEffects.energyBlade.duration <= 0) return;
        const bladeLength = 90, bladeWidth = 15, angle = playerEffects.energyBlade.angle;
        ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(angle);
        ctx.drawImage(energyBladeImage, -bladeLength / 2, -bladeWidth / 2, bladeLength, bladeWidth);
        ctx.restore();
    }

    function drawBullets() {
        for (const b of bullets) {
            ctx.save(); ctx.translate(b.x, b.y);
            if (b.special && b.special.plasma) { const size = b.special.size; ctx.rotate(b.rotation); ctx.drawImage(plasmaShotImage, -size / 2, -size / 2, size, size);
            } else { ctx.drawImage(projectileImage, -5, -5, 10, 10); }
            ctx.restore();
        }
        ctx.fillStyle = "red";
        for (const bp of bossProjectiles) { ctx.beginPath(); ctx.arc(bp.x, bp.y, bp.radius, 0, Math.PI * 2); ctx.fill(); }
    }

    function drawMissiles() { for (const m of missiles) { ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.angle); ctx.fillStyle = "orange"; ctx.fillRect(-5, -2, 10, 4); ctx.restore(); } }
    function drawXPOrbs() { for (const orb of xpOrbs) { ctx.fillStyle = "#00FF00"; ctx.beginPath(); ctx.arc(orb.x, orb.y, 5, 0, Math.PI * 2); ctx.fill(); } }
    function drawParticles() { for (const p of particles) { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2); ctx.fill(); } }
    function drawLightningBolts() {
        ctx.save();
        for (const bolt of lightningBolts) {
            ctx.strokeStyle = `rgba(0, 255, 255, ${bolt.life / 15 * 0.8})`; ctx.lineWidth = 3; ctx.beginPath();
            if(bolt.path.length > 0) ctx.moveTo(bolt.path[0].x, bolt.path[0].y);
            for(let j = 1; j < bolt.path.length; j++) {
                const start = bolt.path[j-1], end = bolt.path[j];
                ctx.quadraticCurveTo((start.x + end.x) / 2 + (Math.random() - 0.5) * 20, (start.y + end.y) / 2 + (Math.random() - 0.5) * 20, end.x, end.y);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawAsteroids() {
        for (const a of asteroids) {
            if (a.loadSuccess !== false) ctx.drawImage(asteroidImage, a.x - a.radius, a.y - a.radius, a.radius * 2, a.radius * 2);
            const barX = a.x - a.radius, barY = a.y - a.radius - 10;
            ctx.fillStyle = "red"; ctx.fillRect(barX, barY, a.radius * 2, 5);
            ctx.fillStyle = "lime"; ctx.fillRect(barX, barY, a.radius * 2 * (a.health / a.maxHealth), 5);
        }
    }

    function drawBoss() {
        if (!boss) return;
        if (boss.type === 'terra') {
            const moonX = boss.x + Math.cos(boss.moon.angle) * boss.moon.distance;
            const moonY = boss.y + Math.sin(boss.moon.angle) * boss.moon.distance;
            if (earthImage.loadSuccess !== false) ctx.drawImage(earthImage, boss.x - boss.radius, boss.y - boss.radius, boss.radius * 2, boss.radius * 2);
            if (moonImage.loadSuccess !== false) ctx.drawImage(moonImage, moonX - boss.moon.radius, moonY - boss.moon.radius, boss.moon.radius * 2, boss.moon.radius * 2);
        } else if (boss.type === 'marte') {
            ctx.drawImage(marsImage, boss.x - boss.radius, boss.y - boss.radius, boss.radius * 2, boss.radius * 2);
            boss.turrets.forEach(t => { if (t.health > 0) ctx.drawImage(marsShipImage, t.x - t.radius, t.y - t.radius, t.radius * 2, t.radius * 2); });
            boss.laserShips.forEach(ship => {
                if(ship.state !== 'idle' && ship.state !== 'dead' && ship.health > 0) {
                    const shipSize = 30;
                    ctx.save(); ctx.translate(ship.currentX, ship.y);
                    if (ship.side === 'left') ctx.scale(-1, 1);
                    if(ship.state === 'charging'){ const glow = Math.abs(Math.sin(ship.timer * 0.1)) * 10; ctx.shadowColor = "red"; ctx.shadowBlur = 10 + glow; }
                    ctx.drawImage(marsShipImage, -shipSize, -shipSize, shipSize*2, shipSize*2);
                    ctx.restore();
                }
            });
            boss.lasers.forEach(laser => {
                ctx.save(); ctx.fillStyle = `rgba(255, 0, 0, ${0.5 * (laser.life / 120)})`;
                const startX = laser.side === 'left' ? laser.originX : 0;
                const width = laser.side === 'left' ? canvas.width - laser.originX : laser.originX;
                ctx.fillRect(startX, laser.y - 20, width, 40);
                ctx.restore();
            });
        }
    }

    function drawSatellites() {
        for (const s of satellites) {
            const img = s.isElite ? satelliteRedImage : satelliteImage;
            if (img.loadSuccess !== false) {
                ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.atan2(s.vy, s.vx) + Math.PI / 2);
                if (s.isElite) { ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; ctx.beginPath(); ctx.arc(0, 0, s.radius * 1.2, 0, Math.PI * 2); ctx.fill(); }
                ctx.drawImage(img, -s.radius, -s.radius, s.radius * 2, s.radius * 2);
                ctx.restore();
            }
        }
    }

    function drawBlueMeteors() {
        for (const bm of blueMeteors) {
            if (blueMeteorImage.loadSuccess !== false) ctx.drawImage(blueMeteorImage, bm.x - bm.radius, bm.y - bm.radius, bm.radius * 2, bm.radius * 2);
        }
    }

    let lastFireTime = 0;
    function fireBullet() {
        const now = Date.now();
        const fireRateBonus = playerEffects.battleFrenzy.active && playerEffects.battleFrenzy.timer > 0 ? 1.5 : 1;
        if (now - lastFireTime > 1000 / (playerStats.fireRate * fireRateBonus)) {
            let damage = playerStats.baseDamage;
            if (Math.random() < playerStats.critChance) damage *= playerStats.critDamage;
            const special = { spectral: playerEffects.spectralCannon };
            if (playerEffects.bifurcatedShot.active) {
                const numShots = playerEffects.bifurcatedShot.level + 1;
                const totalAngle = 0.25 * numShots;
                const damagePerShot = damage * 0.7;
                for (let i = 0; i < numShots; i++) {
                    const angleOffset = (numShots > 1) ? -totalAngle / 2 + (i * (totalAngle / (numShots - 1))) : 0;
                    createBullet(player.x, player.y, player.angle + angleOffset, playerStats.projectileSpeed, damagePerShot, special);
                }
            } else {
                createBullet(player.x, player.y, player.angle, playerStats.projectileSpeed, damage, special);
            }
            lastFireTime = now;
        }
    }

    function takeDamage(amount) {
        if (playerStats.health <= 0 || playerEffects.shieldOvercharge.duration > 0) return true;
        if (playerEffects.reactiveShield.duration > 0) return true;
        if (playerEffects.reactiveShield.active && playerEffects.reactiveShield.cooldown <= 0) {
            playerEffects.reactiveShield.duration = playerEffects.reactiveShield.maxDuration;
            playerEffects.reactiveShield.cooldown = playerEffects.reactiveShield.maxCooldown * playerStats.cooldownReduction;
            createParticles(player.x, player.y, 40, "#00BFFF", 2.5); 
            return true; 
        }
        const finalDamage = Math.max(0, amount - playerStats.armor);
        if (playerEffects.hullShield.active && playerEffects.hullShield.shield > 0) {
            playerEffects.hullShield.shield -= finalDamage;
            if (playerEffects.hullShield.shield < 0) {
                playerStats.health += playerEffects.hullShield.shield;
                playerEffects.hullShield.shield = 0;
            }
        } else {
            playerStats.health -= finalDamage;
        }
        damageFlashEffect.classList.add('active');
        setTimeout(() => damageFlashEffect.classList.remove('active'), 200);
        if (playerStats.health <= 0) { playerStats.health = 0; gameOver(); }
        updateUI();
        return false;
    }

    function gainXP(amount) {
        if (gameState.bossActive || gameState.isGameOver) return;
        gameState.xp += amount;
        if (gameState.xp >= gameState.xpRequired) levelUp();
        updateUI();
    }

    function levelUp() {
        gameState.level++; gameState.xp -= gameState.xpRequired; 
        gameState.xpRequired = Math.floor(5 * Math.pow(gameState.level, 1.5));
        gameState.rerollsAvailableThisLevel = 1;
        playerStats.health = Math.min(playerStats.maxHealth, playerStats.health + playerStats.maxHealth * 0.20);
        updateUI();
        showLevelUpScreen();
    }

    function showLevelUpScreen() {
        gameState.isLevelingUp = true;
        togglePause(true, { fromLevelUp: true });
        levelUpScreen.classList.remove("hidden");
        rerollButton.classList.remove("hidden");
        rerollButton.disabled = gameState.rerollsAvailableThisLevel <= 0;
        rerollButton.textContent = `Rerolar (${gameState.rerollsAvailableThisLevel})`;
        generateCards();
    }
    
    function generateCards() {
        const cardContainer = document.getElementById("cardContainer");
        cardContainer.innerHTML = "";
        let cardPool = [...cardDatabase];
        let availableCards = [];
        const isSuperCard = Math.random() < (0.005 + (playerStats.luck * 0.01));
        if(isSuperCard){
            const cardElement = document.createElement("div");
            cardElement.className = "card super-card";
            cardElement.innerHTML = `<h3>SUPER CARTA!</h3><p>Escolha um power-up duas vezes!</p><button>Escolher</button>`;
            cardContainer.appendChild(cardElement);
            cardElement.querySelector("button").addEventListener("click", () => {
                showLevelUpScreen(); showLevelUpScreen(); 
            });
        } else {
            for (let i = 0; i < 3; i++) {
                if (cardPool.length === 0) break;
                const cardIndex = Math.floor(Math.random() * cardPool.length);
                availableCards.push(cardPool[cardIndex]);
                cardPool.splice(cardIndex, 1);
            }
            availableCards.forEach(card => {
                const cardElement = document.createElement("div");
                cardElement.className = `card card-${card.type}`;
                cardElement.innerHTML = `<h3>${card.name}</h3><p>${card.description}</p><button>Escolher</button>`;
                cardContainer.appendChild(cardElement);
                cardElement.querySelector("button").addEventListener("click", () => {
                    applyCardEffect(card);
                    levelUpScreen.classList.add("hidden");
                    rerollButton.classList.add("hidden");
                    gameState.isLevelingUp = false;
                    togglePause(false);
                });
            });
        }
    }
    
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = message;
        notificationContainer.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }

    function addAbilityIcon(effectName, key) {
        const desktopIcon = document.getElementById(`icon-${effectName}`);
        if (!desktopIcon) {
             const iconContainer = document.createElement('div');
             iconContainer.id = `icon-${effectName}`; iconContainer.className = 'ui-icon';
             const iconImg = document.createElement('img');
             iconImg.src = iconImages[effectName] || 'assets/icons/default.png';
             iconContainer.appendChild(iconImg);
             const keyText = document.createElement('span');
             keyText.className = 'cooldown-key'; keyText.textContent = key;
             iconContainer.appendChild(keyText);
             const overlay = document.createElement('div');
             overlay.className = 'cooldown-overlay'; iconContainer.appendChild(overlay);
             abilityCooldownsContainer.appendChild(iconContainer);
        }

        if (isMobileDevice) {
            const mobileIcon = document.getElementById(`mobile-btn-${effectName}`);
            if(!mobileIcon) {
                const button = document.createElement('div');
                button.id = `mobile-btn-${effectName}`;
                button.className = 'mobile-ability-button';
                button.innerHTML = `<img src="${iconImages[effectName] || 'assets/icons/default.png'}"><div class="cooldown-overlay"></div>`;
                
                button.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if(abilityTriggers[effectName]) abilityTriggers[effectName]();
                });

                mobileAbilityButtons.appendChild(button);
            }
        }
    }
    
    function addPassiveIcon(effectName) {
        if (document.getElementById(`passive-icon-${effectName}`)) return;
        const iconContainer = document.createElement('div');
        iconContainer.id = `passive-icon-${effectName}`;
        iconContainer.className = 'ui-icon passive-icon';
        const iconImg = document.createElement('img');
        iconImg.src = iconImages[effectName] || 'assets/icons/default.png';
        iconContainer.appendChild(iconImg);
        passivePowerupsContainer.appendChild(iconContainer);
    }


    function applyCardEffect(card) {
        if (card.key && !playerEffects[card.id]?.active) showNotification(`Nova Habilidade: <strong>${card.name}</strong> <br> Use '${card.key.toUpperCase()}' ou o botão na tela!`);

        switch(card.id) {
            case "bifurcated_shot": playerEffects.bifurcatedShot.active = true; if(playerEffects.bifurcatedShot.level < 3) playerEffects.bifurcatedShot.level++; break;
            case "plasma_cannon": if (!playerEffects.plasmaCannon.active) addAbilityIcon('plasmaCannon', card.key); playerEffects.plasmaCannon.active = true; playerEffects.plasmaCannon.maxCharges++; playerEffects.plasmaCannon.charges++; heatBarContainer.classList.remove('hidden'); break;
            case "missile_storm": playerEffects.missileStorm.active = true; if (playerEffects.missileStorm.shotsNeeded > 2) playerEffects.missileStorm.shotsNeeded--; break;
            case "orbital_drones": playerEffects.orbitalDrones.active = true; playerEffects.orbitalDrones.drones.push({ angleOffset: Math.random() * Math.PI * 2, dist: 60, fireRate: 1, lastFire: 0 }); break;
            case "energy_blade": if (!playerEffects.energyBlade.active) addAbilityIcon('energyBlade', card.key); playerEffects.energyBlade.active = true; break;
            case "ricochet_shot": if (!playerEffects.ricochetShot) addPassiveIcon('ricochetShot'); playerEffects.ricochetShot = true; break;
            case "chain_lightning": playerEffects.chainLightning.active = true; playerEffects.chainLightning.bounces++; break;
            case "battle_frenzy": playerEffects.battleFrenzy.active = true; break;
            case "static_pulse": if (!playerEffects.staticPulse.active) addAbilityIcon('staticPulse', card.key); playerEffects.staticPulse.active = true; break;
            case "spectral_cannon": if (!playerEffects.spectralCannon) addPassiveIcon('spectralCannon'); playerEffects.spectralCannon = true; break;
            case "reactive_shield": playerEffects.reactiveShield.active = true; break;
            case "maneuver_thrusters": playerStats.moveSpeed *= 1.25; break;
            case "adamantium_plating": playerStats.maxHealth += 50; playerStats.health += 50; playerStats.armor += 5; break;
            case "repulsion_field": playerEffects.repulsionField.active = true; playerEffects.repulsionField.maxCooldown *= 0.85; playerEffects.repulsionField.radius += 35; break;
            case "emergency_teleport": if (!playerEffects.emergencyTeleport.active) addAbilityIcon('emergencyTeleport', card.key); playerEffects.emergencyTeleport.active = true; break;
            case "nanobot_regeneration": if (!playerEffects.nanobotRegeneration) addPassiveIcon('nanobotRegeneration'); playerEffects.nanobotRegeneration = true; break;
            case "invisibility_cloak": if (!playerEffects.invisibilityCloak.active) addAbilityIcon('invisibilityCloak', card.key); playerEffects.invisibilityCloak.active = true; break;
            case "shield_overcharge": if (!playerEffects.shieldOvercharge.active) addAbilityIcon('shieldOvercharge', card.key); playerEffects.shieldOvercharge.active = true; break;
            case "fine_calibration": playerStats.projectileSpeed *= 1.2; break;
            case "combat_focus": playerStats.critChance += 0.05; break;
            case "improved_reactor": playerStats.fireRate *= 1.25; break;
            case "expansion_modules": playerStats.projectileRange *= 1.3; break;
            case "target_analyzer": playerStats.critDamage += 0.5; break;
            case "magnetic_collector": playerStats.xpCollectionRadius *= 1.2; break;
            case "cooldown_reducer": playerStats.cooldownReduction *= 0.9; break;
            case "explorer_luck": playerStats.luck += 0.01; break;
            case "reinforced_chassis": playerStats.maxHealth += 35; playerStats.health += 35; break;
            case "armor_plating": playerStats.armor += 3; break;
            case "hull_shield": playerEffects.hullShield.active = true; playerEffects.hullShield.maxShield = playerStats.maxHealth * 0.3; playerEffects.hullShield.shield = playerEffects.hullShield.maxShield; break;
        }
        updateUI();
    }

    function gameOver() {
        gameState.isGameOver = true;
        player.vx = 0; player.vy = 0;
        gameMusic.pause(); bossMusic.pause();
        if(soundEnabled) { gameOverSound.currentTime = 0; gameOverSound.play(); }
        createParticles(player.x, player.y, 150, "#ff4500", 4, 60);
        createParticles(player.x, player.y, 100, "#ffa500", 3, 50);
        setTimeout(() => gameOverScreen.classList.remove('hidden'), 1000); 
    }

    function restartGame() {
        cancelAnimationFrame(animationFrameId);
        gameOverScreen.classList.add('hidden'); pauseMenu.classList.add('hidden');
        bossHealthBarContainer.classList.add('hidden'); bossWarningBorder.classList.add('hidden');
        heatBarContainer.classList.add('hidden'); damageFlashEffect.classList.add('hidden');
        abilityCooldownsContainer.innerHTML = ''; passivePowerupsContainer.innerHTML = '';
        mobileAbilityButtons.innerHTML = ''; // Limpa botões mobile
        
        Object.assign(gameState, {
            paused: false, isLevelingUp: false, isGameOver: false, level: 1, xp: 0,
            xpRequired: 5, rerollsAvailableThisLevel: 1, score: 0, bossActive: false,
            postBossMode: false, bossDefeats: 0
        });
        boss = null;
        playerStats = { ...initialPlayerStats };
        playerEffects = JSON.parse(JSON.stringify(initialPlayerEffects));
        
        [asteroids, bullets, particles, missiles, xpOrbs, satellites, blueMeteors, lightningBolts].forEach(arr => arr.length = 0);
        
        Object.values(objectPools).forEach(pool => pool.length = 0);
        prewarmPools();
        
        initGame();
        
        if (soundEnabled) {
            bossMusic.pause();
            gameMusic.currentTime = 0;
            gameMusic.play().catch(e => console.error("Game music playback failed:", e));
        }
    }

    function updateScoreUI() {
        const scoreString = gameState.score.toString().padStart(5, '0');
        for (let i = 0; i < scoreString.length; i++) {
            scoreDigits[i].src = numberImages[scoreString[i]].src;
        }
    }

    function updateUI() {
        xpBarContainer.querySelector("#xpText").textContent = `NÍVEL ${gameState.level} | XP: ${gameState.xp}/${gameState.xpRequired}`;
        xpBarContainer.querySelector("#xpBarFill").style.width = `${(gameState.xp / gameState.xpRequired) * 100}%`;
        healthBarContainer.querySelector("#healthText").textContent = `HP: ${Math.ceil(playerStats.health)}/${playerStats.maxHealth}`;
        const healthBarFill = healthBarContainer.querySelector("#healthBarFill");
        healthBarFill.style.width = `${(playerStats.health / playerStats.maxHealth) * 100}%`;
        healthBarFill.style.background = (playerStats.health / playerStats.maxHealth < 0.3) ? 'linear-gradient(90deg, #ff0000, #ff6600)' : 'linear-gradient(90deg, #00ff00, #ffff00)';
        updateScoreUI();

        if (playerEffects.plasmaCannon.active) {
            if (playerEffects.plasmaCannon.cooldown > 0) {
                heatBarFill.style.width = `${100 - (playerEffects.plasmaCannon.cooldown / (playerEffects.plasmaCannon.maxCooldown * playerStats.cooldownReduction)) * 100}%`;
                heatText.textContent = `RECARREGANDO...`;
            } else {
                heatBarFill.style.width = `${(playerEffects.plasmaCannon.charges / playerEffects.plasmaCannon.maxCharges) * 100}%`;
                heatText.textContent = `CARGAS: ${playerEffects.plasmaCannon.charges}/${playerEffects.plasmaCannon.maxCharges}`;
            }
        }
        
        Object.keys(playerEffects).forEach(effectName => {
            const effect = playerEffects[effectName];
            if (effect.active && effect.maxCooldown) {
                const cooldown = effect.cooldown || 0;
                const maxCooldown = effect.maxCooldown * playerStats.cooldownReduction;
                const heightPercentage = (cooldown / maxCooldown) * 100;
                
                const desktopIcon = document.getElementById(`icon-${effectName}`);
                if (desktopIcon) desktopIcon.querySelector('.cooldown-overlay').style.height = `${heightPercentage}%`;

                if (isMobileDevice) {
                    const mobileIcon = document.getElementById(`mobile-btn-${effectName}`);
                    if (mobileIcon) mobileIcon.querySelector('.cooldown-overlay').style.height = `${heightPercentage}%`;
                }
            }
        });
    }

    function updateBossUI() {
        if (!boss) return;
        bossHealthBarContainer.querySelector("#bossHealthBarFill").style.width = `${(boss.health / boss.maxHealth) * 100}%`;
    }

    function gameLoop() {
        if (gameState.paused) return;
        animationFrameId = requestAnimationFrame(gameLoop);
        try {
            if (!gameState.isGameOver) updatePlayer();
            updateEnergyBlade();
            if (!gameState.isGameOver) {
                if (isMobileDevice || mouseDown || keys['Space']) fireBullet();
            }
            updateBullets(); updateMissiles(); updateLightningBolts();
            if (gameState.bossActive) { updateBoss(); if(boss && boss.type === 'terra') updateSatellites();
            } else { updateAsteroids(); }
            if (gameState.postBossMode) updateBlueMeteors();
            updateParticles(); updateXPOrbs();
            updateUI();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (backgroundImage.loadSuccess !== false) ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
            drawParticles(); drawBullets(); drawMissiles(); drawXPOrbs(); drawLightningBolts();
            drawAsteroids(); drawBoss(); drawSatellites(); drawBlueMeteors();
            if (!gameState.isGameOver) drawPlayer();
            drawEnergyBlade();
            if (playerEffects.orbitalDrones.active) {
                playerEffects.orbitalDrones.drones.forEach((drone, index) => {
                    const angleStep = (Math.PI * 2) / playerEffects.orbitalDrones.drones.length;
                    drone.angleOffset += 0.05;
                    const dX = player.x + Math.cos(angleStep * index + drone.angleOffset) * drone.dist;
                    const dY = player.y + Math.sin(angleStep * index + drone.angleOffset) * drone.dist;
                    ctx.fillStyle = "#8A2BE2"; ctx.beginPath(); ctx.arc(dX, dY, 8, 0, Math.PI * 2); ctx.fill();
                    if(!gameState.isGameOver && Date.now() - drone.lastFire > 1000 / drone.fireRate) {
                        const target = [...asteroids, ...satellites].reduce((closest, ast) => (Math.hypot(dX - ast.x, dY - ast.y) < Math.hypot(dX - (closest?.x || Infinity), dY - (closest?.y || Infinity)) ? ast : closest), null);
                        if(target){
                           const angleToTarget = Math.atan2(target.y - dY, target.x - dX);
                           createBullet(dX, dY, angleToTarget, playerStats.projectileSpeed * 0.8, playerStats.baseDamage * 0.5);
                           drone.lastFire = Date.now();
                        }
                    }
                });
            }
        } catch (e) { console.error("Erro no gameLoop:", e); togglePause(true); }
    }

    // --- 4. INICIALIZAÇÃO E EVENT LISTENERS ---
    
    function startBossFight(bossType) {
        if (gameState.isGameOver || gameState.bossActive) return;
        asteroids.length = 0; bullets.forEach(b => returnToPool(b, 'bullets')); bullets.length = 0;
        missiles.length = 0; xpOrbs.forEach(orb => returnToPool(orb, 'xpOrbs')); xpOrbs.length = 0;
        if (bossType === 'terra') spawnTerraBoss(); else if (bossType === 'marte') spawnMarsBoss();
    }

    function togglePause(shouldPause, options = {}) {
        const { fromLevelUp = false } = options;
        if (shouldPause && !gameState.paused) {
            gameState.paused = true;
            cancelAnimationFrame(animationFrameId);
            if (!fromLevelUp) pauseMenu.classList.remove('hidden');
        } else if (!shouldPause && gameState.paused) {
            if (gameState.isLevelingUp) return;
            gameState.paused = false;
            pauseMenu.classList.add('hidden');
            gameLoop();
        }
    }

    function startIntro(withSound) {
        soundPermissionPopup.classList.add('hidden');
        introScreen.classList.remove('hidden');
        soundEnabled = withSound;
        if (soundEnabled) introMusic.play().catch(e => console.error("A reprodução de música falhou:", e));
        else introMusic.muted = true;
        introVideo.play().catch(e => console.error("A reprodução de vídeo falhou:", e));
    }

    function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }

    function initGame() {
        resizeCanvas();
        player.x = canvas.width / 2; player.y = canvas.height / 2;
        player.invisible = false; asteroids.length = 0;
        for (let i = 0; i < 5; i++) createAsteroid("large");
        updateUI();
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        prewarmPools();
        gameLoop();
    }
    
    function setupMobileControls() {
        mobileControls.classList.remove('hidden');
        const rect = joystickBase.getBoundingClientRect();
        joystick.baseX = rect.left + rect.width / 2;
        joystick.baseY = rect.top + rect.height / 2;

        canvas.addEventListener('touchstart', handleJoystickStart, { passive: false });
        canvas.addEventListener('touchmove', handleJoystickMove, { passive: false });
        canvas.addEventListener('touchend', handleJoystickEnd, { passive: false });
        canvas.addEventListener('touchcancel', handleJoystickEnd, { passive: false });
    }

    function handleJoystickStart(e) {
        e.preventDefault();
        const touch = e.changedTouches[0];
        const dist = Math.hypot(touch.clientX - joystick.baseX, touch.clientY - joystick.baseY);
        if (dist < joystickBase.clientWidth / 2) {
            joystick.active = true;
            joystick.touchId = touch.identifier;
        }
    }

    function handleJoystickMove(e) {
        if (!joystick.active) return;
        e.preventDefault();
        let touch;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joystick.touchId) {
                touch = e.changedTouches[i];
                break;
            }
        }
        if (!touch) return;
        
        let dx = touch.clientX - joystick.baseX;
        let dy = touch.clientY - joystick.baseY;
        const distance = Math.hypot(dx, dy);
        const radius = joystickBase.clientWidth / 2;
        
        if (distance > radius) {
            dx = (dx / distance) * radius;
            dy = (dy / distance) * radius;
        }
        
        joystickStick.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px)`;
        joystick.moveX = dx / radius;
        joystick.moveY = dy / radius;
    }

    function handleJoystickEnd(e) {
        if (!joystick.active) return;
        let touchReleased = false;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === joystick.touchId) {
                touchReleased = true;
                break;
            }
        }
        if (!touchReleased) return;

        joystick.active = false;
        joystick.touchId = null;
        joystickStick.style.transform = 'translate(-50%, -50%)';
        joystick.moveX = 0;
        joystick.moveY = 0;
    }

    playButton.addEventListener("click", () => {
        introScreen.classList.add("hidden"); canvas.classList.remove("hidden");
        xpBarContainer.classList.remove("hidden"); healthBarContainer.classList.remove("hidden");
        scoreContainer.classList.remove("hidden"); abilityCooldownsContainer.classList.remove("hidden");
        passivePowerupsContainer.classList.remove("hidden"); damageFlashEffect.classList.remove('hidden');
        if (!isMobileDevice) controls.classList.remove("hidden");
        introMusic.pause();
        if (soundEnabled) gameMusic.play().catch(e => console.error("A reprodução da música do jogo falhou:", e));
        initGame();
    });

    restartButton.addEventListener('click', () => { gameOverSound.pause(); gameOverSound.currentTime = 0; restartGame(); });
    resumeButton.addEventListener('click', () => togglePause(false));
    restartFromPauseButton.addEventListener('click', restartGame);
    rerollButton.addEventListener("click", () => {
        if (gameState.rerollsAvailableThisLevel > 0) {
            gameState.rerollsAvailableThisLevel--;
            rerollButton.textContent = `Rerolar (${gameState.rerollsAvailableThisLevel})`;
            generateCards();
            if (gameState.rerollsAvailableThisLevel <= 0) rerollButton.disabled = true;
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.code === 'Escape' && !gameState.isGameOver) { e.preventDefault(); togglePause(!gameState.paused, { fromLevelUp: gameState.isLevelingUp }); }
        if (gameState.paused && !gameState.isLevelingUp) return;
        keys[e.code] = true;
        if (e.code === "Space") e.preventDefault();
        if (!isNaN(e.key)) {
            clearTimeout(sequenceTimeout); keySequence.push(e.key);
            sequenceTimeout = setTimeout(() => { keySequence = []; }, 1500);
            const seq = keySequence.join('');
            if (seq.endsWith('0000')) { openCheatMenu(); keySequence = []; }
        }
        if (!gameState.isGameOver) {
            if (e.code === 'KeyK') triggerPlasmaCannon();
            if (e.code === "KeyJ") triggerEnergyBlade();
            if (e.code === "KeyU") triggerStaticPulse();
            if (e.code === "KeyP") triggerEmergencyTeleport();
            if (e.code === "KeyI") triggerInvisibilityCloak();
            if (e.code === "KeyO") triggerShieldOvercharge();
        }
    });
    
    document.addEventListener("keyup", (e) => { keys[e.code] = false; });
    document.addEventListener("mousedown", () => { if(!gameState.paused && !isMobileDevice) mouseDown = true; });
    document.addEventListener("mouseup", () => { mouseDown = false; });

    function openCheatMenu() {
        if (gameState.paused) return;
        togglePause(true); pauseMenu.classList.add('hidden');
        cheatPowerupList.innerHTML = ''; 
        cardDatabase.forEach(card => {
            const btn = document.createElement('button');
            btn.className = 'cheat-button'; btn.textContent = card.name;
            btn.onclick = () => applyCardEffect(card);
            cheatPowerupList.appendChild(btn);
        });
        const separator = document.createElement('div');
        separator.className = 'cheat-section-title'; separator.textContent = '--- Teste de Chefes ---';
        cheatPowerupList.appendChild(separator);
        const terraBtn = document.createElement('button');
        terraBtn.className = 'cheat-button boss-cheat'; terraBtn.textContent = 'Invocar Terra';
        terraBtn.onclick = () => { startBossFight('terra'); closeCheatMenu(); };
        cheatPowerupList.appendChild(terraBtn);
        const marsBtn = document.createElement('button');
        marsBtn.className = 'cheat-button boss-cheat'; marsBtn.textContent = 'Invocar Marte';
        marsBtn.onclick = () => { startBossFight('marte'); closeCheatMenu(); };
        cheatPowerupList.appendChild(marsBtn);
        cheatMenu.classList.remove('hidden');
    }

    function closeCheatMenu() { cheatMenu.classList.add('hidden'); togglePause(false); }
    closeCheatMenuBtn.addEventListener('click', closeCheatMenu);

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener('blur', () => { if (!gameState.isGameOver) togglePause(true); });
    
    allowSoundBtn.addEventListener('click', () => startIntro(true));
    denySoundBtn.addEventListener('click', () => startIntro(false));

    isMobileDevice = isMobile();
    if(isMobileDevice) {
        setupMobileControls();
    }
    soundPermissionPopup.style.display = 'flex';
};
