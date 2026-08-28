from django.contrib import admin

from .models import VisitorLog


@admin.register(VisitorLog)
class VisitorLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "created_at",
        "ip_address",
        "platform",
        "gpu_renderer",
        "effective_type",
        "battery_level_percent",
        "cpu_benchmark_ms",
    )
    list_filter = (
        "platform",
        "architecture",
        "effective_type",
        "orientation",
        "is_charging",
        "cookie_enabled",
        "created_at",
    )
    search_fields = (
        "ip_address",
        "user_agent",
        "gpu_vendor",
        "gpu_renderer",
        "platform",
        "canvas_fingerprint_hash",
    )
    readonly_fields = ("created_at",)
    date_hierarchy = "created_at"

    fieldsets = (
        (
            "Request Metadata",
            {
                "fields": ("ip_address", "user_agent", "referrer", "created_at"),
            },
        ),
        (
            "Hardware & Architecture",
            {
                "classes": ("collapse",),
                "fields": ("cpu_cores", "device_memory_gb", "platform", "architecture"),
            },
        ),
        (
            "GPU & WebGL",
            {
                "classes": ("collapse",),
                "fields": ("gpu_vendor", "gpu_renderer", "webgl_version"),
            },
        ),
        (
            "Screen & Display",
            {
                "classes": ("collapse",),
                "fields": (
                    "screen_width",
                    "screen_height",
                    "color_depth",
                    "pixel_ratio",
                    "orientation",
                ),
            },
        ),
        (
            "Network & Connection",
            {
                "classes": ("collapse",),
                "fields": ("downlink_mbps", "effective_type", "rtt_ms", "save_data_mode"),
            },
        ),
        (
            "Battery & Power",
            {
                "classes": ("collapse",),
                "fields": (
                    "battery_level_percent",
                    "is_charging",
                    "charging_time_sec",
                    "discharging_time_sec",
                ),
            },
        ),
        (
            "Browser Environment & Capabilities",
            {
                "classes": ("collapse",),
                "fields": (
                    "language",
                    "languages_list",
                    "timezone",
                    "cookie_enabled",
                    "do_not_track",
                    "touch_support",
                    "webrtc_supported",
                    "service_worker_supported",
                    "canvas_fingerprint_hash",
                ),
            },
        ),
        (
            "In-Browser Benchmark",
            {
                "classes": ("collapse",),
                "fields": ("cpu_benchmark_ms",),
            },
        ),
    )
