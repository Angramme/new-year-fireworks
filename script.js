const PRE_RENDER_N = 10;
const FW_SIZE = 170;

let can,ctx;

let fireworks = [];
// let particles = [];
let explosions = [];
let firepaths = [];

let count = 0;
let goCrazy = false;

window.onload = ()=>{
	can = document.getElementById('can');
	ctx = can.getContext('2d');
	resizeCan();
	window.addEventListener('resize',resizeCan);

	ctx.fillStyle = "#444444";
	ctx.fillRect(0, 0, can.width, can.height);
	ctx.fillStyle = "white";
	ctx.font = '40px Arial';
	ctx.textAlign = 'center';
	ctx.fillText('Please wait! Pre-rendering fireworks...',can.width*.5,can.height*.3, can.width);
	ctx.fillText('Press any key to start once loaded.',can.width*.5,can.height*.5, can.width);
	// ctx.fillText('Press space to go crazy.',can.width*.5,can.height*.7, can.width);

	setTimeout(()=>{
		pre_render_explosions();
		draw();

		window.addEventListener("keydown", ()=>{
			let seq = WordSequence("happy new year", 2, 120);
			firepaths.push(seq);
			seq.on_end(()=>setTimeout(
				()=>goCrazy = true, 2000
			))
		}, {once:true});
	}, 20);
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

	const forEachWD = (arr, cb)=>{
		for(let i=arr.length-1; i>-1; i--){
			let e = arr[i];
			cb(e);
			if(e.toDelete)
				arr.splice(i,1);
		}
	};

	forEachWD(fireworks, fw=>{
		fw.update();
		fw.draw(ctx);
	});

	forEachWD(explosions, ex=>{
		ex.update();
		ex.draw(ctx);
	});
	forEachWD(firepaths, fp=>{
		fp.update();
	});

	count++;
	// if(count > (spaceDown?1:100)){
	if(count > 2 && goCrazy){
		count = 0;
		fireworks.push(new Firework());
	}

	requestAnimationFrame(draw);
}

// let spaceDown = false;
// window.addEventListener('keydown',e=>{
// 	if(e.code == 'Space')spaceDown = true;
// });
// window.addEventListener('keyup',e=>{
// 	if(e.code == 'Space')spaceDown = false;
// });

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

const LetterPaths = {
	A:[[
		[0, 1], [0.5, 0], [1, 1]
	], [
		[0.25, 0.5], [0.75, 0.5]
	]],
	B:[
		ArcPath(0.25, 0.25, 0.25, -Math.PI*0.5, Math.PI*0.5, 10),
		ArcPath(0.4, 0.75, 0.25, -Math.PI*0.7, Math.PI*0.9, 10),
		[[0, 1], [0, 0]], 
	],
	C:[
		ArcPath(0.5, 0.5, 0.5, Math.PI*0.4, Math.PI*1.8, 10)
	],
	O:[
		ArcPath(0.5, 0.5, 0.5, 0, Math.PI*2, 15)
	],
	N:[
		[[0, 1], [0, 0], [1, 1], [1, 0]]
	],
	E:[
		[[1, 0], [0, 0], [0, 1], [1, 1]],
		[[0, 0.5], [1, 0.5]]
	],
	W:[
		[[0, 0], [0.2, 1], [0.5, 0.5], [0.8, 1], [1, 0]]
	],
	Y:[
		[[0, 0], [0.5, 0.5], [0.5, 1]],
		[[0.5, 0.5], [1, 0]]
	],
	P:[
		[[0, 1], [0, 0]],
		ArcPath(0.4, 0.25, 0.25, -Math.PI*0.7, Math.PI*1.2, 10)
	],
	R:[
		[[0, 1], [0, 0]],
		ArcPath(0.4, 0.25, 0.25, -Math.PI*0.7, Math.PI*0.7, 10),
		[[0, 0.5], [1, 1]]
	],
	H:[
		[[0, 0], [0, 1]],
		[[1, 0], [1, 1]],
		[[0, 0.5], [1, 0.5]],
	]
}

function ArcPath(x, y, r, as, ae, sc){
	let p = [];
	let da = 2*Math.PI/sc;
	let a = as;
	while(a < ae){
		p.push([
			x+ Math.cos(a)*r,
			y+ Math.sin(a)*r
		]);
		a += da;
	}
	return p;
}

function WordSequence(word, delay, delay2){
	const wH = (can.height-200);
	const wW = 0.8*wH;
	const seq = word.toUpperCase().replace(/\s/g, '').split('').map(
		l=>new SyncFireworks(LetterToFireworks(l, (can.width-wW)/2, 100, wW, wH), delay));
	return Sequence(seq, delay2);
}

function LetterToFireworks(letter, x, y, w, h){
	let ps = LetterPaths[letter];
	if(!ps) console.error("letter not defined", letter);
	let fw = [];
	for(let p of ps){
		fw = fw.concat(PathToFireworks(
			p.map(e=>[x+ e[0]*w, y+ e[1]*h]),
			80
		));
	}
	return fw;
}

function PathToFireworks(path, step){
	const fw = [];
	let dx = 0;
	let i = 0;
	while(i<path.length-1){
		let a = path[i];
		let b = path[i+1];
		let L = Math.sqrt(
			Math.pow(a[0]-b[0], 2) +
			Math.pow(a[1]-b[1], 2)
		);
		while(dx < L){
			let lerp = dx/L;
			fw.push(new Firework(
				a[0]*(1-lerp)+b[0]*lerp,
				a[1]*(1-lerp)+b[1]*lerp
			));
			dx += step;
		}
		dx -= L;
		i ++;
	}
	return fw;
}

function Sequence(sc, delay){
	// sc : SyncFireworks
	let S = sc[0];
	for(let i=1; i<sc.length; i++){
		S.concat(sc[i], delay);
	}
	return S;
}

class SyncFireworks{
	constructor(fireworks, seq_time_step=0){
		this.to_launch = [];
		for(let i=0; i<fireworks.length; i++){
			const f = fireworks[i];
			let frame = (-f.getRemainingTime() + i*seq_time_step)|0;
			if(this.to_launch.length <= frame || !this.to_launch[frame])
				this.to_launch[frame] = [];
			this.to_launch[frame].push(f);
		}
		const fnz = this.to_launch.findIndex(x=>x && x.length!=0);
		this.to_launch.reverse();
		this.to_launch = this.to_launch.slice(0, this.to_launch.length-fnz);
		this.cframe = 0;

		this._onend = [];
	}
	update(){
		if(this.toDelete) return;
		if(this.to_launch[this.cframe])
			for(let f of this.to_launch[this.cframe]){
				fireworks.push(f);
			}
		this.cframe++;
		if(this.cframe >= this.to_launch.length){
			for(let cb of this._onend){
				cb();
			}
			this.toDelete = true;
		}
	}
	concat(sf, delay){
		this.to_launch = this.to_launch.concat(new Array(delay), sf.to_launch);
	}
	on_end(cb){
		this._onend.push(cb);
	}
}



function randColor(){
	return `rgb(${Math.random()*125+125|0},${Math.random()*125+125|0},${Math.random()*125+125|0})`;
}
const availableColors = [];
for(let i=0; i<PRE_RENDER_N; i++){
	availableColors.push(randColor());
}

class Firework{
	constructor(tX, tY){
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
		this.g = Math.random()*0.15+0.2;
		this.y = can.height;
		this.vx = Math.random()*0.8-0.4;

		if(tX){
			this.vy = -Math.sqrt((tY-can.height)*-2*this.g);
			this.x = tX + this.getRemainingTime()*this.vx;
		}else{
			this.x = can.width*Math.random()|0;
			this.vy = Math.random()*-8-10|0;
		}

		this.px = this.x;
		this.py = this.y;

		this.spiral_F = Math.random()*4;
		this.spiral_S = Math.random()*0.08+0.003;

		this.color_id = Math.floor(availableColors.length*Math.random());
		this.color = availableColors[this.color_id];
	}
	update(){
		this.vy += this.g;
		this.x += this.vx;
		this.y += this.vy;

		if(this.vy > 0)this.explode();
	}
	draw(ctx){
		const WD = 2.5;

		const xX = this.x + Math.sin(this.y*this.spiral_S)*this.spiral_F;

		ctx.beginPath();
		ctx.arc(
			xX, this.y, WD, 0, Math.PI*2);
		ctx.fillStyle = this.color;
		ctx.fill();

		ctx.beginPath();
		ctx.lineWidth = WD*2;
		ctx.moveTo(this.px, this.py);
		ctx.lineTo(xX, this.y);
		ctx.strokeStyle = this.color;
		ctx.stroke();

		this.px = xX;
		this.py = this.y;
	}
	getRemainingTime(){
		return this.vy/this.g;
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
		const scale = Math.random()*0.6 + 0.6;
		for(let i=0; i<200; i++){
			pcles.push(new Particle(w/2, h/2, color, scale));
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
	constructor(x,y,color,scale=1){
		this.x = x;
		this.y = y;
		this.px = x;
		this.py = y;

		let ang = Math.random()*Math.PI*2;
		let len = Math.abs(1-Math.exp(Math.random()))*4*(FW_SIZE/200)*scale +0.5;
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