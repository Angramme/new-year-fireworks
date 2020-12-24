const PRE_RENDER_N = 8;

let can,ctx;

let fireworks = [];
// let particles = [];
let explosions = [];

let count = 0;

window.onload = ()=>{
	can = document.getElementById('can');
	ctx = can.getContext('2d');
	resizeCan();
	window.addEventListener('resize',resizeCan);

	ctx.fillStyle = "rgb(50, 100, 200)";
	ctx.font = '40px Arial';
	ctx.textAlign = 'center';
	ctx.fillText('Please wait! Pre-rendering fireworks...',can.width*.5,can.height*.3, can.width);

	setTimeout(()=>{
		pre_render_explosions();
		draw();
	}, 10);
}

let background = document.createElement('canvas');
function initBackground(){
	background.width = window.innerWidth;
	background.height = window.innerHeight;

	let c = background.getContext('2d');
	for(let y=0; y<background.height; y++){
		let p = y/background.height;
		let q = 1-p;
		c.fillStyle = `rgb(${29*p|0},${29*p|0},${71*p|0})`;
		c.fillRect(0,y,background.width,1);
	}
	c.fillStyle = '#fff';
	for(let i=0; i<300; i++){
		let y = Math.pow(Math.random(),2)*background.height;
		c.globalAlpha = 1-y/background.height;
		c.fillRect(Math.random()*background.width|0,y,1,1);
	}
}

function draw(){
	ctx.save();
	ctx.globalAlpha = .2;
	ctx.drawImage(background,0,0);
	ctx.restore();

	// ctx.fillStyle = "rgb(50, 100, 200)";
	// ctx.font = '120px Arial';
	// ctx.textAlign = 'center';
	// ctx.fillText('New Year!',can.width*.5,can.height*.3);

	for(let i=fireworks.length-1; i>-1; i--){
		let fw = fireworks[i];
		fw.update();
		fw.draw(ctx);
		if(fw.toDelete)
			fireworks.splice(i,1);
	}

	// for(let i=particles.length-1; i>-1; i--){
	// 	let pr = particles[i];
	// 	pr.update();
	// 	pr.draw(ctx);
	// 	if(pr.toDelete)
	// 		particles.splice(i,1);
	// }

	for(let i=explosions.length-1; i> -1; i--){
		let ex = explosions[i];
		ex.update();
		ex.draw(ctx);
		if(ex.toDelete)
			explosions.splice(i,1);
	}

	count++;
	// if(count > (spaceDown?1:100)){
	if(count > 2 && spaceDown){
		count = 0;
		fireworks.push(new Firework());
	}

	requestAnimationFrame(draw);
}

let spaceDown = false;
window.addEventListener('keydown',e=>{
	if(e.code == 'Space')spaceDown = true;
});
window.addEventListener('keyup',e=>{
	if(e.code == 'Space')spaceDown = false;
});

window.addEventListener("mousedown", e=>{
	fireworks.push(new Firework(e.clientX, e.clientY));
})


function resizeCan(){
	can.width = window.innerWidth;
	can.height = window.innerHeight;

	initBackground();

	ctx.fillStyle = '#fff';
	ctx.fillRect(0,0,can.width,can.height);
}

/*
v1 = v0 + t*a = 0
x1 = v0*t + 1/2*a*t^2 + x0
=>
t = -v0/a
x1 = -v0^2/a + 1/2*a*(v0/a)^2 + x0
=>
x1 = (-1/a + 1/(2a)) * v0^2 + x0
v0 = sqrt((x1-x0)*-2a)
*/

function randColor(){
	return `rgb(${Math.random()*125+125|0},${Math.random()*125+125|0},${Math.random()*125+125|0})`;
}
const availableColors = [];
for(let i=0; i<PRE_RENDER_N; i++){
	availableColors.push(randColor());
}

const gravity = .2;
class Firework{
	constructor(tX, tY){
		this.y = can.height;
		this.vx = Math.random()*1-0.5;

		if(tX){
			this.vy = -Math.sqrt((tY-can.height)*-2*.2);
			this.x = tX + this.getRemainingTime()*this.vx;
		}else{
			this.x = can.width*Math.random()|0;
			this.vy = Math.random()*-8-10|0;
		}

		this.px = this.x;
		this.py = this.y;

		this.spiral_F = Math.random()*2;
		this.spiral_S = Math.random()*0.08+0.003;

		this.color_id = Math.floor(availableColors.length*Math.random());
		this.color = availableColors[this.color_id];
	}
	update(){
		this.vy += gravity;
		this.x += this.vx;
		this.y += this.vy;

		if(this.vy > 0)this.explode();
	}
	draw(ctx){
		const WD = 2.5;

		ctx.beginPath();
		ctx.arc(
			this.x + Math.sin(this.y*this.spiral_S)*this.spiral_F, 
			this.y, WD, 0, Math.PI*2);
		ctx.fillStyle = this.color;
		ctx.fill();

		ctx.beginPath();
		ctx.lineWidth = WD*2;
		ctx.moveTo(this.px, this.py);
		ctx.lineTo(this.x, this.y);
		ctx.strokeStyle = this.color;
		ctx.stroke();

		this.px = this.x;
		this.py = this.y;
	}
	getRemainingTime(){
		return this.vy/gravity;
	}
	explode(){
		// for(let i=0; i<175; i++){
		// 	particles.push(new Particle(this.x, this.y, this.color));
		// }
		explosions.push(new Explosion(this.x, this.y, this.color_id));

		this.toDelete = true;
	}
}

let cached_explosions = null;
function pre_render_explosions(){
	cached_explosions = availableColors
		.map(col=>Explosion.preRenderExplosion(250, 300, col));
}

class Explosion{
	constructor(x, y, color_id){
		this.seq = cached_explosions[color_id];
		this.cframe = 0;
		this.x = x;
		this.y = y;
	}

	update(){
		this.cframe++;
		if(this.cframe > this.seq.length-2)
			this.toDelete = true;
	}
	draw(ctx){
		const img = this.seq[this.cframe|0];
		ctx.drawImage(img, 
			Math.floor(this.x-img.width*0.5), Math.floor(this.y-img.height*0.5));
	}

	static preRenderExplosion(w, h, color){
		const seq = [];
		const pcles = [];
		for(let i=0; i<300; i++){
			pcles.push(new Particle(w/2, h/2, color));
		}
		while(pcles.length > 0){
			const cframe = this.newFrame(w, h);
			const ctx = cframe.X;
			for(let i=pcles.length-1; i>-1; i--){
				let p = pcles[i];
				p.update();
				p.draw(ctx);
				if(p.toDelete)
					pcles.splice(i,1);
			}
			seq.push(cframe.C);
		}
		return seq;
	}
	static newFrame(w, h){
		let C = document.createElement("canvas");
		let X = C.getContext("2d");
		C.width = w;
		C.height = h;
		return {C, X};
	}
}

class Particle{
	constructor(x,y,color){
		this.x = x;
		this.y = y;
		this.px = x;
		this.py = y;

		let ang = Math.random()*Math.PI*2;
		let len = Math.abs(1-Math.exp(Math.random()))*4+1;
		this.vx = Math.sin(ang)*len;
		this.vy = Math.cos(ang)*len;

		this.countdown = 70+30*Math.random()|0;
		this.countdown_speed = Math.random()+0.5;
		this.speed_falloff = Math.random()*0.03+0.92;
		this.blink = 0;

		this.color = color;
	}
	update(){
		this.countdown -= this.countdown_speed;
		this.toDelete = this.countdown<0;
		this.vy += .03;
		this.vx *= this.speed_falloff;
		this.vy *= this.speed_falloff;
		this.x += this.vx;
		this.y += this.vy;
	}
	draw(ctx){
		const WD = Math.max(this.countdown*0.035,.5);

		ctx.beginPath();
		ctx.arc(this.x, this.y, WD, 0, Math.PI*2);
		ctx.fillStyle = this.blink > 3 ? this.color : "white";
		ctx.fill();

		// ctx.beginPath();
		// ctx.lineWidth = WD*2;
		// ctx.moveTo(this.px, this.py);
		// ctx.lineTo(this.x, this.y);
		// ctx.strokeStyle = this.blink > 3 ? this.color : "white";
		// ctx.stroke();

		// this.px = this.x;
		// this.py = this.y;

		this.blink--;
		if(this.blink <= 0) this.blink = 10+Math.random()*5|0;
	}
}