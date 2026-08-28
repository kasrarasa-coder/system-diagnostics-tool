from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="VisitorLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("ip_address", models.GenericIPAddressField(blank=True, null=True)),
                ("user_agent", models.TextField(blank=True, default="")),
                ("referrer", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("cpu_cores", models.IntegerField(blank=True, null=True)),
                ("device_memory_gb", models.FloatField(blank=True, null=True)),
                ("platform", models.CharField(blank=True, default="", max_length=100)),
                ("architecture", models.CharField(blank=True, default="", max_length=50)),
                ("gpu_vendor", models.CharField(blank=True, default="", max_length=255)),
                ("gpu_renderer", models.CharField(blank=True, default="", max_length=255)),
                ("webgl_version", models.CharField(blank=True, default="", max_length=50)),
                ("screen_width", models.IntegerField(blank=True, null=True)),
                ("screen_height", models.IntegerField(blank=True, null=True)),
                ("color_depth", models.IntegerField(blank=True, null=True)),
                ("pixel_ratio", models.FloatField(blank=True, null=True)),
                ("orientation", models.CharField(blank=True, default="", max_length=20)),
                ("downlink_mbps", models.FloatField(blank=True, null=True)),
                ("effective_type", models.CharField(blank=True, default="", max_length=20)),
                ("rtt_ms", models.IntegerField(blank=True, null=True)),
                ("save_data_mode", models.BooleanField(default=False)),
                ("battery_level_percent", models.FloatField(blank=True, null=True)),
                ("is_charging", models.BooleanField(blank=True, null=True)),
                ("charging_time_sec", models.IntegerField(blank=True, null=True)),
                ("discharging_time_sec", models.IntegerField(blank=True, null=True)),
                ("language", models.CharField(blank=True, default="", max_length=20)),
                ("languages_list", models.TextField(blank=True, default="")),
                ("timezone", models.CharField(blank=True, default="", max_length=100)),
                ("cookie_enabled", models.BooleanField(default=False)),
                ("do_not_track", models.BooleanField(blank=True, null=True)),
                ("touch_support", models.BooleanField(default=False)),
                ("webrtc_supported", models.BooleanField(default=False)),
                ("service_worker_supported", models.BooleanField(default=False)),
                ("canvas_fingerprint_hash", models.CharField(blank=True, default="", max_length=64)),
                ("cpu_benchmark_ms", models.FloatField(blank=True, null=True)),
            ],
            options={
                "verbose_name": "Visitor Log",
                "verbose_name_plural": "Visitor Logs",
                "ordering": ["-created_at"],
            },
        ),
    ]
