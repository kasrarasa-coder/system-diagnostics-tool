import json

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import VisitorLog
from .utils import get_client_ip


def index_view(request):
    """Render the diagnostic dashboard page."""
    return render(request, "tracker/index.html")


def _to_float(value):
    try:
        if value is None or value == "":
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _to_int(value):
    try:
        if value is None or value == "":
            return None
        return int(value)
    except (TypeError, ValueError):
        return None


def _to_bool_or_none(value):
    if value is None:
        return None
    return bool(value)


@csrf_exempt
@require_POST
def log_telemetry_view(request):
    """
    Accepts a JSON payload of client-side diagnostic parameters,
    combines it with server-observable data (IP, User-Agent, Referrer),
    validates/coerces types, and persists a VisitorLog row.
    """
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"status": "error", "message": "Invalid JSON payload."}, status=400)

    if not isinstance(payload, dict):
        return JsonResponse({"status": "error", "message": "Payload must be a JSON object."}, status=400)

    try:
        log_entry = VisitorLog.objects.create(
            # Server-side captured
            ip_address=get_client_ip(request),
            user_agent=request.META.get("HTTP_USER_AGENT", ""),
            referrer=request.META.get("HTTP_REFERER", ""),
            # Hardware & Architecture
            cpu_cores=_to_int(payload.get("cpu_cores")),
            device_memory_gb=_to_float(payload.get("device_memory_gb")),
            platform=str(payload.get("platform", ""))[:100],
            architecture=str(payload.get("architecture", ""))[:50],
            # GPU & WebGL
            gpu_vendor=str(payload.get("gpu_vendor", ""))[:255],
            gpu_renderer=str(payload.get("gpu_renderer", ""))[:255],
            webgl_version=str(payload.get("webgl_version", ""))[:50],
            # Screen & Display
            screen_width=_to_int(payload.get("screen_width")),
            screen_height=_to_int(payload.get("screen_height")),
            color_depth=_to_int(payload.get("color_depth")),
            pixel_ratio=_to_float(payload.get("pixel_ratio")),
            orientation=str(payload.get("orientation", ""))[:20],
            # Network & Connection
            downlink_mbps=_to_float(payload.get("downlink_mbps")),
            effective_type=str(payload.get("effective_type", ""))[:20],
            rtt_ms=_to_int(payload.get("rtt_ms")),
            save_data_mode=bool(payload.get("save_data_mode", False)),
            # Battery & Power
            battery_level_percent=_to_float(payload.get("battery_level_percent")),
            is_charging=_to_bool_or_none(payload.get("is_charging")),
            charging_time_sec=_to_int(payload.get("charging_time_sec")),
            discharging_time_sec=_to_int(payload.get("discharging_time_sec")),
            # Browser Environment & Capabilities
            language=str(payload.get("language", ""))[:20],
            languages_list=str(payload.get("languages_list", "")),
            timezone=str(payload.get("timezone", ""))[:100],
            cookie_enabled=bool(payload.get("cookie_enabled", False)),
            do_not_track=_to_bool_or_none(payload.get("do_not_track")),
            touch_support=bool(payload.get("touch_support", False)),
            webrtc_supported=bool(payload.get("webrtc_supported", False)),
            service_worker_supported=bool(payload.get("service_worker_supported", False)),
            canvas_fingerprint_hash=str(payload.get("canvas_fingerprint_hash", ""))[:64],
            # In-Browser Benchmark
            cpu_benchmark_ms=_to_float(payload.get("cpu_benchmark_ms")),
        )
    except Exception as exc:  # noqa: BLE001 - surface a clean error to the client
        return JsonResponse({"status": "error", "message": f"Failed to save log: {exc}"}, status=500)

    return JsonResponse({"status": "success", "id": log_entry.id})
