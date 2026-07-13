Feature: The mGBA core boots in a cross-origin-isolated context

  Scenario: Opening the app initialises the core
    Given I open the app
    Then the page is cross-origin isolated
    And SharedArrayBuffer is available
    And the app is ready
    And no errors were printed to the console
