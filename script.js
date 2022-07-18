window.addEventListener('load', function () {
  // canvas setup
  const canvas = document.getElementById('canvas1');
  const ctx = canvas.getContext('2d');
  canvas.width = 700;
  canvas.height = 500;

  class InputHandler {
    constructor(game) {
      this.game = game;
      window.addEventListener('keydown', (e) => {
        if (
          (e.key === 'ArrowUp' || e.key === 'ArrowDown') &&
          this.game.keys.indexOf(e.key) === -1
        ) {
          this.game.keys.push(e.key);
        } else if (e.key === ' ') {
          this.game.player.shootTop();
        } else if (e.key === 'd') {
          this.game.debug = !this.game.debug;
        }
      });
      window.addEventListener('keyup', (e) => {
        if (this.game.keys.indexOf(e.key) > -1) {
          this.game.keys.splice(this.game.keys.indexOf(e.key), 1);
        }
      });
    }
  }
  class SoundController {
    constructor() {
      this.powerUpSound = document.getElementById('powerup');
      this.powerDownSound = document.getElementById('powerdown');
      this.explosionSound = document.getElementById('explosion');
      this.shotSound = document.getElementById('shot');
      this.hitSound = document.getElementById('hit');
      this.shieldSound = document.getElementById('shieldSound');
    }
    powerUp() {
      this.powerUpSound.currentTime = 0;
      this.powerUpSound.play();
    }
    powerDown() {
      this.powerDownSound.currentTime = 0;
      this.powerDownSound.play();
    }
    explosion() {
      this.explosionSound.currentTime = 0;
      this.explosionSound.play();
    }
    shot() {
      this.shotSound.currentTime = 0;
      this.shotSound.play();
    }
    hit() {
      this.hitSound.currentTime = 0;
      this.hitSound.play();
    }
    shield() {
      this.shieldSound.currentTime = 0;
      this.shieldSound.play();
    }
  }
  class Shield {
    constructor(game) {
      this.game = game;
      this.width = this.game.player.width;
      this.height = this.game.player.height;
      this.frameX = 0;
      this.maxFrame = 24;
      this.image = document.getElementById('shield');
      this.fps = 60;
      this.timer = 0;
      this.interval = 1000 / this.fps;
    }
    update(deltaTime) {
      if (this.frameX <= this.maxFrame) {
        if (this.timer > this.interval) {
          this.frameX++;
          this.timer = 0;
        } else {
          this.timer += deltaTime;
        }
      }
    }
    draw(context) {
      context.drawImage(
        this.image,
        this.frameX * this.width,
        0,
        this.width,
        this.height,
        this.game.player.x,
        this.game.player.y,
        this.width,
        this.height
      );
    }
    reset() {
      this.frameX = 0;
      this.game.sound.shield();
    }
  }
  class Projectile {
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.width = 10;
      this.height = 3;
      this.speed = 3;
      this.markedForDeletion = false;
      this.image = document.getElementById('projectile');
    }
    update() {
      this.x += this.speed;
      if (this.x > this.game.width * 0.8) this.markedForDeletion = true;
    }
    draw(context) {
      context.drawImage(this.image, this.x, this.y);
    }
  }
  class Particle {
    constructor(game, x, y) {
      this.game = game;
      this.x = x;
      this.y = y;
      this.image = document.getElementById('gears');
      this.frameX = Math.floor(Math.random() * 3);
      this.frameY = Math.floor(Math.random() * 3);
      this.spriteSize = 50;
      this.sizeModifier = (Math.random() * 0.5 + 0.5).toFixed(1);
      this.size = this.spriteSize * this.sizeModifier;
      this.speedX = Math.random() * 6 - 3;
      this.speedY = Math.random() * -15;
      this.gravity = 0.5;
      this.markedForDeletion = false;
      this.angle = 0;
      this.va = Math.random() * 0.2 - 0.1;
      this.bounced = 0;
      this.bottomBounceBoundary = Math.random() * 80 + 60;
    }
    update() {
      this.angle += this.va;
      this.speedY += this.gravity;
      this.x -= this.speedX + this.game.speed;
      this.y += this.speedY;
      if (this.y > this.game.height + this.size || this.x < 0 - this.size)
        this.markedForDeletion = true;
      if (
        this.y > this.game.height - this.bottomBounceBoundary &&
        this.bounced < 1
      ) {
        this.bounced++;
        this.speedY *= -0.7;
      }
    }
    draw(context) {
      context.save();
      context.translate(this.x, this.y);
      context.rotate(this.angle);
      context.drawImage(
        this.image,
        this.frameX * this.spriteSize,
        this.frameY * this.spriteSize,
        this.spriteSize,
        this.spriteSize,
        this.size * -0.5,
        this.size * -0.5,
        this.size,
        this.size
      );
      context.restore();
    }
  }
  class Player {
    constructor(game) {
      this.game = game;
      this.width = 120;
      this.height = 190;
      this.x = 20;
      this.y = 130;
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 37;
      this.speedY = 0;
      this.maxSpeed = 3;
      this.projectiles = [];
      this.image = document.getElementById('player');
      this.powerUp = false;
      this.powerUpTimer = 0;
      this.powerUpLimit = 10000;
    }
    update(deltaTime) {
      if (this.game.keys.includes('ArrowUp')) this.speedY = -this.maxSpeed;
      else if (this.game.keys.includes('ArrowDown'))
        this.speedY = this.maxSpeed;
      else this.speedY = 0;
      this.y += this.speedY;
      // vertical boundaries
      if (this.y > this.game.height - this.height * 0.5)
        this.y = this.game.height - this.height * 0.5;
      else if (this.y < -this.height * 0.5) this.y = -this.height * 0.5;
      // handle projectiles
      this.projectiles.forEach((projectile) => {
        projectile.update();
      });
      this.projectiles = this.projectiles.filter(
        (projectile) => !projectile.markedForDeletion
      );
      // sprite animation
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      } else {
        this.frameX = 0;
      }
      // power up
      if (this.powerUp) {
        if (this.powerUpTimer > this.powerUpLimit) {
          this.powerUpTimer = 0;
          this.powerUp = false;
          this.frameY = 0;
          this.game.sound.powerDown();
        } else {
          this.powerUpTimer += deltaTime;
          this.frameY = 1;
          this.game.ammo += 0.1;
        }
      }
    }
    draw(context) {
      if (this.game.debug)
        context.strokeRect(this.x, this.y, this.width, this.height);
      this.projectiles.forEach((projectile) => {
        projectile.draw(context);
      });
      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
    }
    shootTop() {
      if (this.game.ammo > 0) {
        this.projectiles.push(
          new Projectile(this.game, this.x + 80, this.y + 30)
        );
        this.game.ammo--;
      }
      this.game.sound.shot();
      if (this.powerUp) this.shootBottom();
    }
    shootBottom() {
      if (this.game.ammo > 0) {
        this.projectiles.push(
          new Projectile(this.game, this.x + 80, this.y + 175)
        );
      }
    }
    enterPowerUp() {
      this.powerUpTimer = 0;
      this.powerUp = true;
      if (this.game.ammo < this.game.maxAmmo)
        this.game.ammo = this.game.maxAmmo;
      this.game.sound.powerUp();
    }
  }
  class Enemy {
    constructor(game) {
      this.game = game;
      this.x = this.game.width;
      this.speedX = Math.random() * -1.5 - 0.5;
      this.markedForDeletion = false;
      this.frameX = 0;
      this.frameY = 0;
      this.maxFrame = 37;
    }
    update() {
      this.x += this.speedX - this.game.speed;
      if (this.x + this.width < 0) this.markedForDeletion = true;
      // sprite animation
      if (this.frameX < this.maxFrame) {
        this.frameX++;
      } else this.frameX = 0;
    }
    draw(context) {
      if (this.game.debug)
        context.strokeRect(this.x, this.y, this.width, this.height);
      context.drawImage(
        this.image,
        this.frameX * this.width,
        this.frameY * this.height,
        this.width,
        this.height,
        this.x,
        this.y,
        this.width,
        this.height
      );
      if (this.game.debug) {
        context.font = '20px Helvetica';
        context.fillText(this.lives, this.x, this.y);
      }
    }
  }
  class Angler1 extends Enemy {
    constructor(game) {
      super(game);
      this.width = 228;
      this.height = 169;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById('angler1');
      this.frameY = Math.floor(Math.random() * 3);
      this.lives = 5;
      this.score = this.lives;
    }
  }
  class Angler2 extends Enemy {
    constructor(game) {
      super(game);
      this.width = 213;
      this.height = 165;
      this.y = Math.random() * (this.game.height * 0.95 - this.height);
      this.image = document.getElementById('angler2');
      this.frameY = Math.floor(Math.random() * 2);
      this.lives = 6;
      this.score = this.lives;
    }
  }
});

class LuckyFish extends Enemy {
  constructor(game) {
    super(game);
    this.width = 99;
    this.height = 95;
    this.y = Math.random() * (this.game.height * 0.95 - this.height);
    this.image = document.getElementById('lucky');
    this.frameY = Math.floor(Math.random() * 2);
    this.lives = 5;
    this.score = 15;
    this.type = 'lucky';
  }
}

class Drone extends Enemy {
  consuctor(game, x, y) {
    super(gme);
    this.width = 115;
    thisght = 95;
    this.Math.random() * (this.game.height * 0.95 - this.height);
    this.ige = document.getElementById('drone');
    this.frmeY = Math.floor(Math.random() * 2);
    this.lives = 3;
    thisre = this.lives;
    this.edX = Math.random() * -4.2 - 0.5;
  }
}

class Layer {
  constructor(game, image, speedModifier) {
    this.game = game;
    this.image = image;
    this.speedModifier = speedModifier;
    this.width = 1768;
    this.height = 500;
    this.x = 0;
    this.y = 0;
  }
  update() {
    if (this.x <= -this.width) this.x = 0;
    this.x -= this.game.speed * this.speedModifier;
  }
  draw(context) {
    context.drawImage(this.image, this.x, this.y);
    context.drawImage(this.image, this.x + this.width, this.y);
  }
}

class Background {
  constructor(game) {
    this.game = game;
    this.image1 = document.getElementById('layer1');
    this.image2 = document.getElementById('layer2');
    this.image3 = document.getElementById('layer3');
    this.image4 = document.getElementById('layer4');
    this.layer1 = new Layer(this.game, this.image1, 0.2);
    this.layer2 = new Layer(this.game, this.image2, 0.4);
    this.layer3 = new Layer(this.game, this.image3, 1);
    this.layer4 = new Layer(this.game, this.image4, 1.5);
    this.layers = [this.layer1, this.layer2, this.layer3];
  }
  update() {
    this.layers.forEach((layer) => layer.update());
  }
  draw(context) {
    this.layers.forEach((layer) => layer.draw(context));
  }
}
class Explosion {
  uctor(game, x, y) { 
 thie = game;
thismeX = 0;
his.iteWidth = 200;
is.siteHeight = 200;
.width = this.spriteWidth;
    ght = this.spriteHeight;
   t x - this.width * 0.5;
  th y - this.height * 0.5;
 thi = 30;
his.er = 0;
is.ierval = 1000 / this. f ps;
his.kedForDeletion = false;
is.mFrame = 8;


updeltaTime) { 
 thi= this.game.speed;
if (.timer > this.interval) { 
  thisX++;
       = 0;
    
       += deltaTime;
    
    .frameX > this.maxFrame) this.markedForDeletion = true;
  
  ontext) { 
    drawImage(
      
     
     
     
     
     
     
     
     
    );
this.image,
  this.frameX * this.spriteWidth,
      0,
      this.spriteWidth,
      this.spriteHeight,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }
}
 class SmokeExplosion extends Explosion {
        constructor(game, x, y){
            super(game, x, y);
            this.image = document.getElementById('smokeExplosion');
        }
    }
       class FireExplosion extends Explosion {
        constructor(game, x, y){
            super(game, x, y);
            this.image = document.getElementById('fireExplosion');
        }
    }
      class UI {
        constructor(game){
            this.game = game;
            this.fontSize = 25;
            this.fontFamily = 'Bangers';
            this.color = 'white';
        }
        draw(context){
            context.save();
            context.fillStyle = this.color;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
            context.shadowColor = 'black';
            context.font = this.fontSize + 'px ' + this.fontFamily;
            // score
            context.fillText('Score: ' + this.game.score, 20, 40);
            // timer
            const formattedTime = (this.game.gameTime * 0.001).toFixed(1);
            context.fillText('Timer: ' + formattedTime, 20, 100);
            // game over messages
            if (this.game.gameOver){
                context.textAlign = 'center';
                let message1;
                let message2;
                if (this.game.score > this.game.winningScore){
                    message1 = 'Most Wondrous!';
                    message2 = 'Well done explorer!';
                } else {
                    message1 = 'Blazes!';
                    message2 = 'Get my repair kit and try again!';
                }
                context.font = '70px ' + this.fontFamily;
                context.fillText(message1, this.game.width * 0.5, this.game.height * 0.5 - 20);
                context.font = '25px ' + this.fontFamily;
                context.fillText(message2, this.game.width * 0.5, this.game.height * 0.5 + 20);
            }