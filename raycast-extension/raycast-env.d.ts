/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {};

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences;

declare namespace Preferences {
  /** Preferences accessible in the `open-options` command */
  export type OpenOptions = ExtensionPreferences & {};
  /** Preferences accessible in the `search-bookmarks` command */
  export type SearchBookmarks = ExtensionPreferences & {};
  /** Preferences accessible in the `run-command` command */
  export type RunCommand = ExtensionPreferences & {};
  /** Preferences accessible in the `reload-extension` command */
  export type ReloadExtension = ExtensionPreferences & {};
}

declare namespace Arguments {
  /** Arguments passed to the `open-options` command */
  export type OpenOptions = {};
  /** Arguments passed to the `search-bookmarks` command */
  export type SearchBookmarks = {};
  /** Arguments passed to the `run-command` command */
  export type RunCommand = {};
  /** Arguments passed to the `reload-extension` command */
  export type ReloadExtension = {};
}
