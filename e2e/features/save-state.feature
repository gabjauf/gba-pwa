Feature: Saving and listing save states

  Background:
    Given the core is ready
    And a ROM "test.gba" is running

  Scenario: Saving a state fills a save slot
    Given no save slots are filled
    When I activate the "Save state" control
    Then a save slot is filled
