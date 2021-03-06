# -*- coding: utf-8 -*-

# Akvo RSR is covered by the GNU Affero General Public License.
# See more details in the license.txt file located at the root folder of the Akvo RSR module.
# For additional details on the GNU license please see < http://www.gnu.org/licenses/agpl.html >.


from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import ugettext_lazy as _

from ..fields import ValidXMLCharField


class Partnership(models.Model):
    # the old way
    FIELD_PARTNER = u'field'
    FUNDING_PARTNER = u'funding'
    SPONSOR_PARTNER = u'sponsor'
    SUPPORT_PARTNER = u'support'
    EXTENDING_PARTNER = u'extending'

    PARTNER_TYPE_LIST = [
        FIELD_PARTNER, FUNDING_PARTNER, SPONSOR_PARTNER, SUPPORT_PARTNER, EXTENDING_PARTNER
    ]
    PARTNER_LABELS = [
        _(u'Implementing partner'),
        _(u'Funding partner'),
        _(u'Sponsor partner'),
        _(u'Accountable partner'),
        _(u'Extending partner'),
    ]
    PARTNER_TYPES = zip(PARTNER_TYPE_LIST, PARTNER_LABELS)

    # the new way
    IATI_FUNDING_PARTNER = 1
    IATI_ACCOUNTABLE_PARTNER = 2
    IATI_EXTENDING_PARTNER = 3
    IATI_IMPLEMENTING_PARTNER = 4
    AKVO_SPONSOR_PARTNER = 100   # not part of the IATI OrganisationRole codelist!
    IATI_REPORTING_ORGANISATION = 101

    # make sure the AKVO_SPONSOR_PARTNER is last in the list
    IATI_ROLE_LIST = [
        IATI_FUNDING_PARTNER, IATI_ACCOUNTABLE_PARTNER, IATI_EXTENDING_PARTNER,
        IATI_IMPLEMENTING_PARTNER, AKVO_SPONSOR_PARTNER, IATI_REPORTING_ORGANISATION
    ]
    IATI_ROLE_LABELS = [
        _(u'Funding partner'),
        _(u'Accountable partner'),
        _(u'Extending partner'),
        _(u'Implementing partner'),
        _(u'Sponsor partner'),
        _(u'Reporting organisation'),
    ]
    IATI_ROLES = zip(IATI_ROLE_LIST, IATI_ROLE_LABELS)

    # used when migrating
    PARTNER_TYPES_TO_ROLES_MAP = {
        FUNDING_PARTNER: IATI_FUNDING_PARTNER,
        SUPPORT_PARTNER: IATI_ACCOUNTABLE_PARTNER,
        FIELD_PARTNER: IATI_IMPLEMENTING_PARTNER,
        SPONSOR_PARTNER: AKVO_SPONSOR_PARTNER,
    }

    # backwards compatibility
    ROLES_TO_PARTNER_TYPES_MAP = {
        IATI_FUNDING_PARTNER: FUNDING_PARTNER,
        IATI_ACCOUNTABLE_PARTNER: SUPPORT_PARTNER,
        IATI_EXTENDING_PARTNER: EXTENDING_PARTNER,
        IATI_IMPLEMENTING_PARTNER: FIELD_PARTNER,
        AKVO_SPONSOR_PARTNER: SPONSOR_PARTNER,
        # TODO: not backwards compatible
        IATI_REPORTING_ORGANISATION: u''
    }

    ALLIANCE_PARTNER = u'alliance'
    KNOWLEDGE_PARTNER = u'knowledge'
    NETWORK_PARTNER = u'network'

    PARTNER_TYPE_EXTRAS_LIST = (ALLIANCE_PARTNER, KNOWLEDGE_PARTNER, NETWORK_PARTNER)
    PARTNER_TYPE_EXTRA_LABELS = (
        _(u'Alliance'),
        _(u'Knowledge'),
        _(u'Network')
    )

    PARTNER_TYPE_EXTRAS = zip(PARTNER_TYPE_EXTRAS_LIST, PARTNER_TYPE_EXTRA_LABELS)

    organisation = models.ForeignKey(
        'Organisation', verbose_name=_(u'organisation'), related_name='partnerships', null=True,
        blank=False, help_text=_(u'Select an organisation that is taking an active role in the '
                                 u'project.')
    )
    project = models.ForeignKey('Project', verbose_name=_(u'project'), related_name='partnerships')
    iati_organisation_role = models.PositiveSmallIntegerField(
        u'Organisation role', choices=IATI_ROLES, db_index=True, null=True)
    # is_secondary_reporter is only used when the iati_organisation_role is set to
    # IATI_REPORTING_ORGANISATION, thus the use of NullBooleanField
    is_secondary_reporter = models.NullBooleanField(
        _(u'secondary reporter'),
        help_text=_(
            u'This indicates whether the reporting organisation is a secondary publisher: '
            u'publishing data for which it is not directly responsible.'
        )
    )
    funding_amount = models.DecimalField(
        _(u'funding amount'), max_digits=14, decimal_places=2, blank=True, null=True, db_index=True,
        help_text=_(u'The funding amount of the partner.<br>'
                    u'Note that it\'s only possible to indicate a funding amount for funding '
                    u'partners.')
    )
    partner_type_extra = ValidXMLCharField(
        _(u'partner type extra'), max_length=30, blank=True, null=True, choices=PARTNER_TYPE_EXTRAS,
        help_text=_(u'RSR specific partner type.')
    )
    iati_activity_id = ValidXMLCharField(
        _(u'IATI activity ID'), max_length=75, blank=True, null=True, db_index=True
    )
    internal_id = ValidXMLCharField(
        _(u'Internal ID'), max_length=75, blank=True, null=True, db_index=True,
        help_text=_(u'This field can be used to indicate an internal identifier that is used by '
                    u'the organisation for this project. (75 characters)')
    )
    iati_url = models.URLField(
        blank=True,
        help_text=_(
            u'Please enter the URL for where the IATI Activity Id Funding details are published. '
            u'For projects directly or indirectly funded by the Dutch Government, this should '
            u'be the OpenAid.nl page. For other projects, an alternative URL can be used.'
        )
    )
    related_activity_id = ValidXMLCharField(
        _(u'related IATI activity ID'), max_length=50, blank=True
    )

    def iati_organisation_role_label(self):
        return dict(self.IATI_ROLES).get(self.iati_organisation_role)

    def iati_role_to_partner_type(self):
        return dict(self.ROLES_TO_PARTNER_TYPES_MAP).get(int(self.iati_organisation_role))

    class Meta:
        app_label = 'rsr'
        verbose_name = _(u'project partner')
        verbose_name_plural = _(u'project partners')
        ordering = ['iati_organisation_role']

    def __unicode__(self):
        if self.organisation:
            if self.organisation.name:
                organisation_unicode = self.organisation.name
            elif self.organisation.long_name:
                organisation_unicode = self.organisation.long_name
            else:
                organisation_unicode = u'%s' % _(u'Organisation name not specified')
        else:
            organisation_unicode = u'%s' % _(u'Organisation not specified')

        if self.iati_organisation_role:
            organisation_unicode += u' ({})'.format(
                unicode(dict(self.IATI_ROLES)[self.iati_organisation_role])
            )
        return organisation_unicode

    def clean(self):
        # Don't allow multiple reporting organisations
        if self.iati_organisation_role == self.IATI_REPORTING_ORGANISATION:
            reporting_orgs = self.project.partnerships.filter(
                iati_organisation_role=self.IATI_REPORTING_ORGANISATION
            )

            if reporting_orgs.count() > 1:
                raise ValidationError(
                    {'iati_organisation_role': u'%s' % _(u'Project can only have one reporting '
                                                         u'organisation')}
                )

    def save(self, *args, **kwargs):
        super(Partnership, self).save(*args, **kwargs)
        self.set_primary_organisation()

    def delete(self, *args, **kwargs):
        super(Partnership, self).delete(*args, **kwargs)
        self.set_primary_organisation()

    def set_primary_organisation(self):
        # Check which organisation should be set to the primary organisation of the project
        # This is done to get better performance on the project list page
        self.project.primary_organisation = self.project.find_primary_organisation()
        self.project.save(update_fields=['primary_organisation'])
