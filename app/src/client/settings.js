import {debounce, defaultTo} from 'lodash-es';
import {ActionState, Port, Device} from './enums';
import nes from './nes';
import log from './log';

export const audioSupported = nes.audio != null;
const nesDefaults = nes.config.get();

const STORAGE_KEY = 'settings';
const SAVE_TIMEOUT = 5000;

export function watchSettings(store) {
  let settings;
  const saveSettingsLater = debounce(() => saveSettings(settings), SAVE_TIMEOUT);

  store.subscribe(() => {
    const newSettings = store.getState().settings;
    if (settings !== newSettings) {
      settings = newSettings;
      saveSettingsLater();
    }
  });
}

function saveSettings(settings) {
  log.info('Saving settings');
  const {resetState, ...settingsToSave} = settings;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave));
}

export function loadSettings() {
  let settings;

  try {
    log.info('Loading settings');
    settings = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (settings) {
      applySettingsToNes(settings);
    }
  } catch (error) {
    log.error('Failed to load settings', error);
  }

  return updateSettings(settings || {});
}

export function resetSettings() {
  return new Promise(resolve => {
    nes.config.use(nesDefaults);
    resolve(updateSettings({}));
  });
}

function updateSettings(settings) {
  return {
    resetState: ActionState.NONE,
    fpsVisible: defaultTo(settings.fpsVisible, true),
    controlsVisible: defaultTo(settings.controlsVisible, false),
    ...copySettingsFromNes(),
  };
}

function applySettingsToNes(settings) {
  nes.config.use({
    region: settings.region,
    speed: settings.speed,
    video: {
      renderer: settings.videoRenderer,
      scale: settings.videoScale,
      palette: settings.videoPalette,
      filter: settings.videoFilter,
      debug: settings.videoDebug,
    },
    fullscreen: {
      type: settings.fullscreenType,
    },
    audio: {
      enabled: settings.audioEnabled,
      volume: settings.audioVolume,
    },
    devices: copyDevicesFromControls(settings.controls),
    inputs: conpyInputsFromControls(settings.controls),
  });
}

function copyDevicesFromControls(controls) {
  const devices = {};
  for (const port of Port.values) {
    const {device} = controls[port];
    devices[port] = Device.toId(device);
  }
  return devices;
}

function conpyInputsFromControls(controls) {
  const inputs = {};
  for (const port of [1, 2]) {
    for (const device of Device.values) {
      for (const input of Device.params[device].inputs) {
        inputs[`${port}.${device}.${input}`] = controls[port].inputs[device][input];
      }
    }
  }
  return inputs;
}

function copySettingsFromNes() {
  return {
    region: nes.region,
    speed: nes.speed,
    videoRenderer: nes.video.renderer,
    videoScale: nes.video.scale,
    videoPalette: nes.video.palette,
    videoFilter: nes.video.filter,
    videoDebug: nes.video.debug,
    fullscreenType: nes.fullscreen.type,
    audioEnabled: audioSupported ? nes.audio.enabled : false,
    audioVolume: audioSupported ? {...nes.audio.volume} : {},
    controls: copyControlsFromNes(),
  };
}

function copyControlsFromNes() {
  const controls = {};
  for (const port of Port.values) {
    controls[port] = {
      device: Device.fromId(nes.devices[port]),
      inputs: copyInputsFromNes(port),
    };
  }
  return controls;
}

function copyInputsFromNes(port) {
  const inputs = {};
  for (const device of Device.values) {
    inputs[device] = {};
    if (device !== Device.NONE) {
      for (const input of Device.params[device].inputs) {
        inputs[device][input] = nes.inputs.get(`${port}.${device}.${input}`);
      }
    }
  }
  return inputs;
}
