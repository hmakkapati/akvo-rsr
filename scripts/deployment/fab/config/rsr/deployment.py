# -*- coding: utf-8 -*-

# Akvo RSR is covered by the GNU Affero General Public License.
# See more details in the license.txt file located at the root folder of the Akvo RSR module.
# For additional details on the GNU license please see < http://www.gnu.org/licenses/agpl.html >.


import os

from fab.config.rsr.codebase import RSRCodebaseConfig
from fab.config.values import DeploymentHostConfigValues


class RSRDeploymentConfig(object):

    def __init__(self, deployment_user, deployment_host_config_values, codebase_config):
        self.deployment_user = deployment_user

        self.repo_checkout_home = deployment_host_config_values.repo_checkout_home
        self.repo_archives_dir  = os.path.join(self.repo_checkout_home, "archives")

        self.rsr_archive_url            = codebase_config.rsr_archive_url
        self.unpacked_archive_dir_mask  = RSRCodebaseConfig.UNPACKED_RSR_ARCHIVE_DIR_MASK

        self.rsr_deployment_dir_name    = "rsr_%s" % codebase_config.repo_branch_without_type
        self.rsr_deployment_home        = os.path.join(self.repo_checkout_home, self.rsr_deployment_dir_name)

    @staticmethod
    def create_instance(deployment_user):
        return RSRDeploymentConfig(deployment_user, DeploymentHostConfigValues(), RSRCodebaseConfig.create_instance())