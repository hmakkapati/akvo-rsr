# -*- coding: utf-8 -*-

# Akvo RSR is covered by the GNU Affero General Public License.
# See more details in the license.txt file located at the root folder of the Akvo RSR module.
# For additional details on the GNU license please see < http://www.gnu.org/licenses/agpl.html >.


import imp, os, sys

imp.load_source("syspath", os.path.join(os.path.dirname(__file__), '../verifiers/syspath.py'))

from syspath import SysPathVerifier

SysPathVerifier().exit_if_deployment_scripts_home_not_on_syspath()


# Use "fab --list" to display the list of available tasks

import fab.tasks.codedeployment
import fab.tasks.dataretriever
import fab.tasks.virtualenv