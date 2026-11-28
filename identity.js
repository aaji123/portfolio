/*
 * LIGHT NOVEL, VOLUME 1: the printing press.
 *
 * Every visit is a new print run: one seed (or #s=<seed> from the URL) draws
 * the colour insert's focus lines and every screentone illustration plate.
 * "Reprint" rolls a new seed and writes it to the URL, so any print run can
 * be shared. Math.random() is never used for anything drawn.
 *
 * Each part checks for its own markup, so the file works on every page.
 */
(function () {
    "use strict";

    const INK = "#121212";
    const PAPER = "#fbfaf6";
    const MAGENTA = "#ff2d7a";
    const CLOTH = "#2335e8";
    const MAX_SEED_LENGTH = 32;
    const TAU = Math.PI * 2;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");


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

    function range(random, low, high) {
        return low + random() * (high - low);
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
            history.replaceState(history.state, "", hash);
        } catch (error) {
            location.replace(hash);
        }
    }

    function freshSeed() {
        const words = crypto.getRandomValues(new Uint32Array(1));
        return words[0].toString(36).padStart(7, "0");
    }


    /* ---------- canvas helpers ---------- */

    // Sizes a canvas to its CSS box at device resolution and returns a context
    // that draws in CSS pixels, or null while the canvas has no size.
    function prepare(canvas) {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (!w || !h) return null;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        const ctx = canvas.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return { ctx: ctx, w: w, h: h };
    }

    // A tapered stroke, wide at `to` and pointed at `from`: one manga speed line.
    function wedge(ctx, x0, y0, x1, y1, width) {
        const dx = x1 - x0;
        const dy = y1 - y0;
        const length = Math.hypot(dx, dy) || 1;
        const nx = -dy / length * width / 2;
        const ny = dx / length * width / 2;
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1 + nx, y1 + ny);
        ctx.lineTo(x1 - nx, y1 - ny);
        ctx.closePath();
    }

    // A line tapered at both ends.
    function needle(ctx, x0, y0, x1, y1, width) {
        const mx = (x0 + x1) / 2;
        const my = (y0 + y1) / 2;
        const dx = x1 - x0;
        const dy = y1 - y0;
        const length = Math.hypot(dx, dy) || 1;
        const nx = -dy / length * width / 2;
        const ny = dx / length * width / 2;
        ctx.moveTo(x0, y0);
        ctx.lineTo(mx + nx, my + ny);
        ctx.lineTo(x1, y1);
        ctx.lineTo(mx - nx, my - ny);
        ctx.closePath();
    }

    function sparkle(ctx, x, y, r) {
        ctx.moveTo(x, y - r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.quadraticCurveTo(x, y, x, y + r);
        ctx.quadraticCurveTo(x, y, x - r, y);
        ctx.quadraticCurveTo(x, y, x, y - r);
        ctx.closePath();
    }


    /* ---------- screentone plates: the volume's illustrations ---------- */

    // Each takes (ctx, w, h, random) and draws ink on paper.
    const PLATES = {

        // Ink streamlines following a seeded flow field.
        flow: function (ctx, w, h, random) {
            const waves = [];
            for (let k = 0; k < 3; k++) {
                const a = random() * TAU;
                const f = range(random, 2.5, 6) * (1 + k * 0.6);
                waves.push({ fx: Math.cos(a) * f, fy: Math.sin(a) * f, p: random() * TAU, amp: range(random, 0.7, 1.4) / (1 + k * 0.5) });
            }
            const base = random() * TAU;
            const extent = Math.max(w, h);
            const angle = function (x, y) {
                const u = (x - w / 2) / extent;
                const v = (y - h / 2) / extent;
                let sum = base;
                for (let k = 0; k < waves.length; k++) {
                    sum += Math.sin(u * waves[k].fx + v * waves[k].fy + waves[k].p) * waves[k].amp;
                }
                return sum;
            };
            ctx.strokeStyle = INK;
            ctx.lineCap = "round";
            const lines = Math.round(w * h / 900);
            for (let i = 0; i < lines; i++) {
                let x = random() * w;
                let y = random() * h;
                ctx.lineWidth = range(random, 0.6, 2.6);
                ctx.beginPath();
                ctx.moveTo(x, y);
                const steps = 20 + Math.floor(random() * 50);
                for (let s = 0; s < steps; s++) {
                    const a = angle(x, y);
                    x += Math.cos(a) * 2.2;
                    y += Math.sin(a) * 2.2;
                    ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
        },

        // Parallel speed lines with a clear band where the "subject" moves.
        speed: function (ctx, w, h, random) {
            const tilt = range(random, -0.35, 0.35);
            const cos = Math.cos(tilt);
            const sin = Math.sin(tilt);
            const span = Math.hypot(w, h);
            const band = range(random, 0.3, 0.7);
            const bandWidth = range(random, 0.08, 0.2);
            ctx.fillStyle = INK;
            ctx.beginPath();
            const count = Math.round(h * 1.4);
            for (let i = 0; i < count; i++) {
                const offset = (random() - 0.5) * span;
                const across = offset / span + 0.5;
                if (Math.abs(across - band) < bandWidth * random()) continue;
                const length = span * range(random, 0.15, 0.9);
                const start = (random() - 0.5) * span;
                const cx = w / 2 + cos * start - sin * offset;
                const cy = h / 2 + sin * start + cos * offset;
                needle(ctx, cx, cy, cx + cos * length, cy + sin * length, range(random, 0.6, 3.2));
            }
            ctx.fill();
        },

        // Concentric dot rings, like a sound wave or a set-associative cache.
        rings: function (ctx, w, h, random) {
            const cx = range(random, 0.25, 0.75) * w;
            const cy = range(random, 0.25, 0.75) * h;
            const gap = range(random, 8, 13);
            const freq = range(random, 0.15, 0.4);
            const phase = random() * TAU;
            const reach = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy));
            ctx.fillStyle = INK;
            ctx.beginPath();
            for (let r = gap; r < reach; r += gap) {
                const count = Math.max(6, Math.round(TAU * r / 7));
                for (let k = 0; k < count; k++) {
                    const a = k / count * TAU;
                    const size = 2.6 * (0.5 + 0.5 * Math.sin(r * freq + Math.cos(a * 3 + phase) * 2));
                    if (size < 0.35) continue;
                    const x = cx + Math.cos(a) * r;
                    const y = cy + Math.sin(a) * r;
                    ctx.moveTo(x + size, y);
                    ctx.arc(x, y, size, 0, TAU);
                }
            }
            ctx.fill();
        },

        // Overlapping shapes, each filled with hatching at its own angle.
        hatch: function (ctx, w, h, random) {
            const shapes = 4 + Math.floor(random() * 4);
            for (let s = 0; s < shapes; s++) {
                const x = random() * w;
                const y = random() * h;
                const r = range(random, 0.12, 0.32) * Math.min(w, h) * 1.4;
                const square = random() < 0.45;
                ctx.save();
                ctx.beginPath();
                if (square) ctx.rect(x - r / 2, y - r / 2, r, r);
                else ctx.arc(x, y, r / 2, 0, TAU);
                ctx.fillStyle = PAPER;
                ctx.fill();
                ctx.clip();
                const angle = random() * Math.PI;
                const gap = range(random, 3.5, 7);
                ctx.strokeStyle = INK;
                ctx.lineWidth = range(random, 0.8, 1.6);
                ctx.beginPath();
                for (let d = -r * 1.5; d < r * 1.5; d += gap) {
                    ctx.moveTo(x + Math.cos(angle) * -r * 2 - Math.sin(angle) * d, y + Math.sin(angle) * -r * 2 + Math.cos(angle) * d);
                    ctx.lineTo(x + Math.cos(angle) * r * 2 - Math.sin(angle) * d, y + Math.sin(angle) * r * 2 + Math.cos(angle) * d);
                }
                ctx.stroke();
                ctx.restore();
                ctx.strokeStyle = INK;
                ctx.lineWidth = 2;
                ctx.beginPath();
                if (square) ctx.rect(x - r / 2, y - r / 2, r, r);
                else ctx.arc(x, y, r / 2, 0, TAU);
                ctx.stroke();
            }
        },

        // Sand tone: stippled dots whose density drifts across the panel.
        stipple: function (ctx, w, h, random) {
            const fx = range(random, 1, 3) * TAU / w;
            const fy = range(random, 1, 3) * TAU / h;
            const p = random() * TAU;
            ctx.fillStyle = INK;
            ctx.beginPath();
            const count = Math.round(w * h / 6);
            for (let i = 0; i < count; i++) {
                const x = random() * w;
                const y = random() * h;
                const density = 0.5 + 0.5 * Math.sin(x * fx + Math.cos(y * fy + p) * 2.2);
                if (random() > density * density) continue;
                const r = range(random, 0.5, 1.3);
                ctx.moveTo(x + r, y);
                ctx.arc(x, y, r, 0, TAU);
            }
            ctx.fill();
        },

        // A classic 45-degree dot screen grading from paper to solid ink.
        halftone: function (ctx, w, h, random) {
            const gap = range(random, 6, 9);
            const cx = random() * w;
            const cy = random() * h;
            const dir = random() * TAU;
            const reach = Math.hypot(w, h);
            const sun = { x: range(random, 0.2, 0.8) * w, y: range(random, 0.2, 0.6) * h, r: range(random, 0.12, 0.22) * Math.min(w, h) };
            ctx.fillStyle = INK;
            ctx.beginPath();
            const cos = Math.cos(Math.PI / 4);
            for (let i = -reach; i < reach; i += gap) {
                for (let j = -reach; j < reach; j += gap) {
                    const x = w / 2 + (i - j) * cos;
                    const y = h / 2 + (i + j) * cos;
                    if (x < -gap || y < -gap || x > w + gap || y > h + gap) continue;
                    if (Math.hypot(x - sun.x, y - sun.y) < sun.r + gap) continue;
                    const along = ((x - cx) * Math.cos(dir) + (y - cy) * Math.sin(dir)) / reach + 0.5;
                    const tone = Math.min(1, Math.max(0, along * 1.4 - 0.2));
                    const r = gap * 0.52 * Math.sqrt(tone);
                    if (r < 0.4) continue;
                    ctx.moveTo(x + r, y);
                    ctx.arc(x, y, r, 0, TAU);
                }
            }
            ctx.fill();
            ctx.strokeStyle = INK;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sun.x, sun.y, sun.r, 0, TAU);
            ctx.stroke();
        },

        // Focus lines: everything rushes toward one point.
        focus: function (ctx, w, h, random) {
            const cx = range(random, 0.35, 0.65) * w;
            const cy = range(random, 0.35, 0.65) * h;
            const hole = range(random, 0.14, 0.26) * Math.min(w, h);
            const outer = Math.hypot(w, h);
            ctx.fillStyle = INK;
            ctx.beginPath();
            const count = 170 + Math.floor(random() * 90);
            for (let i = 0; i < count; i++) {
                const a = random() * TAU;
                const inner = hole * range(random, 1, 1.9);
                wedge(ctx,
                    cx + Math.cos(a) * inner, cy + Math.sin(a) * inner,
                    cx + Math.cos(a) * outer, cy + Math.sin(a) * outer,
                    range(random, 2, 9));
            }
            ctx.fill();
        },

        // Beta flash: solid ink with white spikes bursting from the centre.
        flash: function (ctx, w, h, random) {
            ctx.fillStyle = INK;
            ctx.fillRect(0, 0, w, h);
            const cx = range(random, 0.4, 0.6) * w;
            const cy = range(random, 0.35, 0.55) * h;
            const outer = Math.hypot(w, h) * 0.75;
            ctx.fillStyle = PAPER;
            ctx.beginPath();
            const count = 90 + Math.floor(random() * 60);
            for (let i = 0; i < count; i++) {
                const a = random() * TAU;
                const length = outer * range(random, 0.25, 1);
                const width = range(random, 3, 14);
                const nx = -Math.sin(a) * width / 2;
                const ny = Math.cos(a) * width / 2;
                ctx.moveTo(cx + nx, cy + ny);
                ctx.lineTo(cx + Math.cos(a) * length, cy + Math.sin(a) * length);
                ctx.lineTo(cx - nx, cy - ny);
                ctx.closePath();
            }
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx, cy, Math.min(w, h) * range(random, 0.06, 0.1), 0, TAU);
            ctx.fill();
        },

        // Night sky: a toned gradient with four-point sparkles.
        stars: function (ctx, w, h, random) {
            const gap = 6;
            ctx.fillStyle = INK;
            ctx.beginPath();
            const cos = Math.cos(Math.PI / 4);
            const reach = Math.hypot(w, h);
            for (let i = -reach; i < reach; i += gap) {
                for (let j = -reach; j < reach; j += gap) {
                    const x = w / 2 + (i - j) * cos;
                    const y = h / 2 + (i + j) * cos;
                    if (x < -gap || y < -gap || x > w + gap || y > h + gap) continue;
                    const tone = 1 - y / h;
                    const r = gap * 0.58 * Math.sqrt(Math.max(0, tone));
                    if (r < 0.4) continue;
                    ctx.moveTo(x + r, y);
                    ctx.arc(x, y, r, 0, TAU);
                }
            }
            ctx.fill();
            const count = 10 + Math.floor(random() * 12);
            for (let s = 0; s < count; s++) {
                const x = random() * w;
                const y = random() * h * 0.75;
                const r = range(random, 4, 15);
                ctx.beginPath();
                sparkle(ctx, x, y, r + 3);
                ctx.fillStyle = INK;
                ctx.fill();
                ctx.beginPath();
                sparkle(ctx, x, y, r);
                ctx.fillStyle = PAPER;
                ctx.fill();
            }
        }
    };

    // The opener gets the flash; each episode keeps its own kind of plate.
    const EPISODE_PLATES = ["flow", "speed", "rings", "hatch", "stipple", "halftone", "focus", "stars"];

    function createPlates() {
        const canvases = Array.from(document.querySelectorAll(".plate"));
        if (!canvases.length) return null;
        let seed = "";

        const plates = canvases.map(function (canvas) {
            let kind = "halftone";
            let name = "plate";
            if (canvas.classList.contains("plate--opener")) {
                kind = "flash";
                name = "opener";
            } else {
                const project = canvas.closest(".project");
                if (project) {
                    const all = Array.from(document.querySelectorAll(".project"));
                    kind = EPISODE_PLATES[all.indexOf(project) % EPISODE_PLATES.length];
                    name = project.id || kind;
                } else {
                    name = (canvas.closest("[id]") || {}).id || "plate";
                }
            }
            return { canvas: canvas, kind: kind, name: name };
        });

        function draw(plate) {
            const surface = prepare(plate.canvas);
            if (!surface || !seed) return;
            surface.ctx.fillStyle = PAPER;
            surface.ctx.fillRect(0, 0, surface.w, surface.h);
            PLATES[plate.kind](surface.ctx, surface.w, surface.h, mulberry32(fnv1a(seed + "/" + plate.name)));
        }

        plates.forEach(function (plate) {
            watchSize(plate.canvas, function () { draw(plate); });
        });

        return {
            print: function (nextSeed) {
                seed = nextSeed;
                plates.forEach(draw);
            }
        };
    }


    /* ---------- colour insert: cobalt and white focus lines around the photo ---------- */

    function createInsert() {
        const canvas = document.querySelector(".focus-lines");
        const photo = document.querySelector(".insert-photo");
        if (!canvas || !photo) return null;
        let seed = "";

        function draw() {
            const surface = prepare(canvas);
            if (!surface || !seed) return;
            const ctx = surface.ctx;
            const random = mulberry32(fnv1a(seed + "/insert"));
            const box = canvas.getBoundingClientRect();
            const frame = photo.getBoundingClientRect();
            const cx = frame.left + frame.width / 2 - box.left;
            const cy = frame.top + frame.height / 2 - box.top;
            const halfW = frame.width / 2 + 14;
            const halfH = frame.height / 2 + 14;
            const outer = Math.hypot(surface.w, surface.h);

            ctx.fillStyle = MAGENTA;
            ctx.fillRect(0, 0, surface.w, surface.h);

            // Lines start where a ray from the centre leaves the photo, never on it.
            function edge(a) {
                const dx = Math.abs(Math.cos(a)) || 1e-6;
                const dy = Math.abs(Math.sin(a)) || 1e-6;
                return Math.min(halfW / dx, halfH / dy);
            }

            [[CLOTH, 220, 3, 12], [PAPER, 130, 1.2, 5]].forEach(function (layer) {
                ctx.fillStyle = layer[0];
                ctx.beginPath();
                for (let i = 0; i < layer[1]; i++) {
                    const a = random() * TAU;
                    const inner = edge(a) + range(random, 6, 90);
                    wedge(ctx,
                        cx + Math.cos(a) * inner, cy + Math.sin(a) * inner,
                        cx + Math.cos(a) * outer, cy + Math.sin(a) * outer,
                        range(random, layer[2], layer[3]));
                }
                ctx.fill();
            });
        }

        watchSize(canvas, draw);

        return {
            print: function (nextSeed) {
                seed = nextSeed;
                draw();
            }
        };
    }


    /* ---------- favicon: a tiny colour insert ---------- */

    function updateFavicon(seed) {
        const canvas = document.createElement("canvas");
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");
        const random = mulberry32(fnv1a(seed + "/favicon"));
        ctx.fillStyle = CLOTH;
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = MAGENTA;
        ctx.beginPath();
        for (let i = 0; i < 26; i++) {
            const a = random() * TAU;
            wedge(ctx, 16 + Math.cos(a) * 7, 16 + Math.sin(a) * 7, 16 + Math.cos(a) * 24, 16 + Math.sin(a) * 24, range(random, 2, 4));
        }
        ctx.fill();
        ctx.fillStyle = PAPER;
        ctx.fillRect(11, 9, 10, 14);

        let link = document.head.querySelector("link[rel='icon']");
        if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
        }
        link.type = "image/png";
        link.href = canvas.toDataURL("image/png");
    }


    /* ---------- turning pages and finding your place ---------- */

    function watchSize(element, callback) {
        let last = element.clientWidth + "x" + element.clientHeight;
        let timer = 0;
        new ResizeObserver(function () {
            clearTimeout(timer);
            timer = setTimeout(function () {
                const key = element.clientWidth + "x" + element.clientHeight;
                if (key === last || !element.clientWidth) return;
                last = key;
                callback();
            }, 150);
        }).observe(element);
    }

    // The first time a page comes into view, its gutter shadow lifts once.
    function watchPageTurns() {
        if (reducedMotion.matches) return;
        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-turned");
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.25 });
        document.querySelectorAll(".page").forEach(function (page) {
            observer.observe(page);
        });
    }

    // The thumb tab for the chapter you are reading sticks out further.
    function watchCurrentTab() {
        const tabs = Array.from(document.querySelectorAll(".nav-links a[href^='#']"));
        const targets = tabs.map(function (tab) {
            return document.getElementById(tab.getAttribute("href").slice(1));
        });
        if (!tabs.length || targets.some(function (t) { return !t; })) return;

        // A tab stays current until the next tab's chapter starts.
        const starts = [
            [document.getElementById("about"), 0],
            [document.getElementById("skills"), 2],
            [document.getElementById("education"), 2],
            [document.getElementById("projects"), 1],
            [document.getElementById("contact"), 3]
        ].filter(function (pair) { return pair[0]; });

        function update() {
            const line = window.innerHeight * 0.4;
            let current = -1;
            starts.forEach(function (pair) {
                if (pair[0].getBoundingClientRect().top <= line) current = pair[1];
            });
            tabs.forEach(function (tab, index) {
                if (index === current) tab.setAttribute("aria-current", "true");
                else tab.removeAttribute("aria-current");
            });
        }

        let pending = false;
        window.addEventListener("scroll", function () {
            if (pending) return;
            pending = true;
            requestAnimationFrame(function () {
                pending = false;
                update();
            });
        }, { passive: true });
        update();
    }


    /* ---------- wiring ---------- */

    const presses = [createInsert(), createPlates()].filter(Boolean);
    const seedLabel = document.querySelector(".identity-seed");
    const colophon = document.querySelector(".colophon");
    const reprint = document.querySelector(".reprint");
    let current = "";

    function print(seed) {
        if (seed === current) return;
        current = seed;
        presses.forEach(function (press) { press.print(seed); });
        if (seedLabel) seedLabel.textContent = seed;
        updateFavicon(seed);
    }

    if (reprint) {
        reprint.addEventListener("click", function () {
            const next = freshSeed();
            writeSeedToHash(next);
            print(next);
        });
        reprint.hidden = false;
    }
    if (colophon) colophon.hidden = false;

    // The hash is shared with the contents and tabs: only #s=... reprints.
    window.addEventListener("hashchange", function () {
        const fromHash = seedFromHash();
        if (fromHash) print(fromHash);
    });

    watchPageTurns();
    watchCurrentTab();

    // A fresh print run every visit; only Reprint writes it to the URL.
    const start = function () { print(seedFromHash() || freshSeed()); };
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(start); // plates size to the laid-out pages
    } else {
        start();
    }
})();
