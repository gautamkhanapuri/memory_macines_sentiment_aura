import React, { useEffect, useRef } from 'react';
import p5 from 'p5';

function AuraVisualization({ sentiment, keywords }) {
    const canvasRef = useRef(null);
    const p5InstanceRef = useRef(null);
    const sentimentRef = useRef(0);

    useEffect(() => {
        sentimentRef.current = sentiment;
    }, [sentiment]);

    useEffect(() => {
        const sketch = (p) => {
            let particles = [];
            let flowField = [];
            let cols, rows;
            let scale = 20;
            let zoff = 0;
            let currentSentiment = 0;

            p.setup = () => {
                p.createCanvas(window.innerWidth, window.innerHeight);
                cols = Math.floor(p.width / scale);
                rows = Math.floor(p.height / scale);
                flowField = new Array(cols * rows);

                // Create particles
                for (let i = 0; i < 500; i++) {
                    particles.push(new Particle(p));
                }
            };

            p.draw = () => {
                // Smooth sentiment transitions
                currentSentiment = p.lerp(currentSentiment, sentimentRef.current, 0.05);

                // Map sentiment to color
                let bgColor = getSentimentColor(currentSentiment, 0.05);
                p.background(bgColor[0], bgColor[1], bgColor[2], 25);

                // Update flow field based on Perlin noise
                let yoff = 0;
                for (let y = 0; y < rows; y++) {
                    let xoff = 0;
                    for (let x = 0; x < cols; x++) {
                        let index = x + y * cols;

                        let noiseScale = p.map(Math.abs(currentSentiment), 0, 1, 0.1, 0.3);
                        let angle = p.noise(xoff, yoff, zoff) * p.TWO_PI * 4;

                        let v = p5.Vector.fromAngle(angle);
                        let magnitude = p.map(Math.abs(currentSentiment), 0, 1, 0.5, 2);
                        v.setMag(magnitude);

                        flowField[index] = v;
                        xoff += noiseScale;
                    }
                    yoff += p.map(Math.abs(currentSentiment), 0, 1, 0.1, 0.3);
                }

                let zSpeed = p.map(Math.abs(currentSentiment), 0, 1, 0.001, 0.005);
                zoff += zSpeed;

                // Update and display particles
                for (let particle of particles) {
                    particle.follow(flowField, cols, scale);
                    particle.update();
                    particle.edges(p.width, p.height);
                    particle.show(p, currentSentiment);
                }
            };

            p.windowResized = () => {
                p.resizeCanvas(window.innerWidth, window.innerHeight);
                cols = Math.floor(p.width / scale);
                rows = Math.floor(p.height / scale);
                flowField = new Array(cols * rows);
            };

            function getSentimentColor(sentiment, alpha = 1) {
                if (sentiment < 0) {
                    let t = p.map(sentiment, -1, 0, 0, 1);
                    return [
                        p.lerp(150, 0, t),
                        p.lerp(80, 200, t),
                        p.lerp(255, 150, t),
                        alpha * 255
                    ];
                } else {
                    let t = p.map(sentiment, 0, 1, 0, 1);
                    return [
                        p.lerp(0, 255, t),
                        p.lerp(200, 150, t),
                        p.lerp(150, 50, t),
                        alpha * 255
                    ];
                }
            }

            class Particle {
                constructor(p5Instance) {
                    this.p = p5Instance;
                    this.pos = p5Instance.createVector(
                        p5Instance.random(p5Instance.width),
                        p5Instance.random(p5Instance.height)
                    );
                    this.vel = p5Instance.createVector(0, 0);
                    this.acc = p5Instance.createVector(0, 0);
                    this.maxSpeed = 2;
                    this.prevPos = this.pos.copy();
                }

                follow(vectors, cols, scale) {
                    let x = Math.floor(this.pos.x / scale);
                    let y = Math.floor(this.pos.y / scale);
                    let index = x + y * cols;
                    let force = vectors[index];
                    if (force) {
                        this.applyForce(force);
                    }
                }

                applyForce(force) {
                    this.acc.add(force);
                }

                update() {
                    this.vel.add(this.acc);
                    this.vel.limit(this.maxSpeed);
                    this.pos.add(this.vel);
                    this.acc.mult(0);
                }

                show(p5Instance, sentiment) {
                    let color = getSentimentColor(sentiment, 0.8);
                    p5Instance.stroke(color[0], color[1], color[2], color[3]);
                    p5Instance.strokeWeight(2);
                    p5Instance.line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
                    this.updatePrev();
                }

                updatePrev() {
                    this.prevPos.x = this.pos.x;
                    this.prevPos.y = this.pos.y;
                }

                edges(width, height) {
                    if (this.pos.x > width) {
                        this.pos.x = 0;
                        this.updatePrev();
                    }
                    if (this.pos.x < 0) {
                        this.pos.x = width;
                        this.updatePrev();
                    }
                    if (this.pos.y > height) {
                        this.pos.y = 0;
                        this.updatePrev();
                    }
                    if (this.pos.y < 0) {
                        this.pos.y = height;
                        this.updatePrev();
                    }
                }
            }
        };

        // Create p5 instance
        p5InstanceRef.current = new p5(sketch, canvasRef.current);

        // Cleanup on unmount
        return () => {
            if (p5InstanceRef.current) {
                p5InstanceRef.current.remove();
            }
        };
    }, []);

    return (
        <div
            ref={canvasRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0
            }}
        />
    );
}

export default AuraVisualization;