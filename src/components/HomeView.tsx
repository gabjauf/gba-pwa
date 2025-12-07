import { useContext, type DragEvent } from 'react';
import { GBAContext } from '../emulator/useEmulator';

export type HomeViewProps = {
  statusMessage: string;
  lastAutoSave: string | null;
  roms: string[];
  onImport: (files: FileList | null) => Promise<void>;
  onDrop: (e: DragEvent<HTMLDivElement>) => Promise<void>;
  onRefresh: () => void;
  onLaunch: (rom: string) => void;
  booting: boolean;
  pwaReady: boolean;
  emulatorReady: boolean;
};

const HomeView = ({
  statusMessage,
  lastAutoSave,
  onImport,
  onDrop,
  onRefresh,
  onLaunch,
  pwaReady,
  emulatorReady,
}: HomeViewProps) => {
  const { emulator } = useContext(GBAContext);

  const roms = emulator?.listRoms().filter(el => el !== '.' && el !== '..')
  return (
    <>
      <header className="hero">
        <div>
          <h1>
            GBA Studio <span>— modern wrapper for mGBA</span>
          </h1>
          <p className="lede">
            Drop in ROMs, play with keyboard or the touch pad, and keep quick saves synced offline.
          </p>
          <div className="hero-actions">
            <label className="upload">
              <input
                type="file"
                accept=".gba,.gb,.gbc,.zip,.7z"
                onChange={(e) => onImport(e.target.files)}
              />
              <span>Import ROM</span>
            </label>
            <button
              type="button"
              className="ghost"
              onClick={onRefresh}
              disabled={!emulatorReady}
            >
              Refresh library
            </button>
            <div className="badges">
              {pwaReady ? (
                <span className="badge success">PWA cached</span>
              ) : (
                <span className="badge ghost">Waiting for install</span>
              )}
            </div>
          </div>
        </div>
        <div className="status info">
          <div className="status-dot" />
          <div>
            <p className="muted">Status</p>
            <p>{statusMessage}</p>
            {lastAutoSave && <p className="muted small">Last auto-save: {lastAutoSave}</p>}
          </div>
        </div>
      </header>

      <section
        className="panel drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div className="panel-head">
          <div>
            <p className="eyebrow">ROMs & library</p>
            <h2>Load, persist, and resume</h2>
          </div>
          <div className="muted small">Drag-and-drop supported</div>
        </div>

        <div className="dropzone">
          <div>
            <p>Drop a ROM here or tap to browse.</p>
            <p className="muted small">
              Supported: .gba, .gbc, .gb, zipped bundles. Files persist to IndexedDB so you can come back offline.
            </p>
          </div>
          <label className="upload primary">
            <input
              type="file"
              accept=".gba,.gb,.gbc,.zip,.7z"
              onChange={(e) => onImport(e.target.files)}
            />
            <span>Choose file</span>
          </label>
        </div>

        <div className="rom-list">
          {roms?.length ? (
            roms.map((rom) => (
              <button className="rom" key={rom} onClick={() => onLaunch(rom)}>
                {rom}
              </button>
            ))
          ) : (
            <p className="muted">Your library is empty. Import a ROM.</p>
          )}
        </div>
      </section>
    </>
  );
};

export default HomeView;
