const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const ball = {
    x: 200,
    y: 480,
    radius: 10,
    speed: 5
};
const keys = {};

document.addEventListener("keydown", (e) => (keys[e.key] = true));
document.addEventListener("keyup", (e) => (keys[e.key] = false));

function update() {
    if (keys["ArrowLeft"] || keys["a"]) ball.x -= ball.speed;
    if (keys["ArrowRight"] || keys["d"]) ball.x += ball.speed;

    // Keep the ball within the canvas boundaries
    ball.x = Math.max(ball.radius, Math.min(canvas.width - ball.radius, ball.x));
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.dtrokeStyle = "#8fb8de";
    ctx.lineWidth = 3;
    ctx.stroke();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

loop();
