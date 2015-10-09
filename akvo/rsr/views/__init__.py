# -*- coding: utf-8 -*-

"""Akvo RSR is covered by the GNU Affero General Public License.

See more details in the license.txt file located at the root folder of the Akvo RSR module.
For additional details on the GNU license please see < http://www.gnu.org/licenses/agpl.html >.
"""

from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect

from ..decorators import disallowed_for_akvo_iati


@disallowed_for_akvo_iati
def index(request):
    """The index of RSR."""
    return HttpResponseRedirect(reverse('project-directory'))
