#!/usr/bin/env python

# Akvo RSR is covered by the GNU Affero General Public License.
# See more details in the license.txt file located at the root folder of the Akvo RSR module.
# For additional details on the GNU license please see < http://www.gnu.org/licenses/agpl.html >.

import nose

from seleniumextensions import SeleniumTestCase
from test_settings import *

from helpers.navigation import *

class RSRUserRegistrationTest(SeleniumTestCase):

    def setUp(self):
        SeleniumTestCase.setUp(self)
        self.navigator = SeleniumNavigator(self.selenium)
        self.rsr = RSRNavigator(self.selenium)

    def test_01_home_page_has_sign_in_link(self):
        """>>  1. Home page has Sign In link"""
        self.rsr.open_home_page()
        self.assert_title_is(ORGANISATION_NAME)
        self.assert_link_exists("Sign In")

    def test_02_sign_in_link_loads_sign_in_or_register_page(self):
        """>>  2. Sign In link loads sign-in-or-register page"""
        self.open_sign_in_or_register_page()
        self.assert_page_contains_text_items(["I have an online account",
                                              "Enter username",
                                              "Enter password",
                                              "I forgot my username and/or password",
                                              "I don't have an online account",
                                              "Register and you'll be able to",
                                              "Create updates on your organisation's projects",
                                              "Leave comments on projects",
                                              "Get Started now"])
        self.assert_link_exists("Register")
        self.assert_link_exists("I forgot my username and/or password")

    def test_03_register_link_loads_organisation_selection_page(self):
        """>>  3. Register link loads organisation selection page"""
        self.open_organisation_selection_page_for_user_registration()
        self.assert_page_contains_text_items(["Set up your account - Step 1",
                                            "Select the organisation that you belong to"])
        self.assert_link_exists("Cancel")
        self.assert_submit_button_with_text_exists("Continue")

    def test_04_cancel_link_on_organisation_selection_page_takes_user_back_to_home_page(self):
        """>>  4. Cancel link on organisation selection page takes user back to home page"""
        self.open_organisation_selection_page_for_user_registration()
        self.navigator.click_link("Cancel")
        self.verify_home_page_has_loaded()

    def test_05_organisation_selection_page_warns_if_organisation_is_not_selected(self):
        """>>  5. Organisation selection page warns if organisation is not selected"""
        self.open_organisation_selection_page_for_user_registration()
        self.navigator.click_submit_button_with_text("Continue")

        try:
            self.assert_title_is(ORGANISATION_NAME)
            self.assert_page_contains_text_items(["Set up your account - Step 1",
                                                  "Select the organisation that you belong to",
                                                  "This field is required"])
        except AssertionError, error:
            self.fail("Expected warning if organisation was not selected: %s" % (error))

    def test_06_can_select_organisation_and_load_user_details_entry_page(self):
        """>>  6. Can select organisation and load user details entry page"""
        self.select_organisation_and_open_user_details_entry_page()
        self.assert_page_contains_text_items(["Set up your account - Step 2",
                                              "Enter a username",
                                              "Enter your first and last name",
                                              "Enter a password",
                                              "Enter your email address"])
        self.assert_link_exists("Cancel")
        self.assert_submit_button_with_text_exists("Continue")

    def test_07_cancel_link_on_user_details_entry_page_takes_user_back_to_home_page(self):
        """>>  7. Cancel link on user details entry page takes user back to home page"""
        self.select_organisation_and_open_user_details_entry_page()
        self.navigator.click_link("Cancel")
        self.verify_home_page_has_loaded()

    def open_sign_in_or_register_page(self):
        self.rsr.open_home_page()
        self.assert_title_is(ORGANISATION_NAME)
        self.assert_link_exists("Sign In")
        self.navigator.click_link("Sign In")
        self.assert_title_is(ORGANISATION_NAME)
        self.assert_location_contains("rsr/signin/?next=/")

    def open_organisation_selection_page_for_user_registration(self):
        self.open_sign_in_or_register_page()
        self.assert_link_exists("Register")
        self.navigator.click_link("Register")
        self.assert_title_is(ORGANISATION_NAME)
        self.assert_location_contains("rsr/accounts/register1")

    def select_organisation_and_open_user_details_entry_page(self):
        self.open_organisation_selection_page_for_user_registration()
        self.selenium.select("id_organisation", "label=Administrators")
        self.assert_submit_button_with_text_exists("Continue")
        self.navigator.click_submit_button_with_text("Continue")
        self.assert_title_is(ORGANISATION_NAME)
        self.assert_location_contains("rsr/accounts/register2/?org_id=")

    def verify_home_page_has_loaded(self):
        self.assert_title_is(ORGANISATION_NAME)
        self.assert_page_contains_text_items(["Focus Areas", "Get Solutions", "Education",
                                              "Directory", "News", "About", "Recent contributions"])

if __name__ == "__main__":
    print "Running tests on: %s" % (SITE_UNDER_TEST)
    print "RSR user registration test:"
    suite = nose.loader.TestLoader().loadTestsFromTestCase(RSRUserRegistrationTest)
    nose.core.TextTestRunner(verbosity=2).run(suite)
