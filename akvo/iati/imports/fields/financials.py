# -*- coding: utf-8 -*-

# Akvo RSR is covered by the GNU Affero General Public License.
# See more details in the license.txt file located at the root folder of the Akvo RSR module.
# For additional details on the GNU license please see < http://www.gnu.org/licenses/agpl.html >.

from ....rsr.models.iati_import_log import IatiImportLog
from ..utils import add_log, get_or_create_organisation, get_text

from decimal import Decimal, InvalidOperation
from datetime import datetime

from django.conf import settings
from django.db.models import get_model, ObjectDoesNotExist

TYPE_TO_CODE = {
    'C': '2',
    'D': '3',
    'E': '4',
    'IF': '1',
    'IR': '5',
    'LR': '6',
    'R': '7',
    'QP': '8',
    'QS': '9',
    'CG': '10'
}


def transactions(iati_import, activity, project, activities_globals):
    """
    Retrieve and store the transactions.
    The transactions will be extracted from the 'transaction' elements.

    :param iati_import: IatiImport instance
    :param activity: ElementTree; contains all data of the activity
    :param project: Project instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    imported_transactions = []
    changes = []

    for transaction in activity.findall('transaction'):
        transaction_ref = ''
        transaction_type = ''
        transaction_date = None
        transaction_value = None
        transaction_value_date = None
        transaction_currency = ''
        transaction_description = ''
        transaction_provider_org = None
        transaction_provider_activity_id = ''
        transaction_receiver_org = None
        transaction_receiver_activity_id = ''
        transaction_disbursement = ''
        transaction_flow = ''
        transaction_finance = ''
        transaction_aid = ''
        transaction_tied_status = ''
        transaction_country = ''
        transaction_region = ''
        transaction_region_vocabulary = ''

        if 'ref' in transaction.attrib.keys():
            if not len(transaction.attrib['ref']) > 25:
                transaction_ref = transaction.attrib['ref']
            else:
                add_log(iati_import, 'transaction_ref', 'ref too long (25 characters allowed)',
                        project)

        trans_type_element = transaction.find('transaction-type')
        if not trans_type_element is None and 'code' in trans_type_element.attrib.keys():
            if not len(trans_type_element.attrib['code']) > 2:
                transaction_type = trans_type_element.attrib['code'].upper()
                if transaction_type in TYPE_TO_CODE.keys():
                    transaction_type = TYPE_TO_CODE[transaction_type]
            else:
                add_log(iati_import, 'transaction_type', 'type too long (2 characters allowed)',
                        project)

        trans_date_element = transaction.find('transaction-date')
        if not trans_date_element is None and 'iso-date' in trans_date_element.attrib.keys():
            trans_date_text = trans_date_element.attrib['iso-date']
            try:
                transaction_date = datetime.strptime(trans_date_text, '%Y-%m-%d').date()
            except ValueError as e:
                add_log(iati_import, 'transaction_date', str(e), project)

        value_element = transaction.find('value')
        if not value_element is None:
            try:
                if value_element.text:
                    if not len(value_element.text) > 14:
                        transaction_value = Decimal(value_element.text)
                    else:
                        add_log(iati_import, 'transaction_value',
                                'value too big (14 characters allowed)', project)
            except InvalidOperation as e:
                add_log(iati_import, 'transaction_value', str(e), project)

            if 'value-date' in value_element.attrib.keys():
                value_date_text = value_element.attrib['value-date']
                try:
                    transaction_value_date = datetime.strptime(value_date_text, '%Y-%m-%d').date()
                except ValueError as e:
                    add_log(iati_import, 'transaction_value_date', str(e), project)

            if 'currency' in value_element.attrib.keys():
                if not len(value_element.attrib['currency']) > 3:
                    transaction_currency = value_element.attrib['currency'].upper()
                else:
                    add_log(iati_import, 'transaction_currency',
                            'currency too long (3 characters allowed)', project)

        description_element = transaction.find('description')
        if not description_element is None:
            transaction_description = get_text(description_element, activities_globals['version'])
            if len(transaction_description) > 255:
                add_log(iati_import, 'transaction_description',
                        'description too long (255 characters allowed)', project,
                        IatiImportLog.VALUE_PARTLY_SAVED)
                transaction_description = transaction_description[:255]

        prov_org_element = transaction.find('provider-org')
        if not prov_org_element is None:
            transaction_provider_org = get_or_create_organisation(
                prov_org_element.attrib['ref'] if 'ref' in prov_org_element.attrib.keys() else '',
                get_text(prov_org_element, activities_globals['version'])
            )

            if 'provider-activity-id' in prov_org_element.attrib.keys():
                if not len(prov_org_element.attrib['provider-activity-id']) > 50:
                    transaction_provider_activity_id = \
                        prov_org_element.attrib['provider-activity-id']
                else:
                    add_log(iati_import, 'transaction_provider_activity_id',
                            'activity id too long (50 characters allowed)', project)

        rec_org_element = transaction.find('receiver-org')
        if not rec_org_element is None:
            transaction_receiver_org = get_or_create_organisation(
                rec_org_element.attrib['ref'] if 'ref' in rec_org_element.attrib.keys() else '',
                get_text(rec_org_element, activities_globals['version'])
            )

            if 'receiver-activity-id' in rec_org_element.attrib.keys():
                if not len(rec_org_element.attrib['receiver-activity-id']) > 50:
                    transaction_receiver_activity_id = \
                        rec_org_element.attrib['receiver-activity-id']
                else:
                    add_log(iati_import, 'transaction_receiver_activity_id',
                            'activity id too long (50 characters allowed)', project)

        disbursement_element = transaction.find('disbursement-channel')
        if not disbursement_element is None and 'code' in disbursement_element.attrib.keys():
            if not len(disbursement_element.attrib['code']) > 1:
                transaction_disbursement = disbursement_element.attrib['code']
            else:
                add_log(iati_import, 'transaction_disbursement_channel',
                        'code too long (1 character allowed)', project)

        flow_element = transaction.find('flow-type')
        if not flow_element is None and 'code' in flow_element.attrib.keys():
            if not len(flow_element.attrib['code']) > 2:
                transaction_flow = flow_element.attrib['code']
            else:
                add_log(iati_import, 'transaction_flow_type',
                        'code too long (2 characters allowed)', project)

        finance_element = transaction.find('finance-type')
        if not finance_element is None and 'code' in finance_element.attrib.keys():
            if not len(finance_element.attrib['code']) > 3:
                transaction_finance = finance_element.attrib['code']
            else:
                add_log(iati_import, 'transaction_finance_type',
                        'code too long (3 character allowed)', project)

        aid_element = transaction.find('aid-type')
        if not aid_element is None and 'code' in aid_element.attrib.keys():
            if not len(aid_element.attrib['code']) > 3:
                transaction_aid = aid_element.attrib['code']
            else:
                add_log(iati_import, 'transaction_aid_type',
                        'code too long (3 characters allowed)', project)

        tied_status_element = transaction.find('tied-status')
        if not tied_status_element is None and 'code' in tied_status_element.attrib.keys():
            if not len(tied_status_element.attrib['code']) > 1:
                transaction_tied_status = tied_status_element.attrib['code']
            else:
                add_log(iati_import, 'transaction_tied_status',
                        'code too long (1 character allowed)', project)

        country_element = transaction.find('recipient-country')
        if not country_element is None and 'code' in country_element.attrib.keys():
            if not len(country_element.attrib['code']) > 2:
                transaction_country = country_element.attrib['code'].upper()
            else:
                add_log(iati_import, 'transaction_recipient_country',
                        'code too long (2 characters allowed)', project)

        region_element = transaction.find('recipient-region')
        if not region_element is None and 'code' in region_element.attrib.keys():
            if not len(region_element.attrib['code']) > 3:
                transaction_region = region_element.attrib['code']
            else:
                add_log(iati_import, 'transaction_recipient_region',
                        'code too long (3 characters allowed)', project)

            if 'vocabulary' in region_element.attrib.keys():
                if not len(region_element.attrib['vocabulary']) > 1:
                    transaction_region_vocabulary = region_element.attrib['vocabulary']
                else:
                    add_log(iati_import, 'transaction_recipient_region_vocabulary',
                            'vocabulary too long (1 character allowed)', project)

        trans, created = get_model('rsr', 'transaction').objects.get_or_create(
            project=project,
            reference=transaction_ref,
            aid_type=transaction_aid,
            description=transaction_description,
            disbursement_channel=transaction_disbursement,
            finance_type=transaction_finance,
            flow_type=transaction_flow,
            tied_status=transaction_tied_status,
            transaction_date=transaction_date,
            transaction_type=transaction_type,
            value=transaction_value,
            value_date=transaction_value_date,
            currency=transaction_currency,
            provider_organisation=transaction_provider_org,
            provider_organisation_activity=transaction_provider_activity_id,
            receiver_organisation=transaction_receiver_org,
            receiver_organisation_activity=transaction_receiver_activity_id,
            recipient_country=transaction_country,
            recipient_region=transaction_region,
            recipient_region_vocabulary=transaction_region_vocabulary
        )

        # Disregard double transactions
        if not trans in imported_transactions:
            if created:
                changes.append(u'added transaction (id: %s): %s' % (str(trans.pk), trans))

            imported_transactions.append(trans)

            # Process transaction sectors
            for sector_change in transaction_sectors(iati_import, transaction, trans,
                                                     activities_globals):
                changes.append(sector_change)

    for transaction in project.transactions.all():
        if not transaction in imported_transactions:
            changes.append(u'deleted transaction (id: %s): %s' %
                           (str(transaction.pk),
                            transaction.__unicode__()))
            transaction.delete()

    return changes


def transaction_sectors(iati_import, transaction_element, transaction, activities_globals):
    """
    Retrieve and store the transaction sectors.
    The transaction sectors will be extracted from the 'sector' elements within a 'transaction'
    element.

    :param iati_import: IatiImport instance
    :param transaction_element: ElementTree; contains all data of the transaction
    :param transaction: Transaction instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    imported_sectors = []
    changes = []

    for sector in transaction_element.findall('sector'):
        sector_code = ''
        sector_vocabulary = ''

        if 'code' in sector.attrib.keys():
            if not len(sector.attrib['code']) > 5:
                sector_code = sector.attrib['code']
            else:
                add_log(iati_import, 'transaction_sector_code',
                        'code too long (5 characters allowed)', transaction.project)

        if 'vocabulary' in sector.attrib.keys():
            if not len(sector.attrib['vocabulary']) > 5:
                sector_vocabulary = sector.attrib['vocabulary']
            else:
                add_log(iati_import, 'transaction_sector_vocabulary',
                        'vocabulary too long (5 characters allowed)', transaction.project)

        sector_description = get_text(sector, activities_globals['version'])
        if len(sector_description) > 100:
            add_log(iati_import, 'transaction_sector_description',
                    'description too long (100 characters allowed)', transaction.project,
                    IatiImportLog.VALUE_PARTLY_SAVED)
            sector_description = sector_description[:100]

        sec, created = get_model('rsr', 'transactionsector').objects.get_or_create(
            transaction=transaction,
            code=sector_code,
            text=sector_description,
            vocabulary=sector_vocabulary
        )

        if created:
            changes.append(u'added transaction sector (id: %s): %s' % (str(sec.pk), sec))

        imported_sectors.append(sec)

    for sector in transaction.sectors.all():
        if not sector in imported_sectors:
            changes.append(u'deleted transaction sector (id: %s): %s' %
                           (str(sector.pk),
                            sector.__unicode__()))
            sector.delete()

    return changes


def budget_items(iati_import, activity, project, activities_globals):
    """
    Retrieve and store the budget items.
    The budget items will be extracted from the 'budget' elements. Since there is no place to
    indicate the budget item label in IATI, we set it to the 'Total' label if there is only one
    budget item (per type, e.g. if there's one original and one revised budget item, both will be
    set to 'Total'). In all other cases, the budget item label will be set to 'Other'.

    :param iati_import: IatiImport instance
    :param activity: ElementTree; contains all data of the activity
    :param project: Project instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    imported_budgets = []
    changes = []

    all_budget_count = len(activity.findall("budget"))
    original_budgets_count = len(activity.findall("budget[@type='1']"))
    revised_budgets_count = len(activity.findall("budget[@type='2']"))

    for budget in activity.findall('budget'):
        budget_type = ''
        period_start = None
        period_end = None
        value = None
        value_date = None
        currency = ''
        label = get_model('rsr', 'budgetitemlabel').objects.get(label='Other')
        other_extra = 'Other'

        if 'type' in budget.attrib.keys() and len(budget.attrib['type']) < 2:
            budget_type = budget.attrib['type']
            if (budget_type == '1' and original_budgets_count == 1) or \
                    (budget_type == '2' and revised_budgets_count == 1) or all_budget_count == 1:
                label = get_model('rsr', 'budgetitemlabel').objects.get(label='Total')
                other_extra = ''

        if '{%s}type' % settings.AKVO_NS in budget.attrib.keys() or \
                '{%s}label' % settings.AKVO_NS in budget.attrib.keys():
            if '{%s}type' % settings.AKVO_NS in budget.attrib.keys():
                try:
                    label = get_model('rsr', 'budgetitemlabel').objects.get(
                        pk=int(budget.attrib['{%s}type' % settings.AKVO_NS])
                    )
                except (ValueError, ObjectDoesNotExist) as e:
                    add_log(iati_import, 'budget_item_label', str(e), project,
                            IatiImportLog.VALUE_PARTLY_SAVED)

            if '{%s}label' % settings.AKVO_NS in budget.attrib.keys():
                other_extra = budget.attrib['{%s}label' % settings.AKVO_NS]
                if len(other_extra) > 30:
                    add_log(iati_import, 'budget_item_label',
                            'label too long (30 characters allowed)', project,
                            IatiImportLog.VALUE_PARTLY_SAVED)
                    other_extra = other_extra[:30]

        period_start_element = budget.find('period-start')
        if not period_start_element is None and 'iso-date' in period_start_element.attrib.keys():
            period_start_text = period_start_element.attrib['iso-date']
            try:
                period_start = datetime.strptime(period_start_text, '%Y-%m-%d').date()
                if other_extra == 'Other':
                    other_extra = str(period_start.year)
            except ValueError as e:
                add_log(iati_import, 'budget_item_period_start', str(e), project)

        period_end_element = budget.find('period-end')
        if not period_end_element is None and 'iso-date' in period_end_element.attrib.keys():
            period_end_text = period_end_element.attrib['iso-date']
            try:
                period_end = datetime.strptime(period_end_text, '%Y-%m-%d').date()
            except ValueError as e:
                add_log(iati_import, 'budget_item_period_end', str(e), project)

        value_element = budget.find('value')
        if not value_element is None:
            try:
                if value_element.text:
                    if not len(value_element.text) > 14:
                        value = Decimal(value_element.text)
                    else:
                        add_log(iati_import, 'budget_item_period_start',
                                'value too big (14 characters allowed)', project)
            except InvalidOperation as e:
                add_log(iati_import, 'budget_item_value', str(e), project)

            if 'value-date' in value_element.attrib.keys():
                value_date_text = value_element.attrib['value-date']
                try:
                    value_date = datetime.strptime(value_date_text, '%Y-%m-%d').date()
                except ValueError as e:
                    add_log(iati_import, 'budget_item_value_date', str(e), project)

            if 'currency' in value_element.attrib.keys():
                if not len(value_element.attrib['currency']) > 3:
                    currency = value_element.attrib['currency'].upper()
                else:
                    add_log(iati_import, 'budget_item_currency',
                            'currency too long (3 characters allowed)', project)

        budget, created = get_model('rsr', 'budgetitem').objects.get_or_create(
            project=project,
            type=budget_type,
            period_start=period_start,
            period_end=period_end,
            amount=value,
            value_date=value_date,
            currency=currency,
            label=label,
            other_extra=other_extra
        )

        if created:
            changes.append(u'added budget item (id: %s): %s' % (str(budget.pk), budget))

        imported_budgets.append(budget)

    for budget_item in project.budget_items.all():
        if not budget_item in imported_budgets:
            changes.append(u'deleted budget item (id: %s): %s' %
                           (str(budget_item.pk),
                            budget_item.__unicode__()))
            budget_item.delete()

    return changes


def country_budget_items(iati_import, activity, project, activities_globals):
    """
    Retrieve and store the country budget items.
    The country budget items will be extracted from the 'country-budget-items' element.

    :param iati_import: IatiImport instance
    :param activity: ElementTree; contains all data of the activity
    :param project: Project instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    imported_cbis = []
    changes = []

    country_budget_vocabulary = ''

    cbis_element = activity.find('country-budget-items')
    if not cbis_element is None:
        if 'vocabulary' in cbis_element.attrib.keys():
            if not len(cbis_element['vocabulary']) > 1:
                country_budget_vocabulary = cbis_element.attrib['vocabulary']
            else:
                add_log(iati_import, 'country_budget_vocabulary',
                        'vocabulary is too long (1 characters allowed)', project)

        for cbi_element in cbis_element.findall('budget-item'):
            code_text = ''
            description_text = ''
            percentage = None

            if 'code' in cbi_element.attrib.keys():
                if not len(cbi_element.attrib['code']) > 6:
                    code_text = cbi_element.attrib['code']
                else:
                    add_log(iati_import, 'country_budget_item',
                            'code too long (6 characters allowed)', project)

            description_element = cbi_element.find('description')
            if not description_element is None:
                description_text = get_text(description_element, activities_globals['version'])
                if len(description_text) > 100:
                    add_log(iati_import, 'country_budget_item_description',
                            'description is too long (100 characters allowed)', project,
                            IatiImportLog.VALUE_PARTLY_SAVED)
                    description_text = description_text[:100]

            try:
                if 'percentage' in cbi_element.attrib.keys():
                    percentage = Decimal(cbi_element.attrib['percentage'])
            except InvalidOperation as e:
                add_log(iati_import, 'country_budget_item_percentage', str(e), project)

            cbi, created = get_model('rsr', 'countrybudgetitem').objects.get_or_create(
                project=project,
                code=code_text,
                description=description_text,
                percentage=percentage
            )

            if created:
                changes.append(u'added country budget item (id: %s): %s' % (str(cbi.pk), cbi))

            imported_cbis.append(cbi)

        for cbi in project.country_budget_items.all():
            if not cbi in imported_cbis:
                changes.append(u'deleted country budget item (id: %s): %s' %
                               (str(cbi.pk),
                                cbi.__unicode__()))
                cbi.delete()

    if project.country_budget_vocabulary != country_budget_vocabulary:
        project.country_budget_vocabulary = country_budget_vocabulary
        project.save(update_fields=['country_budget_vocabulary'])
        changes.append('country_budget_vocabulary')

    return changes


def capital_spend(iati_import, activity, project, activities_globals):
    """
    Retrieve and store the capital spend percentage.
    The capital spend percentage will be extracted from the 'capital-spend' element.

    :param iati_import: IatiImport instance
    :param activity: ElementTree; contains all data of the activity
    :param project: Project instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    capital_spend_percentage = None

    try:
        cap_spend_element = activity.find('capital-spend')
        if not cap_spend_element is None and 'percentage' in cap_spend_element.attrib.keys():
            capital_spend_percentage = Decimal(cap_spend_element.attrib['percentage'])
    except InvalidOperation as e:
        add_log(iati_import, 'capital_spend_percentage', str(e), project)

    if project.capital_spend_percentage != capital_spend_percentage:
        project.capital_spend_percentage = capital_spend_percentage
        project.save(update_fields=['capital_spend_percentage'])
        return ['capital_spend_percentage']

    return []


def planned_disbursements(iati_import, activity, project, activities_globals):
    """
    Retrieve and store the planned disbursements.
    The planned disbursements will be extracted from the 'planned-disbursement' elements.

    :param iati_import: IatiImport instance
    :param activity: ElementTree; contains all data of the activity
    :param project: Project instance
    :param activities_globals: Dictionary; contains all global activities information
    :return: List; contains fields that have changed
    """
    imported_pds = []
    changes = []

    for planned_disbursement in activity.findall('planned-disbursement'):
        value = None
        value_date = None
        currency = ''
        updated = None
        period_start = None
        period_end = None
        disbursement_type = ''

        if 'type' in planned_disbursement.attrib.keys():
            if not len(planned_disbursement.attrib['type']) > 1:
                disbursement_type = planned_disbursement.attrib['type']
            else:
                add_log(iati_import, 'planned_disbursement_type',
                        'type is too long (1 character allowed)', project)

        if 'updated' in planned_disbursement.attrib.keys():
            updated_text = planned_disbursement.attrib['updated']
            try:
                updated = datetime.strptime(updated_text, '%Y-%m-%d').date()
            except ValueError as e:
                add_log(iati_import, 'planned_disbursement_updated', str(e), project)

        period_start_element = planned_disbursement.find('period-start')
        if not period_start_element is None and 'iso-date' in period_start_element.attrib.keys():
            period_start_text = period_start_element.attrib['iso-date']
            try:
                period_start = datetime.strptime(period_start_text, '%Y-%m-%d').date()
            except ValueError as e:
                add_log(iati_import, 'planned_disbursement_period_start', str(e), project)

        period_end_element = planned_disbursement.find('period-end')
        if not period_end_element is None and 'iso-date' in period_end_element.attrib.keys():
            period_end_text = period_end_element.attrib['iso-date']
            try:
                period_end = datetime.strptime(period_end_text, '%Y-%m-%d').date()
            except ValueError as e:
                add_log(iati_import, 'planned_disbursement_period_end', str(e), project)

        value_element = planned_disbursement.find('value')
        if not value_element is None:
            try:
                if value_element.text:
                    if not len(value_element.text) > 14:
                        value = Decimal(value_element.text)
                    else:
                        add_log(iati_import, 'planned_disbursement_value',
                                'value too long (14 characters allowed)', project)
            except InvalidOperation as e:
                add_log(iati_import, 'planned_disbursement_value', str(e), project)

            if 'value-date' in value_element.attrib.keys():
                value_date_text = value_element.attrib['value-date']
                try:
                    value_date = datetime.strptime(value_date_text, '%Y-%m-%d').date()
                except ValueError as e:
                    add_log(iati_import, 'planned_disbursement_value_date', str(e), project)

            if 'currency' in value_element.attrib.keys():
                if not len(value_element.attrib['currency']) > 3:
                    currency = value_element.attrib['currency'].upper()
                else:
                    add_log(iati_import, 'planned_disbursement_currency',
                            'currency too long (3 characters allowed)', project)

        pd, created = get_model('rsr', 'planneddisbursement').objects.get_or_create(
            project=project,
            value=value,
            value_date=value_date,
            currency=currency,
            updated=updated,
            period_start=period_start,
            period_end=period_end,
            type=disbursement_type
        )

        if created:
            changes.append(u'added planned disbursement (id: %s): %s' % (str(pd.pk), pd))

        imported_pds.append(pd)

    for planned_disbursement in project.planned_disbursements.all():
        if not planned_disbursement in imported_pds:
            changes.append(u'deleted planned disbursement (id: %s): %s' %
                           (str(planned_disbursement.pk),
                            planned_disbursement.__unicode__()))
            planned_disbursement.delete()

    return changes
