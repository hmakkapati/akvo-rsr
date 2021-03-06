# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations

def remove_unused_keys(apps, schema_editor):
    Keyword = apps.get_model('rsr', 'Keyword')
    Project = apps.get_model('rsr', 'Project')
    print

    for keyword in Keyword.objects.all():
        projects = Project.objects.filter(keywords__exact=keyword)
        if not projects:
            print "Deleting keyword {}".format(keyword.label)
            keyword.delete()

    print "Keyword distribution after migration:"
    for keyword in Keyword.objects.all():
        projects = Project.objects.filter(keywords__exact=keyword)
        print keyword.label, projects.count()

class Migration(migrations.Migration):

    dependencies = [
        ('rsr', '0026_auto_20150819_1149'),
    ]

    operations = [
        migrations.RunPython(
            remove_unused_keys
        ),
    ]
