/*
 * SEED INSTRUMENT
 *
 * Every visit rolls one seed, unless the URL carries one (#s=<seed>). That
 * seed drives everything generated on the page: the hero banner, the 1-bit
 * portrait, each project's sigil, the section rules, the favicon and the logo.
 * Math.random() is never used, so any seed can be reproduced from its link.
 *
 * Each part below checks for its own markup, so the file works on every page.
 */
(function () {
    "use strict";

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const MAX_SEED_LENGTH = 32;
    const WHITE = 0xffffffff;   // canvas pixels are little-endian ABGR
    const BLACK = 0xff000000;
    const INK = 0xffe8e8e8;     // --fg

    // 8x8 ordered dither: shapes dissolve pixel by pixel instead of going grey.
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

    function bayer(col, row) {
        return BAYER[(row & 7) * 8 + (col & 7)];
    }


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


    /* ---------- the flow field: shared by the banner, a sigil, favicon and OG ---------- */

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

        return { seed: seed, hash: hash, baseAngle: baseAngle, waves: waves };
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

    const FADE = 0.965;     // trail brightness kept per step
    const SPEED = 0.2;      // cells per step
    const WARM_UP = 160;    // steps run before the first frame, so it starts full

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

        // Lights a 3x3 brush along a line, in cell coordinates.
        function brush(x0, y0, x1, y1) {
            const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
            for (let i = 0; i <= n; i++) {
                const cx = Math.floor(x0 + (x1 - x0) * i / n);
                const cy = Math.floor(y0 + (y1 - y0) * i / n);
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const px = cx + dx;
                        const py = cy + dy;
                        if (px >= 0 && py >= 0 && px < cols && py < rows) light[py * cols + px] = 1;
                    }
                }
            }
        }

        for (let i = 0; i < WARM_UP; i++) step();

        return {
            cols: cols,
            rows: rows,
            count: count,
            extent: extent,
            light: light,
            step: step,
            brush: brush,
            steps: function () { return stepIndex; }
        };
    }

    // Each pixel is either lit or not drawn: the page's own black shows through.
    function paintField(target, field, image, ink) {
        const out = new Uint32Array(image.data.buffer);
        for (let row = 0, i = 0; row < field.rows; row++) {
            for (let col = 0; col < field.cols; col++, i++) {
                out[i] = field.light[i] > bayer(col, row) ? ink : 0;
            }
        }
        target.putImageData(image, 0, 0);
    }


    /* ---------- a shared loop for everything that animates ---------- */

    const animations = new Set();
    let frame = 0;

    function loop(now) {
        frame = requestAnimationFrame(loop);
        animations.forEach(function (animation) { animation(now); });
    }

    function startAnimation(animation) {
        animations.add(animation);
        if (!frame && !document.hidden) frame = requestAnimationFrame(loop);
    }

    function stopAnimation(animation) {
        animations.delete(animation);
        if (!animations.size && frame) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
    }

    document.addEventListener("visibilitychange", function () {
        if (document.hidden && frame) {
            cancelAnimationFrame(frame);
            frame = 0;
        } else if (!document.hidden && animations.size && !frame) {
            frame = requestAnimationFrame(loop);
        }
    });

    function debounce(callback, delay) {
        let timer = 0;
        return function () {
            clearTimeout(timer);
            timer = setTimeout(callback, delay);
        };
    }

    // Runs callback() after the element's size really changes (debounced).
    // The first draw is the caller's job.
    function watchSize(element, callback) {
        let last = element.clientWidth + "x" + element.clientHeight;
        const check = debounce(function () {
            const key = element.clientWidth + "x" + element.clientHeight;
            if (key === last || !element.clientWidth) return;
            last = key;
            callback();
        }, 150);
        new ResizeObserver(check).observe(element);
    }

    function pixels(canvas, cols, rows) {
        canvas.width = cols;
        canvas.height = rows;
        const ctx = canvas.getContext("2d");
        const image = ctx.createImageData(cols, rows);
        return { ctx: ctx, image: image, out: new Uint32Array(image.data.buffer) };
    }


    /* ---------- banner: the flow field behind the hero ---------- */

    function createBanner() {
        const hero = document.querySelector(".hero");
        const layer = document.querySelector(".identity");
        const canvas = document.querySelector(".identity-canvas");
        const readout = document.querySelector(".readout-data");
        if (!hero || !layer || !canvas) return null;

        const STEP_MS = 1000 / 60;
        let identity = null;
        let field = null;
        let surface = null;
        let cell = 6;
        let onScreen = false;
        let lastTime = 0;
        let backlog = 0;
        let pointer = null;

        function build() {
            const width = layer.clientWidth;
            const height = layer.clientHeight;
            if (!width || !height || !identity) return;
            cell = width < 700 ? 4 : 6; // CSS pixels per art pixel
            const cols = Math.ceil(width / cell);
            const rows = Math.ceil(height / cell);
            surface = pixels(canvas, cols, rows);
            canvas.style.width = cols * cell + "px";
            canvas.style.height = rows * cell + "px";
            field = createField(identity, cols, rows);
            paintField(surface.ctx, field, surface.image, WHITE);
            report();
            update();
        }

        function report() {
            if (!readout || !field) return;
            const degrees = Math.round((identity.baseAngle * 180 / Math.PI) % 360);
            let text = "θ " + String(degrees).padStart(3, "0") + "°" +
                "  n " + field.count +
                "  t " + String(field.steps()).padStart(6, "0");
            if (pointer) {
                const u = (pointer.x - field.cols / 2) / field.extent;
                const v = (pointer.y - field.rows / 2) / field.extent;
                text += "  x " + (u < 0 ? "−" : "+") + Math.abs(u).toFixed(2) +
                    " y " + (v < 0 ? "−" : "+") + Math.abs(v).toFixed(2);
            }
            readout.textContent = text;
        }

        function tick(now) {
            // Fixed timestep: same speed and same sequence at 60, 90 or 120 Hz.
            backlog += Math.min(now - lastTime, STEP_MS * 2);
            lastTime = now;
            let stepped = false;
            while (backlog >= STEP_MS - 1) {
                field.step();
                backlog -= STEP_MS;
                stepped = true;
            }
            if (!stepped) return;
            paintField(surface.ctx, field, surface.image, WHITE);
            if (field.steps() % 6 === 0) report();
        }

        function update() {
            const shouldRun = onScreen && !reducedMotion.matches && field !== null;
            if (shouldRun && !animations.has(tick)) {
                lastTime = performance.now();
                backlog = 0;
                startAnimation(tick);
            } else if (!shouldRun) {
                stopAnimation(tick);
            }
        }

        // The pointer draws into the field; the dither dissolves its trail.
        hero.addEventListener("pointermove", function (event) {
            if (!field || reducedMotion.matches) return;
            const box = layer.getBoundingClientRect();
            const next = { x: (event.clientX - box.left) / cell, y: (event.clientY - box.top) / cell };
            if (pointer) field.brush(pointer.x, pointer.y, next.x, next.y);
            pointer = next;
        });
        hero.addEventListener("pointerleave", function () {
            pointer = null;
        });

        new IntersectionObserver(function (entries) {
            onScreen = entries[entries.length - 1].isIntersecting;
            update();
        }).observe(layer);

        reducedMotion.addEventListener("change", build);
        watchSize(layer, build);

        return {
            setIdentity: function (next) {
                identity = next;
                build();
            }
        };
    }


    /* ---------- portrait: the photo, re-printed with Atkinson dithering ---------- */

    function createPortrait() {
        const frameElement = document.querySelector(".portrait-frame");
        const img = document.querySelector(".profile-picture");
        const canvas = document.querySelector(".portrait-dither");
        if (!frameElement || !img || !canvas) return null;

        let tone = null; // luminance, 0..1, contrast-stretched
        let cols = 0;
        let rows = 0;
        let identity = null;

        // Samples the photo the way CSS shows it: cover, centred at 38% height.
        function sample() {
            cols = Math.round(canvas.clientWidth / 2);
            rows = Math.round(canvas.clientHeight / 2);
            if (!cols || !rows || !img.naturalWidth) return false;
            const scale = Math.max(cols / img.naturalWidth, rows / img.naturalHeight);
            const sw = cols / scale;
            const sh = rows / scale;
            const sx = (img.naturalWidth - sw) * 0.5;
            const sy = (img.naturalHeight - sh) * 0.38;

            const off = document.createElement("canvas");
            off.width = cols;
            off.height = rows;
            const offCtx = off.getContext("2d");
            offCtx.imageSmoothingQuality = "high";
            offCtx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);
            let data;
            try {
                data = offCtx.getImageData(0, 0, cols, rows).data;
            } catch (error) {
                return false; // opened from file://: keep the photo
            }

            tone = new Float32Array(cols * rows);
            for (let i = 0; i < tone.length; i++) {
                tone[i] = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
            }
            const sorted = Array.from(tone).sort(function (a, b) { return a - b; });
            const low = sorted[Math.floor(sorted.length * 0.02)];
            const high = sorted[Math.floor(sorted.length * 0.98)];
            for (let i = 0; i < tone.length; i++) {
                tone[i] = Math.min(1, Math.max(0, (tone[i] - low) / (high - low || 1)));
            }
            return true;
        }

        function render() {
            if (!identity || (!tone && !sample())) return;
            // Gamma below 1 lifts the midtones, where the face is; the seed
            // leans each print a little lighter or darker.
            const random = mulberry32(identity.hash ^ 0xa7c3e1d9);
            const gamma = 0.55 + random() * 0.15;
            const bias = -0.04 + random() * 0.08;
            const buffer = new Float32Array(tone.length);
            for (let i = 0; i < tone.length; i++) buffer[i] = Math.pow(tone[i], gamma) + bias;

            const surface = pixels(canvas, cols, rows);
            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    const i = y * cols + x;
                    const value = buffer[i] > 0.5 ? 1 : 0;
                    surface.out[i] = value ? WHITE : BLACK;
                    // Atkinson: pass on 6/8 of the error, which keeps contrast high.
                    const error = (buffer[i] - value) / 8;
                    if (x + 1 < cols) buffer[i + 1] += error;
                    if (x + 2 < cols) buffer[i + 2] += error;
                    if (y + 1 < rows) {
                        if (x > 0) buffer[i + cols - 1] += error;
                        buffer[i + cols] += error;
                        if (x + 1 < cols) buffer[i + cols + 1] += error;
                    }
                    if (y + 2 < rows) buffer[i + cols * 2] += error;
                }
            }
            reveal(surface);
        }

        // Prints top to bottom, over whatever was there before.
        function reveal(surface) {
            if (reducedMotion.matches) {
                surface.ctx.putImageData(surface.image, 0, 0);
                frameElement.classList.add("is-dithered");
                return;
            }
            const start = performance.now();
            function scan(now) {
                const progress = Math.min(1, (now - start) / 700);
                surface.ctx.putImageData(surface.image, 0, 0, 0, 0, cols, Math.ceil(rows * progress));
                if (progress === 1) {
                    stopAnimation(scan);
                    frameElement.classList.add("is-dithered");
                }
            }
            startAnimation(scan);
        }

        function whenLoaded() {
            if (img.complete && img.naturalWidth) render();
            else img.addEventListener("load", render, { once: true });
        }

        watchSize(canvas, function () {
            tone = null;
            whenLoaded();
        });

        return {
            setIdentity: function (next) {
                identity = next;
                whenLoaded();
            }
        };
    }


    /* ---------- project sigils: seven 1-bit families, one per plate ---------- */

    function seededRange(random, low, high) {
        return low + random() * (high - low);
    }

    // Each family: init(cols, rows, random, seedText) -> state,
    // draw(state, t, bits) fills bits with 0/1 for frame t.
    const FAMILIES = [

        // Flow: the banner's own field, at plate scale.
        {
            init: function (cols, rows, random, seedText) {
                return { field: createField(createIdentity(seedText), cols, rows), shown: 0 };
            },
            draw: function (s, t, bits) {
                while (s.shown < t) {
                    s.field.step();
                    s.shown++;
                }
                for (let row = 0, i = 0; row < s.field.rows; row++) {
                    for (let col = 0; col < s.field.cols; col++, i++) {
                        bits[i] = s.field.light[i] > bayer(col, row) ? 1 : 0;
                    }
                }
            }
        },

        // Automaton: an elementary cellular automaton scrolling upward.
        {
            init: function (cols, rows, random) {
                const rules = [30, 45, 73, 86, 89, 105, 110, 124, 137, 150, 169, 193];
                const rule = rules[Math.floor(random() * rules.length)];
                const grid = new Uint8Array(cols * rows);
                for (let x = 0; x < cols; x++) grid[x] = random() < 0.5 ? 1 : 0;
                for (let y = 1; y < rows; y++) next(grid, cols, y, rule);
                return { rule: rule, grid: grid, cols: cols, rows: rows, shown: 0 };

                function next(g, c, y, r) {
                    for (let x = 0; x < c; x++) {
                        const left = g[(y - 1) * c + (x - 1 + c) % c];
                        const mid = g[(y - 1) * c + x];
                        const right = g[(y - 1) * c + (x + 1) % c];
                        g[y * c + x] = (r >> (left * 4 + mid * 2 + right)) & 1;
                    }
                }
            },
            draw: function (s, t, bits) {
                const c = s.cols;
                while (s.shown < t) {
                    s.grid.copyWithin(0, c);
                    const y = s.rows - 1;
                    for (let x = 0; x < c; x++) {
                        const left = s.grid[(y - 1) * c + (x - 1 + c) % c];
                        const mid = s.grid[(y - 1) * c + x];
                        const right = s.grid[(y - 1) * c + (x + 1) % c];
                        s.grid[y * c + x] = (s.rule >> (left * 4 + mid * 2 + right)) & 1;
                    }
                    s.shown++;
                }
                bits.set(s.grid);
            }
        },

        // Désordre: nested squares whose disorder grows left to right.
        {
            init: function (cols, rows, random) {
                const size = Math.max(8, Math.round(rows / 4));
                const tiles = [];
                for (let ty = 0; ty * size < rows; ty++) {
                    for (let tx = 0; tx * size < cols; tx++) {
                        const disorder = (tx * size / cols) * 2.4 + random() * 0.4;
                        const rings = 1 + Math.floor(random() * 3);
                        const corners = [];
                        for (let k = 0; k < rings * 4 * 2; k++) corners.push(random() * Math.PI * 2);
                        tiles.push({ x: tx * size, y: ty * size, disorder: disorder, rings: rings, corners: corners });
                    }
                }
                return { tiles: tiles, size: size, cols: cols, rows: rows };
            },
            draw: function (s, t, bits) {
                bits.fill(0);
                const half = s.size / 2;
                s.tiles.forEach(function (tile) {
                    for (let r = 0; r < tile.rings; r++) {
                        const reach = half * (r + 1) / (tile.rings + 0.6);
                        const points = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(function (corner, k) {
                            const phase = tile.corners[(r * 4 + k) * 2];
                            const phase2 = tile.corners[(r * 4 + k) * 2 + 1];
                            return [
                                tile.x + half + corner[0] * reach + Math.sin(phase + t * 0.06) * tile.disorder,
                                tile.y + half + corner[1] * reach + Math.cos(phase2 + t * 0.05) * tile.disorder
                            ];
                        });
                        for (let k = 0; k < 4; k++) line(bits, s.cols, s.rows, points[k], points[(k + 1) % 4]);
                    }
                });
            }
        },

        // Barcode: three bands of data drifting at their own speeds.
        {
            init: function (cols, rows, random) {
                const bands = [];
                let y = 0;
                while (y < rows) {
                    const height = Math.min(rows - y, Math.max(3, Math.round(seededRange(random, 0.15, 0.45) * rows)));
                    const pattern = [];
                    while (pattern.length < cols * 2) {
                        const width = 1 + Math.floor(random() * random() * 6);
                        const on = pattern.length === 0 ? 1 : 1 - pattern[pattern.length - 1];
                        for (let w = 0; w < width; w++) pattern.push(on);
                    }
                    bands.push({ y: y, height: height, pattern: pattern, speed: seededRange(random, -1.4, 1.4) });
                    y += height + 1; // one dark row between bands
                }
                return { bands: bands, cols: cols };
            },
            draw: function (s, t, bits) {
                bits.fill(0);
                s.bands.forEach(function (band) {
                    const length = band.pattern.length;
                    const offset = Math.floor(t * band.speed);
                    for (let x = 0; x < s.cols; x++) {
                        const on = band.pattern[(((x + offset) % length) + length) % length];
                        if (!on) continue;
                        for (let y = band.y; y < band.y + band.height; y++) bits[y * s.cols + x] = 1;
                    }
                });
            }
        },

        // Moiré: two ring systems, one orbiting the other.
        {
            init: function (cols, rows, random) {
                return {
                    a: [random() * cols, random() * rows],
                    b: [random() * cols, random() * rows],
                    spacing: seededRange(random, 2.2, 4),
                    orbit: seededRange(random, 3, 8),
                    phase: random() * Math.PI * 2,
                    cols: cols,
                    rows: rows
                };
            },
            draw: function (s, t, bits) {
                const bx = s.b[0] + Math.cos(s.phase + t * 0.05) * s.orbit;
                const by = s.b[1] + Math.sin(s.phase + t * 0.05) * s.orbit;
                for (let y = 0, i = 0; y < s.rows; y++) {
                    for (let x = 0; x < s.cols; x++, i++) {
                        const ringA = Math.floor(Math.hypot(x - s.a[0], y - s.a[1]) / s.spacing);
                        const ringB = Math.floor(Math.hypot(x - bx, y - by) / s.spacing);
                        bits[i] = (ringA + ringB) & 1;
                    }
                }
            }
        },

        // Truchet: quarter-circle tiles, flipping one by one.
        {
            init: function (cols, rows, random) {
                const size = 8;
                const across = Math.ceil(cols / size);
                const down = Math.ceil(rows / size);
                const orientation = new Uint8Array(across * down);
                const phase = new Float32Array(across * down);
                for (let i = 0; i < orientation.length; i++) {
                    orientation[i] = random() < 0.5 ? 1 : 0;
                    phase[i] = random() * 4;
                }
                return { size: size, across: across, orientation: orientation, phase: phase, cols: cols, rows: rows };
            },
            draw: function (s, t, bits) {
                const size = s.size;
                for (let y = 0, i = 0; y < s.rows; y++) {
                    for (let x = 0; x < s.cols; x++, i++) {
                        const tile = Math.floor(y / size) * s.across + Math.floor(x / size);
                        const flip = s.orientation[tile] ^ (Math.floor(t * 0.04 + s.phase[tile]) & 1);
                        const lx = (x % size) + 0.5;
                        const ly = (y % size) + 0.5;
                        const d = flip
                            ? Math.min(Math.hypot(lx, ly), Math.hypot(size - lx, size - ly))
                            : Math.min(Math.hypot(size - lx, ly), Math.hypot(lx, size - ly));
                        bits[i] = Math.abs(d - size / 2) < 0.8 ? 1 : 0;
                    }
                }
            }
        },

        // Contour: a height map drawn as topographic lines.
        {
            init: function (cols, rows, random) {
                const waves = [];
                for (let k = 0; k < 4; k++) {
                    const angle = random() * Math.PI * 2;
                    const frequency = seededRange(random, 2, 7);
                    waves.push({
                        fx: Math.cos(angle) * frequency / cols,
                        fy: Math.sin(angle) * frequency / cols,
                        phase: random() * Math.PI * 2,
                        speed: seededRange(random, -0.03, 0.03)
                    });
                }
                return { waves: waves, levels: seededRange(random, 2, 3.4), cols: cols, rows: rows };
            },
            draw: function (s, t, bits) {
                for (let y = 0, i = 0; y < s.rows; y++) {
                    for (let x = 0; x < s.cols; x++, i++) {
                        let height = 0;
                        for (let k = 0; k < s.waves.length; k++) {
                            const w = s.waves[k];
                            height += Math.sin(x * w.fx * Math.PI * 2 + y * w.fy * Math.PI * 2 + w.phase + t * w.speed);
                        }
                        const level = height * s.levels;
                        bits[i] = level - Math.floor(level) < 0.16 ? 1 : 0;
                    }
                }
            }
        }
    ];

    function line(bits, cols, rows, from, to) {
        const steps = Math.max(1, Math.ceil(Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1]))));
        for (let k = 0; k <= steps; k++) {
            const x = Math.round(from[0] + (to[0] - from[0]) * k / steps);
            const y = Math.round(from[1] + (to[1] - from[1]) * k / steps);
            if (x >= 0 && y >= 0 && x < cols && y < rows) bits[y * cols + x] = 1;
        }
    }

    function createSigils() {
        const plates = Array.from(document.querySelectorAll(".project"));
        if (!plates.length) return null;
        const BOOT_FRAMES = 45;
        const FRAME_MS = 1000 / 30; // stepped, like the pixels
        let identity = null;

        const sigils = plates.map(function (plate, index) {
            const canvas = plate.querySelector(".glyph");
            const title = (plate.querySelector("h3") || {}).textContent || String(index);
            if (!canvas) return null;
            return {
                plate: plate,
                canvas: canvas,
                title: title.trim(),
                family: FAMILIES[index % FAMILIES.length],
                state: null,
                surface: null,
                bits: null,
                t: 0,
                boot: 0,
                hover: false,
                seen: false,
                last: 0
            };
        }).filter(Boolean);

        function build(sigil) {
            const cols = Math.max(16, Math.round(sigil.canvas.clientWidth / 4));
            const rows = Math.max(8, Math.round(sigil.canvas.clientHeight / 4));
            if (!sigil.canvas.clientWidth || !identity) return;
            // The family belongs to the project; its parameters belong to the visit.
            const seedText = sigil.title + "/" + identity.seed;
            sigil.surface = pixels(sigil.canvas, cols, rows);
            sigil.bits = new Uint8Array(cols * rows);
            sigil.state = sigil.family.init(cols, rows, mulberry32(fnv1a(seedText)), seedText);
            sigil.t = 0;
            render(sigil);
        }

        function render(sigil) {
            sigil.family.draw(sigil.state, sigil.t, sigil.bits);
            const out = sigil.surface.out;
            for (let i = 0; i < out.length; i++) out[i] = sigil.bits[i] ? INK : 0;
            sigil.surface.ctx.putImageData(sigil.surface.image, 0, 0);
        }

        function animate(sigil) {
            if (sigil.tick) return;
            sigil.tick = function (now) {
                if (now - sigil.last < FRAME_MS) return;
                sigil.last = now;
                sigil.t++;
                render(sigil);
                if (sigil.boot > 0) sigil.boot--;
                if (!sigil.hover && sigil.boot === 0) {
                    stopAnimation(sigil.tick);
                    sigil.tick = null;
                }
            };
            startAnimation(sigil.tick);
        }

        function play(sigil) {
            if (reducedMotion.matches || !sigil.state) return;
            animate(sigil);
        }

        const seen = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                const sigil = sigils.find(function (s) { return s.canvas === entry.target; });
                if (!entry.isIntersecting || !sigil || sigil.seen) return;
                sigil.seen = true;
                sigil.boot = BOOT_FRAMES; // a short "power on" the first time it's seen
                play(sigil);
            });
        }, { threshold: 0.4 });

        sigils.forEach(function (sigil) {
            const on = function () { sigil.hover = true; play(sigil); };
            const off = function () { sigil.hover = false; };
            sigil.plate.addEventListener("pointerenter", on);
            sigil.plate.addEventListener("pointerleave", off);
            sigil.plate.addEventListener("focusin", on);
            sigil.plate.addEventListener("focusout", off);
            watchSize(sigil.canvas, function () { build(sigil); });
            seen.observe(sigil.canvas);
        });

        return {
            setIdentity: function (next) {
                identity = next;
                sigils.forEach(function (sigil) {
                    build(sigil);
                    if (sigil.seen) {
                        sigil.boot = BOOT_FRAMES;
                        play(sigil);
                    }
                });
            }
        };
    }


    /* ---------- rules: a strip of 1-bit noise under each section heading ---------- */

    function createRules() {
        const rules = Array.from(document.querySelectorAll(".rule"));
        if (!rules.length) return null;
        let identity = null;

        function draw(canvas, index) {
            const cols = Math.round(canvas.clientWidth / 3);
            const rows = 3;
            if (!cols || !identity) return;
            const random = mulberry32(identity.hash ^ Math.imul(index + 1, 0x9e3779b1));
            const surface = pixels(canvas, cols, rows);
            const lobes = 1 + Math.floor(random() * 3);
            const phase = random() * Math.PI * 2;
            const tilt = random() < 0.5 ? -1 : 1;
            for (let x = 0; x < cols; x++) {
                const along = x / cols;
                const density = 0.05 + 0.75 * Math.pow(Math.sin(along * Math.PI * lobes + phase) * 0.5 + 0.5, 3) *
                    (tilt > 0 ? along : 1 - along);
                for (let y = 0; y < rows; y++) {
                    surface.out[y * cols + x] = random() < density ? INK : 0;
                }
            }
            surface.ctx.putImageData(surface.image, 0, 0);
        }

        rules.forEach(function (canvas, index) {
            watchSize(canvas, function () { draw(canvas, index); });
        });

        return {
            setIdentity: function (next) {
                identity = next;
                rules.forEach(draw);
            }
        };
    }


    /* ---------- skills: a barcode for every word, from its own letters ---------- */

    function createBarcodes() {
        document.querySelectorAll(".tags li").forEach(function (item) {
            const random = mulberry32(fnv1a(item.textContent.trim()));
            const stops = [];
            let x = 0;
            let on = true;
            while (x < 240) {
                const width = 1 + Math.floor(random() * random() * 5);
                const color = on ? "#e8e8e8" : "transparent";
                stops.push(color + " " + x + "px " + (x + width) + "px");
                x += width;
                on = !on;
            }
            item.style.setProperty("--code", "linear-gradient(90deg, " + stops.join(", ") + ")");
        });
    }


    /* ---------- education: 2024 to now, as a pixel line ---------- */

    function createTimeline() {
        const canvas = document.querySelector(".timeline-canvas");
        const labels = document.querySelector(".timeline-labels");
        if (!canvas || !labels) return;
        const START = 2024;

        function draw() {
            const cols = Math.round(canvas.clientWidth / 3);
            const rows = 3;
            if (!cols) return;
            const now = new Date();
            const nowYears = now.getFullYear() + (now.getMonth() + now.getDate() / 31) / 12;
            const end = nowYears + 0.35; // headroom: the line keeps going
            const at = function (year) { return (year - START) / (end - START); };
            const nowCol = Math.round(at(nowYears) * (cols - 1));
            const surface = pixels(canvas, cols, rows);

            for (let x = 0; x < cols; x++) {
                const past = x <= nowCol;
                surface.out[cols + x] = past || x % 3 === 0 ? INK : 0; // middle row
            }
            labels.textContent = "";
            for (let year = START; year <= Math.floor(nowYears); year++) {
                const col = Math.round(at(year) * (cols - 1));
                for (let y = 0; y < rows; y++) surface.out[y * cols + col] = INK;
                const label = document.createElement("span");
                label.textContent = String(year);
                label.style.left = (col * 3) + "px";
                if (at(nowYears) - at(year) > 0.12) labels.appendChild(label);
            }
            for (let y = 0; y < rows; y++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const x = nowCol + dx;
                    if (x >= 0 && x < cols) surface.out[y * cols + x] = INK;
                }
            }
            surface.ctx.putImageData(surface.image, 0, 0);
            const marker = document.createElement("span");
            marker.className = "now";
            marker.textContent = "Now";
            marker.style.left = ((nowCol + 2) * 3) + "px";
            labels.appendChild(marker);
        }

        watchSize(canvas, draw);
        draw();
    }


    /* ---------- where am I: section index and scroll position ---------- */

    function createScrollReadout() {
        const box = document.querySelector(".scroll-readout");
        const sections = Array.from(document.querySelectorAll(".section"));
        if (!box || !sections.length) return;
        let current = "00 Seed";
        let pending = false;

        function render() {
            pending = false;
            const max = document.documentElement.scrollHeight - innerHeight;
            const percent = max > 0 ? Math.round(scrollY / max * 100) : 0;
            box.textContent = "§" + current + "  ·  " + String(percent).padStart(3, "0") + "%";
        }

        const watcher = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    const index = entry.target.querySelector(".idx");
                    const heading = entry.target.querySelector("h2");
                    current = (index ? index.textContent : "") + " " + (heading ? heading.textContent : "");
                } else if (entry.target === sections[0] && entry.boundingClientRect.top > 0) {
                    current = "00 Seed";
                }
            });
            render();
        }, { rootMargin: "-45% 0px -50% 0px" });
        sections.forEach(function (section) { watcher.observe(section); });

        window.addEventListener("scroll", function () {
            if (pending) return;
            pending = true;
            requestAnimationFrame(render);
        }, { passive: true });

        box.hidden = false;
        render();
    }


    /* ---------- favicon, logo sigil and OG image: white pixels on black ---------- */

    function renderTile(identity, w, h, cell) {
        const small = document.createElement("canvas");
        const cols = Math.ceil(w / cell);
        const rows = Math.ceil(h / cell);
        const surface = pixels(small, cols, rows);
        paintField(surface.ctx, createField(identity, cols, rows), surface.image, WHITE);

        const tile = document.createElement("canvas");
        tile.width = w;
        tile.height = h;
        const tileCtx = tile.getContext("2d");
        tileCtx.fillStyle = "#000";
        tileCtx.fillRect(0, 0, w, h);
        tileCtx.imageSmoothingEnabled = false;
        tileCtx.drawImage(small, 0, 0, cols * cell, rows * cell);
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

    function updateMarks(identity) {
        const icon = renderTile(identity, 32, 32, 2);
        headElement("link[rel='icon']", "link", {
            rel: "icon",
            type: "image/png",
            sizes: "32x32",
            href: icon.toDataURL("image/png")
        });
        const sigil = document.querySelector(".sigil");
        if (sigil) {
            const ctx = sigil.getContext("2d");
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(icon, 0, 0, 16, 16);
        }
    }

    let ogTimer = 0;
    const whenIdle = window.requestIdleCallback
        ? function (callback) { window.requestIdleCallback(callback, { timeout: 4000 }); }
        : function (callback) { setTimeout(callback, 200); };

    // Deferred, so it never competes with loading or rolling.
    function scheduleOgImage(identity) {
        clearTimeout(ogTimer);
        ogTimer = setTimeout(function () {
            whenIdle(function () {
                if (identity !== current) return; // rolled again meanwhile
                const tags = {
                    "og:image": renderTile(identity, 1200, 630, 6).toDataURL("image/png"),
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

    const parts = [createBanner(), createPortrait(), createSigils(), createRules()].filter(Boolean);
    const seedLabel = document.querySelector(".identity-seed");
    const footerSeed = document.querySelector(".footer-seed");
    const rollButton = document.querySelector(".identity-roll");
    const readout = document.querySelector(".readout");
    const headline = document.querySelector(".hero h1");
    let current = null;

    function applySeed(seed) {
        if (current && current.seed === seed) return;
        current = createIdentity(seed);
        if (seedLabel) seedLabel.textContent = "Seed: " + seed;
        if (footerSeed) {
            footerSeed.textContent = "Seed " + seed + " · rendered in your browser";
            footerSeed.hidden = false;
        }
        parts.forEach(function (part) { part.setIdentity(current); });
        updateMarks(current);
        scheduleOgImage(current);
    }

    if (rollButton) {
        rollButton.addEventListener("click", function () {
            const next = freshSeed();
            writeSeedToHash(next);
            applySeed(next);
            if (headline && !reducedMotion.matches) {
                headline.classList.remove("is-rolling");
                void headline.offsetWidth; // restart the animation
                headline.classList.add("is-rolling");
            }
        });
    }

    // The hash is shared with the nav: only #s=... changes the artwork.
    window.addEventListener("hashchange", function () {
        const fromHash = seedFromHash();
        if (fromHash) applySeed(fromHash);
    });

    createBarcodes();
    createTimeline();
    createScrollReadout();

    // The automatic roll is not written to the URL, so a reload rolls again.
    applySeed(seedFromHash() || freshSeed());
    if (readout) readout.hidden = false;
})();
