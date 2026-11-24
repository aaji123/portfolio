/*
 * Generative identity: a seeded, 1-bit pixel flow field behind the hero.
 *
 * Every load rolls a new seed, unless the URL carries one (#s=<seed>). From
 * there, everything visible is a pure function of (seed, size): Math.random()
 * is never used, so any seed can be reproduced from its link.
 */
(function () {
    "use strict";

    const hero = document.querySelector(".hero");
    const layer = document.querySelector(".identity");
    const canvas = document.querySelector(".identity-canvas");
    const controls = document.querySelector(".identity-controls");
    const rollButton = document.querySelector(".identity-roll");
    const seedLabel = document.querySelector(".identity-seed");

    const ctx = canvas && canvas.getContext && canvas.getContext("2d");
    if (!hero || !layer || !ctx || !controls || !rollButton || !seedLabel) return;

    const STEP_MS = 1000 / 60;
    const FADE = 0.965;     // trail brightness kept per step
    const SPEED = 0.2;      // cells per step
    const WARM_UP = 160;    // steps run before the first frame, so it starts full
    const RESIZE_DELAY = 150;
    const MAX_SEED_LENGTH = 32;

    // 8x8 ordered dither. A trail dissolves pixel by pixel instead of going grey.
    const BAYER = [
         0, 32,  8, 40,  2, 34, 10, 42,
        48, 16, 56, 24, 50, 18, 58, 26,
        12, 44,  4, 36, 14, 46,  6, 38,
        60, 28, 52, 20, 62, 30, 54, 22,
         3, 35, 11, 43,  1, 33,  9, 41,
        51, 19, 59, 27, 49, 17, 57, 25,
        15, 47,  7, 39, 13, 45,  5, 37,
        63, 31, 55, 23, 61, 29, 53, 21
    ].map(function (n) { return (n + 2.5) / 68; });


    /* ---------- seed ---------- */

    function fnv1a(text) {
        const bytes = new TextEncoder().encode(text);
        let hash = 0x811c9dc5;
        for (let i = 0; i < bytes.length; i++) {
            hash ^= bytes[i];
            hash = Math.imul(hash, 0x01000193);
        }
        return hash >>> 0;
    }

    function mulberry32(state) {
        return function () {
            state = (state + 0x6d2b79f5) | 0;
            let t = Math.imul(state ^ (state >>> 15), 1 | state);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // Returns null when the hash is not a seed (for example #about).
    function seedFromHash() {
        if (location.hash.indexOf("#s=") !== 0) return null;
        let value = location.hash.slice(3);
        try {
            value = decodeURIComponent(value);
        } catch (error) {
            // Malformed escape: use the raw text, it is still a valid seed.
        }
        return Array.from(value.trim()).slice(0, MAX_SEED_LENGTH).join("") || null;
    }

    function writeSeedToHash(seed) {
        const hash = "#s=" + encodeURIComponent(seed);
        try {
            history.replaceState(history.state, "", hash); // no history spam, no scroll
        } catch (error) {
            location.replace(hash);
        }
    }

    function freshSeed() {
        const words = crypto.getRandomValues(new Uint32Array(1));
        return words[0].toString(36).padStart(7, "0");
    }


    /* ---------- identity: all seed-derived parameters ---------- */

    function createIdentity(seed) {
        const hash = fnv1a(seed);
        const random = mulberry32(hash);
        const baseAngle = random() * Math.PI * 2;
        const waves = [];

        for (let i = 0; i < 3; i++) {
            const direction = random() * Math.PI * 2;
            const frequency = (3.2 + random() * 3.2) * (1 + i * 0.7);
            waves.push({
                fx: Math.cos(direction) * frequency,
                fy: Math.sin(direction) * frequency,
                phase: random() * Math.PI * 2,
                amplitude: (0.8 + random() * 0.7) / (1 + i * 0.6),
                drift: (random() < 0.5 ? -1 : 1) * (0.25 + random() * 0.3)
            });
        }

        return { hash: hash, baseAngle: baseAngle, waves: waves };
    }

    // u and v are centred and divided by the longer side, so every output size
    // shows a crop of the same field. The drift is a bounded sway: it keeps the
    // motion alive without ever turning into a different composition.
    function fieldAngle(identity, u, v, sway) {
        const w = identity.waves;
        const a = Math.sin(u * w[0].fx + v * w[0].fy + w[0].phase + sway * w[0].drift);
        const b = Math.cos(u * w[1].fx + v * w[1].fy + w[1].phase + sway * w[1].drift + a * 0.6);
        const c = Math.sin(u * w[2].fx + v * w[2].fy + w[2].phase + sway * w[2].drift + b * 0.4);
        return identity.baseAngle + a * w[0].amplitude + b * w[1].amplitude + c * w[2].amplitude;
    }


    /* ---------- simulation: a small grid of brightness values ---------- */

    function createField(identity, cols, rows) {
        // Capped by area: one particle per 55 cells.
        const count = Math.round(Math.min(1600, Math.max(14, cols * rows / 55)));
        const extent = Math.max(cols, rows);
        const random = mulberry32(identity.hash ^ 0x51ed270b);
        const x = new Float64Array(count);
        const y = new Float64Array(count);
        const life = new Float64Array(count);
        const light = new Float32Array(cols * rows);
        let stepIndex = 0;

        function spawn(i) {
            x[i] = random() * cols;
            y[i] = random() * rows;
            life[i] = 140 + random() * 260;
        }

        for (let i = 0; i < count; i++) {
            spawn(i);
            life[i] *= random(); // stagger the first deaths
        }

        function step() {
            const sway = Math.sin(stepIndex * 0.0021) * 2.2;
            for (let i = 0; i < light.length; i++) light[i] *= FADE;
            for (let i = 0; i < count; i++) {
                const angle = fieldAngle(identity, (x[i] - cols / 2) / extent, (y[i] - rows / 2) / extent, sway);
                x[i] += Math.cos(angle) * SPEED;
                y[i] += Math.sin(angle) * SPEED;
                life[i] -= 1;
                if (life[i] <= 0 || x[i] < 0 || y[i] < 0 || x[i] >= cols || y[i] >= rows) spawn(i);
                light[Math.floor(y[i]) * cols + Math.floor(x[i])] = 1;
            }
            stepIndex++;
        }

        for (let i = 0; i < WARM_UP; i++) step();
        return { cols: cols, rows: rows, light: light, step: step };
    }

    // Each pixel is either solid white or not drawn. The page's own black shows through.
    function paint(target, field, image) {
        const out = new Uint32Array(image.data.buffer);
        for (let row = 0, i = 0; row < field.rows; row++) {
            for (let col = 0; col < field.cols; col++, i++) {
                out[i] = field.light[i] > BAYER[(row & 7) * 8 + (col & 7)] ? 0xffffffff : 0;
            }
        }
        target.putImageData(image, 0, 0);
    }


    /* ---------- hero background ---------- */

    let seed = "";
    let identity = null;
    let field = null;
    let image = null;
    let width = 0;
    let height = 0;

    function initialise() {
        const cell = width < 700 ? 4 : 6; // CSS pixels per art pixel
        const cols = Math.ceil(width / cell);
        const rows = Math.ceil(height / cell);
        canvas.width = cols;
        canvas.height = rows;
        canvas.style.width = cols * cell + "px";
        canvas.style.height = rows * cell + "px";
        image = ctx.createImageData(cols, rows);
        field = createField(identity, cols, rows);
        paint(ctx, field, image);
    }

    function placeLayer() {
        layer.style.setProperty("--identity-height", hero.offsetHeight + "px");
    }

    // Returns true when the canvas needs to be rebuilt.
    function measure() {
        const w = layer.clientWidth;
        const h = layer.clientHeight;
        if (!w || !h || (w === width && h === height)) return false;
        width = w;
        height = h;
        return true;
    }

    let resizeTimer = 0;

    function onResize() {
        placeLayer();
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (!measure()) return;
            initialise();
            updateLoop();
        }, RESIZE_DELAY);
    }


    /* ---------- loop: runs only when visible, on-screen and motion is allowed ---------- */

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = false;
    let frame = 0;
    let lastTime = 0;
    let backlog = 0;

    function tick(now) {
        frame = requestAnimationFrame(tick);
        // Fixed timestep: same speed and same sequence at 60, 90 or 120 Hz.
        backlog += Math.min(now - lastTime, STEP_MS * 2);
        lastTime = now;
        let stepped = false;
        while (backlog >= STEP_MS - 1) {
            field.step();
            backlog -= STEP_MS;
            stepped = true;
        }
        if (stepped) paint(ctx, field, image);
    }

    function updateLoop() {
        const shouldRun = onScreen && !document.hidden && !reducedMotion.matches && field !== null;
        if (shouldRun && !frame) {
            lastTime = performance.now();
            backlog = 0;
            frame = requestAnimationFrame(tick);
        } else if (!shouldRun && frame) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
    }


    /* ---------- derived outputs: white pixels on black ---------- */

    function renderTile(w, h, cell) {
        const small = document.createElement("canvas");
        small.width = Math.ceil(w / cell);
        small.height = Math.ceil(h / cell);
        const smallCtx = small.getContext("2d");
        paint(smallCtx, createField(identity, small.width, small.height),
            smallCtx.createImageData(small.width, small.height));

        const tile = document.createElement("canvas");
        tile.width = w;
        tile.height = h;
        const tileCtx = tile.getContext("2d");
        tileCtx.fillStyle = "#000";
        tileCtx.fillRect(0, 0, w, h);
        tileCtx.imageSmoothingEnabled = false;
        tileCtx.drawImage(small, 0, 0, small.width * cell, small.height * cell);
        return tile;
    }

    function headElement(selector, tag, attributes) {
        let element = document.head.querySelector(selector);
        if (!element) {
            element = document.createElement(tag);
            document.head.appendChild(element);
        }
        Object.keys(attributes).forEach(function (key) {
            element.setAttribute(key, attributes[key]);
        });
    }

    function updateFavicon() {
        headElement("link[rel='icon']", "link", {
            rel: "icon",
            type: "image/png",
            sizes: "32x32",
            href: renderTile(32, 32, 2).toDataURL("image/png")
        });
    }

    let ogTimer = 0;
    const whenIdle = window.requestIdleCallback
        ? function (callback) { window.requestIdleCallback(callback, { timeout: 4000 }); }
        : function (callback) { setTimeout(callback, 200); };

    // Deferred, so it never competes with loading or rolling.
    function scheduleOgImage() {
        const target = identity;
        clearTimeout(ogTimer);
        ogTimer = setTimeout(function () {
            whenIdle(function () {
                if (target !== identity) return; // rolled again meanwhile
                const tags = {
                    "og:image": renderTile(1200, 630, 6).toDataURL("image/png"),
                    "og:image:type": "image/png",
                    "og:image:width": "1200",
                    "og:image:height": "630"
                };
                Object.keys(tags).forEach(function (name) {
                    // Separate tags: the static og:image in the page stays
                    // first, because crawlers can't use a data URL.
                    headElement("meta[data-identity='" + name + "']", "meta", {
                        "data-identity": name,
                        property: name,
                        content: tags[name]
                    });
                });
            });
        }, 800);
    }


    /* ---------- wiring ---------- */

    function applySeed(next) {
        if (next === seed) return;
        seed = next;
        identity = createIdentity(seed);
        seedLabel.textContent = "Seed: " + seed;
        measure();
        if (width && height) initialise();
        updateFavicon();
        scheduleOgImage();
        updateLoop();
    }

    rollButton.addEventListener("click", function () {
        const next = freshSeed();
        writeSeedToHash(next);
        applySeed(next);
    });

    // The hash is shared with the nav: only #s=... changes the artwork.
    window.addEventListener("hashchange", function () {
        const fromHash = seedFromHash();
        if (fromHash) applySeed(fromHash);
    });

    document.addEventListener("visibilitychange", updateLoop);

    reducedMotion.addEventListener("change", function () {
        if (width && height) initialise(); // back to the one clean static frame
        updateLoop();
    });

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(hero);
    resizeObserver.observe(layer); // full width, so it can change when the hero doesn't

    new IntersectionObserver(function (entries) {
        onScreen = entries[entries.length - 1].isIntersecting;
        updateLoop();
    }).observe(layer);

    // The automatic roll is not written to the URL, so a reload rolls again.
    placeLayer();
    applySeed(seedFromHash() || freshSeed());
    controls.hidden = false;
})();
