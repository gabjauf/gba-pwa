@offline
Feature: The installed PWA works offline

  Background:
    Given I open the built app
    And the service worker is in control

  Scenario: Reloading with no network still boots the core
    When I go offline
    And I reload the app
    Then the page is cross-origin isolated
    And the app is ready
