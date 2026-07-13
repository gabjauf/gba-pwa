Feature: On-screen controls drive the emulator core

  Background:
    Given the core is ready
    And a ROM "test.gba" is running
    And I am recording button presses

  Scenario Outline: A D-pad direction presses then releases the matching button
    When I press the D-pad towards "<direction>"
    Then the core receives a "<button>" press and release

    Examples:
      | direction | button |
      | right     | right  |
      | left      | left   |
      | up        | up     |
      | down      | down   |

  Scenario Outline: Each labelled button reaches the core
    When I press the "<label>" button
    Then the core receives a "<button>" press and release

    Examples:
      | label  | button |
      | A      | a      |
      | B      | b      |
      | L      | l      |
      | R      | r      |
      | Select | select |
      | Start  | start  |

  Scenario: In landscape the clusters sit in opposite bottom corners
    Given the screen is landscape 844 by 390
    Then the D-pad sits in the bottom-left
    And the action buttons sit in the bottom-right
    And the control clusters do not overlap
