# End-to-end tests & the scenario vocabulary

Our e2e tests are written in **Gherkin** (plain-language `Given/When/Then`), organised in three
layers:

| Layer | Where | What it is |
| --- | --- | --- |
| **Stories** | [`e2e/features/*.feature`](../e2e/features) | Scenarios — the behaviours we guarantee, in plain English. |
| **Vocabulary** | [`e2e/steps/*.steps.ts`](../e2e/steps) | Reusable sentences ("steps"), each defined once, as thin one-liners. |
| **Screens** | [`e2e/screens/*.ts`](../e2e/screens) | Page/screen objects that own the selectors and interactions. |

A scenario composes vocabulary; a step delegates to a screen object. **Selectors live only in
screen objects** — steps never touch the DOM directly.

## Conventions (read before adding a step)

- **Declarative & domain-level.** Say *what* the user achieves (`the game is running`), not *how*
  the DOM does it (`the canvas element is visible`). The exception is the gamepad control steps,
  which are intentionally mechanical because the UI interaction itself is what's under test.
- **Given / When / Then differ by role, not by page:**
  - **Given** = a state/precondition (`a ROM "test.gba" is running`).
  - **When** = the *single* action under test (`I import the ROM "test.gba"`).
  - **Then** = an observable outcome (`the library lists "test.gba"`).
- **One sentence per concept.** Before inventing a phrasing, check the list below (or run
  `npm run test:e2e:steps`) and reuse an existing sentence rather than a synonym.

## The step vocabulary

Generated from the code — **`npm run test:e2e:steps` prints the authoritative list.** Snapshot:

Placeholders: `{string}` is a quoted value (e.g. `"test.gba"`, `"Pause"`); `{int}` is a number.

### Given — set up a situation
- `I open the app`
- `the core is ready`
- `I open the built app`
- `the service worker is in control`
- `a ROM {string} is running`
- `I am recording button presses`
- `the screen is landscape {int} by {int}`
- `no save slots are filled`

### When — do something
- `I import the ROM {string}`
- `I activate the {string} control`
- `I reload the app`
- `I press the D-pad towards {string}`
- `I press the {string} button`
- `I go offline`

### Then — assert the result
- `the page is cross-origin isolated`
- `SharedArrayBuffer is available`
- `the app is ready`
- `no errors were printed to the console`
- `the library is empty`
- `the library lists {string}`
- `the game is running`
- `the {string} control is shown`
- `I am back on the home library`
- `the core receives a {string} press and release`
- `the D-pad sits in the bottom-left`
- `the action buttons sit in the bottom-right`
- `the control clusters do not overlap`
- `a save slot is filled`

### Common placeholder values
- **Control names** (`I activate the {string} control`, `the {string} control is shown`): `Pause`,
  `Resume`, `Reset`, `Quit`, `Save state`.
- **D-pad directions** (`I press the D-pad towards {string}`): `up`, `down`, `left`, `right`.
- **Buttons** (`I press the {string} button`): `A`, `B`, `L`, `R`, `Select`, `Start`.

## Writing a new scenario

Add it to the relevant `*.feature` file, reusing sentences from the list above:

```gherkin
Scenario: Resetting the game keeps the emulator running
  Given the core is ready
  And a ROM "test.gba" is running
  When I activate the "Reset" control
  Then the game is running
```

If no sentence fits, add one thin step in `e2e/steps/` that delegates to a screen object (extend a
screen object with the new selector/action if needed). The step then joins the shared vocabulary.

**Tip for authoring:** install the official **Cucumber** VS Code extension — it autocompletes these
steps as you type in a `.feature` file and flags any sentence that isn't defined yet.

## Running

- `npm run test:e2e` — run every scenario headless.
- `npm run test:e2e:ui` — watch them run / debug interactively.
- `npm run test:e2e:steps` — print the current step vocabulary.
