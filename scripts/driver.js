/*
	Brian Chu
	James Stewart
	CS 74.42B Game Programming

	Flocking demo

*/

var display = document.getElementById("gameCanvas");
var ctx = display.getContext('2d');
display.width = window.innerWidth * 99/100;
display.height = window.innerHeight * 97/100;

var mousePosition = {x:0, y:0};
var tick = 0;

window.addEventListener("mousemove", onMouseMove, false);
function onMouseMove(event){
	mousePosition = { x: event.pageX, y: event.pageY };
}

var steeringForce = new SteeringForce();
var tempSteeringForce = new SteeringForce();

var separationWeight = 1.5;
var alignmentWeight = 0.29;
var cohesionWeight = 10.6;
var wanderWeight = 0.1;

var agents = [];
var centerOfMassX;
var centerOfMassY;

var seeker = new Agent();
var seekerForce = new SteeringForce();
	seeker.x = 16 + Math.random() * 256;
	seeker.y = display.height / 4 + Math.random() * 256;
	seeker.maxSpeed = 6.4;
	seeker.maxAcceleration = 0.15;
	seeker.radius = 8;

for (var i = 0; i < 168; ++i) {
	var agent = new Agent();
	agent.x = 16 + Math.random() * 256;
	agent.y = display.height / 4 + Math.random() * 256;
	agent.maxSpeed = 8.4;
	agent.maxAcceleration = 0.085;
	agent.radius = 8;
		
	agents.push(agent);
}


// our adorable moving turret
function Agent() {
	this.x = 0;
	this.y = 0;
	this.height = 1; //between 0.5 and 1.5.
	this.orientation = 0;
	
	this.vx = 0;
	this.vy = 0;
		
	this.maxSpeed = 0;
	this.maxAcceleration = 0;
	
	// used for wander behavior
	this.wanderRadius = 16;
	this.wanderOffset = 64;
	this.wanderRate = 0.3;
	this.wanderAngle = 0;
}

// accumlates influences of all steering behaviors.
function SteeringForce() {
	this.linearX = 0;
	this.linearY = 0;
}

// render agent to canvas.
Agent.prototype.draw = function() {
  ctx.save();
  
  ctx.translate(this.x, this.y);
  ctx.rotate(this.orientation);
  ctx.scale(this.height, this.height);
    
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.arc(0, 0, agent.radius, 0.3, 6);
  ctx.moveTo(0, 0);
  ctx.lineTo(agent.radius * 2.2, 0);
  
  ctx.fillStyle = "DodgerBlue";
  ctx.fill();
  ctx.fillStyle = "black";
  ctx.stroke();
  
  ctx.restore();
}

// update agent's orientation and position based on steering forces
// and current velocity.
Agent.prototype.update = function(steeringForce) {
	this.x += this.vx;
	this.y += this.vy;
			
	this.vx += steeringForce.linearX;
	this.vy += steeringForce.linearY;
		
	var speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
	
	if (speed > 0 && speed > this.maxSpeed) {
		this.vx = (this.vx / speed) * this.maxSpeed;
		this.vy = (this.vy / speed) * this.maxSpeed;
	}
	
	this.height = speed / this.maxSpeed + 0.5;

	//orient to current velocity
	this.orientation = Math.atan2(this.vy, this.vx);
}

// move toward target position at max accleration.
function seek(agent, targetX, targetY, steeringForce) {
	var x = targetX - agent.x;
	var y = targetY - agent.y;
	
	var distance = Math.sqrt(x * x + y * y);
	
	x = x / distance * agent.maxAcceleration;
	y = y / distance * agent.maxAcceleration;
	
	steeringForce.linearX = x;
	steeringForce.linearY = y;
}

function wander(agent, neighbors, steeringForce) {

	// perturb wander angle by a small random amount.
	var deltaWander = Math.random() * agent.wanderRate;
	agent.wanderAngle += Math.random() > 0.5 ? deltaWander : -deltaWander;
			
	// move target to wanderOffset in front of agent
	var targetX = agent.x + Math.cos(agent.orientation) * agent.wanderOffset + Math.cos(agent.wanderAngle) * agent.wanderRadius;
	var targetY = agent.y + Math.sin(agent.orientation) * agent.wanderOffset + Math.sin(agent.wanderAngle) * agent.wanderRadius;
			
	return seek(agent, targetX, targetY, steeringForce);
}

function separation(agent, neighbors, steeringForce) {
	for (var i = 0; i < neighbors.length; ++i) {
		var toAgentX = agent.x - neighbors[i].x;
		var toAgentY = agent.y - neighbors[i].y;
		
		var toAgentMagnitude = utils.getMagnitude(toAgentX, toAgentY);
		
		if (toAgentMagnitude > 0) {
			var normalizedToAgentX = toAgentX / toAgentMagnitude;
			var normalizedToAgentY = toAgentY / toAgentMagnitude;
			
			// scale force to inversely proportional to distance from neighbor:
			steeringForce.linearX += normalizedToAgentX / toAgentMagnitude;
			steeringForce.linearY += normalizedToAgentY / toAgentMagnitude;
		}
	}
}

function alignment(agent, neighbors, steeringForce) {
	var averageOrientation = 0;
	
	for (var i = 0; i < neighbors.length; ++i) {
		averageOrientation += neighbors[i].orientation;
	}
	
	averageOrientation /= neighbors.length;
	
	var currentOrientationX = Math.cos(agent.orientation);
	var currentOrientationY = Math.sin(agent.orientation);
	
	var averageOrientationX = Math.cos(averageOrientation);
	var averageOrientationY = Math.sin(averageOrientation);
	
	steeringForce.linearX = averageOrientationX - currentOrientationX;
	steeringForce.linearY = averageOrientationY - currentOrientationY;
}

function cohesion(agent, neighbors, steeringForce) {
	seek(agent, centerOfMassX, centerOfMassY, steeringForce);
}

function applyBehavior(agent, behavior, weight, steeringForce) {
	tempSteeringForce.linearX = 0;
	tempSteeringForce.linearY = 0;
	
	behavior(agent, agents, tempSteeringForce);

	steeringForce.linearX += tempSteeringForce.linearX * weight;
	steeringForce.linearY += tempSteeringForce.linearY * weight;
}



(function update(){
	tick++;
	window.requestAnimationFrame(update, display);
	clearDisplay();
	drawBackdrop();

	centerOfMassX = seeker.x;
	centerOfMassY = seeker.y;

			
	// update each agent		
	for (var i = 0; i < agents.length; ++i) {
		var agent = agents[i];
		
		steeringForce.linearX = 0;
		steeringForce.linearY = 0;
		
		applyBehavior(agent, separation, separationWeight, steeringForce);
		applyBehavior(agent, alignment, alignmentWeight, steeringForce);
		applyBehavior(agent, cohesion, cohesionWeight, steeringForce);
		applyBehavior(agent, wander, wanderWeight, steeringForce);		
						
		agent.update(steeringForce);
		agent.draw();
	}

	seek(seeker, mousePosition.x, mousePosition.y, seekerForce);
	seeker.update(seekerForce);
	seeker.draw();

	drawFrameRate()

})();

function drawFrame(){
}

function drawBackdrop(){
	var gradient = ctx.createLinearGradient(0,0,0,display.height);
	gradient.addColorStop(0, "hsla(217, 99%, 47%, 1)");
	gradient.addColorStop(1, "hsla(217, 78%, 26%, 1)");
	ctx.fillStyle = gradient;
	ctx.fillRect(0,0,display.width,display.height);
}

//code found at http://stackoverflow.com/questions/4787431/check-fps-in-js/5111475#5111475
var filterStrength = 20;
var frameTime = 0, lastLoop = new Date, thisLoop;
var fpsOut = 0;
function drawFrameRate(){
	ctx.fillStyle = "white";

	var thisFrameTime = (thisLoop=new Date) - lastLoop;
	frameTime+= (thisFrameTime - frameTime) / filterStrength;
	lastLoop = thisLoop;

	ctx.font = "30px Arial";
	ctx.fillText(fpsOut, display.width/30, display.height/30);
}

setInterval(function(){fpsOut = (1000/frameTime).toFixed(1) + " fps";}, 1000);

// Report the fps only every second, to only lightly affect measurements



//@citation: user: Prestaul at http://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
function clearDisplay(){
// Store the current transformation matrix
ctx.save();

// Use the identity matrix while clearing the canvas
ctx.setTransform(1, 0, 0, 1, 0, 0);
ctx.clearRect(0, 0, display.width, display.height);

// Restore the transform
ctx.restore();
}