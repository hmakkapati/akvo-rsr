# -*- coding: utf-8 -*-

# Akvo RSR is covered by the GNU Affero General Public License.
# See more details in the license.txt file located at the root folder of the Akvo RSR module.
# For additional details on the GNU license please see < http://www.gnu.org/licenses/agpl.html >.

from ....rsr.models.iati_import_log import IatiImportLog
from ..utils import add_log, get_text

from django.db.models import get_model

CODE_TO_STATUS = {
    '1': 'H',
    '2': 'A',
    '3': 'C',
    '4': 'C',
    '5': 'L',
    '6': 'R'
}


def language(iati_import, activity, project, activities_globals):
    """
    Retrieve and store the language.
    The language will be extracted from the 'lang' attribute of the activity root element.

    :param iati_import: IatiImport instance
    :param activity: ElementTree; contains all data for the activity
    :param project: Project instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    xml_ns = 'http://www.w3.org/XML/1998/namespace'
    default_language_value = ''

    if '{%s}lang' % xml_ns in activity.attrib.keys():
        if not len(activity.attrib['{%s}lang' % xml_ns]) > 2:
            default_language_value = activity.attrib['{%s}lang' % xml_ns].lower()
        else:
            add_log(iati_import, 'language', 'code too long (2 characters allowed)', project)

    if project.language != default_language_value:
        project.language = default_language_value
        project.save(update_fields=['language'])
        return ['language']

    return []


def currency(iati_import, activity, project, activities_globals):
    """
    Retrieve and store the currency.
    The currency will be extracted from the 'default-currency' attribute of the activity root
    element.

    :param iati_import: IatiImport instance
    :param activity: ElementTree; contains all data for the activity
    :param project: Project instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    default_currency_value = 'EUR'

    if 'default-currency' in activity.attrib.keys():
        if not len(activity.attrib['default-currency']) > 3:
            default_currency_value = activity.attrib['default-currency']
        else:
            add_log(iati_import, 'currency', 'code too long (3 characters allowed)', project)

    if project.currency != default_currency_value:
        project.currency = default_currency_value
        project.save(update_fields=['currency'])
        return ['currency']

    return []


def hierarchy(iati_import, activity, project, activities_globals):
    """
    Retrieve and store the hierarchy.
    The hierarchy will be extracted from the 'hierarchy' attribute of the activity root element.

    :param iati_import: IatiImport instance
    :param activity: ElementTree; contains all data for the activity
    :param project: Project instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    hierarchy_value = None

    try:
        if 'hierarchy' in activity.attrib.keys():
            if not len(activity.attrib['hierarchy']) > 1:
                hierarchy_value = int(activity.attrib['hierarchy'])
            else:
                add_log(iati_import, 'hierarchy', 'code too long (1 character allowed)', project)
    except ValueError as e:
        add_log(iati_import, 'hierarchy', str(e), project)

    if project.hierarchy != hierarchy_value:
        project.hierarchy = hierarchy_value
        project.save(update_fields=['hierarchy'])
        return ['hierarchy']

    return []


def scope(iati_import, activity, project, activities_globals):
    """
    Retrieve and store the activity scope.
    The scope will be extracted from the 'code' attribute of the 'activity-scope' element.

    :param iati_import: IatiImport instance
    :param activity: ElementTree; contains all data for the activity
    :param project: Project instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    scope_value = ''

    scope_element = activity.find("activity-scope")
    if not scope_element is None and 'code' in scope_element.attrib.keys():
        if not len(scope_element.attrib['code']) > 2:
            scope_value = scope_element.attrib['code']
        else:
            add_log(iati_import, 'scope', 'code too long (2 characters allowed)', project)

    if project.project_scope != scope_value:
        project.project_scope = scope_value
        project.save(update_fields=['project_scope'])
        return ['project_scope']

    return []


def collaboration_type(iati_import, activity, project, activities_globals):
    """
    Retrieve and store the collaboration type.
    The collaboration type will be extracted from the 'code' attribute of the
    'collaboration-type' element.

    :param iati_import: IatiImport instance
    :param activity: ElementTree; contains all data for the activity
    :param project: Project instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    ct_value = ''

    ct_element = activity.find("collaboration-type")
    if not ct_element is None and 'code' in ct_element.attrib.keys():
        if not len(ct_element.attrib['code']) > 1:
            ct_value = ct_element.attrib['code']
        else:
            add_log(iati_import, 'collaboration_type', 'code too long (1 characters allowed)',
                    project)

    if project.collaboration_type != ct_value:
        project.collaboration_type = ct_value
        project.save(update_fields=['collaboration_type'])
        return ['collaboration_type']

    return []


def default_flow_type(iati_import, activity, project, activities_globals):
    """
    Retrieve and store the default flow type.
    The flow type will be extracted from the 'code' attribute of the 'default-flow-type' element.

    :param iati_import: IatiImport instance
    :param activity: ElementTree; contains all data for the activity
    :param project: Project instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    dft_value = ''

    dft_element = activity.find("default-flow-type")
    if not dft_element is None and 'code' in dft_element.attrib.keys():
        if not len(dft_element.attrib['code']) > 2:
            dft_value = dft_element.attrib['code']
        else:
            add_log(iati_import, 'default_flow_type', 'code too long (2 characters allowed)',
                    project)

    if project.default_flow_type != dft_value:
        project.default_flow_type = dft_value
        project.save(update_fields=['default_flow_type'])
        return ['default_flow_type']

    return []


def default_finance_type(iati_import, activity, project, activities_globals):
    """
    Retrieve and store the default finance type.
    The finance type will be extracted from the 'code' attribute of the 'default-finance-type'
    element.

    :param iati_import: IatiImport instance
    :param activity: ElementTree; contains all data for the activity
    :param project: Project instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    dft_value = ''

    dft_element = activity.find("default-finance-type")
    if not dft_element is None and 'code' in dft_element.attrib.keys():
        if not len(dft_element.attrib['code']) > 3:
            dft_value = dft_element.attrib['code']
        else:
            add_log(iati_import, 'default_finance_type', 'code too long (3 characters allowed)',
                    project)

    if project.default_finance_type != dft_value:
        project.default_finance_type = dft_value
        project.save(update_fields=['default_finance_type'])
        return ['default_finance_type']

    return []


def default_aid_type(iati_import, activity, project, activities_globals):
    """
    Retrieve and store the default aid type.
    The aid type will be extracted from the 'code' attribute of the 'default-aid-type' element.

    :param iati_import: IatiImport instance
    :param activity: ElementTree; contains all data for the activity
    :param project: Project instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    dat_value = ''

    dat_element = activity.find("default-aid-type")
    if not dat_element is None and 'code' in dat_element.attrib.keys():
        if not len(dat_element.attrib['code']) > 3:
            dat_value = dat_element.attrib['code']
        else:
            add_log(iati_import, 'default_aid_type', 'code too long (3 characters allowed)',
                    project)

    if project.default_aid_type != dat_value:
        project.default_aid_type = dat_value
        project.save(update_fields=['default_aid_type'])
        return ['default_aid_type']

    return []


def default_tied_status(iati_import, activity, project, activities_globals):
    """
    Retrieve and store the default tied status.
    The tied status will be extracted from the 'code' attribute of the 'default-tied-status'
    element.

    :param iati_import: IatiImport instance
    :param activity: ElementTree; contains all data for the activity
    :param project: Project instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    dts_value = ''

    dts_element = activity.find("default-tied-status")
    if not dts_element is None and 'code' in dts_element.attrib.keys():
        if not len(dts_element.attrib['code']) > 1:
            dts_value = dts_element.attrib['code']
        else:
            add_log(iati_import, 'default_tied_status', 'code too long (1 character allowed)',
                    project)

    if project.default_tied_status != dts_value:
        project.default_tied_status = dts_value
        project.save(update_fields=['default_tied_status'])
        return ['default_tied_status']

    return []


def status(iati_import, activity, project, activities_globals):
    """
    Retrieve and store the status.
    The title will be extracted from the 'code' attribute of the 'activity-status' element.

    :param iati_import: IatiImport instance
    :param activity: ElementTree; contains all data for the activity
    :param project: Project instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    project_status = 'N'

    activity_status = activity.find('activity-status')
    if activity_status is not None and 'code' in activity_status.attrib.keys():
        if not len(activity_status.attrib['code']) > 1:
            code = activity_status.attrib['code']
            if code in CODE_TO_STATUS.keys():
                project_status = CODE_TO_STATUS[code]
            else:
                add_log(iati_import, 'status', 'invalid status code', project)
        else:
            add_log(iati_import, 'status', 'status is too long (1 character allowed)', project)

    if project.status != project_status:
        project.status = project_status
        project.save(update_fields=['status'])
        return ['status']

    return []


def conditions(iati_import, activity, project, activities_globals):
    """
    Retrieve and store the conditions.
    The conditions will be extracted from the 'conditions' elements in the 'conditions' element.

    :param iati_import: IatiImport instance
    :param activity: ElementTree; contains all data of the activity
    :param project: Project instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    imported_conditions = []
    changes = []

    conditions_element = activity.find('conditions')

    if not conditions_element is None and 'attached' in conditions_element.attrib.keys() and \
            conditions_element.attrib['attached'] == '1':
        for condition in conditions_element.findall('condition'):
            condition_type = ''

            if 'type' in condition.attrib.keys():
                if not len(condition.attrib['type']) > 1:
                    condition_type = condition.attrib['type']
                else:
                    add_log(iati_import, 'condition',
                            'condition type is too long (1 character allowed)', project)

            condition_text = get_text(condition, activities_globals['version'])
            if len(condition_text) > 100:
                add_log(iati_import, 'condition', 'condition is too long (100 character allowed)',
                        project, IatiImportLog.VALUE_PARTLY_SAVED)
                condition_text = condition_text[:100]

            cond, created = get_model('rsr', 'projectcondition').objects.get_or_create(
                project=project,
                type=condition_type,
                text=condition_text
            )

            if created:
                changes.append(u'added condition (id: %s): %s' % (str(cond.pk), cond))

            imported_conditions.append(cond)

    for condition in project.conditions.all():
        if not condition in imported_conditions:
            changes.append(u'deleted condition (id: %s): %s' %
                           (str(condition.pk),
                            condition.__unicode__()))
            condition.delete()

    return changes
