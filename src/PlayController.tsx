import { useCallback, useContext, useEffect, useRef, useState, type DragEvent } from 'react';
import HomeView from './components/HomeView';
import PlayView from './components/PlayView';
import { GBAContext } from './emulator/useEmulator';
import { useGamepadControls } from './hooks/useGamepadControls';

export type Status = {
  message: string;
  tone?: 'info' | 'success' | 'warn';
};

const STORAGE_KEY = 'gba-studio-settings';
const STATE_SLOT_COUNT = 5;
const SAVE_STATE_META_KEY = 'gba-studio-save-states';

type SaveSlotInfo = {
  slot: number;
  savedAt: number | null;
  exists: boolean;
};

type LoadOption = {
  value: string;
  label: string;
  disabled: boolean;
};

const filterEntries = (names: string[]) =>
  names.filter((name) => name && name !== '.' && name !== '..');

const formatTime = (date: Date) =>
  `${date.toLocaleDateString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const readSaveStateMeta = (): Record<string, Record<string, number>> => {
  const raw = localStorage.getItem(SAVE_STATE_META_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, Record<string, number>>;
    return parsed ?? {};
  } catch (err) {
    console.warn('Unable to parse save state metadata', err);
    return {};
  }
};

const writeSaveStateMeta = (meta: Record<string, Record<string, number>>) => {
  localStorage.setItem(SAVE_STATE_META_KEY, JSON.stringify(meta));
};

const createEmptySlots = () =>
  Array.from({ length: STATE_SLOT_COUNT }, (_, slot) => ({
    slot,
    savedAt: null,
    exists: false,
  }));

const keyBindings: Record<string, string> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  z: 'a',
  x: 'b',
  a: 'l',
  s: 'r',
  Shift: 'select',
  Enter: 'start',
  ' ': 'start',
};

const PlayController = () => {
  const { emulator } = useContext(GBAContext);
  console.log(emulator);
  const syncTimer = useRef<number | null>(null);
  const [booting] = useState(false);
  const [roms, setRoms] = useState<string[]>([]);
  const [activeRom, setActiveRom] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({
    message: 'Booting the mGBA core…',
    tone: 'info',
  });
  const [updateReady, setUpdateReady] = useState(false);
  const [showGamepad, setShowGamepad] = useState(true);
  const [volume, setVolume] = useState(80);
  const [performanceMode, setPerformanceMode] = useState<'quality' | 'performance'>(
    'performance'
  );
  const [isPaused, setIsPaused] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'play'>('home');
  const [saveSlots, setSaveSlots] = useState<SaveSlotInfo[]>(() => createEmptySlots());
  const saveSlotsRef = useRef<SaveSlotInfo[]>(saveSlots);
  const [autoSaveInfo, setAutoSaveInfo] = useState<{ exists: boolean; savedAt: number | null }>(
    { exists: false, savedAt: null }
  );
  const [loadSelection, setLoadSelection] = useState('');

  useEffect(() => {
    const handleUpdateAvailable = () => {
      setUpdateReady(true);
    };
    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    return () => {
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    window.location.reload();
  }, []);

  const dismissUpdate = useCallback(() => {
    setUpdateReady(false);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<{
        showGamepad: boolean;
        volume: number;
        speed: number;
        performanceMode: 'quality' | 'performance';
        lastRom: string;
      }>;
      setShowGamepad(parsed.showGamepad ?? true);
      setVolume(parsed.volume ?? 80);
      setPerformanceMode(parsed.performanceMode ?? 'performance');;
    } catch (err) {
      console.warn('Unable to parse saved settings', err);
    }
  }, []);

  const persistSettings = useCallback(
    (next?: Partial<{ activeRom: string | null }>) => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          showGamepad,
          volume,
          performanceMode,
          lastRom: next?.activeRom ?? activeRom ?? undefined,
        })
      );
    },
    [activeRom, performanceMode, showGamepad, volume]
  );

  const getSaveSlotsFromFs = useCallback(() => {
    if (!emulator || !activeRom) return {};
    const saveStatePath = emulator.filePaths().saveStatePath;
    let entries: string[] = [];
    try {
      entries = emulator.FS.readdir(saveStatePath);
    } catch (err) {
      console.warn('Unable to read save states from FS', err);
      return {};
    }

    const romName = activeRom;
    const baseName = romName.replace(/\.[^/.]+$/, '');
    const patterns = [
      new RegExp(`^${escapeRegExp(baseName)}\\.ss(\\d+)$`),
      new RegExp(`^${escapeRegExp(romName)}\\.ss(\\d+)$`),
    ];

    const slotTimes: Record<number, number> = {};
    for (const entry of filterEntries(entries)) {
      for (const pattern of patterns) {
        const match = entry.match(pattern);
        if (!match) continue;
        const slot = Number(match[1]);
        if (!Number.isInteger(slot) || slot < 0 || slot >= STATE_SLOT_COUNT) {
          continue;
        }
        try {
          const stat = emulator.FS.stat(`${saveStatePath}/${entry}`);
          const rawTime = stat?.mtime;
          const mtime =
            rawTime instanceof Date
              ? rawTime.getTime()
              : typeof rawTime === 'number'
                ? rawTime
                : Date.now();
          slotTimes[slot] = mtime;
        } catch {
          slotTimes[slot] = Date.now();
        }
      }
    }

    return slotTimes;
  }, [activeRom, emulator]);

  const getAutoSaveInfo = useCallback(() => {
    if (!emulator?.autoSaveStateName) return { exists: false, savedAt: null };
    try {
      const exists = emulator.FS.analyzePath(emulator.autoSaveStateName).exists;
      if (!exists) return { exists: false, savedAt: null };
      const stat = emulator.FS.stat(emulator.autoSaveStateName);
      const rawTime = stat?.mtime;
      const savedAt =
        rawTime instanceof Date
          ? rawTime.getTime()
          : typeof rawTime === 'number'
            ? rawTime
            : Date.now();
      return { exists: true, savedAt };
    } catch {
      return { exists: false, savedAt: null };
    }
  }, [emulator]);

  const refreshSaveSlots = useCallback(() => {
    if (!emulator || !activeRom) {
      const emptySlots = createEmptySlots();
      setSaveSlots(emptySlots);
      saveSlotsRef.current = emptySlots;
      setAutoSaveInfo({ exists: false, savedAt: null });
      return;
    }

    const meta = readSaveStateMeta();
    const metaSlots = meta[activeRom] ?? {};
    const fsSlots = getSaveSlotsFromFs();
    const slots = Array.from({ length: STATE_SLOT_COUNT }, (_, slot) => {
      const metaTime = metaSlots[slot];
      const fsTime = fsSlots[slot];
      const savedAt = metaTime ?? fsTime ?? null;
      return {
        slot,
        savedAt,
        exists: savedAt !== null,
      };
    });

    const nextAutoSaveInfo = getAutoSaveInfo();
    setSaveSlots(slots);
    saveSlotsRef.current = slots;
    setAutoSaveInfo(nextAutoSaveInfo);
    setLastAutoSave(
      nextAutoSaveInfo.exists && nextAutoSaveInfo.savedAt
        ? formatTime(new Date(nextAutoSaveInfo.savedAt))
        : null
    );
  }, [activeRom, emulator, getAutoSaveInfo, getSaveSlotsFromFs]);

  const refreshRoms = useCallback(() => {
    if (!emulator) return;
    const list = filterEntries(emulator.listRoms()).sort((a, b) => a.localeCompare(b));
    setRoms(list);
  }, []);

  useEffect(() => {
    refreshSaveSlots();
  }, [refreshSaveSlots]);

  useEffect(() => {
    saveSlotsRef.current = saveSlots;
  }, [saveSlots]);

  useEffect(() => {
    setLoadSelection('');
  }, [activeRom]);

  const scheduleSync = useCallback(() => {
    if (!emulator || syncTimer.current) return;
    syncTimer.current = window.setTimeout(async () => {
      syncTimer.current = null;
      try {
        await emulator.FSSync();
      } catch (err) {
        console.warn('Failed to sync data to IndexedDB', err);
      }
    }, 900);
  }, [emulator]);

  // const attachCallbacks = useCallback(
  //   (instance: mGBAEmulator) => {
  //     instance.addCoreCallbacks({
  //       saveDataUpdatedCallback: scheduleSync,
  //       autoSaveStateCapturedCallback: () => {
  //         setLastAutoSave(formatTime(new Date()));
  //         scheduleSync();
  //         setStatus({ message: 'Captured auto-save', tone: 'success' });
  //       },
  //       autoSaveStateLoadedCallback: () =>
  //         setStatus({ message: 'Restored auto-save', tone: 'success' }),
  //       coreCrashedCallback: () =>
  //         setStatus({
  //           message: 'mGBA reported a crash. Try reloading the ROM.',
  //           tone: 'warn',
  //         }),
  //     });
  //   },
  //   [scheduleSync]
  // );

  useEffect(() => {
    if (!emulator) return;
    emulator.setVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (!emulator) return;
    emulator.setCoreSettings({
      audioSampleRate: 48000,
      audioBufferSize: 1024,
      timestepSync: true,
      videoSync: false,
      audioSync: false,
      threadedVideo: false,
      rewindEnable: true,
      rewindBufferCapacity: 600,
      rewindBufferInterval: 2,
    });
    persistSettings();
  }, [performanceMode, persistSettings, emulator]);

  const handleKeyboard = useCallback(
    (event: KeyboardEvent, action: 'press' | 'release') => {
      if (!emulator) return;
      const activeTag = (event.target as HTMLElement | null)?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
      const binding = keyBindings[event.key];
      if (!binding) return;
      event.preventDefault();
      if (action === 'press') {
        emulator.buttonPress(binding);
        emulator.resumeAudio();
      } else {
        emulator.buttonUnpress(binding);
      }
    },
    [emulator]
  );

  useEffect(() => {
    const down = (e: KeyboardEvent) => handleKeyboard(e, 'press');
    const up = (e: KeyboardEvent) => handleKeyboard(e, 'release');
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [handleKeyboard]);

  useGamepadControls({
    emulator,
    enabled: Boolean(emulator && view === 'play' && activeRom),
  });

  const loadRomFromPath = useCallback(
    async (romName: string) => {
      console.log("EMU", emulator)
      if (!emulator) return;
      const gamePath = `${emulator.filePaths().gamePath}/${romName}`;
      const loaded = emulator.loadGame(gamePath);
      if (!loaded) {
        const available = filterEntries(emulator.listRoms()).join(', ') || 'none';
        setStatus({
          message: `Unable to load ROM. Tried ${gamePath}. Available in FS: ${available}`,
          tone: 'warn',
        });
        return;
      }
      setActiveRom(romName);
      setIsPaused(false);
      persistSettings({ activeRom: romName });
      setStatus({ message: `Loaded ${romName}`, tone: 'success' });
      emulator.resumeAudio();
      emulator.resumeGame();
      setView('play');
      const restored = emulator.loadAutoSaveState();
      if (restored) {
        setStatus({ message: 'Auto-save restored', tone: 'success' });
      } else if (emulator.loadState(0)) {
        setStatus({ message: 'State slot 0 restored', tone: 'success' });
      }
      scheduleSync();
    },
    [persistSettings, scheduleSync, setView, emulator]
  );

  const importRom = useCallback(
    async (file: File) => {
      if (!emulator) {
        setStatus({
          message: 'Core not ready yet. Wait for mGBA to finish booting.',
          tone: 'warn',
        });
        return;
      }
      setStatus({ message: `Importing ${file.name}…`, tone: 'info' });
      try {
        await new Promise<void>((resolve, reject) => {
          try {
            emulator.uploadRom(file, () => resolve());
          } catch (err) {
            reject(err);
          }
        });
        await emulator.FSSync();
        refreshRoms();
        await loadRomFromPath(file.name);
      } catch (err) {
        console.error('Import failed', err);
        setStatus({ message: `Import failed: ${(err as Error).message ?? err}`, tone: 'warn' });
      }
    },
    [loadRomFromPath, refreshRoms]
  );

  const handleFileInput = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      const file = files[0];
      setStatus({ message: `Selected ${file.name}…`, tone: 'info' });
      await importRom(file);
    },
    [importRom]
  );

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      await handleFileInput(event.dataTransfer?.files);
    },
    [handleFileInput]
  );

  const pauseToggle = useCallback(() => {
    if (!emulator) return;
    if (isPaused) {
      emulator.resumeGame();
      emulator.resumeAudio();
      setStatus({ message: 'Resumed', tone: 'info' });
    } else {
      emulator.pauseGame();
      emulator.pauseAudio();
      setStatus({ message: 'Paused', tone: 'info' });
    }
    setIsPaused((prev) => !prev);
  }, [isPaused]);

  const pickSaveSlot = useCallback(() => {
    const slots = saveSlotsRef.current.length ? saveSlotsRef.current : createEmptySlots();
    const emptySlot = slots.find((slot) => !slot.exists);
    if (emptySlot) return emptySlot.slot;

    let oldestSlot = slots[0]?.slot ?? 0;
    let oldestTime = slots[0]?.savedAt ?? Date.now();
    for (const slot of slots) {
      const time = slot.savedAt ?? 0;
      if (time < oldestTime) {
        oldestTime = time;
        oldestSlot = slot.slot;
      }
    }
    return oldestSlot;
  }, []);

  const saveState = useCallback(() => {
    if (!emulator || !activeRom) return;
    const slot = pickSaveSlot();
    const ok = emulator.saveState(slot);
    if (ok) {
      scheduleSync();
      const timestamp = Date.now();
      const meta = readSaveStateMeta();
      const romMeta = meta[activeRom] ?? {};
      romMeta[slot] = timestamp;
      meta[activeRom] = romMeta;
      writeSaveStateMeta(meta);
      refreshSaveSlots();
      setStatus({
        message: `Saved state (slot ${slot + 1})`,
        tone: 'success',
      });
    } else {
      setStatus({ message: 'Save failed', tone: 'warn' });
    }
  }, [activeRom, pickSaveSlot, refreshSaveSlots, scheduleSync]);

  const handleLoadSelection = useCallback(
    (value: string) => {
      if (!emulator || !activeRom || !value) return;
      let ok = false;
      if (value === 'auto') {
        ok = emulator.loadAutoSaveState();
        if (ok) {
          emulator.resumeGame();
          emulator.resumeAudio();
          setIsPaused(false);
          setStatus({ message: 'Loaded auto-save', tone: 'success' });
        } else {
          setStatus({ message: 'No auto-save available', tone: 'warn' });
        }
      } else if (value.startsWith('slot:')) {
        const slot = Number(value.replace('slot:', ''));
        if (Number.isInteger(slot)) {
          ok = emulator.loadState(slot);
          if (ok) {
            emulator.resumeGame();
            emulator.resumeAudio();
            setIsPaused(false);
            setStatus({
              message: `Loaded state (slot ${slot + 1})`,
              tone: 'success',
            });
          } else {
            setStatus({
              message: `No save in slot ${slot + 1}`,
              tone: 'warn',
            });
          }
        } else {
          setStatus({ message: 'Invalid save slot selected', tone: 'warn' });
        }
      }
      setLoadSelection('');
    },
    [activeRom, emulator]
  );

  const slotOptions: LoadOption[] = saveSlots.map((slot) => {
    const label = slot.exists
      ? `Slot ${slot.slot + 1} — ${
          slot.savedAt ? formatTime(new Date(slot.savedAt)) : 'Saved'
        }`
      : `Slot ${slot.slot + 1} — empty`;
    return {
      value: `slot:${slot.slot}`,
      label,
      disabled: !slot.exists,
    };
  });

  const autoSaveOption: LoadOption = {
    value: 'auto',
    label: autoSaveInfo.exists
      ? `Auto-save — ${autoSaveInfo.savedAt ? formatTime(new Date(autoSaveInfo.savedAt)) : 'Saved'}`
      : 'Auto-save — empty',
    disabled: !autoSaveInfo.exists,
  };

  const onLoadSelectionChange = useCallback(
    (value: string) => {
      setLoadSelection(value);
      handleLoadSelection(value);
    },
    [handleLoadSelection]
  );

  const reset = () => {
    if (!emulator) return;
    emulator.quickReload();
    emulator.resumeGame();
    setStatus({ message: 'Soft reset executed', tone: 'info' });
  };

  const quit = () => {
    if (!emulator) return;
    emulator.quitGame();
    setActiveRom(null);
    setIsPaused(true);
    setStatus({ message: 'Game closed. Load another ROM.', tone: 'info' });
    setView('home');
  };

  return (
    <div className={`page ${view === 'play' ? 'play-mode' : ''}`}>
      {updateReady && view !== 'play' && (
        <div className="update-toast" role="status" aria-live="polite">
          <span>Update ready.</span>
          <div className="update-actions">
            <button onClick={applyUpdate}>Reload</button>
            <button className="ghost" onClick={dismissUpdate}>
              Later
            </button>
          </div>
        </div>
      )}
      {view !== 'play' &&
        <div className="topbar">
          <div className="brand">
            <span className="pill">mGBA • PWA</span>
          </div>
        </div>
      }

      {view === 'home' && (
        <HomeView
          statusMessage={status.message}
          lastAutoSave={lastAutoSave}
          roms={roms}
          onImport={handleFileInput}
          onDrop={handleDrop}
          onRefresh={() => refreshRoms()}
          onLaunch={(rom) => {
            loadRomFromPath(rom);
          }}
          booting={booting}
          emulatorReady={!!emulator}
        />
      )}

      <PlayView
        activeRom={activeRom}
        isPaused={isPaused}
        status={status}
        showGamepad={showGamepad}
        loadSelection={loadSelection}
        loadSlotOptions={slotOptions}
        autoSaveOption={autoSaveOption}
        onLoadSelectionChange={onLoadSelectionChange}
        onPauseToggle={pauseToggle}
        onReset={reset}
        onQuit={quit}
        onSaveState={saveState}
        showCanvas={view === 'play' && !!activeRom}
      />
    </div>
  );
};

export default PlayController;
