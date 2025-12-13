import { useCallback, useContext, useEffect, useRef, useState, type DragEvent } from 'react';
import HomeView from './components/HomeView';
import PlayView from './components/PlayView';
import { GBAContext } from './emulator/useEmulator';

export type Status = {
  message: string;
  tone?: 'info' | 'success' | 'warn';
};

const STORAGE_KEY = 'gba-studio-settings';

const filterEntries = (names: string[]) =>
  names.filter((name) => name && name !== '.' && name !== '..');

const formatTime = (date: Date) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
  const [showGamepad, setShowGamepad] = useState(true);
  const [volume, setVolume] = useState(80);
  const [performanceMode, setPerformanceMode] = useState<'quality' | 'performance'>(
    'performance'
  );
  const [isPaused, setIsPaused] = useState(true);
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);
  const [view, setView] = useState<'home' | 'play'>('home');

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

  const refreshRoms = useCallback(() => {
    if (!emulator) return;
    const list = filterEntries(emulator.listRoms()).sort((a, b) => a.localeCompare(b));
    setRoms(list);
  }, []);

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
    []
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

  const saveState = useCallback(() => {
    if (!emulator) return;
    const ok = emulator.saveState(0);
    if (ok) {
      scheduleSync();
      setStatus({ message: 'Quick-saved (slot 0)', tone: 'success' });
    } else {
      setStatus({ message: 'Save failed', tone: 'warn' });
    }
  }, [scheduleSync]);

  const loadState = useCallback(() => {
    if (!emulator) return;
    const ok = emulator.loadState(0);
    if (ok) {
      emulator.resumeGame();
      setStatus({ message: 'Quick-loaded (slot 0)', tone: 'success' });
    } else {
      setStatus({ message: 'No save in slot 0', tone: 'warn' });
    }
  }, []);

  const autoSave = useCallback(() => {
    if (!emulator) return;
    const ok = emulator.forceAutoSaveState();
    if (ok) {
      scheduleSync();
      const stamp = formatTime(new Date());
      setLastAutoSave(stamp);
      setStatus({ message: 'Auto-save forced', tone: 'success' });
    } else {
      setStatus({ message: 'Auto-save failed', tone: 'warn' });
    }
  }, [scheduleSync]);

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
        onPauseToggle={pauseToggle}
        onReset={reset}
        onQuit={quit}
        onSaveState={saveState}
        onLoadState={loadState}
        onAutoSave={autoSave}
        showCanvas={view === 'play' && !!activeRom}
      />
    </div>
  );
};

export default PlayController;
