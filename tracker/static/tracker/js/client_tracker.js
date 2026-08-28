/**
 * Client Telemetry & System Benchmark Diagnostics Tool
 * Gathers 35+ client-side diagnostic parameters via standard Web APIs,
 * renders them live in the dashboard, and POSTs the payload to the
 * Django backend at /api/log/.
 */

(function () {
  "use strict";

  const payload = {};

  /* ---------------------------------------------------------------
   * DOM helpers
   * ------------------------------------------------------------- */
  function setField(name, value, formatter) {
    const el = document.querySelector(`[data-field="${name}"]`);
    if (!el) return;
    el.classList.remove("pending");
    const display = formatter ? formatter(value) : value;
    el.textContent = (display === null || display === undefined || display === "")
      ? "N/A"
      : display;
  }

  function boolPill(value) {
    if (value === null || value === undefined) {
      const span = document.createElement("span");
      span.className = "pill warn";
      span.textContent = "Unknown";
      return span.outerHTML;
    }
    const span = document.createElement("span");
    span.className = value ? "pill ok" : "pill bad";
    span.textContent = value ? "Yes" : "No";
    return span.outerHTML;
  }

  function setFieldHTML(name, html) {
    const el = document.querySelector(`[data-field="${name}"]`);
    if (!el) return;
    el.classList.remove("pending");
    el.innerHTML = html;
  }

  /* ---------------------------------------------------------------
   * 1. Hardware & Architecture
   * ------------------------------------------------------------- */
  function collectHardware() {
    payload.cpu_cores = navigator.hardwareConcurrency || null;
    payload.device_memory_gb = navigator.deviceMemory || null;
    payload.platform = navigator.platform || "";

    // "Architecture" is not directly exposed by browsers for privacy
    // reasons; derive a best-effort hint from the UA string.
    const ua = navigator.userAgent || "";
    let archHint = "unknown";
    if (/arm64|aarch64/i.test(ua)) archHint = "arm64";
    else if (/win64|x64|x86_64|amd64/i.test(ua)) archHint = "x86_64";
    else if (/i686|i386|x86/i.test(ua)) archHint = "x86";
    payload.architecture = archHint;

    setField("cpu_cores", payload.cpu_cores);
    setField("device_memory_gb", payload.device_memory_gb, (v) => `${v} GB`);
    setField("platform", payload.platform);
    setField("architecture", payload.architecture);
  }

  /* ---------------------------------------------------------------
   * 2. GPU & WebGL
   * ------------------------------------------------------------- */
  function collectGPU() {
    let vendor = "Unavailable";
    let renderer = "Unavailable";
    let version = "Unavailable";

    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");

      if (gl) {
        version = gl.getParameter(gl.VERSION) || "WebGL";
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (debugInfo) {
          vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || gl.getParameter(gl.VENDOR);
          renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || gl.getParameter(gl.RENDERER);
        } else {
          vendor = gl.getParameter(gl.VENDOR) || "Masked";
          renderer = gl.getParameter(gl.RENDERER) || "Masked";
        }
      }
    } catch (e) {
      vendor = "Error";
      renderer = "Error";
      version = "Error";
    }

    payload.gpu_vendor = vendor;
    payload.gpu_renderer = renderer;
    payload.webgl_version = version;

    setField("gpu_vendor", vendor);
    setField("gpu_renderer", renderer);
    setField("webgl_version", version);
  }

  /* ---------------------------------------------------------------
   * 3. Screen & Display
   * ------------------------------------------------------------- */
  function collectDisplay() {
    payload.screen_width = window.screen.width || null;
    payload.screen_height = window.screen.height || null;
    payload.color_depth = window.screen.colorDepth || null;
    payload.pixel_ratio = window.devicePixelRatio || 1;

    let orientation = "unknown";
    if (window.screen.orientation && window.screen.orientation.type) {
      orientation = window.screen.orientation.type.includes("portrait") ? "portrait" : "landscape";
    } else {
      orientation = window.innerWidth >= window.innerHeight ? "landscape" : "portrait";
    }
    payload.orientation = orientation;

    setField("resolution", null, () => `${payload.screen_width} × ${payload.screen_height}`);
    setField("color_depth", payload.color_depth, (v) => `${v}-bit`);
    setField("pixel_ratio", payload.pixel_ratio, (v) => `${v}x`);
    setField("orientation", orientation);
  }

  /* ---------------------------------------------------------------
   * 4. Network & Connection
   * ------------------------------------------------------------- */
  function collectNetwork() {
    const conn =
      navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;

    payload.downlink_mbps = conn && typeof conn.downlink === "number" ? conn.downlink : null;
    payload.effective_type = conn && conn.effectiveType ? conn.effectiveType : "unknown";
    payload.rtt_ms = conn && typeof conn.rtt === "number" ? conn.rtt : null;
    payload.save_data_mode = conn ? !!conn.saveData : false;

    setField("effective_type", payload.effective_type);
    setField("downlink_mbps", payload.downlink_mbps, (v) => (v === null ? "N/A" : `${v} Mbps`));
    setField("rtt_ms", payload.rtt_ms, (v) => (v === null ? "N/A" : `${v} ms`));
    setFieldHTML("save_data_mode", boolPill(payload.save_data_mode));
  }

  /* ---------------------------------------------------------------
   * 5. Battery & Power (async, Promise-based API)
   * ------------------------------------------------------------- */
  function collectBattery() {
    if (!navigator.getBattery) {
      payload.battery_level_percent = null;
      payload.is_charging = null;
      payload.charging_time_sec = null;
      payload.discharging_time_sec = null;
      setField("battery_level_percent", "Unsupported");
      setFieldHTML("is_charging", boolPill(null));
      setField("charging_time_sec", "N/A");
      setField("discharging_time_sec", "N/A");
      return Promise.resolve();
    }

    return navigator
      .getBattery()
      .then((battery) => {
        const levelPct = Math.round(battery.level * 100);
        payload.battery_level_percent = levelPct;
        payload.is_charging = !!battery.charging;
        payload.charging_time_sec =
          Number.isFinite(battery.chargingTime) ? battery.chargingTime : null;
        payload.discharging_time_sec =
          Number.isFinite(battery.dischargingTime) ? battery.dischargingTime : null;

        setField("battery_level_percent", `${levelPct}%`);
        const bar = document.getElementById("battery-bar");
        if (bar) bar.style.width = `${levelPct}%`;

        setFieldHTML("is_charging", boolPill(payload.is_charging));
        setField("charging_time_sec", payload.charging_time_sec ?? "N/A");
        setField("discharging_time_sec", payload.discharging_time_sec ?? "N/A");
      })
      .catch(() => {
        payload.battery_level_percent = null;
        payload.is_charging = null;
        payload.charging_time_sec = null;
        payload.discharging_time_sec = null;
        setField("battery_level_percent", "Error");
      });
  }

  /* ---------------------------------------------------------------
   * 6. Browser Environment & Capabilities
   * ------------------------------------------------------------- */
  function simpleCanvasFingerprint() {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 220;
      canvas.height = 40;
      const ctx = canvas.getContext("2d");
      ctx.textBaseline = "top";
      ctx.font = "16px 'Arial'";
      ctx.fillStyle = "#06b6d4";
      ctx.fillRect(0, 0, 220, 40);
      ctx.fillStyle = "#10b981";
      ctx.fillText("diagnostics-check-🔎", 2, 2);
      const dataUrl = canvas.toDataURL();

      // Lightweight, non-cryptographic hash (djb2) of the resulting
      // pixel data URL — sufficient for a session fingerprint field.
      let hash = 5381;
      for (let i = 0; i < dataUrl.length; i++) {
        hash = (hash * 33) ^ dataUrl.charCodeAt(i);
      }
      // Convert to an unsigned hex string, padded/truncated to 64 chars.
      const hex = (hash >>> 0).toString(16).padStart(8, "0");
      return (hex + hex + hex + hex + hex + hex + hex + hex).slice(0, 64);
    } catch (e) {
      return "";
    }
  }

  function collectBrowserEnvironment() {
    payload.language = navigator.language || "";
    payload.languages_list = (navigator.languages || []).join(",");
    payload.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    payload.cookie_enabled = !!navigator.cookieEnabled;
    payload.do_not_track =
      navigator.doNotTrack === "1" || navigator.doNotTrack === "yes"
        ? true
        : navigator.doNotTrack === "0"
        ? false
        : null;
    payload.touch_support =
      "ontouchstart" in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    payload.webrtc_supported = !!(
      window.RTCPeerConnection ||
      window.webkitRTCPeerConnection ||
      window.mozRTCPeerConnection
    );
    payload.service_worker_supported = "serviceWorker" in navigator;
    payload.canvas_fingerprint_hash = simpleCanvasFingerprint();

    setField("language", payload.language);
    setField("timezone", payload.timezone);
    setFieldHTML("cookie_enabled", boolPill(payload.cookie_enabled));
    setFieldHTML("do_not_track", boolPill(payload.do_not_track));
    setFieldHTML("touch_support", boolPill(payload.touch_support));
    setFieldHTML("webrtc_supported", boolPill(payload.webrtc_supported));
    setFieldHTML("service_worker_supported", boolPill(payload.service_worker_supported));
    setField("canvas_fingerprint_hash", payload.canvas_fingerprint_hash.slice(0, 16) + "…");
  }

  /* ---------------------------------------------------------------
   * 7. In-Browser CPU Benchmark
   *    Single-thread prime-counting micro-benchmark, timed via
   *    performance.now() for sub-millisecond precision.
   * ------------------------------------------------------------- */
  function runCpuBenchmark(iterations) {
    const start = performance.now();

    function isPrime(n) {
      if (n < 2) return false;
      for (let i = 2, limit = Math.sqrt(n); i <= limit; i++) {
        if (n % i === 0) return false;
      }
      return true;
    }

    let primeCount = 0;
    let candidate = 2;
    let tested = 0;
    while (tested < iterations) {
      if (isPrime(candidate)) primeCount++;
      candidate++;
      tested++;
    }

    const elapsedMs = performance.now() - start;
    payload.cpu_benchmark_ms = Math.round(elapsedMs * 100) / 100;

    setField("cpu_benchmark_ms", payload.cpu_benchmark_ms, (v) => `${v} ms`);

    const statusEl = document.getElementById("benchmark-status");
    if (statusEl) {
      let tier = "ok";
      let label = "Fast";
      if (elapsedMs > 80) {
        tier = "warn";
        label = "Moderate";
      }
      if (elapsedMs > 200) {
        tier = "bad";
        label = "Slow";
      }
      statusEl.innerHTML = `<span class="pill ${tier}">${label} · ${primeCount} primes</span>`;
    }
  }

  /* ---------------------------------------------------------------
   * 8. CSRF helper (Django expects the csrftoken cookie echoed back
   *    as the X-CSRFToken header on unsafe methods; the log endpoint
   *    is csrf_exempt server-side, but we send it defensively in
   *    case that exemption is removed in a future deployment).
   * ------------------------------------------------------------- */
  function getCookie(name) {
    const match = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[2]) : null;
  }

  /* ---------------------------------------------------------------
   * 9. Transmit payload to backend
   * ------------------------------------------------------------- */
  function sendPayload() {
    const statusBox = document.getElementById("send-status");
    const statusText = document.getElementById("send-status-text");

    const csrftoken = getCookie("csrftoken");
    const headers = { "Content-Type": "application/json" };
    if (csrftoken) headers["X-CSRFToken"] = csrftoken;

    fetch("/api/log/", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (ok && data.status === "success") {
          statusBox.classList.add("success");
          statusText.textContent = `Diagnostics transmitted successfully (log #${data.id}).`;
          statusBox.querySelector(".icon").textContent = "✅";
        } else {
          throw new Error(data.message || "Unknown server error");
        }
      })
      .catch((err) => {
        statusBox.classList.add("error");
        statusText.textContent = `Failed to transmit diagnostics: ${err.message}`;
        statusBox.querySelector(".icon").textContent = "⚠️";
      });
  }

  /* ---------------------------------------------------------------
   * Orchestration
   * ------------------------------------------------------------- */
  function init() {
    collectHardware();
    collectGPU();
    collectDisplay();
    collectNetwork();
    collectBrowserEnvironment();

    // Battery API is async; run benchmark + send only after it settles
    // (or immediately falls back) so the payload is complete.
    collectBattery().finally(() => {
      // Defer the benchmark slightly so the UI paints first.
      setTimeout(() => {
        runCpuBenchmark(10000);
        sendPayload();
      }, 50);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
