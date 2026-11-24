/*
 * Generative identity: a seeded flow field behind the hero.
 *
 * Everything visible is a pure function of (seed, size). Math.random() is never
 * used; the Roll button gets a fresh seed from crypto, and that seed is written
 * to the URL so the result can always be reproduced.
 */
(function () {
    "use strict";

    const hero = document.querySelector(".hero");
    const layer = document.querySelector(".identity");
    const canvas = document.querySelector(".identity-canvas");
    const controls = document.querySelector(".identity-controls");
    const rollButton = document.querySelector(".identity-roll");
    const seedLabel = document.querySelector(".identity-seed");
    const textBlock = document.querySelector(".hero-content > div");
    const heading = document.querySelector(".hero h1");

    const ctx = canvas && canvas.getContext && canvas.getContext("2d", { alpha: false });
    if (!hero || !layer || !ctx || !controls || !rollButton || !seedLabel || !textBlock || !heading) return;

    const BG = [17, 17, 17]; // must match the body background and --identity-bg
    const BG_CSS = "rgb(" + BG.join(",") + ")";
    const FADE_CSS = "rgba(" + BG.join(",") + ",0.05)";

    const STEP_MS = 1000 / 60;
    const MAX_DPR = 2;
    const MAX_PIXELS = 2.5e6; // fill rate, not particle maths, is the bottleneck
    const RESIZE_DELAY = 150;
    const MAX_SEED_LENGTH = 32;

    // Exactly two accents per identity.
    const PALETTES = [
        ["#d8c58a", "#5f9a94"], // brass, verdigris
        ["#dca273", "#7585b8"], // apricot, dusk
        ["#c98f86", "#7ba396"], // clay rose, sage
        ["#9db6d6", "#c4a468"], // fog blue, ochre
        ["#a6b684", "#bd8460"], // moss, terracotta
        ["#b29bca", "#d3b789"]  // heather, sand
    ];


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

    // <title> and the logo don't contain the name; the headline ("I'm Aaron.") does.
    function nameFromPage() {
        const text = heading.textContent.trim();
        const match = /\bI['’]m\s+(.+?)[.!]?$/.exec(text);
        return (match ? match[1] : text) || "Aaron";
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
        const palette = PALETTES[Math.floor(random() * PALETTES.length)];
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

        return { hash: hash, palette: palette, baseAngle: baseAngle, waves: waves };
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


    /* ---------- static renderer: first frame, reduced motion, favicon, OG ---------- */

    function renderStatic(target, identity, width, height, options) {
        const random = mulberry32(identity.hash ^ 0x9e3779b9);
        const extent = Math.max(width, height);
        const bands = 4;
        const pointsPerBand = Math.ceil(options.points / bands);
        const paths = [];

        for (let i = 0; i < bands * 2; i++) paths.push(new Path2D());

        for (let i = 0; i < options.count; i++) {
            let x = random() * width;
            let y = random() * height;
            const color = i % 3 === 0 ? 1 : 0;

            for (let band = 0; band < bands; band++) {
                const path = paths[color * bands + band];
                path.moveTo(x, y);
                for (let p = 0; p < pointsPerBand; p++) {
                    const angle = fieldAngle(identity, (x - width / 2) / extent, (y - height / 2) / extent, 0);
                    x += Math.cos(angle) * options.stride;
                    y += Math.sin(angle) * options.stride;
                    path.lineTo(x, y);
                }
            }
        }

        target.globalAlpha = 1;
        target.fillStyle = BG_CSS;
        target.fillRect(0, 0, width, height);
        target.lineWidth = options.lineWidth;
        target.lineCap = "round";
        target.lineJoin = "round";

        for (let band = 0; band < bands; band++) {
            target.globalAlpha = options.alpha * (band + 1) / bands; // tail to head
            for (let color = 0; color < 2; color++) {
                target.strokeStyle = identity.palette[color];
                target.stroke(paths[color * bands + band]);
            }
        }
        target.globalAlpha = 1;
    }


    /* ---------- live renderer ---------- */

    let seed = "";
    let identity = null;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let count = 0;
    let particles = null; // x, y, remaining life; 3 floats per particle
    let liveRandom = null;
    let stepIndex = 0;

    function spawn(i, firstTime) {
        particles[i * 3] = liveRandom() * width;
        particles[i * 3 + 1] = liveRandom() * height;
        const life = 140 + liveRandom() * 260;
        particles[i * 3 + 2] = firstTime ? life * liveRandom() : life; // stagger deaths
    }

    function initialise() {
        count = Math.round(Math.min(900, Math.max(140, width * height / 1300)));
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);

        renderStatic(ctx, identity, width, height, {
            count: count,
            points: 72,
            stride: 1.6,
            lineWidth: 1.1,
            alpha: 0.7
        });

        liveRandom = mulberry32(identity.hash ^ 0x51ed270b);
        particles = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) spawn(i, true);
        stepIndex = 0;
        ctx.lineWidth = 1.1;
        ctx.lineCap = "round";
    }

    function step() {
        const extent = Math.max(width, height);
        const sway = Math.sin(stepIndex * 0.0021) * 2.2;

        ctx.globalAlpha = 1;
        ctx.fillStyle = FADE_CSS;
        ctx.fillRect(0, 0, width, height);

        // An 8-bit canvas rounds a 5% fade to nothing within ~10 levels of the
        // background, leaving permanent ghost trails. Subtract one level now and
        // then, and clamp back up to the background colour.
        if (stepIndex % 8 === 0) {
            ctx.globalCompositeOperation = "difference";
            ctx.fillStyle = "rgb(1,1,1)";
            ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = "lighten";
            ctx.fillStyle = BG_CSS;
            ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = "source-over";
        }

        ctx.globalAlpha = 0.7;
        for (let color = 0; color < 2; color++) {
            ctx.strokeStyle = identity.palette[color];
            ctx.beginPath();
            for (let i = 0; i < count; i++) {
                if ((i % 3 === 0 ? 1 : 0) !== color) continue;
                const o = i * 3;
                const x = particles[o];
                const y = particles[o + 1];
                const angle = fieldAngle(identity, (x - width / 2) / extent, (y - height / 2) / extent, sway);
                const nx = x + Math.cos(angle) * 1.2;
                const ny = y + Math.sin(angle) * 1.2;
                ctx.moveTo(x, y);
                ctx.lineTo(nx, ny);
                particles[o] = nx;
                particles[o + 1] = ny;
                particles[o + 2] -= 1;
            }
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Respawn in index order so the PRNG stream stays reproducible.
        for (let i = 0; i < count; i++) {
            const o = i * 3;
            const x = particles[o];
            const y = particles[o + 1];
            if (particles[o + 2] <= 0 || x < -10 || y < -10 || x > width + 10 || y > height + 10) spawn(i, false);
        }
        stepIndex++;
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
        while (backlog >= STEP_MS - 1) {
            step();
            backlog -= STEP_MS;
        }
    }

    function updateLoop() {
        const shouldRun = onScreen && !document.hidden && !reducedMotion.matches && particles !== null;
        if (shouldRun && !frame) {
            lastTime = performance.now();
            backlog = 0;
            frame = requestAnimationFrame(tick);
        } else if (!shouldRun && frame) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
    }


    /* ---------- layout ---------- */

    // Keeps the layer on the hero and the scrim on the text. Cheap, so it runs
    // undebounced: the text is never without its scrim, even mid-resize.
    function placeLayer() {
        layer.style.setProperty("--identity-height", hero.offsetHeight + "px");
        const box = layer.getBoundingClientRect();
        const text = textBlock.getBoundingClientRect();
        // The gradient is solid out to 72% of its radius. Size it so that the
        // ellipse at 72% encloses the text box's corners, plus a margin.
        const reach = function (size) {
            return (size / 2 * Math.SQRT2 + 12) / 0.72;
        };
        layer.style.setProperty("--identity-x", text.left + text.width / 2 - box.left + "px");
        layer.style.setProperty("--identity-y", text.top + text.height / 2 - box.top + "px");
        layer.style.setProperty("--identity-rx", reach(text.width) + "px");
        layer.style.setProperty("--identity-ry", reach(text.height) + "px");
    }

    // Returns true when the canvas needs to be rebuilt.
    function measure() {
        const w = layer.clientWidth;
        const h = layer.clientHeight;
        if (!w || !h) return false;
        const ratio = Math.min(window.devicePixelRatio || 1, MAX_DPR, Math.sqrt(MAX_PIXELS / (w * h)));
        if (w === width && h === height && ratio === dpr) return false;
        width = w;
        height = h;
        dpr = ratio;
        return true;
    }

    let resizeTimer = 0;

    function onResize() {
        placeLayer();
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (!measure()) return; // e.g. mobile URL bar: hero did not change
            initialise();
            updateLoop();
        }, RESIZE_DELAY);
    }


    /* ---------- derived outputs ---------- */

    function offscreen(w, h) {
        const element = document.createElement("canvas");
        element.width = w;
        element.height = h;
        return element;
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
        const icon = offscreen(32, 32);
        renderStatic(icon.getContext("2d"), identity, 32, 32, {
            count: 16,
            points: 24,
            stride: 0.9,
            lineWidth: 3.4,
            alpha: 1
        });
        headElement("link[rel='icon']", "link", {
            rel: "icon",
            type: "image/png",
            sizes: "32x32",
            href: icon.toDataURL("image/png")
        });
    }

    let ogTimer = 0;
    const whenIdle = window.requestIdleCallback
        ? function (callback) { window.requestIdleCallback(callback, { timeout: 4000 }); }
        : function (callback) { setTimeout(callback, 200); };

    // Deferred and encoded off the main path so it never competes with a frame.
    function scheduleOgImage() {
        const target = identity;
        clearTimeout(ogTimer);
        ogTimer = setTimeout(function () {
            whenIdle(function () {
                if (target !== identity) return;
                const image = offscreen(1200, 630);
                renderStatic(image.getContext("2d"), identity, 1200, 630, {
                    count: 620,
                    points: 72,
                    stride: 1.6,
                    lineWidth: 1.4,
                    alpha: 0.85
                });
                image.toBlob(function (blob) {
                    if (!blob) return;
                    const reader = new FileReader();
                    reader.onload = function () {
                        if (target !== identity) return; // rolled again meanwhile
                        const tags = {
                            "og:image": reader.result,
                            "og:image:type": "image/jpeg",
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
                    };
                    reader.readAsDataURL(blob);
                }, "image/jpeg", 0.85);
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

    // The hash is shared with the nav. #s=... selects an identity, an empty hash
    // (the logo link) is home, and section anchors leave the artwork alone.
    window.addEventListener("hashchange", function () {
        const fromHash = seedFromHash();
        if (fromHash) applySeed(fromHash);
        else if (location.hash === "" || location.hash === "#s=") applySeed(nameFromPage());
    });

    document.addEventListener("visibilitychange", updateLoop);
    window.addEventListener("resize", onResize);

    reducedMotion.addEventListener("change", function () {
        if (width && height) initialise(); // back to the one clean static frame
        updateLoop();
    });

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(hero);
    resizeObserver.observe(textBlock);

    new IntersectionObserver(function (entries) {
        onScreen = entries[entries.length - 1].isIntersecting;
        updateLoop();
    }).observe(layer);

    placeLayer();
    applySeed(seedFromHash() || nameFromPage());
    controls.hidden = false;
})();
