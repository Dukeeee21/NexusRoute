"""
Seeds a working demo environment: an admin, two drivers, two vehicles
and a handful of unassigned pending deliveries around Buenos Aires.

Idempotent — safe to run more than once (uses get_or_create throughout).
This is what makes the README's quickstart actually reproducible: a
fresh `docker compose up` + this command gives you a database you can
immediately log into and build a route with, instead of an empty one
that requires manually poking the Django shell.
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.deliveries.models import Delivery, Package
from apps.vehicles.models import Vehicle

User = get_user_model()

DELIVERIES = [
    ("TechCorp Ltda.", "Palermo, CABA", -34.5711, -58.4233),
    ("Distribuidora SUR", "La Boca, CABA", -34.6345, -58.3631),
    ("MegaRetail S.A.", "Belgrano, CABA", -34.5627, -58.4583),
    ("Hospital General", "San Telmo, CABA", -34.6211, -58.3731),
    ("Panadería Central", "Caballito, CABA", -34.6190, -58.4408),
]

DEPOT = ("Depósito Central", -34.6037, -58.3816)


class Command(BaseCommand):
    help = "Crea usuarios, vehículos y entregas de ejemplo para probar la app."

    def handle(self, *args, **options):
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={"email": "admin@nexusroute.local", "role": User.Role.ADMIN},
        )
        if created:
            admin.set_password("admin12345")
            admin.is_staff = True
            admin.is_superuser = True
            admin.save()
        self._report("Admin", "admin", "admin12345", created)

        drivers = []
        for i, name in enumerate(["Carlos", "Miguel"], start=1):
            username = f"conductor{i}"
            driver, created = User.objects.get_or_create(
                username=username,
                defaults={"first_name": name, "role": User.Role.DRIVER},
            )
            if created:
                driver.set_password("driver12345")
                driver.save()
            drivers.append(driver)
            self._report("Conductor", username, "driver12345", created)

        vehicle, created = Vehicle.objects.get_or_create(
            plate="NX-001",
            defaults={
                "model": "Furgón mediano",
                "vehicle_type": Vehicle.VehicleType.VAN,
                "capacity_kg": 800,
                "driver": drivers[0],
            },
        )
        status = "creado" if created else "ya existía"
        self.stdout.write(f"  Vehículo: {vehicle.plate} ({status})")

        created_count = 0
        for client_name, destination_address, lat, lng in DELIVERIES:
            package, was_created = Package.objects.get_or_create(
                client_name=client_name,
                destination_address=destination_address,
                defaults={
                    "origin_address": DEPOT[0],
                    "origin_lat": DEPOT[1],
                    "origin_lng": DEPOT[2],
                    "destination_lat": lat,
                    "destination_lng": lng,
                    "weight_kg": 10,
                },
            )
            if was_created:
                Delivery.objects.create(package=package)
                created_count += 1
        self.stdout.write(f"  Entregas: {created_count} nuevas (de {len(DELIVERIES)} totales)")

        self.stdout.write(self.style.SUCCESS("\nListo. Iniciá sesión en http://localhost:5173"))

    def _report(self, label, username, password, created):
        status = "creado" if created else "ya existía"
        self.stdout.write(f"  {label}: {username} / {password} ({status})")
