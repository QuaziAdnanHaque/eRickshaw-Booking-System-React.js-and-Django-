from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('booking', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='ride',
            name='route_geometry',
            field=models.JSONField(blank=True, null=True),
        ),
    ]
