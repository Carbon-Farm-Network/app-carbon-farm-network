
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * Environment variables [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env`. Like [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), this module cannot be imported into client-side code. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env).
 * 
 * _Unlike_ [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), the values exported from this module are statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * ```ts
 * import { API_KEY } from '$env/static/private';
 * ```
 * 
 * Note that all environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * 
 * ```
 * MY_FEATURE_FLAG=""
 * ```
 * 
 * You can override `.env` values from the command line like so:
 * 
 * ```bash
 * MY_FEATURE_FLAG="enabled" npm run dev
 * ```
 */
declare module '$env/static/private' {
	export const SHELL: string;
	export const npm_command: string;
	export const SESSION_MANAGER: string;
	export const QT_ACCESSIBILITY: string;
	export const npm_config_userconfig: string;
	export const COLORTERM: string;
	export const XDG_CONFIG_DIRS: string;
	export const npm_config_cache: string;
	export const SSH_AGENT_LAUNCHER: string;
	export const npm_package_dev_optional: string;
	export const NIX_BUILD_CORES: string;
	export const NIX_GCROOT: string;
	export const XDG_MENU_PREFIX: string;
	export const GNOME_DESKTOP_SESSION_ID: string;
	export const configureFlags: string;
	export const mesonFlags: string;
	export const PKG_CONFIG_PATH: string;
	export const npm_package_integrity: string;
	export const shell: string;
	export const depsHostHost: string;
	export const NODE: string;
	export const CARGO_CACHE_RUSTC_INFO: string;
	export const GNOME_SHELL_SESSION_MODE: string;
	export const SSH_AUTH_SOCK: string;
	export const STRINGS: string;
	export const LD_FOR_BUILD: string;
	export const depsTargetTarget: string;
	export const stdenv: string;
	export const COLOR: string;
	export const npm_config_local_prefix: string;
	export const NIX_CFLAGS_COMPILE_FOR_BUILD: string;
	export const builder: string;
	export const XMODIFIERS: string;
	export const DESKTOP_SESSION: string;
	export const shellHook: string;
	export const npm_config_globalconfig: string;
	export const EDITOR: string;
	export const phases: string;
	export const GTK_MODULES: string;
	export const CARGO_TARGET_DIR: string;
	export const PWD: string;
	export const NIX_PROFILES: string;
	export const SOURCE_DATE_EPOCH: string;
	export const LOGNAME: string;
	export const XDG_SESSION_DESKTOP: string;
	export const XDG_SESSION_TYPE: string;
	export const NIX_ENFORCE_NO_NATIVE: string;
	export const NIX_PATH: string;
	export const npm_package_dev: string;
	export const npm_config_init_module: string;
	export const GPG_AGENT_INFO: string;
	export const SYSTEMD_EXEC_PID: string;
	export const AS_FOR_BUILD: string;
	export const CXX: string;
	export const _: string;
	export const XAUTHORITY: string;
	export const TEMPDIR: string;
	export const system: string;
	export const SIZE_FOR_BUILD: string;
	export const HOST_PATH: string;
	export const WINDOWPATH: string;
	export const IN_NIX_SHELL: string;
	export const doInstallCheck: string;
	export const HOME: string;
	export const USERNAME: string;
	export const NIX_BINTOOLS: string;
	export const npm_package_peer: string;
	export const LANG: string;
	export const LS_COLORS: string;
	export const XDG_CURRENT_DESKTOP: string;
	export const CARGO_HOME: string;
	export const depsTargetTargetPropagated: string;
	export const npm_package_version: string;
	export const VTE_VERSION: string;
	export const cmakeFlags: string;
	export const CXX_FOR_BUILD: string;
	export const NIX_SSL_CERT_FILE: string;
	export const npm_package_resolved: string;
	export const outputs: string;
	export const NIX_STORE: string;
	export const TMPDIR: string;
	export const GNOME_TERMINAL_SCREEN: string;
	export const PERL5LIB: string;
	export const LD: string;
	export const NM_FOR_BUILD: string;
	export const NIX_BINTOOLS_FOR_BUILD: string;
	export const buildPhase: string;
	export const INIT_CWD: string;
	export const READELF: string;
	export const STRIP_FOR_BUILD: string;
	export const NIX_CC_WRAPPER_TARGET_BUILD_x86_64_unknown_linux_gnu: string;
	export const NIX_BINTOOLS_WRAPPER_TARGET_BUILD_x86_64_unknown_linux_gnu: string;
	export const npm_lifecycle_script: string;
	export const doCheck: string;
	export const npm_package_optional: string;
	export const depsBuildBuild: string;
	export const LESSCLOSE: string;
	export const XDG_SESSION_CLASS: string;
	export const TERM: string;
	export const npm_package_name: string;
	export const SIZE: string;
	export const OBJCOPY_FOR_BUILD: string;
	export const propagatedNativeBuildInputs: string;
	export const npm_config_prefix: string;
	export const LESSOPEN: string;
	export const CC_FOR_BUILD: string;
	export const USER: string;
	export const strictDeps: string;
	export const GNOME_TERMINAL_SERVICE: string;
	export const CARGO_INSTALL_ROOT: string;
	export const AR: string;
	export const AS: string;
	export const TEMP: string;
	export const DISPLAY: string;
	export const NIX_BINTOOLS_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu: string;
	export const OBJDUMP_FOR_BUILD: string;
	export const npm_lifecycle_event: string;
	export const SHLVL: string;
	export const AR_FOR_BUILD: string;
	export const NIX_BUILD_TOP: string;
	export const NM: string;
	export const NIX_LDFLAGS_FOR_BUILD: string;
	export const NIX_CFLAGS_COMPILE: string;
	export const patches: string;
	export const QT_IM_MODULE: string;
	export const buildInputs: string;
	export const preferLocalBuild: string;
	export const npm_config_user_agent: string;
	export const npm_execpath: string;
	export const XDG_RUNTIME_DIR: string;
	export const NIX_PKG_CONFIG_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu: string;
	export const NODE_PATH: string;
	export const depsBuildTarget: string;
	export const OBJCOPY: string;
	export const RANLIB_FOR_BUILD: string;
	export const out: string;
	export const npm_package_json: string;
	export const STRIP: string;
	export const XDG_DATA_DIRS: string;
	export const TMP: string;
	export const OBJDUMP: string;
	export const npm_config_noproxy: string;
	export const PATH: string;
	export const propagatedBuildInputs: string;
	export const npm_config_metrics_registry: string;
	export const npm_config_node_gyp: string;
	export const dontAddDisableDepTrack: string;
	export const READELF_FOR_BUILD: string;
	export const GDMSESSION: string;
	export const CC: string;
	export const NIX_CC: string;
	export const DBUS_SESSION_BUS_ADDRESS: string;
	export const depsBuildTargetPropagated: string;
	export const STRINGS_FOR_BUILD: string;
	export const depsBuildBuildPropagated: string;
	export const npm_config_global_prefix: string;
	export const NIX_CC_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu: string;
	export const CONFIG_SHELL: string;
	export const __structuredAttrs: string;
	export const npm_node_execpath: string;
	export const RANLIB: string;
	export const NIX_HARDENING_ENABLE: string;
	export const NIX_LDFLAGS: string;
	export const nativeBuildInputs: string;
	export const name: string;
	export const npm_package_engines_node: string;
	export const NIX_CC_FOR_BUILD: string;
	export const PKG_CONFIG: string;
	export const depsHostHostPropagated: string;
}

/**
 * Similar to [`$env/static/private`](https://kit.svelte.dev/docs/modules#$env-static-private), except that it only includes environment variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Values are replaced statically at build time.
 * 
 * ```ts
 * import { PUBLIC_BASE_URL } from '$env/static/public';
 * ```
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to runtime environment variables, as defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/master/packages/adapter-node) (or running [`vite preview`](https://kit.svelte.dev/docs/cli)), this is equivalent to `process.env`. This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env).
 * 
 * This module cannot be imported into client-side code.
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * console.log(env.DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 * 
 * > In `dev`, `$env/dynamic` always includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 */
declare module '$env/dynamic/private' {
	export const env: {
		SHELL: string;
		npm_command: string;
		SESSION_MANAGER: string;
		QT_ACCESSIBILITY: string;
		npm_config_userconfig: string;
		COLORTERM: string;
		XDG_CONFIG_DIRS: string;
		npm_config_cache: string;
		SSH_AGENT_LAUNCHER: string;
		npm_package_dev_optional: string;
		NIX_BUILD_CORES: string;
		NIX_GCROOT: string;
		XDG_MENU_PREFIX: string;
		GNOME_DESKTOP_SESSION_ID: string;
		configureFlags: string;
		mesonFlags: string;
		PKG_CONFIG_PATH: string;
		npm_package_integrity: string;
		shell: string;
		depsHostHost: string;
		NODE: string;
		CARGO_CACHE_RUSTC_INFO: string;
		GNOME_SHELL_SESSION_MODE: string;
		SSH_AUTH_SOCK: string;
		STRINGS: string;
		LD_FOR_BUILD: string;
		depsTargetTarget: string;
		stdenv: string;
		COLOR: string;
		npm_config_local_prefix: string;
		NIX_CFLAGS_COMPILE_FOR_BUILD: string;
		builder: string;
		XMODIFIERS: string;
		DESKTOP_SESSION: string;
		shellHook: string;
		npm_config_globalconfig: string;
		EDITOR: string;
		phases: string;
		GTK_MODULES: string;
		CARGO_TARGET_DIR: string;
		PWD: string;
		NIX_PROFILES: string;
		SOURCE_DATE_EPOCH: string;
		LOGNAME: string;
		XDG_SESSION_DESKTOP: string;
		XDG_SESSION_TYPE: string;
		NIX_ENFORCE_NO_NATIVE: string;
		NIX_PATH: string;
		npm_package_dev: string;
		npm_config_init_module: string;
		GPG_AGENT_INFO: string;
		SYSTEMD_EXEC_PID: string;
		AS_FOR_BUILD: string;
		CXX: string;
		_: string;
		XAUTHORITY: string;
		TEMPDIR: string;
		system: string;
		SIZE_FOR_BUILD: string;
		HOST_PATH: string;
		WINDOWPATH: string;
		IN_NIX_SHELL: string;
		doInstallCheck: string;
		HOME: string;
		USERNAME: string;
		NIX_BINTOOLS: string;
		npm_package_peer: string;
		LANG: string;
		LS_COLORS: string;
		XDG_CURRENT_DESKTOP: string;
		CARGO_HOME: string;
		depsTargetTargetPropagated: string;
		npm_package_version: string;
		VTE_VERSION: string;
		cmakeFlags: string;
		CXX_FOR_BUILD: string;
		NIX_SSL_CERT_FILE: string;
		npm_package_resolved: string;
		outputs: string;
		NIX_STORE: string;
		TMPDIR: string;
		GNOME_TERMINAL_SCREEN: string;
		PERL5LIB: string;
		LD: string;
		NM_FOR_BUILD: string;
		NIX_BINTOOLS_FOR_BUILD: string;
		buildPhase: string;
		INIT_CWD: string;
		READELF: string;
		STRIP_FOR_BUILD: string;
		NIX_CC_WRAPPER_TARGET_BUILD_x86_64_unknown_linux_gnu: string;
		NIX_BINTOOLS_WRAPPER_TARGET_BUILD_x86_64_unknown_linux_gnu: string;
		npm_lifecycle_script: string;
		doCheck: string;
		npm_package_optional: string;
		depsBuildBuild: string;
		LESSCLOSE: string;
		XDG_SESSION_CLASS: string;
		TERM: string;
		npm_package_name: string;
		SIZE: string;
		OBJCOPY_FOR_BUILD: string;
		propagatedNativeBuildInputs: string;
		npm_config_prefix: string;
		LESSOPEN: string;
		CC_FOR_BUILD: string;
		USER: string;
		strictDeps: string;
		GNOME_TERMINAL_SERVICE: string;
		CARGO_INSTALL_ROOT: string;
		AR: string;
		AS: string;
		TEMP: string;
		DISPLAY: string;
		NIX_BINTOOLS_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu: string;
		OBJDUMP_FOR_BUILD: string;
		npm_lifecycle_event: string;
		SHLVL: string;
		AR_FOR_BUILD: string;
		NIX_BUILD_TOP: string;
		NM: string;
		NIX_LDFLAGS_FOR_BUILD: string;
		NIX_CFLAGS_COMPILE: string;
		patches: string;
		QT_IM_MODULE: string;
		buildInputs: string;
		preferLocalBuild: string;
		npm_config_user_agent: string;
		npm_execpath: string;
		XDG_RUNTIME_DIR: string;
		NIX_PKG_CONFIG_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu: string;
		NODE_PATH: string;
		depsBuildTarget: string;
		OBJCOPY: string;
		RANLIB_FOR_BUILD: string;
		out: string;
		npm_package_json: string;
		STRIP: string;
		XDG_DATA_DIRS: string;
		TMP: string;
		OBJDUMP: string;
		npm_config_noproxy: string;
		PATH: string;
		propagatedBuildInputs: string;
		npm_config_metrics_registry: string;
		npm_config_node_gyp: string;
		dontAddDisableDepTrack: string;
		READELF_FOR_BUILD: string;
		GDMSESSION: string;
		CC: string;
		NIX_CC: string;
		DBUS_SESSION_BUS_ADDRESS: string;
		depsBuildTargetPropagated: string;
		STRINGS_FOR_BUILD: string;
		depsBuildBuildPropagated: string;
		npm_config_global_prefix: string;
		NIX_CC_WRAPPER_TARGET_HOST_x86_64_unknown_linux_gnu: string;
		CONFIG_SHELL: string;
		__structuredAttrs: string;
		npm_node_execpath: string;
		RANLIB: string;
		NIX_HARDENING_ENABLE: string;
		NIX_LDFLAGS: string;
		nativeBuildInputs: string;
		name: string;
		npm_package_engines_node: string;
		NIX_CC_FOR_BUILD: string;
		PKG_CONFIG: string;
		depsHostHostPropagated: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: string]: string | undefined;
	}
}

/**
 * Similar to [`$env/dynamic/private`](https://kit.svelte.dev/docs/modules#$env-dynamic-private), but only includes variables that begin with [`config.kit.env.publicPrefix`](https://kit.svelte.dev/docs/configuration#env) (which defaults to `PUBLIC_`), and can therefore safely be exposed to client-side code.
 * 
 * Note that public dynamic environment variables must all be sent from the server to the client, causing larger network requests — when possible, use `$env/static/public` instead.
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.PUBLIC_DEPLOYMENT_SPECIFIC_VARIABLE);
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
