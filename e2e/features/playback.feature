Feature: Playing and controlling a ROM session

  Background:
    Given the core is ready
    And a ROM "test.gba" is running

  Scenario: Launching a ROM shows the emulator canvas
    Then the game is running

  Scenario: Pausing and resuming the game
    When I activate the "Pause" control
    Then the "Resume" control is shown
    When I activate the "Resume" control
    Then the "Pause" control is shown

  Scenario: Quitting the game returns to the library
    When I activate the "Quit" control
    Then I am back on the home library

  Scenario: Sound resumes after returning from the background
    Given I am recording audio-resume calls
    When the app returns from the background
    Then the emulator audio is resumed
