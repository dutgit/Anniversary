document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-bar');
    const loadingPercentage = document.getElementById('loading-percentage');
    const crawlContainer = document.getElementById('crawl-container');
    const bgMusic = document.getElementById('bg-music');
    const sfxStart = document.getElementById('sfx-start');
    const sfxComplete = document.getElementById('sfx-complete');

    // 1. Handle Start Button & Loading Bar
    startBtn.addEventListener('click', () => {
        // Play audio
        bgMusic.play().catch(e => console.log("Audio play failed:", e));
        sfxStart.play().catch(e => console.log("SFX play failed:", e));

        // Switch to Loading Screen
        startScreen.classList.remove('active');
        loadingScreen.classList.add('active');

        // Fake Loading Progress
        let progress = 0;
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 15; // Random jump
            if (progress >= 100) {
                progress = 100;
                clearInterval(loadingInterval);
                sfxComplete.play().catch(e => console.log("SFX play failed:", e));

                // Finished loading, wait 0.5s then show the Star Wars Crawl
                setTimeout(() => {
                    loadingScreen.classList.remove('active');

                    // Activate crawl container to trigger CSS animation
                    crawlContainer.classList.add('active');

                    // Activate hologram container to make photos visible
                    document.getElementById('hologram-container').classList.add('active');

                    // Enable Interactivity
                    initInteractivity();

                    // Start Hologram Waves
                    startHolograms();
                }, 500);
            }

            // Update Bar & Text
            loadingBar.style.width = `${progress}%`;
            loadingPercentage.innerText = `${Math.floor(progress)}%`;
        }, 300); // Update every 300ms
    });

    // 2. Interactivity Systems
    function initInteractivity() {
        // --- A. FAST FORWARD (PRESS AND HOLD) ---
        const crawlText = document.querySelector('.crawl-text');

        const setSpeed = (speed) => {
            // Speed up crawl
            const crawlAnims = crawlText.getAnimations();
            if (crawlAnims.length > 0) crawlAnims[0].playbackRate = speed;

            // Speed up holograms
            document.querySelectorAll('.hologram-photo').forEach(photo => {
                if (photo._hologramAnim) photo._hologramAnim.playbackRate = speed;
            });
        };

        const handlePress = () => setSpeed(4); // 4x faster
        const handleRelease = () => setSpeed(1); // Back to normal speed

        // Touch & Mouse events for Fast Forward
        document.addEventListener('mousedown', handlePress);
        document.addEventListener('mouseup', handleRelease);
        document.addEventListener('touchstart', handlePress);
        document.addEventListener('touchend', handleRelease);

        // --- B. MAGIC TOUCH (STAR PARTICLES) ---
        let lastMoveTime = 0;
        const spawnParticle = (x, y) => {
            const now = Date.now();
            if (now - lastMoveTime < 30) return; // Limit spawn rate (throttle)
            lastMoveTime = now;

            const particle = document.createElement('div');
            particle.classList.add('magic-particle');

            // Random scatter direction
            const tx = (Math.random() - 0.5) * 100 + 'px';
            const ty = (Math.random() - 0.5) * 100 + 'px';
            particle.style.setProperty('--tx', tx);
            particle.style.setProperty('--ty', ty);

            // Position exactly at cursor
            particle.style.left = (x - 3) + 'px'; // -3 to center the 6x6 dot
            particle.style.top = (y - 3) + 'px';

            document.body.appendChild(particle);

            // Clean up after animation finishes (1s)
            setTimeout(() => {
                particle.remove();
            }, 1000);
        };

        document.addEventListener('mousemove', (e) => {
            spawnParticle(e.clientX, e.clientY);
        });

        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                spawnParticle(e.touches[0].clientX, e.touches[0].clientY);
            }
        });
    }

    // 3. 3D Canvas Starfield (Warp Speed Effect)
    function init3DStarfield() {
        const canvas = document.getElementById('cosmic-bg');
        const ctx = canvas.getContext('2d');
        let width, height;
        let stars = [];
        const numStars = 400;

        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        }

        window.addEventListener('resize', resize);
        resize();

        class Star {
            constructor() {
                this.x = (Math.random() - 0.5) * 2000;
                this.y = (Math.random() - 0.5) * 2000;
                this.z = Math.random() * 2000;
                this.pz = this.z;
            }

            update(speed) {
                this.pz = this.z;
                this.z -= speed;

                // If star goes past camera, reset to far distance
                if (this.z < 1) {
                    this.x = (Math.random() - 0.5) * 2000;
                    this.y = (Math.random() - 0.5) * 2000;
                    this.z = 2000;
                    this.pz = this.z;
                }
            }

            draw() {
                // Project 3D coordinates to 2D screen
                const sx = (this.x / this.z) * width + (width / 2);
                const sy = (this.y / this.z) * height + (height / 2);

                // Size grows as it gets closer (z decreases)
                const r = Math.max(0, 2 - (this.z / 1000));

                // Brightness grows as it gets closer
                const alpha = 1 - (this.z / 2000);

                ctx.beginPath();
                ctx.arc(sx, sy, r, 0, Math.PI * 2);

                // Add glowing blue aesthetic color
                ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
                ctx.fill();
            }
        }

        for (let i = 0; i < numStars; i++) {
            stars.push(new Star());
        }

        function animate() {
            // Clear screen with a very faint trail effect (black with opacity)
            ctx.fillStyle = 'rgba(3, 7, 18, 0.3)'; // Match the body cosmic blue
            ctx.fillRect(0, 0, width, height);

            // Determine star speed (faster if fast-forwarding)
            const speed = crawlContainer.classList.contains('fast-forward') ||
                (document.querySelector('.crawl-text') && document.querySelector('.crawl-text').getAnimations()[0]?.playbackRate > 1)
                ? 15 : 2;

            stars.forEach(star => {
                star.update(speed);
                star.draw();
            });

            requestAnimationFrame(animate);
        }

        animate();
    }

    // Initialize the 3D Starfield immediately
    // 4. Hologram Spawner System
    function startHolograms() {
        const container = document.getElementById('hologram-container');

        // Define the 3 batches of photos (12 photos total)
        const batches = [
            { time: 5000, startId: 1 },  // Batch 1: 5 seconds in
            { time: 25000, startId: 5 }, // Batch 2: 25 seconds in
            { time: 45000, startId: 9 }  // Batch 3: 45 seconds in
        ];

        const positions = ['hologram-tl', 'hologram-bl', 'hologram-tr', 'hologram-br'];

        batches.forEach(batch => {
            setTimeout(() => {
                // Spawn 4 photos for this batch with a staggered delay
                for (let i = 0; i < 4; i++) {
                    setTimeout(() => {
                        const photoId = batch.startId + i;
                        spawnHologram(photoId, positions[i], container);
                    }, i * 500); // 500ms delay between each photo appearing
                }
            }, batch.time);
        });
    }

    function generateKeyframes(posClass) {
        // Calculate tilt to face the center of the screen
        let ry = 0; // Rotate Y (3D inward tilt)
        let rz = 0; // Rotate Z (Slight 2D tilt)

        if (posClass.includes('tl')) { ry = 25; rz = 6; }
        else if (posClass.includes('bl')) { ry = 25; rz = -6; }
        else if (posClass.includes('tr')) { ry = -25; rz = -6; }
        else if (posClass.includes('br')) { ry = -25; rz = 6; }

        return [
            // Offset 0: Start far away. Eases OUT (decelerates) into the screen.
            { transform: `translateZ(-3000px) translateX(0px) translateY(0px) scale(0) rotateY(${ry}deg) rotateZ(${rz}deg)`, opacity: 0, offset: 0, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' },

            // Offset 0.1: Arrived at screen. Eases IN-OUT for a smooth hover up.
            { transform: `translateZ(0px) translateX(0px) translateY(0px) scale(1) rotateY(${ry}deg) rotateZ(${rz}deg)`, opacity: 1, offset: 0.1, easing: 'ease-in-out' },

            // Offset 0.5: Reached top of hover. Sways Right & Tilts deeper 3D.
            { transform: `translateZ(0px) translateX(20px) translateY(-30px) scale(1) rotateY(${ry + 15}deg) rotateZ(${rz + 4}deg)`, opacity: 1, offset: 0.5, easing: 'ease-in-out' },

            // Offset 0.9: Reached bottom of hover. Sways Left & Tilts shallower.
            { transform: `translateZ(0px) translateX(-15px) translateY(15px) scale(1) rotateY(${ry - 10}deg) rotateZ(${rz - 3}deg)`, opacity: 1, offset: 0.9, easing: 'cubic-bezier(0.5, 0, 1, 0.5)' },

            // Offset 1: Warped out.
            { transform: `translateZ(1000px) translateX(0px) translateY(0px) scale(2) rotateY(${ry}deg) rotateZ(${rz}deg)`, opacity: 0, offset: 1 }
        ];
    }

    function spawnHologram(id, positionClass, container) {
        const img = document.createElement('img');
        img.src = `assets/photo${id}.jpg`;
        img.alt = `Memory ${id}`;
        img.classList.add('hologram-photo', positionClass);

        container.appendChild(img);

        // Get dynamically calculated 3D keyframes based on position
        const keyframes = generateKeyframes(positionClass);

        // 15 seconds duration for each photo
        const animation = img.animate(keyframes, {
            duration: 15000,
            fill: 'forwards'
            // Removed global easing so per-keyframe easing works correctly
        });

        // Store animation in element so fast-forward can affect it
        img._hologramAnim = animation;

        animation.onfinish = () => {
            img.remove(); // Clean up DOM
        };
    }

    // 5. Phase 3: Dream Destinations
    function startPhase3() {
        // Hide previous containers
        document.getElementById('crawl-container').classList.remove('active');
        document.getElementById('hologram-container').classList.remove('active');

        const phase3Container = document.getElementById('phase3-container');
        phase3Container.classList.add('active');

        // Spawn 3D Category Text
        const title = document.createElement('div');
        title.className = 'phase3-text';
        title.innerHTML = "3 Negara Impian<br>Kita ✈️";
        phase3Container.appendChild(title);

        const textKeyframes = [
            { transform: `translateZ(-3000px) scale(0)`, opacity: 0, offset: 0, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' },
            { transform: `translateZ(0) scale(1)`, opacity: 1, offset: 0.1, easing: 'ease-in-out' },
            { transform: `translateZ(0) scale(1.1)`, opacity: 1, offset: 0.8, easing: 'cubic-bezier(0.5, 0, 1, 0.5)' },
            { transform: `translateZ(1000px) scale(2)`, opacity: 0, offset: 1 }
        ];

        const textAnim = title.animate(textKeyframes, { duration: 8000, fill: 'forwards' });

        textAnim.onfinish = () => {
            title.remove();
            spawnCountries();
        };
    }

    function spawnCountries() {
        const phase3Container = document.getElementById('phase3-container');
        const modal = document.getElementById('country-modal');
        const modalImg = document.getElementById('modal-img');
        const modalTitle = document.getElementById('modal-title');
        const modalDesc = document.getElementById('modal-desc');

        document.getElementById('close-modal').addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });

        const countries = [
            {
                id: 'china', name: 'China', img: 'assets/china.jpg', xOffset: -30,
                desc: 'Negeri Tirai Bambu! Kita bisa jalan-jalan menyusuri Tembok Besar China sambil menikmati senja, atau nyobain kuliner otentik di pasar tradisionalnya. Tempat di mana budaya kuno dan modernitas menyatu dengan sangat epik.'
            },
            {
                id: 'swiss', name: 'Swiss', img: 'assets/swiss.jpg', xOffset: 0,
                desc: 'Surga dunia di Pegunungan Alpen. Bayangin kita bangun pagi di kabin kayu yang hangat, minum coklat panas sambil ngeliatin hamparan salju abadi dan danau yang sejernih kristal. Damai banget!'
            },
            {
                id: 'japan', name: 'Jepang', img: 'assets/japan.jpg', xOffset: 30,
                desc: 'Negeri Sakura! Kita wajib pakai Kimono berdua jalan-jalan di Kyoto, terus nyobain sushi asli Tokyo, dan foto-foto dengan latar Gunung Fuji. Vibes anime di dunia nyata!'
            }
        ];

        countries.forEach((country, index) => {
            setTimeout(() => {
                const img = document.createElement('img');
                img.src = country.img;
                img.alt = country.name;
                img.className = 'country-photo';
                phase3Container.appendChild(img);

                const isMobile = window.innerWidth < 768;
                let tx = isMobile ? 0 : country.xOffset;
                let ty = isMobile ? (index - 1) * 30 : 0; // Stack vertically on mobile, horizontally on desktop

                const hoverKeyframes = [
                    { transform: `translateZ(-3000px) translate3d(0, 0, 0) scale(0)`, opacity: 0, offset: 0, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' },
                    { transform: `translateZ(0) translate3d(${tx}vw, ${ty}vh, 0) scale(1)`, opacity: 1, offset: 0.2, easing: 'ease-in-out' },
                    { transform: `translateZ(0) translate3d(${tx}vw, ${ty - 3}vh, 0) scale(1)`, opacity: 1, offset: 0.6, easing: 'ease-in-out' },
                    { transform: `translateZ(0) translate3d(${tx}vw, ${ty}vh, 0) scale(1)`, opacity: 1, offset: 1 }
                ];

                img.animate(hoverKeyframes, {
                    duration: 6000 + (Math.random() * 1000), // Slightly random duration to desync hovers
                    iterations: Infinity,
                    direction: 'alternate'
                });

                img.addEventListener('click', () => {
                    modalImg.src = country.img;
                    modalTitle.innerText = country.name;
                    modalDesc.innerText = country.desc;
                    modal.classList.add('active');
                });

            }, index * 800); // Stagger entry
        });
    }

    // Listen for the end of the Star Wars crawl to trigger Phase 3
    const crawlTextEl = document.querySelector('.crawl-text');
    crawlTextEl.addEventListener('animationend', () => {
        startPhase3();
    });

    init3DStarfield();

});
