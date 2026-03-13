# Generated migration for Phase 6: Masking & Anonymization Engine

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0004_add_database_connection_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='MaskingJob',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier for the masking job', primary_key=True, serialize=False)),
                ('database_name', models.CharField(blank=True, default='', help_text='Name of the database being processed', max_length=255)),
                ('table_name', models.CharField(blank=True, help_text='Name of the specific table being processed (null = all tables)', max_length=255, null=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('running', 'Running'), ('completed', 'Completed'), ('failed', 'Failed')], default='pending', help_text='Current status of the masking job', max_length=20)),
                ('total_fields', models.IntegerField(default=0, help_text='Total number of PII fields to process')),
                ('processed_fields', models.IntegerField(default=0, help_text='Number of fields processed so far')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='When the job was created')),
                ('started_at', models.DateTimeField(blank=True, help_text='When the job started processing', null=True)),
                ('completed_at', models.DateTimeField(blank=True, help_text='When the job completed', null=True)),
                ('project', models.ForeignKey(help_text='Project this masking job belongs to', on_delete=django.db.models.deletion.CASCADE, related_name='masking_jobs', to='projects.project')),
            ],
            options={
                'verbose_name': 'Masking Job',
                'verbose_name_plural': 'Masking Jobs',
                'db_table': 'masking_jobs',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='MaskingField',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('table_name', models.CharField(help_text='Name of the table containing the field', max_length=255)),
                ('column_name', models.CharField(help_text='Name of the column being masked', max_length=255)),
                ('pii_type', models.CharField(help_text='Type of PII in this field', max_length=50)),
                ('masking_strategy', models.CharField(choices=[('email_mask', 'Email Masking'), ('phone_mask', 'Phone Masking'), ('name_mask', 'Name Masking'), ('address_mask', 'Address Masking'), ('account_mask', 'Account Number Masking'), ('card_mask', 'Credit Card Masking'), ('ssn_mask', 'SSN Masking'), ('aadhaar_mask', 'Aadhaar Masking'), ('pan_mask', 'PAN Card Masking'), ('generic_mask', 'Generic Masking')], default='generic_mask', help_text='Masking strategy applied to this field', max_length=50)),
                ('original_sample', models.TextField(blank=True, default='', help_text='Sample of original data (for preview)')),
                ('masked_sample', models.TextField(blank=True, default='', help_text='Sample of masked data (for preview)')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('processing', 'Processing'), ('completed', 'Completed'), ('failed', 'Failed')], default='pending', help_text='Processing status of this field', max_length=20)),
                ('processed_at', models.DateTimeField(blank=True, help_text='When processing completed', null=True)),
                ('job', models.ForeignKey(help_text='Masking job this field belongs to', on_delete=django.db.models.deletion.CASCADE, related_name='masking_fields', to='projects.maskingjob')),
                ('detected_field', models.ForeignKey(blank=True, help_text='Reference to the detected PII field', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='masking_records', to='projects.detectedpiifield')),
            ],
            options={
                'verbose_name': 'Masking Field',
                'verbose_name_plural': 'Masking Fields',
                'db_table': 'masking_fields',
                'ordering': ['id'],
            },
        ),
        migrations.CreateModel(
            name='MaskingLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('step', models.CharField(choices=[('analysis', 'Analysis'), ('strategy_selection', 'Strategy Selection'), ('masking', 'Masking'), ('validation', 'Validation'), ('completed', 'Completed')], help_text='Current processing step', max_length=50)),
                ('message', models.TextField(help_text='Log message')),
                ('level', models.CharField(choices=[('info', 'Info'), ('warning', 'Warning'), ('error', 'Error'), ('success', 'Success')], default='info', help_text='Log level', max_length=20)),
                ('field_name', models.CharField(blank=True, help_text='Name of field being processed (if applicable)', max_length=255, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='When this log entry was created')),
                ('job', models.ForeignKey(help_text='Masking job this log belongs to', on_delete=django.db.models.deletion.CASCADE, related_name='logs', to='projects.maskingjob')),
            ],
            options={
                'verbose_name': 'Masking Log',
                'verbose_name_plural': 'Masking Logs',
                'db_table': 'masking_logs',
                'ordering': ['created_at'],
            },
        ),
    ]
