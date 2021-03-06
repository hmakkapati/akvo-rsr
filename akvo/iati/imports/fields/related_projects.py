# -*- coding: utf-8 -*-

# Akvo RSR is covered by the GNU Affero General Public License.
# See more details in the license.txt file located at the root folder of the Akvo RSR module.
# For additional details on the GNU license please see < http://www.gnu.org/licenses/agpl.html >.

from ..utils import add_log

from django.core.exceptions import ObjectDoesNotExist
from django.db.models import get_model


def related_projects(iati_import, activity, project, activities_globals):
    """
    Retrieve and store the related projects.
    The related projects will be extracted from the 'related-activity' elements.

    :param iati_import: IatiImport instance
    :param activity: ElementTree; contains all data for the activity
    :param project: Project instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    imported_related_projects = []
    changes = []

    for related_project in activity.findall('related-activity'):
        project_reference = ''
        project_type = ''
        related_project_project = None

        if 'ref' in related_project.attrib.keys():
            project_reference = related_project.attrib['ref']

        if 'type' in related_project.attrib.keys():
            if not len(related_project.attrib['type']) > 1:
                project_type = related_project.attrib['type']
            else:
                add_log(iati_import, 'related_project_type',
                        'type is too long (1 character allowed)', project)

        try:
            related_project_project = get_model('rsr', 'project').objects.get(
                iati_activity_id=project_reference
            )
        except ObjectDoesNotExist:
            if related_project_project and len(project_reference) > 100:
                add_log(iati_import, 'related_project_reference',
                        'reference too long (100 characters allowed)', project)
                project_reference = ''

        rp, created = get_model('rsr', 'relatedproject').objects.get_or_create(
            project=project,
            related_project=related_project_project,
            related_iati_id=project_reference[:100] if not related_project_project else '',
            relation=project_type
        )

        if created:
            changes.append(u'added related project (id: %s): %s' % (str(rp.pk), rp))

        imported_related_projects.append(rp)

    for related_project in project.related_projects.all():
        if not related_project in imported_related_projects:
            changes.append(u'deleted related project (id: %s): %s' %
                           (str(related_project.pk),
                            related_project.__unicode__()))
            related_project.delete()

    return changes
