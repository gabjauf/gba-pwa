Feature: Managing the ROM library

  Background:
    Given the core is ready

  Scenario: An empty library prompts me to import a ROM
    Then the library is empty

  Scenario: Importing a ROM launches it into the emulator
    When I import the ROM "test.gba"
    Then the game is running

  Scenario: An imported ROM survives a reload (persisted to IndexedDB)
    Given a ROM "test.gba" is running
    When I reload the app
    Then the library lists "test.gba"
