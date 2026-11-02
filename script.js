const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Elementos de la Interfaz
const scoreBoard = document.getElementById("score-board");
const levelBoard = document.getElementById("level-board");
const livesBoard = document.getElementById("lives-board");

// --- CONFIGURACIÓN DE JUEGO ---
let score = 0;
let level = 1;
let lives = 3;
let keys = {};
let gameOver = false;

// --- CARGA DE IMÁGENES ---
const robotImage = new Image();
robotImage.src = "mi_robot.png";

const enemyImage = new Image();
enemyImage.src = "enemigo_alien.png";

const laserImage = new Image();
laserImage.src = "rayo_laser.png";

// Propiedades del Robot
const robot = {
    x: canvas.width / 2 - 30,
    y: canvas.height - 80,
    width: 60,
    height: 60,
    speed: 8
};

let bullets = [];
let enemies = [];
let particles = [];
let enemySpawnTimer = 0;
let shootTimer = 0; // Temporizador para el disparo automático en móvil

// --- CONTROLES DE PC (TECLADO) ---
window.addEventListener("keydown", (e) => keys[e.code] = true);
window.addEventListener("keyup", (e) => keys[e.code] = false);
window.addEventListener("keypress", (e) => {
    if (e.code === "Space" && !gameOver) {
        shoot();
    }
});

// --- CONTROLES MÓVILES (TOUCH) ---
// Al tocar y arrastrar en la pantalla, el robot sigue el dedo horizontalmente
canvas.addEventListener("touchmove", (e) => {
    if (gameOver) return;
    
    // Obtener la posición del toque respecto al canvas
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    
    // Calcular la escala real si el canvas se achicó en la pantalla móvil
    const scaleX = canvas.width / rect.width;
    const canvasTouchX = touchX * scaleX;

    // Centrar el robot con el dedo
    robot.x = canvasTouchX - robot.width / 2;

    // Límites para que no se salga de la pantalla
    if (robot.x < 0) robot.x = 0;
    if (robot.x > canvas.width - robot.width) robot.x = canvas.width - robot.width;
}, { passive: true });


// Función unificada para disparar
function shoot() {
    bullets.push({
        x: robot.x + robot.width / 2 - 10,
        y: robot.y,
        width: 20,
        height: 30,
        speed: 10
    });
}

// Explosiones
function createExplosion(x, y, color) {
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            radius: Math.random() * 3 + 2,
            color: color || "#ff5500",
            alpha: 1,
            decay: Math.random() * 0.03 + 0.02
        });
    }
}

function updateLivesUI() {
    let hearts = "";
    for (let i = 0; i < lives; i++) hearts += "❤️ ";
    livesBoard.innerText = `VIDAS: ${hearts || "❌"}`;
}

// Bucle principal (Update)
function update() {
    if (gameOver) return;

    // Movimiento PC
    if (keys["ArrowLeft"] && robot.x > 0) robot.x -= robot.speed;
    if (keys["ArrowRight"] && robot.x < canvas.width - robot.width) robot.x += robot.speed;

    // Ráfaga automática de disparos (Ideal para móviles)
    shootTimer++;
    if (shootTimer % 15 === 0) { // Dispara automáticamente cada 15 frames
        shoot();
    }

    // Actualizar Balas
    bullets.forEach((bullet, bIndex) => {
        bullet.y -= bullet.speed;
        if (bullet.y + bullet.height < 0) bullets.splice(bIndex, 1);
    });

    // Actualizar Partículas
    particles.forEach((particle, pIndex) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.alpha -= particle.decay;
        if (particle.alpha <= 0) particles.splice(pIndex, 1);
    });

    // Generar Enemigos
    let spawnInterval = Math.max(20, 60 - (level * 5)); 
    enemySpawnTimer++;
    if (enemySpawnTimer % spawnInterval === 0) {
        const size = Math.random() * 20 + 35;
        let minSpeed = 1.5 + (level * 0.7);
        let maxSpeed = 3.5 + (level * 0.7);

        enemies.push({
            x: Math.random() * (canvas.width - size),
            y: -size,
            width: size,
            height: size,
            speed: Math.random() * (maxSpeed - minSpeed) + minSpeed
        });
    }

    // Actualizar Enemigos
    enemies.forEach((enemy, eIndex) => {
        enemy.y += enemy.speed;

        if (enemy.y > canvas.height) {
            enemies.splice(eIndex, 1);
            lives--;
            updateLivesUI();
            checkGameOver();
        }

        if (
            enemy.x < robot.x + robot.width &&
            enemy.x + enemy.width > robot.x &&
            enemy.y < robot.y + robot.height &&
            enemy.y + enemy.height > robot.y
        ) {
            createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#00ffcc");
            enemies.splice(eIndex, 1);
            lives--;
            updateLivesUI();
            checkGameOver();
        }

        bullets.forEach((bullet, bIndex) => {
            if (
                bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y
            ) {
                setTimeout(() => {
                    createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#ffcc00");
                    enemies.splice(eIndex, 1);
                    bullets.splice(bIndex, 1);
                    
                    score += 10;
                    scoreBoard.innerText = `PUNTOS: ${score}`;

                    let newLevel = Math.floor(score / 100) + 1;
                    if (newLevel > level) {
                        level = newLevel;
                        levelBoard.innerText = `NIVEL: ${level}`;
                    }
                }, 0);
            }
        });
    });
}

function checkGameOver() {
    if (lives <= 0) {
        gameOver = true;
        setTimeout(() => {
            alert(`💥 ¡SISTEMA APAGADO! 💥\n\nNivel: ${level}\nPuntos: ${score}`);
            document.location.reload();
        }, 10);
    }
}

// Dibujar (Draw)
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(robotImage, robot.x, robot.y, robot.width, robot.height);

    bullets.forEach(bullet => {
        ctx.drawImage(laserImage, bullet.x, bullet.y, bullet.width, bullet.height);
    });

    enemies.forEach(enemy => {
        ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
    });

    particles.forEach(particle => {
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = particle.color;
        ctx.fill();
        ctx.restore();
    });
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

robotImage.onload = () => {
    updateLivesUI();
    loop();
};