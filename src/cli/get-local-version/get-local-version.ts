import type { GetLocalVersionOptions, VersionInfo } from "./types"
import { formatJsonOutput, formatVersionOutput } from "./formatter"
import { getPluginInfo } from "../doctor/checks/system-plugin"
import { getLoadedPluginVersion } from "../doctor/checks/system-loaded-version"

export async function getLocalVersion(
  options: GetLocalVersionOptions = {}
): Promise<number> {
  void options.directory

  try {
    const pluginInfo = getPluginInfo()
    const loadedInfo = getLoadedPluginVersion()
    const currentVersion = pluginInfo.pinnedVersion ?? loadedInfo.expectedVersion ?? loadedInfo.loadedVersion

    if (pluginInfo.isLocalDev) {
      const info: VersionInfo = {
        currentVersion,
        latestVersion: null,
        isUpToDate: false,
        isLocalDev: true,
        isPinned: false,
        pinnedVersion: null,
        status: "local-dev",
      }

      console.log(options.json ? formatJsonOutput(info) : formatVersionOutput(info))
      return 0
    }

    if (pluginInfo.isPinned) {
      const info: VersionInfo = {
        currentVersion,
        latestVersion: null,
        isUpToDate: false,
        isLocalDev: false,
        isPinned: true,
        pinnedVersion: pluginInfo.pinnedVersion,
        status: "pinned",
      }

      console.log(options.json ? formatJsonOutput(info) : formatVersionOutput(info))
      return 0
    }

    if (!currentVersion) {
      const info: VersionInfo = {
        currentVersion: null,
        latestVersion: null,
        isUpToDate: false,
        isLocalDev: false,
        isPinned: false,
        pinnedVersion: null,
        status: "unknown",
      }

      console.log(options.json ? formatJsonOutput(info) : formatVersionOutput(info))
      return 1
    }

    const info: VersionInfo = {
      currentVersion,
      latestVersion: null,
      isUpToDate: false,
      isLocalDev: false,
      isPinned: false,
      pinnedVersion: null,
      status: "unknown",
    }

    console.log(options.json ? formatJsonOutput(info) : formatVersionOutput(info))
    return 0
  } catch (error) {
    const info: VersionInfo = {
      currentVersion: null,
      latestVersion: null,
      isUpToDate: false,
      isLocalDev: false,
      isPinned: false,
      pinnedVersion: null,
      status: "error",
    }

    console.log(options.json ? formatJsonOutput(info) : formatVersionOutput(info))
    return 1
  }
}
