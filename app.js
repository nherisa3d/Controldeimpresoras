/**
 * ============================================================================
 * NHERISA 3D — CONTROL DE IMPRESORAS BI & COMMAND HUB
 * Core Application Engine & Telemetry System
 * Soft Pastel Aesthetic + Full Customization (Logo, Wallpaper, Pastel Palette)
 * ============================================================================
 */

// Default is empty: clean slate for user's real machines
const DEFAULT_PRINTERS = [];

const DEFAULT_SPOOLS = [
  { id: 'sp-1', color: '#c982b6', name: 'PLA Seda Lavanda', brand: 'NHERISA PRO', printerId: '', weightRemaining: 740, weightTotal: 1000, tempNozzle: '205-220°C', tempBed: '55-60°C' },
  { id: 'sp-2', color: '#86efac', name: 'PLA Verde Menta', brand: 'Grilon3', printerId: '', weightRemaining: 510, weightTotal: 1000, tempNozzle: '200-215°C', tempBed: '50-60°C' },
  { id: 'sp-3', color: '#ffffff', name: 'PETG Blanco Nieve', brand: 'Printalot', printerId: '', weightRemaining: 810, weightTotal: 1000, tempNozzle: '235-250°C', tempBed: '70-85°C' },
  { id: 'sp-4', color: '#fdba74', name: 'PLA Melocotón Suave', brand: 'eSun', printerId: '', weightRemaining: 340, weightTotal: 1000, tempNozzle: '205-215°C', tempBed: '50-60°C' },
  { id: 'sp-5', color: '#fda4af', name: 'ABS Rosa Pastel', brand: 'NHERISA PRO', printerId: '', weightRemaining: 920, weightTotal: 1000, tempNozzle: '240-260°C', tempBed: '90-110°C' }
];

const DEFAULT_THEME = {
  logoUrl: 'assets/logo.jpg',
  bgPreset: 'original',
  customBgUrl: null,
  accentColor: '#9d8bc7'
};

const BG_PRESETS = {
  original: "url('assets/background.jpg')",
  lavender: "radial-gradient(circle at 20% 25%, rgba(157, 139, 199, 0.28) 0%, transparent 45%), radial-gradient(circle at 80% 75%, rgba(201, 130, 182, 0.22) 0%, transparent 50%), linear-gradient(180deg, #0e0a17 0%, #171124 100%)",
  mint: "radial-gradient(circle at 25% 25%, rgba(134, 239, 172, 0.22) 0%, transparent 45%), radial-gradient(circle at 75% 75%, rgba(125, 211, 252, 0.18) 0%, transparent 50%), linear-gradient(180deg, #081110 0%, #0e1e1c 100%)",
  charcoal: "radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 60%), linear-gradient(180deg, #0d0c11 0%, #15141b 100%)"
};

class NherisaFarmHub {
  constructor() {
    this.storageKey = 'nherisa_hub_state_v3';
    this.printers = [];
    this.spools = [];
    this.theme = JSON.parse(JSON.stringify(DEFAULT_THEME));
    this.activeFilter = 'all';
    this.isSimulationMode = true;
    this.audioAlerts = true;
    this.refreshIntervalMs = 2000;
    this.timerId = null;
    this.activeCamPrinterId = null;
    this.confirmCallback = null;
    this.simCanvases = new Map();

    this.init();
  }

  init() {
    this.loadState();
    this.applyTheme(this.theme);
    this.cacheDom();
    this.bindEvents();
    this.renderAll();
    this.startTelemetryLoop();
    this.startSimulationEngine();
    this.appendTerminalLog('system', 'NHERISA 3D Farm Hub listo. Diseño pastel y centro de personalización activo.');
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.printers = parsed.printers || [];
        this.spools = parsed.spools || DEFAULT_SPOOLS;
        this.theme = Object.assign({}, DEFAULT_THEME, parsed.theme || {});
        this.isSimulationMode = parsed.isSimulationMode !== undefined ? parsed.isSimulationMode : true;
        this.audioAlerts = parsed.audioAlerts !== undefined ? parsed.audioAlerts : true;
        this.refreshIntervalMs = parsed.refreshIntervalMs || 2000;
      } else {
        this.printers = [];
        this.spools = JSON.parse(JSON.stringify(DEFAULT_SPOOLS));
        this.theme = JSON.parse(JSON.stringify(DEFAULT_THEME));
        this.saveState();
      }
    } catch (e) {
      console.warn('Error al cargar estado:', e);
      this.printers = [];
      this.spools = JSON.parse(JSON.stringify(DEFAULT_SPOOLS));
      this.theme = JSON.parse(JSON.stringify(DEFAULT_THEME));
    }
  }

  saveState() {
    try {
      const state = {
        printers: this.printers,
        spools: this.spools,
        theme: this.theme,
        isSimulationMode: this.isSimulationMode,
        audioAlerts: this.audioAlerts,
        refreshIntervalMs: this.refreshIntervalMs
      };
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (e) {
      console.error('Error al guardar estado:', e);
    }
  }

  // ==========================================================================
  // DOM CACHE & BINDINGS
  // ==========================================================================
  cacheDom() {
    // Navigation & Views
    this.navBtns = document.querySelectorAll('.btn-nav');
    this.tabViews = {
      farm: document.getElementById('view-farm'),
      cctv: document.getElementById('view-cctv'),
      terminal: document.getElementById('view-terminal'),
      spools: document.getElementById('view-spools')
    };

    // Sidebar & Profile
    this.mainLogo = document.getElementById('main-logo');
    this.logoCircleBtn = document.getElementById('logoCircleBtn');
    this.inputProfilePhotoDirect = document.getElementById('inputProfilePhotoDirect');
    this.brandSelector = document.getElementById('brand-selector');

    // Stats
    this.statPrinting = document.getElementById('stat-printing');
    this.statProgress = document.getElementById('stat-progress');
    this.statTotalHours = document.getElementById('stat-total-hours');
    this.navCountFarm = document.getElementById('navCountFarm');

    // Grids
    this.printersGrid = document.getElementById('printersGrid');
    this.cctvGrid = document.getElementById('cctvGrid');
    this.spoolsTableBody = document.getElementById('spoolsTableBody');

    // Sidebar footer buttons
    this.btnNewPrinter = document.getElementById('btn-new-printer');
    this.btnAppearance = document.getElementById('btn-appearance');
    this.btnToggleSim = document.getElementById('btn-toggle-sim');
    this.simModeIcon = document.getElementById('simModeIcon');
    this.simModeText = document.getElementById('simModeText');
    this.btnAudioToggle = document.getElementById('btn-audio-toggle');
    this.audioIcon = document.getElementById('audioIcon');
    this.audioText = document.getElementById('audioText');
    this.btnSettings = document.getElementById('btn-settings');
    this.btnBackup = document.getElementById('btn-backup');

    // Terminal
    this.terminalTargetPrinter = document.getElementById('terminalTargetPrinter');
    this.consoleOutput = document.getElementById('consoleOutput');
    this.formGcodeCommand = document.getElementById('formGcodeCommand');
    this.inputGcodeCommand = document.getElementById('inputGcodeCommand');
    this.btnClearConsole = document.getElementById('btnClearConsole');
    this.btnTerminalEstop = document.getElementById('btnTerminalEstop');

    // CCTV
    this.btnSnapAllCameras = document.getElementById('btnSnapAllCameras');
    this.gridOptBtns = document.querySelectorAll('.btn-grid-opt');

    // Modals
    this.modalPrinter = document.getElementById('modalPrinter');
    this.modalPrinterTitle = document.getElementById('modalPrinterTitle');
    this.formPrinter = document.getElementById('formPrinter');
    this.btnClosePrinterModal = document.getElementById('btnClosePrinterModal');
    this.btnCancelPrinterModal = document.getElementById('btnCancelPrinterModal');
    this.btnDeletePrinterFromModal = document.getElementById('btnDeletePrinterFromModal');
    this.printerTotalHours = document.getElementById('printerTotalHours');

    this.modalCameraViewer = document.getElementById('modalCameraViewer');
    this.camModalTitle = document.getElementById('camModalTitle');
    this.camModalVideoWrapper = document.getElementById('camModalVideoWrapper');
    this.btnCloseCameraModal = document.getElementById('btnCloseCameraModal');
    this.camOverlayHotend = document.getElementById('camOverlayHotend');
    this.camOverlayBed = document.getElementById('camOverlayBed');
    this.camOverlayProgress = document.getElementById('camOverlayProgress');
    this.camOverlayEta = document.getElementById('camOverlayEta');
    this.btnCamModalSnapshot = document.getElementById('btnCamModalSnapshot');
    this.btnCamModalFullscreen = document.getElementById('btnCamModalFullscreen');
    this.btnCamQuickPause = document.getElementById('btnCamQuickPause');
    this.btnCamQuickResume = document.getElementById('btnCamQuickResume');
    this.btnCamQuickStop = document.getElementById('btnCamQuickStop');

    // Appearance Modal
    this.modalAppearance = document.getElementById('modalAppearance');
    this.btnCloseAppearanceModal = document.getElementById('btnCloseAppearanceModal');
    this.btnSaveAppearance = document.getElementById('btnSaveAppearance');
    this.appearanceLogoPreview = document.getElementById('appearanceLogoPreview');
    this.inputModalLogoFile = document.getElementById('inputModalLogoFile');
    this.btnResetLogo = document.getElementById('btnResetLogo');
    this.inputModalBgFile = document.getElementById('inputModalBgFile');
    this.btnResetBg = document.getElementById('btnResetBg');
    this.bgPresetBtns = document.querySelectorAll('.bg-preset-btn');
    this.pastelSwatchBtns = document.querySelectorAll('.pastel-swatch-btn');
    this.inputCustomAccentColor = document.getElementById('inputCustomAccentColor');

    // Settings Modal
    this.modalSettings = document.getElementById('modalSettings');
    this.btnCloseSettingsModal = document.getElementById('btnCloseSettingsModal');
    this.btnSaveSettings = document.getElementById('btnSaveSettings');
    this.btnExportConfig = document.getElementById('btnExportConfig');
    this.inputFileImportConfig = document.getElementById('inputFileImportConfig');
    this.btnResetToDefaults = document.getElementById('btnResetToDefaults');
    this.settingRefreshRate = document.getElementById('settingRefreshRate');

    // Confirmation Modal
    this.modalConfirm = document.getElementById('modalConfirm');
    this.confirmTitle = document.getElementById('confirmTitle');
    this.confirmMessage = document.getElementById('confirmMessage');
    this.btnConfirmCancel = document.getElementById('btnConfirmCancel');
    this.btnConfirmOk = document.getElementById('btnConfirmOk');

    // Toast
    this.toastNotification = document.getElementById('toastNotification');

    // Section bar toggle
    this.btnToggleFarm = document.getElementById('btn-toggle-farm');
  }

  bindEvents() {
    // Nav tabs
    this.navBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // Brand filter
    if (this.brandSelector) {
      this.brandSelector.addEventListener('change', (e) => {
        this.activeFilter = e.target.value;
        this.renderFarmGrid();
      });
    }

    // Direct Profile photo change by clicking logo
    if (this.logoCircleBtn && this.inputProfilePhotoDirect) {
      this.logoCircleBtn.addEventListener('click', () => {
        this.inputProfilePhotoDirect.click();
      });
      this.inputProfilePhotoDirect.addEventListener('change', (e) => {
        this.handleLogoUpload(e);
      });
    }

    // Simulation toggle
    if (this.btnToggleSim) {
      this.btnToggleSim.addEventListener('click', () => {
        this.isSimulationMode = !this.isSimulationMode;
        this.updateSimModeUi();
        this.saveState();
        this.appendTerminalLog(
          'system',
          this.isSimulationMode
            ? 'MODO SIMULACIÓN ACTIVADO: Datos interactivos en memoria.'
            : 'MODO CONEXIÓN REAL ACTIVADO: Consultando IPs locales de tu taller.'
        );
      });
    }

    // Audio toggle
    if (this.btnAudioToggle) {
      this.btnAudioToggle.addEventListener('click', () => {
        this.audioAlerts = !this.audioAlerts;
        this.updateAudioUi();
        this.saveState();
        if (this.audioAlerts) this.playChime('chime');
      });
    }

    // Add / Edit / Delete printer modals
    if (this.btnNewPrinter) this.btnNewPrinter.addEventListener('click', () => this.openAddPrinterModal());
    if (this.btnClosePrinterModal) this.btnClosePrinterModal.addEventListener('click', () => this.closePrinterModal());
    if (this.btnCancelPrinterModal) this.btnCancelPrinterModal.addEventListener('click', () => this.closePrinterModal());
    if (this.formPrinter) this.formPrinter.addEventListener('submit', (e) => this.handleSavePrinterForm(e));
    if (this.btnDeletePrinterFromModal) {
      this.btnDeletePrinterFromModal.addEventListener('click', () => {
        const editId = document.getElementById('printerEditId').value;
        if (editId) {
          this.closePrinterModal();
          this.confirmDeletePrinter(editId);
        }
      });
    }

    // Appearance modal
    if (this.btnAppearance) this.btnAppearance.addEventListener('click', () => this.openAppearanceModal());
    if (this.btnCloseAppearanceModal) this.btnCloseAppearanceModal.addEventListener('click', () => this.closeAppearanceModal());
    if (this.btnSaveAppearance) this.btnSaveAppearance.addEventListener('click', () => this.closeAppearanceModal());
    if (this.inputModalLogoFile) this.inputModalLogoFile.addEventListener('change', (e) => this.handleLogoUpload(e));
    if (this.btnResetLogo) this.btnResetLogo.addEventListener('click', () => this.resetLogoToDefault());
    if (this.inputModalBgFile) this.inputModalBgFile.addEventListener('change', (e) => this.handleCustomBgUpload(e));
    if (this.btnResetBg) this.btnResetBg.addEventListener('click', () => this.setBgPreset('original'));

    // Background preset buttons
    this.bgPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.dataset.preset;
        this.setBgPreset(preset);
      });
    });

    // Pastel color swatch buttons
    this.pastelSwatchBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        this.setThemeColor(color);
      });
    });

    if (this.inputCustomAccentColor) {
      this.inputCustomAccentColor.addEventListener('input', (e) => {
        this.setThemeColor(e.target.value);
      });
    }

    // Camera viewer modal
    if (this.btnCloseCameraModal) this.btnCloseCameraModal.addEventListener('click', () => this.closeCameraModal());
    if (this.btnCamModalSnapshot) this.btnCamModalSnapshot.addEventListener('click', () => this.takeCameraSnapshot());
    if (this.btnCamModalFullscreen) this.btnCamModalFullscreen.addEventListener('click', () => this.toggleCameraFullscreen());
    if (this.btnCamQuickPause) this.btnCamQuickPause.addEventListener('click', () => {
      if (this.activeCamPrinterId) this.pausePrinter(this.activeCamPrinterId);
    });
    if (this.btnCamQuickResume) this.btnCamQuickResume.addEventListener('click', () => {
      if (this.activeCamPrinterId) this.resumePrinter(this.activeCamPrinterId);
    });
    if (this.btnCamQuickStop) this.btnCamQuickStop.addEventListener('click', () => {
      if (this.activeCamPrinterId) this.stopPrinter(this.activeCamPrinterId);
    });

    // Settings modal
    if (this.btnSettings) this.btnSettings.addEventListener('click', () => this.openSettingsModal());
    if (this.btnBackup) this.btnBackup.addEventListener('click', () => this.exportConfig());
    if (this.btnCloseSettingsModal) this.btnCloseSettingsModal.addEventListener('click', () => this.closeSettingsModal());
    if (this.btnSaveSettings) this.btnSaveSettings.addEventListener('click', () => this.closeSettingsModal());
    if (this.btnExportConfig) this.btnExportConfig.addEventListener('click', () => this.exportConfig());
    if (this.inputFileImportConfig) this.inputFileImportConfig.addEventListener('change', (e) => this.importConfig(e));
    if (this.btnResetToDefaults) {
      this.btnResetToDefaults.addEventListener('click', () => {
        this.showConfirm(
          '¿Limpiar toda la granja?',
          'Esta acción eliminará todas las impresoras registradas para que comiences desde cero.',
          () => {
            this.printers = [];
            this.saveState();
            this.renderAll();
            this.closeSettingsModal();
            this.showToast('🧹 Granja limpiada. Lista para cargar tus equipos.');
          }
        );
      });
    }

    // In-app confirmation buttons
    if (this.btnConfirmCancel) {
      this.btnConfirmCancel.addEventListener('click', () => {
        this.modalConfirm.classList.add('hidden');
        this.confirmCallback = null;
      });
    }
    if (this.btnConfirmOk) {
      this.btnConfirmOk.addEventListener('click', () => {
        if (typeof this.confirmCallback === 'function') {
          this.confirmCallback();
        }
        this.modalConfirm.classList.add('hidden');
        this.confirmCallback = null;
      });
    }

    // Close modals on clicking overlay backdrop
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.add('hidden');
          if (overlay === this.modalCameraViewer) {
            this.activeCamPrinterId = null;
            if (this.camModalVideoWrapper) this.camModalVideoWrapper.innerHTML = '';
          }
          if (overlay === this.modalConfirm) {
            this.confirmCallback = null;
          }
        }
      });
    });

    // Close open modal with Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(openModal => {
          openModal.classList.add('hidden');
          if (openModal === this.modalCameraViewer) {
            this.activeCamPrinterId = null;
            if (this.camModalVideoWrapper) this.camModalVideoWrapper.innerHTML = '';
          }
          if (openModal === this.modalConfirm) {
            this.confirmCallback = null;
          }
        });
      }
    });

    // CCTV layout buttons
    this.gridOptBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.gridOptBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cols = btn.dataset.cols;
        if (this.cctvGrid) {
          this.cctvGrid.className = `cctv-grid grid-cols-${cols}`;
        }
      });
    });

    if (this.btnSnapAllCameras) {
      this.btnSnapAllCameras.addEventListener('click', () => {
        this.playChime('camera');
        this.showToast('📸 Snapshots capturados para todas las cámaras.');
      });
    }

    // Terminal Jog & Preheats
    document.querySelectorAll('.btn-jog').forEach(btn => {
      btn.addEventListener('click', () => {
        const gcode = btn.dataset.gcode;
        if (gcode) this.sendGcodeToActivePrinter(gcode);
      });
    });

    document.querySelectorAll('.btn-preheat').forEach(btn => {
      btn.addEventListener('click', () => {
        const nozzle = parseInt(btn.dataset.nozzle, 10);
        const bed = parseInt(btn.dataset.bed, 10);
        this.preheatActivePrinter(nozzle, bed);
      });
    });

    if (this.btnTerminalEstop) {
      this.btnTerminalEstop.addEventListener('click', () => {
        this.showConfirm(
          '🚨 Parada de Emergencia M112',
          '¿Deseas cortar de inmediato la corriente a los calentadores y detener los motores de todas las impresoras?',
          () => {
            this.sendGcodeToActivePrinter('M112');
            this.playChime('alert');
            this.showToast('🚨 Parada de emergencia ejecutada.');
          }
        );
      });
    }

    if (this.formGcodeCommand) {
      this.formGcodeCommand.addEventListener('submit', (e) => {
        e.preventDefault();
        const cmd = this.inputGcodeCommand.value.trim();
        if (cmd) {
          this.sendGcodeToActivePrinter(cmd);
          this.inputGcodeCommand.value = '';
        }
      });
    }

    if (this.btnClearConsole) {
      this.btnClearConsole.addEventListener('click', () => {
        if (this.consoleOutput) this.consoleOutput.innerHTML = '';
        this.appendTerminalLog('system', 'Terminal limpiado.');
      });
    }

    // Spools
    const btnAddSpool = document.getElementById('btnAddSpoolModal');
    if (btnAddSpool) {
      btnAddSpool.addEventListener('click', () => this.promptAddNewSpool());
    }

    // Section bar toggle
    if (this.btnToggleFarm) {
      this.btnToggleFarm.addEventListener('click', () => {
        const grid = this.printersGrid;
        const icon = this.btnToggleFarm.querySelector('.toggle-icon');
        if (grid.style.display === 'none') {
          grid.style.display = 'grid';
          if (icon) icon.textContent = '▼';
        } else {
          grid.style.display = 'none';
          if (icon) icon.textContent = '▶';
        }
      });
    }
  }

  // ==========================================================================
  // APPEARANCE & THEME SYSTEM
  // ==========================================================================
  applyTheme(theme) {
    if (!theme) return;

    // Apply logo
    const logoSrc = theme.logoUrl || 'assets/logo.jpg';
    if (this.mainLogo) this.mainLogo.src = logoSrc;
    if (this.appearanceLogoPreview) this.appearanceLogoPreview.src = logoSrc;

    // Apply background
    if (theme.customBgUrl) {
      document.body.style.backgroundImage = `url('${theme.customBgUrl}')`;
    } else {
      const presetStyle = BG_PRESETS[theme.bgPreset] || BG_PRESETS.original;
      document.body.style.backgroundImage = presetStyle;
    }

    // Apply accent color
    if (theme.accentColor) {
      this.applyCssColorVars(theme.accentColor);
    }
  }

  applyCssColorVars(hex) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return;

    const root = document.documentElement;
    root.style.setProperty('--primary', hex);
    root.style.setProperty('--primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    root.style.setProperty('--primary-hover', this.lightenDarkenColor(hex, 20));
    root.style.setProperty('--primary-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);

    // Complementary soft berry
    const berryHex = this.adjustHue(hex, 35);
    root.style.setProperty('--primary-magenta', berryHex);
    root.style.setProperty('--primary-magenta-hover', this.lightenDarkenColor(berryHex, 15));
    const berryRgb = this.hexToRgb(berryHex);
    if (berryRgb) {
      root.style.setProperty('--primary-magenta-glow', `rgba(${berryRgb.r}, ${berryRgb.g}, ${berryRgb.b}, 0.3)`);
    }
  }

  handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      this.theme.logoUrl = dataUrl;
      this.applyTheme(this.theme);
      this.saveState();
      this.showToast('✅ Foto de perfil / logo actualizada.');
    };
    reader.readAsDataURL(file);
  }

  resetLogoToDefault() {
    this.theme.logoUrl = 'assets/logo.jpg';
    this.applyTheme(this.theme);
    this.saveState();
    this.showToast('🔄 Logo original restaurado.');
  }

  handleCustomBgUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      this.theme.customBgUrl = dataUrl;
      this.theme.bgPreset = 'custom';
      this.applyTheme(this.theme);
      this.saveState();
      this.updateBgPresetBtnsUi('custom');
      this.showToast('🖼️ Fondo personalizado aplicado.');
    };
    reader.readAsDataURL(file);
  }

  setBgPreset(presetName) {
    this.theme.customBgUrl = null;
    this.theme.bgPreset = presetName;
    this.applyTheme(this.theme);
    this.saveState();
    this.updateBgPresetBtnsUi(presetName);
    this.showToast(`🎨 Fondo cambiado: ${presetName}.`);
  }

  updateBgPresetBtnsUi(activePreset) {
    this.bgPresetBtns.forEach(b => {
      b.classList.toggle('active', b.dataset.preset === activePreset);
    });
  }

  setThemeColor(hexColor) {
    this.theme.accentColor = hexColor;
    this.applyTheme(this.theme);
    this.saveState();

    if (this.inputCustomAccentColor) {
      this.inputCustomAccentColor.value = hexColor;
    }

    this.pastelSwatchBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color.toLowerCase() === hexColor.toLowerCase());
    });

    this.showToast('🌸 Paleta pastel actualizada.');
  }

  openAppearanceModal() {
    if (this.appearanceLogoPreview) {
      this.appearanceLogoPreview.src = this.theme.logoUrl || 'assets/logo.jpg';
    }
    this.updateBgPresetBtnsUi(this.theme.bgPreset);
    if (this.inputCustomAccentColor) {
      this.inputCustomAccentColor.value = this.theme.accentColor || '#9d8bc7';
    }
    this.modalAppearance.classList.remove('hidden');
  }

  closeAppearanceModal() {
    this.modalAppearance.classList.add('hidden');
  }

  // ==========================================================================
  // CONFIRMATION POPUP & TOAST (IN-APP PASTEL AESTHETIC)
  // ==========================================================================
  showConfirm(title, message, onConfirm) {
    if (!this.modalConfirm) {
      if (confirm(`${title}\n\n${message}`)) onConfirm();
      return;
    }
    this.confirmTitle.textContent = title;
    this.confirmMessage.textContent = message;
    this.confirmCallback = onConfirm;
    this.modalConfirm.classList.remove('hidden');
  }

  showToast(message, duration = 3000) {
    if (!this.toastNotification) return;
    this.toastNotification.textContent = message;
    this.toastNotification.classList.remove('hidden');

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastNotification.classList.add('hidden');
    }, duration);
  }

  // ==========================================================================
  // NAVIGATION & UI
  // ==========================================================================
  switchTab(tabName) {
    this.navBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    Object.entries(this.tabViews).forEach(([name, view]) => {
      if (view) {
        view.classList.toggle('active', name === tabName);
      }
    });

    if (tabName === 'cctv') {
      this.renderCctvGrid();
    } else if (tabName === 'terminal') {
      this.populateTerminalPrinterSelector();
    } else if (tabName === 'spools') {
      this.renderSpoolsTable();
    }
  }

  updateSimModeUi() {
    if (!this.btnToggleSim) return;
    if (this.isSimulationMode) {
      this.simModeIcon.textContent = '⚡';
      this.simModeText.textContent = 'Modo Simulación';
      this.btnToggleSim.style.borderColor = 'rgba(var(--primary-rgb), 0.35)';
      this.btnToggleSim.style.color = 'var(--primary-hover)';
    } else {
      this.simModeIcon.textContent = '🌐';
      this.simModeText.textContent = 'Modo Red Real';
      this.btnToggleSim.style.borderColor = 'rgba(134, 239, 172, 0.4)';
      this.btnToggleSim.style.color = 'var(--green)';
    }
  }

  updateAudioUi() {
    if (!this.btnAudioToggle) return;
    if (this.audioAlerts) {
      this.audioIcon.textContent = '🔔';
      this.audioText.textContent = 'Alertas de Audio: ON';
      this.btnAudioToggle.style.color = '#fff';
    } else {
      this.audioIcon.textContent = '🔕';
      this.audioText.textContent = 'Alertas de Audio: OFF';
      this.btnAudioToggle.style.color = 'var(--text-muted)';
    }
  }

  // ==========================================================================
  // RENDERING ENGINE
  // ==========================================================================
  renderAll() {
    this.updateSimModeUi();
    this.updateAudioUi();
    this.renderStats();
    this.renderFarmGrid();
    this.populateTerminalPrinterSelector();
    this.renderSpoolsTable();
    this.updateBrandSelectorOptions();
  }

  renderStats() {
    const total = this.printers.length;
    const printing = this.printers.filter(p => p.status === 'printing').length;

    let avgProgress = 0;
    const activeJobs = this.printers.filter(p => p.job && p.status === 'printing');
    if (activeJobs.length > 0) {
      const sum = activeJobs.reduce((acc, curr) => acc + (curr.job.progress || 0), 0);
      avgProgress = Math.round(sum / activeJobs.length);
    }

    const totalHoursSum = this.printers.reduce((acc, p) => acc + (parseFloat(p.totalHours) || 0), 0);

    if (this.statPrinting) {
      this.statPrinting.innerHTML = `${printing} <span style="font-size: 1.4rem; color: var(--text-muted); font-weight: 500;">/ ${total} online</span>`;
    }
    if (this.statProgress) this.statProgress.textContent = `${avgProgress}%`;
    if (this.statTotalHours) {
      this.statTotalHours.innerHTML = `${Math.round(totalHoursSum)}h <span style="font-size: 1.25rem; color: var(--text-muted); font-weight: 500;">totales</span>`;
    }
    if (this.navCountFarm) this.navCountFarm.textContent = total;
  }

  updateBrandSelectorOptions() {
    if (!this.brandSelector) return;
    const total = this.printers.length;
    const bambuCount = this.printers.filter(p => p.brand === 'bambu').length;
    const crealityCount = this.printers.filter(p => p.brand === 'creality').length;
    const snapmakerCount = this.printers.filter(p => p.brand === 'snapmaker').length;
    const flashforgeCount = this.printers.filter(p => p.brand === 'flashforge').length;

    this.brandSelector.innerHTML = `
      <option value="all">Todas las Marcas (${total})</option>
      <option value="bambu">Bambu Lab (${bambuCount})</option>
      <option value="creality">Creality (${crealityCount})</option>
      <option value="snapmaker">Snapmaker (${snapmakerCount})</option>
      <option value="flashforge">Flashforge (${flashforgeCount})</option>
    `;
    this.brandSelector.value = this.activeFilter;
  }

  renderFarmGrid() {
    if (!this.printersGrid) return;
    this.printersGrid.innerHTML = '';

    // If 0 printers registered, show clean, friendly empty state with "Carga tu impresora"
    if (this.printers.length === 0) {
      this.printersGrid.innerHTML = `
        <div class="empty-farm-state">
          <span class="empty-farm-icon">🖨️</span>
          <h3 class="empty-farm-title">Comienza a armar tu granja</h3>
          <p class="empty-farm-desc">
            Aún no has registrado ninguna impresora. Haz clic en el botón de abajo para cargar tus equipos reales (Bambu Lab, Creality, Snapmaker, Flashforge) y comenzar a monitorear su progreso, temperaturas y cámaras en vivo.
          </p>
          <button class="btn btn-primary" id="btnEmptyAddPrinter" type="button" style="margin-top: 0.5rem; font-size: 0.95rem; padding: 0.85rem 1.8rem;">
            + Carga tu impresora
          </button>
        </div>
      `;
      const btnEmpty = document.getElementById('btnEmptyAddPrinter');
      if (btnEmpty) btnEmpty.addEventListener('click', () => this.openAddPrinterModal());
      return;
    }

    const filtered = this.printers.filter(p => {
      if (this.activeFilter === 'all') return true;
      return p.brand === this.activeFilter;
    });

    if (filtered.length === 0) {
      this.printersGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          <p>No tienes impresoras registradas en la categoría seleccionada.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(printer => {
      const card = this.createPrinterCardElement(printer);
      this.printersGrid.appendChild(card);
    });

    this.initSimulatedCameras();
  }

  createPrinterCardElement(printer) {
    const card = document.createElement('div');
    card.className = 'printer-card';
    card.id = `card-${printer.id}`;

    const brandLabels = {
      bambu: 'Bambu Lab',
      creality: 'Creality',
      snapmaker: 'Snapmaker',
      flashforge: 'Flashforge',
      generic: 'Klipper'
    };

    const statusLabels = {
      printing: 'IMPRIMIENDO',
      paused: 'PAUSADA',
      idle: 'LISTA',
      heating: 'CALENTANDO',
      offline: 'OFFLINE'
    };

    const progress = printer.job ? Math.min(100, Math.max(0, printer.job.progress || 0)) : 0;
    const strokeOffset = 201 - (201 * (progress / 100));

    card.innerHTML = `
      <!-- Header -->
      <div class="card-header-row">
        <div class="card-title-meta">
          <div class="brand-tag-row">
            <span class="brand-badge ${printer.brand}">${brandLabels[printer.brand] || printer.brand}</span>
            <span class="printer-ip-sub">${printer.ip || 'USB Serial'}</span>
            <span class="odometer-tag" title="Horas totales acumuladas de impresión">⏱️ ${(printer.totalHours || 0).toFixed(0)}h</span>
          </div>
          <h3 class="printer-card-name">${printer.name}</h3>
        </div>
        <span class="status-badge status-${printer.status}">
          ${statusLabels[printer.status] || printer.status}
        </span>
      </div>

      <!-- Job & Radial Ring -->
      <div class="card-job-row">
        <div class="radial-progress-wrapper">
          <svg class="radial-svg" viewBox="0 0 80 80">
            <circle class="radial-bg" cx="40" cy="40" r="32"></circle>
            <circle class="radial-fill" cx="40" cy="40" r="32" style="stroke-dashoffset: ${strokeOffset}; stroke: ${printer.brand === 'bambu' ? 'var(--green)' : 'var(--primary-magenta)'}"></circle>
          </svg>
          <div class="radial-percent-center">${progress.toFixed(0)}%</div>
        </div>

        <div class="job-details-meta">
          <div class="job-file-title" title="${printer.job ? printer.job.file : 'Sin trabajo'}">
            ${printer.job ? printer.job.file : 'Sin trabajo activo'}
          </div>
          <div class="job-sub-metrics">
            <span class="job-eta-highlight">⏱️ ${this.formatDuration(printer.job ? printer.job.timeRemainingSeconds : 0)}</span>
            <span>Capa ${printer.job ? printer.job.layerCurrent : 0}/${printer.job ? printer.job.layerTotal : 0}</span>
          </div>
        </div>
      </div>

      <!-- Camera Strip -->
      <div class="card-camera-strip" data-id="${printer.id}" title="Haga clic para ampliar cámara">
        <div class="cam-top-hud">
          <span class="cam-live-pill"><span class="dot-red"></span> LIVE</span>
          <span class="cam-expand-label">Expandir ↗</span>
        </div>
        <div id="cam-container-${printer.id}" style="width:100%; height:100%;">
          <!-- Feed -->
        </div>
      </div>

      <!-- Telemetry Strip -->
      <div class="card-telemetry-row">
        <div class="telemetry-chip">
          <span class="chip-label">🔥 NOZZLE</span>
          <div class="chip-value">${printer.hotendTemp}°C <span class="chip-target">/ ${printer.hotendTarget}°C</span></div>
        </div>
        <div class="telemetry-chip">
          <span class="chip-label">🛏️ CAMA</span>
          <div class="chip-value">${printer.bedTemp}°C <span class="chip-target">/ ${printer.bedTarget}°C</span></div>
        </div>
        <div class="telemetry-chip">
          <span class="chip-label">🌀 FAN / CABINA</span>
          <div class="chip-value">${printer.fanSpeed}% <span class="chip-target">${printer.chamberTemp ? `| ${printer.chamberTemp}°C` : ''}</span></div>
        </div>
      </div>

      <!-- Actions -->
      <div class="card-bottom-actions">
        <div style="display: flex; gap: 8px;">
          ${printer.status === 'printing' ? `
            <button class="btn btn-outline-small btn-action-pause" data-id="${printer.id}" type="button">⏸️ Pausar</button>
          ` : printer.status === 'paused' ? `
            <button class="btn btn-outline-small btn-action-resume" style="border-color: var(--green); color: var(--green);" data-id="${printer.id}" type="button">▶️ Reanudar</button>
          ` : `
            <button class="btn btn-outline-small btn-action-preheat" data-id="${printer.id}" type="button">🔥 Precalentar</button>
          `}
          <button class="btn btn-outline-small btn-action-stop" style="border-color: rgba(253, 164, 175, 0.4); color: var(--pastel-rose);" data-id="${printer.id}" type="button">⏹️ Cancelar</button>
        </div>

        <div style="display: flex; gap: 6px;">
          <button class="btn-outline-small btn-action-edit" data-id="${printer.id}" type="button" title="Editar Impresora">⚙️</button>
          <button class="btn-outline-small btn-action-cam" data-id="${printer.id}" type="button" title="Cámara">📹</button>
          <button class="btn-outline-small btn-del-printer btn-action-delete" data-id="${printer.id}" type="button" title="Eliminar Impresora">🗑️</button>
        </div>
      </div>
    `;

    // Bind card actions
    const camStrip = card.querySelector('.card-camera-strip');
    if (camStrip) camStrip.addEventListener('click', () => this.openCameraModal(printer.id));

    const btnPause = card.querySelector('.btn-action-pause');
    if (btnPause) btnPause.addEventListener('click', () => this.pausePrinter(printer.id));

    const btnResume = card.querySelector('.btn-action-resume');
    if (btnResume) btnResume.addEventListener('click', () => this.resumePrinter(printer.id));

    const btnPreheat = card.querySelector('.btn-action-preheat');
    if (btnPreheat) btnPreheat.addEventListener('click', () => this.preheatPrinterPrompt(printer.id));

    const btnStop = card.querySelector('.btn-action-stop');
    if (btnStop) btnStop.addEventListener('click', () => this.stopPrinter(printer.id));

    const btnEdit = card.querySelector('.btn-action-edit');
    if (btnEdit) btnEdit.addEventListener('click', () => this.openEditPrinterModal(printer.id));

    const btnCam = card.querySelector('.btn-action-cam');
    if (btnCam) btnCam.addEventListener('click', () => this.openCameraModal(printer.id));

    const btnDel = card.querySelector('.btn-action-delete');
    if (btnDel) btnDel.addEventListener('click', () => this.confirmDeletePrinter(printer.id));

    return card;
  }

  // ==========================================================================
  // CCTV CAMERA WALL
  // ==========================================================================
  renderCctvGrid() {
    if (!this.cctvGrid) return;
    this.cctvGrid.innerHTML = '';

    if (this.printers.length === 0) {
      this.cctvGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          <p>No hay cámaras activas porque aún no has registrado impresoras en la granja.</p>
        </div>
      `;
      return;
    }

    this.printers.forEach(printer => {
      const cell = document.createElement('div');
      cell.className = 'cctv-cell';
      cell.id = `cctv-cell-${printer.id}`;

      cell.innerHTML = `
        <div class="cctv-cell-top">
          <span class="cctv-cam-title">${printer.name}</span>
          <span class="live-rec-badge">REC</span>
        </div>
        <div id="cctv-frame-${printer.id}" style="width:100%; height:100%;"></div>
        <div class="cctv-cell-bottom">
          <span class="cctv-info-chip">TEMP: ${printer.hotendTemp}°C / ${printer.bedTemp}°C | ${printer.job ? printer.job.progress.toFixed(0) : 0}%</span>
          <div style="display:flex; gap:6px;">
            <button class="btn-outline-small btn-snap-cell" data-id="${printer.id}" style="padding: 2px 8px;">📸</button>
            <button class="btn-outline-small btn-expand-cell" data-id="${printer.id}" style="padding: 2px 8px;">⛶</button>
          </div>
        </div>
      `;

      const btnExpand = cell.querySelector('.btn-expand-cell');
      if (btnExpand) btnExpand.addEventListener('click', () => this.openCameraModal(printer.id));

      const btnSnap = cell.querySelector('.btn-snap-cell');
      if (btnSnap) btnSnap.addEventListener('click', () => {
        this.playChime('camera');
        this.showToast(`📸 Snapshot capturado para ${printer.name}`);
      });

      this.cctvGrid.appendChild(cell);
    });

    this.initSimulatedCameras();
  }

  // ==========================================================================
  // CAMERAS & SIMULATION
  // ==========================================================================
  initSimulatedCameras() {
    this.printers.forEach(printer => {
      const containerFarm = document.getElementById(`cam-container-${printer.id}`);
      if (containerFarm) this.renderFeedIntoContainer(printer, containerFarm, 380, 125);

      const containerCctv = document.getElementById(`cctv-frame-${printer.id}`);
      if (containerCctv) this.renderFeedIntoContainer(printer, containerCctv, 640, 360);
    });
  }

  renderFeedIntoContainer(printer, container, width, height) {
    container.innerHTML = '';

    if (printer.camera && printer.camera.type === 'usb_local') {
      const video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.className = 'cam-video-feed';
      navigator.mediaDevices?.getUserMedia({ video: true })
        .then(stream => { video.srcObject = stream; })
        .catch(err => {
          container.innerHTML = `<div style="padding:15px; color:#fda4af; font-size:0.75rem;">Webcam USB: ${err.message}</div>`;
        });
      container.appendChild(video);
    } else if (printer.camera && printer.camera.type === 'mjpeg' && !this.isSimulationMode) {
      const img = document.createElement('img');
      img.src = printer.camera.url;
      img.className = 'cam-img-feed';
      img.onerror = () => this.createSimulatedCanvas(printer, container, width, height);
      container.appendChild(img);
    } else {
      this.createSimulatedCanvas(printer, container, width, height);
    }
  }

  createSimulatedCanvas(printer, container, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.className = 'cam-simulated-canvas';
    container.appendChild(canvas);

    const canvasKey = `${container.id}-${printer.id}`;
    this.simCanvases.set(canvasKey, {
      canvas,
      ctx: canvas.getContext('2d'),
      printerId: printer.id,
      headX: width * 0.5,
      headY: height * 0.5,
      dirX: 2.5,
      dirY: 1.8
    });
  }

  startSimulationEngine() {
    const loop = () => {
      this.simCanvases.forEach((item) => {
        const printer = this.printers.find(p => p.id === item.printerId);
        if (!printer) return;

        const ctx = item.ctx;
        const w = item.canvas.width;
        const h = item.canvas.height;

        ctx.fillStyle = '#0a0812';
        ctx.fillRect(0, 0, w, h);

        // Bed grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        const step = 20;
        for (let x = 0; x < w; x += step) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += step) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        // Print part silhouette
        const progress = printer.job ? printer.job.progress : 0;
        const partRadius = Math.max(8, (progress / 100) * (h * 0.28));

        ctx.fillStyle = printer.brand === 'bambu' ? 'rgba(134, 239, 172, 0.35)' :
                        printer.brand === 'creality' ? 'rgba(125, 211, 252, 0.35)' :
                        printer.brand === 'snapmaker' ? 'rgba(253, 186, 116, 0.35)' : 'rgba(201, 130, 182, 0.35)';
        
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.55, partRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.stroke();

        // Print head
        if (printer.status === 'printing') {
          item.headX += item.dirX;
          item.headY += item.dirY;

          if (item.headX < w * 0.25 || item.headX > w * 0.75) item.dirX *= -1;
          if (item.headY < h * 0.3 || item.headY > h * 0.7) item.dirY *= -1;

          // Toolhead body
          ctx.fillStyle = '#475569';
          ctx.fillRect(item.headX - 10, item.headY - 20, 20, 16);

          // Nozzle
          ctx.fillStyle = '#fda4af';
          ctx.beginPath();
          ctx.moveTo(item.headX - 5, item.headY - 4);
          ctx.lineTo(item.headX + 5, item.headY - 4);
          ctx.lineTo(item.headX, item.headY + 5);
          ctx.closePath();
          ctx.fill();

          // Pastel thermal glow
          const grad = ctx.createRadialGradient(item.headX, item.headY, 2, item.headX, item.headY, 15);
          grad.addColorStop(0, 'rgba(201, 130, 182, 0.6)');
          grad.addColorStop(1, 'rgba(201, 130, 182, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(item.headX, item.headY, 15, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillText(`NHERISA 3D // ${printer.name.substring(0, 18)}`, 8, h - 8);
      });

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  // ==========================================================================
  // CAMERA VIEWER MODAL
  // ==========================================================================
  openCameraModal(printerId) {
    const printer = this.printers.find(p => p.id === printerId);
    if (!printer) return;

    this.activeCamPrinterId = printer.id;
    this.camModalTitle.textContent = `Cámara en Vivo — ${printer.name}`;
    this.updateCamModalOverlay(printer);

    this.camModalVideoWrapper.innerHTML = '';
    this.renderFeedIntoContainer(printer, this.camModalVideoWrapper, 850, 480);

    this.modalCameraViewer.classList.remove('hidden');
  }

  updateCamModalOverlay(printer) {
    if (this.camOverlayHotend) this.camOverlayHotend.textContent = `${printer.hotendTemp}°C / ${printer.hotendTarget}°C`;
    if (this.camOverlayBed) this.camOverlayBed.textContent = `${printer.bedTemp}°C / ${printer.bedTarget}°C`;
    if (this.camOverlayProgress) this.camOverlayProgress.textContent = `${printer.job ? printer.job.progress.toFixed(0) : 0}%`;
    if (this.camOverlayEta) this.camOverlayEta.textContent = this.formatDuration(printer.job ? printer.job.timeRemainingSeconds : 0);
  }

  closeCameraModal() {
    this.modalCameraViewer.classList.add('hidden');
    this.activeCamPrinterId = null;
    this.camModalVideoWrapper.innerHTML = '';
  }

  takeCameraSnapshot() {
    this.playChime('camera');
    const printer = this.printers.find(p => p.id === this.activeCamPrinterId);
    const canvas = this.camModalVideoWrapper.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `NHERISA_Snapshot_${printer ? printer.name.replace(/\s+/g, '_') : 'Printer'}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      this.showToast('📸 Foto HD guardada.');
    } else {
      this.showToast('Snapshot capturado.');
    }
  }

  toggleCameraFullscreen() {
    const stage = document.querySelector('.camera-stage-wrapper');
    if (!stage) return;
    if (!document.fullscreenElement) {
      stage.requestFullscreen?.().catch(err => console.warn(err));
    } else {
      document.exitFullscreen?.();
    }
  }

  // ==========================================================================
  // TELEMETRY POLLING & SIMULATION TICK
  // ==========================================================================
  startTelemetryLoop() {
    if (this.timerId) clearInterval(this.timerId);

    this.timerId = setInterval(() => {
      if (this.isSimulationMode) {
        this.simulationTick();
      } else {
        this.realNetworkPollingTick();
      }

      this.renderStats();
      this.updateFarmCardTelemetryInPlace();

      if (this.activeCamPrinterId) {
        const p = this.printers.find(x => x.id === this.activeCamPrinterId);
        if (p) this.updateCamModalOverlay(p);
      }
    }, this.refreshIntervalMs);
  }

  simulationTick() {
    this.printers.forEach(p => {
      if (p.status === 'printing' && p.job) {
        p.job.progress += 0.3;
        p.totalHours = (parseFloat(p.totalHours) || 0) + (2 / 3600);

        if (p.job.timeRemainingSeconds > 2) {
          p.job.timeRemainingSeconds -= 2;
          p.job.timeElapsedSeconds += 2;
        }

        p.hotendTemp = Math.round(p.hotendTarget + (Math.random() * 1.6 - 0.8));
        p.bedTemp = Math.round(p.bedTarget + (Math.random() * 0.8 - 0.4));

        if (p.job.progress >= 100) {
          p.job.progress = 100;
          p.status = 'idle';
          p.hotendTarget = 0;
          p.bedTarget = 0;
          this.playChime('chime');
          this.showToast(`🎉 [${p.name}] ¡Impresión finalizada!`);
          this.appendTerminalLog('system', `🎉 [${p.name}] ¡Impresión finalizada! Archivo: ${p.job.file}`);
        }
      } else if (p.status === 'heating') {
        if (p.hotendTemp < p.hotendTarget) p.hotendTemp += 8;
        if (p.bedTemp < p.bedTarget) p.bedTemp += 4;
        if (p.hotendTemp >= p.hotendTarget && p.bedTemp >= p.bedTarget) {
          p.status = 'printing';
        }
      }
    });
  }

  async realNetworkPollingTick() {
    for (const printer of this.printers) {
      if (!printer.ip || printer.connectionType === 'simulation') continue;
      try {
        if (printer.connectionType === 'moonraker') {
          const res = await fetch(`http://${printer.ip}:7125/printer/objects/query?heater_bed&extruder&print_stats`, { signal: AbortSignal.timeout(1500) });
          if (res.ok) {
            const data = await res.json();
            const status = data.result?.status;
            if (status) {
              printer.hotendTemp = Math.round(status.extruder?.temperature || printer.hotendTemp);
              printer.hotendTarget = Math.round(status.extruder?.target || printer.hotendTarget);
              printer.bedTemp = Math.round(status.heater_bed?.temperature || printer.bedTemp);
              printer.bedTarget = Math.round(status.heater_bed?.target || printer.bedTarget);
            }
          }
        }
      } catch (e) {}
    }
  }

  updateFarmCardTelemetryInPlace() {
    this.printers.forEach(printer => {
      const card = document.getElementById(`card-${printer.id}`);
      if (!card) return;

      const progress = printer.job ? Math.min(100, Math.max(0, printer.job.progress || 0)) : 0;
      const fill = card.querySelector('.radial-fill');
      const text = card.querySelector('.radial-percent-center');
      if (fill) fill.style.strokeDashoffset = 201 - (201 * (progress / 100));
      if (text) text.textContent = `${progress.toFixed(0)}%`;

      const etaBadge = card.querySelector('.job-eta-highlight');
      if (etaBadge && printer.job) {
        etaBadge.textContent = `⏱️ ${this.formatDuration(printer.job.timeRemainingSeconds)}`;
      }

      const odometer = card.querySelector('.odometer-tag');
      if (odometer) {
        odometer.textContent = `⏱️ ${(printer.totalHours || 0).toFixed(0)}h`;
      }

      const chips = card.querySelectorAll('.telemetry-chip .chip-value');
      if (chips.length >= 2) {
        chips[0].innerHTML = `${printer.hotendTemp}°C <span class="chip-target">/ ${printer.hotendTarget}°C</span>`;
        chips[1].innerHTML = `${printer.bedTemp}°C <span class="chip-target">/ ${printer.bedTarget}°C</span>`;
      }
    });
  }

  // ==========================================================================
  // PRINTER ACTIONS (PAUSE, RESUME, STOP, PREHEAT)
  // ==========================================================================
  pausePrinter(printerId) {
    const printer = this.printers.find(p => p.id === printerId);
    if (!printer) return;
    printer.status = 'paused';
    this.appendTerminalLog('warning', `[${printer.name}] Impresión en pausa (M25 / PAUSE).`);
    this.saveState();
    this.renderFarmGrid();
    this.showToast(`⏸️ ${printer.name} en pausa.`);
  }

  resumePrinter(printerId) {
    const printer = this.printers.find(p => p.id === printerId);
    if (!printer) return;
    printer.status = 'printing';
    this.appendTerminalLog('received', `[${printer.name}] Reanudando trabajo de impresión (M24 / RESUME).`);
    this.saveState();
    this.renderFarmGrid();
    this.showToast(`▶️ ${printer.name} reanudada.`);
  }

  stopPrinter(printerId) {
    const printer = this.printers.find(p => p.id === printerId);
    if (!printer) return;
    this.showConfirm(
      '¿Cancelar impresión?',
      `¿Seguro que deseas cancelar el trabajo actual en ${printer.name}? La pieza quedará incompleta.`,
      () => {
        printer.status = 'idle';
        printer.hotendTarget = 0;
        printer.bedTarget = 0;
        this.appendTerminalLog('error', `[${printer.name}] Impresión CANCELADA (M524 / CANCEL_PRINT).`);
        this.saveState();
        this.renderFarmGrid();
        this.showToast(`⏹️ Impresión cancelada en ${printer.name}`);
      }
    );
  }

  preheatPrinterPrompt(printerId) {
    const printer = this.printers.find(p => p.id === printerId);
    if (!printer) return;
    printer.hotendTarget = 210;
    printer.bedTarget = 60;
    printer.status = 'heating';
    this.appendTerminalLog('sent', `[${printer.name}] Precalentando PLA (Nozzle: 210°C, Cama: 60°C).`);
    this.saveState();
    this.renderFarmGrid();
    this.showToast(`🔥 Precalentando ${printer.name}`);
  }

  // ==========================================================================
  // G-CODE TERMINAL
  // ==========================================================================
  populateTerminalPrinterSelector() {
    if (!this.terminalTargetPrinter) return;
    this.terminalTargetPrinter.innerHTML = '';
    if (this.printers.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Sin impresoras conectadas';
      this.terminalTargetPrinter.appendChild(opt);
      return;
    }
    this.printers.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.brand.toUpperCase()})`;
      this.terminalTargetPrinter.appendChild(opt);
    });
  }

  sendGcodeToActivePrinter(gcode) {
    const printerId = this.terminalTargetPrinter ? this.terminalTargetPrinter.value : (this.printers[0]?.id);
    const printer = this.printers.find(p => p.id === printerId);
    const name = printer ? printer.name : 'Terminal';

    this.appendTerminalLog('sent', `[${name}] >> ${gcode}`);

    setTimeout(() => {
      if (gcode === 'M105') {
        this.appendTerminalLog('received', `ok T:${printer ? printer.hotendTemp : 210}.0 /${printer ? printer.hotendTarget : 210}.0 B:${printer ? printer.bedTemp : 60}.0 /${printer ? printer.bedTarget : 60}.0`);
      } else if (gcode.startsWith('G28')) {
        this.appendTerminalLog('received', `ok X:0.00 Y:0.00 Z:0.00 E:0.00 (Autohome completado)`);
      } else if (gcode.startsWith('M112')) {
        this.appendTerminalLog('error', `!! PARADA DE EMERGENCIA M112. Motores y calentadores apagados.`);
        if (printer) {
          printer.status = 'idle';
          printer.hotendTarget = 0;
          printer.bedTarget = 0;
          this.saveState();
          this.renderFarmGrid();
        }
      } else {
        this.appendTerminalLog('received', `ok`);
      }
    }, 250);
  }

  preheatActivePrinter(nozzle, bed) {
    const printerId = this.terminalTargetPrinter ? this.terminalTargetPrinter.value : (this.printers[0]?.id);
    const printer = this.printers.find(p => p.id === printerId);
    if (!printer) {
      this.showToast('Primero carga una impresora en la granja.');
      return;
    }

    printer.hotendTarget = nozzle;
    printer.bedTarget = bed;
    if (nozzle > 0 || bed > 0) {
      printer.status = 'heating';
      this.appendTerminalLog('sent', `[${printer.name}] Precalentando: M104 S${nozzle} ; M140 S${bed}`);
      this.showToast(`🔥 Precalentando ${printer.name}`);
    } else {
      printer.status = 'idle';
      this.appendTerminalLog('sent', `[${printer.name}] Enfriando: M104 S0 ; M140 S0`);
      this.showToast(`❄️ Enfriando ${printer.name}`);
    }
    this.saveState();
    this.renderFarmGrid();
  }

  appendTerminalLog(type, text) {
    if (!this.consoleOutput) return;
    const line = document.createElement('div');
    line.className = `log-line log-${type}`;
    const timestamp = new Date().toTimeString().split(' ')[0];
    line.textContent = `[${timestamp}] ${text}`;
    this.consoleOutput.appendChild(line);
    this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
  }

  // ==========================================================================
  // SPOOLS & FILAMENTS
  // ==========================================================================
  renderSpoolsTable() {
    if (!this.spoolsTableBody) return;
    this.spoolsTableBody.innerHTML = '';

    this.spools.forEach(spool => {
      const printer = this.printers.find(p => p.id === spool.printerId);
      const printerName = printer ? printer.name : 'Almacén / Libre';
      const percent = Math.round((spool.weightRemaining / spool.weightTotal) * 100);

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><span class="spool-dot" style="background: ${spool.color};"></span> <strong>${spool.name}</strong></td>
        <td>${spool.name.split(' ')[0]}</td>
        <td>${spool.brand}</td>
        <td>${printerName}</td>
        <td><strong>${spool.weightRemaining}g</strong> / ${spool.weightTotal}g (${percent}%)</td>
        <td>${spool.tempNozzle} / ${spool.tempBed}</td>
        <td>
          <span style="font-size:0.75rem; font-weight:700; color: ${percent < 20 ? 'var(--pastel-rose)' : 'var(--green)'};">
            ${percent < 20 ? 'CRÍTICO' : 'DISPONIBLE'}
          </span>
        </td>
        <td>
          <button class="btn-outline-small btn-del-spool" data-id="${spool.id}" style="padding: 2px 8px;">🗑️</button>
        </td>
      `;

      const btnDel = row.querySelector('.btn-del-spool');
      if (btnDel) {
        btnDel.addEventListener('click', () => {
          this.showConfirm(
            '¿Eliminar Carrete?',
            `¿Deseas quitar la bobina ${spool.name} del inventario?`,
            () => {
              this.spools = this.spools.filter(s => s.id !== spool.id);
              this.saveState();
              this.renderSpoolsTable();
              this.showToast('🗑️ Carrete eliminado.');
            }
          );
        });
      }

      this.spoolsTableBody.appendChild(row);
    });
  }

  promptAddNewSpool() {
    const name = prompt('Nombre del filamento (ej. PLA Lavanda Seda):');
    if (!name) return;
    const brand = prompt('Marca del filamento:') || 'NHERISA PRO';
    const grams = parseInt(prompt('Gramos restantes:', '1000'), 10) || 1000;

    const newSpool = {
      id: `sp-${Date.now()}`,
      color: '#c982b6',
      name,
      brand,
      printerId: this.printers[0]?.id || '',
      weightRemaining: grams,
      weightTotal: 1000,
      tempNozzle: '210°C',
      tempBed: '60°C'
    };

    this.spools.push(newSpool);
    this.saveState();
    this.renderSpoolsTable();
    this.showToast('🧵 Carrete registrado.');
  }

  // ==========================================================================
  // ADD / EDIT / DELETE PRINTER MODAL
  // ==========================================================================
  openAddPrinterModal() {
    this.modalPrinterTitle.textContent = 'Carga tu impresora';
    document.getElementById('printerEditId').value = '';
    document.getElementById('printerName').value = '';
    document.getElementById('printerBrand').value = 'bambu';
    document.getElementById('printerConnectionType').value = 'bambu_mqtt';
    document.getElementById('printerIp').value = '';
    document.getElementById('printerApiKey').value = '';
    document.getElementById('printerBedDimensions').value = '256 x 256 x 256';
    if (this.printerTotalHours) this.printerTotalHours.value = '0';
    document.getElementById('cameraType').value = 'simulated';
    document.getElementById('cameraUrl').value = '';

    if (this.btnDeletePrinterFromModal) {
      this.btnDeletePrinterFromModal.style.display = 'none';
    }

    this.modalPrinter.classList.remove('hidden');
  }

  openEditPrinterModal(printerId) {
    const printer = this.printers.find(p => p.id === printerId);
    if (!printer) return;

    this.modalPrinterTitle.textContent = `Editar Impresora: ${printer.name}`;
    document.getElementById('printerEditId').value = printer.id;
    document.getElementById('printerName').value = printer.name;
    document.getElementById('printerBrand').value = printer.brand;
    document.getElementById('printerConnectionType').value = printer.connectionType;
    document.getElementById('printerIp').value = printer.ip || '';
    document.getElementById('printerApiKey').value = printer.apiKey || '';
    document.getElementById('printerBedDimensions').value = printer.bedDimensions || '256 x 256 x 256';
    if (this.printerTotalHours) this.printerTotalHours.value = (printer.totalHours || 0).toFixed(1);
    document.getElementById('cameraType').value = printer.camera?.type || 'none';
    document.getElementById('cameraUrl').value = printer.camera?.url || '';

    if (this.btnDeletePrinterFromModal) {
      this.btnDeletePrinterFromModal.style.display = 'inline-flex';
    }

    this.modalPrinter.classList.remove('hidden');
  }

  closePrinterModal() {
    this.modalPrinter.classList.add('hidden');
  }

  confirmDeletePrinter(printerId) {
    const printer = this.printers.find(p => p.id === printerId);
    if (!printer) return;

    this.showConfirm(
      '¿Eliminar impresora por completo?',
      `¿Confirmas que deseas eliminar por completo "${printer.name}" de la granja? Se quitará toda su telemetría y conexiones.`,
      () => {
        this.printers = this.printers.filter(p => p.id !== printerId);

        // Unassign spools
        this.spools.forEach(s => {
          if (s.printerId === printerId) s.printerId = '';
        });

        if (this.activeCamPrinterId === printerId) {
          this.closeCameraModal();
        }

        this.saveState();
        this.renderAll();
        this.appendTerminalLog('warning', `[SISTEMA] Impresora "${printer.name}" eliminada por completo.`);
        this.showToast(`🗑️ Impresora "${printer.name}" eliminada.`);
      }
    );
  }

  handleSavePrinterForm(e) {
    e.preventDefault();

    const editId = document.getElementById('printerEditId').value;
    const name = document.getElementById('printerName').value.trim();
    const brand = document.getElementById('printerBrand').value;
    const connectionType = document.getElementById('printerConnectionType').value;
    const ip = document.getElementById('printerIp').value.trim();
    const apiKey = document.getElementById('printerApiKey').value.trim();
    const bedDimensions = document.getElementById('printerBedDimensions').value.trim();
    const totalHours = parseFloat(this.printerTotalHours ? this.printerTotalHours.value : 0) || 0;
    const cameraType = document.getElementById('cameraType').value;
    const cameraUrl = document.getElementById('cameraUrl').value.trim();

    if (editId) {
      const p = this.printers.find(item => item.id === editId);
      if (p) {
        p.name = name;
        p.brand = brand;
        p.connectionType = connectionType;
        p.ip = ip;
        p.apiKey = apiKey;
        p.bedDimensions = bedDimensions;
        p.totalHours = totalHours;
        p.camera = { type: cameraType, url: cameraUrl };
        this.showToast(`✅ Impresora "${name}" actualizada.`);
      }
    } else {
      const newPrinter = {
        id: `printer-${Date.now()}`,
        name,
        brand,
        connectionType,
        ip,
        apiKey,
        bedDimensions,
        totalHours,
        status: 'idle',
        hotendTemp: 25,
        hotendTarget: 0,
        bedTemp: 25,
        bedTarget: 0,
        chamberTemp: 26,
        fanSpeed: 0,
        job: {
          file: 'Listo para imprimir',
          progress: 0,
          layerCurrent: 0,
          layerTotal: 0,
          timeElapsedSeconds: 0,
          timeRemainingSeconds: 0,
          filamentGrams: 0
        },
        camera: {
          type: cameraType,
          url: cameraUrl
        }
      };
      this.printers.push(newPrinter);
      this.showToast(`🎉 ¡Impresora "${name}" cargada con éxito!`);
    }

    this.saveState();
    this.closePrinterModal();
    this.renderAll();
    this.appendTerminalLog('system', `Impresora guardada: ${name}`);
  }

  // ==========================================================================
  // SETTINGS & JSON BACKUP
  // ==========================================================================
  openSettingsModal() {
    this.modalSettings.classList.remove('hidden');
  }

  closeSettingsModal() {
    this.modalSettings.classList.add('hidden');
  }

  exportConfig() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({
      version: '5.2.0',
      exportedAt: new Date().toISOString(),
      theme: this.theme,
      printers: this.printers,
      spools: this.spools
    }, null, 2));

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `NHERISA_Farm_Hub_Backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    this.showToast('💾 Respaldo JSON descargado.');
  }

  importConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.printers) this.printers = imported.printers;
        if (imported.spools) this.spools = imported.spools;
        if (imported.theme) {
          this.theme = imported.theme;
          this.applyTheme(this.theme);
        }
        this.saveState();
        this.renderAll();
        this.closeSettingsModal();
        this.showToast('✅ Configuración importada con éxito.');
      } catch (err) {
        alert('❌ Error al importar: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // ==========================================================================
  // HELPERS (AUDIO & COLOR MATH)
  // ==========================================================================
  playChime(type = 'chime') {
    if (!this.audioAlerts) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (type === 'chime') {
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + idx * 0.1);
          osc.stop(ctx.currentTime + idx * 0.1 + 0.45);
        });
      } else if (type === 'camera') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === 'alert') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {}
  }

  formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `~${h}h ${m}m`;
    return `~${m}m`;
  }

  hexToRgb(hex) {
    const cleaned = hex.replace('#', '');
    if (cleaned.length === 3) {
      return {
        r: parseInt(cleaned[0] + cleaned[0], 16),
        g: parseInt(cleaned[1] + cleaned[1], 16),
        b: parseInt(cleaned[2] + cleaned[2], 16)
      };
    } else if (cleaned.length === 6) {
      return {
        r: parseInt(cleaned.substring(0, 2), 16),
        g: parseInt(cleaned.substring(2, 4), 16),
        b: parseInt(cleaned.substring(4, 6), 16)
      };
    }
    return null;
  }

  lightenDarkenColor(col, amt) {
    let usePound = false;
    if (col[0] === '#') {
      col = col.slice(1);
      usePound = true;
    }
    const num = parseInt(col, 16);
    let r = (num >> 16) + amt;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    let b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    let g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? '#' : '') + (g | (b << 8) | (r << 16)).toString(16).padStart(6, '0');
  }

  adjustHue(hex, degree) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return '#c982b6';
    let r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    h = (h + degree / 360) % 1;
    if (h < 0) h += 1;

    // HSL to RGB
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const newR = Math.round(hue2rgb(p, q, h + 1/3) * 255);
    const newG = Math.round(hue2rgb(p, q, h) * 255);
    const newB = Math.round(hue2rgb(p, q, h - 1/3) * 255);

    return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
  }
}

// Bootstrap Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.farmHub = new NherisaFarmHub();
});
